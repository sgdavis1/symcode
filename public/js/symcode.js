/**
 * Client side library for SymCode
 * NOTE: requires jQuery
 */

var symcodeApp = {
  LIVEDIFF_ERR_DELAY: 15000,
  LIVEDIFF_REFRESH: 250,
  /**
   * Basic HTML escape function.
   */
  'escape': function(str) {
    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;')
      .replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  },
  /**
   * Basic HTML strip function (for usage in element ids).
   */
  'strip': function(str) {
    return str.replace(/[&><"'\.]/g, '_');
  },
  /**
   * Function to parse a file changes hash (diff output) and insert into the
   * indicated accordion element (activating accordion functionality as well).
   */
  'fillCodeAccordion': function(el, data) {
    var accordion = '';
    for (var filename in data)
    {
      // Filename
      accordion += '<div class="title">' + filename + '<i class="dropdown icon"></i></div>';
      // Diff listing
      accordion += '<div class="content code-wrap">';
      for (var i = 0; i < data[filename].length; i++)
      {
        var line = symcodeApp.escape(data[filename][i]);
        if (/^@@.*/.test(line) || /^index.*/.test(line) || /^--- .*/.test(line) || /^\+\+\+ .*/.test(line))
          accordion += '<pre class="metadata">' + line + '</pre>';
        else if (/^\+.*/.test(line))
          accordion += '<pre class="addition">' + line + '</pre>';
        else if (/^-.*/.test(line))
          accordion += '<pre class="deletion">' + line + '</pre>';
        else
          accordion += '<pre>' + line + '</pre>';
      }
      accordion += '</div>';
    }

    // Apply to the UI
    el.empty();
    el.append(accordion);
    el.accordion();
  },
  /**
   * Set the set in memory and the UI. This call will trigger a load for the
   * #current-step-details accordion element (Semantic UI).
   */
  'setStep': function(num) {
    // Memory
    symcode.step = num;
    // UI
    $('#current-step span').replaceWith('<span>' + num + '</span>');
    if (symcode.step + 1 == symcode.totalSteps)
      $('#current-step button').addClass('disabled');

    // Get the file change list, parse, and display
    $.ajax({ 'url': '/repo/' + symcode.repo + '/step/' + symcode.step, dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Session current step details request complete');
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert('An error occurred!\n\n' + xhr.responseJSON.error.message);
        }
        else
        {
          // Add the file changes to the accordion
          symcodeApp.fillCodeAccordion($('#current-step-accordion'), xhr.responseJSON);
        }
      }
    });
  },
  /**
   * Start up a new session on the named repository.
   */
  startSession: function() {
    $.ajax({ 'url': '/repo/' + symcode.repo + '/symcode/start', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Session start request complete');
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          // Update our in memory object to indicate this has been completed
          symcode.sessionStarted = new Date();
          symcodeApp.setStep(1);

          // And start the livediff polling
          symcodeApp.livediff();
        }
      }
    });
  },
  /**
   * Resume a session according to the last step recorded on the server.
   */
  resumeSession: function() {
    $.ajax({ 'url': '/repo/' + symcode.repo + '/symcode/step', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Querying for current step complete');
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          // Update the UI to the correct Step
          symcodeApp.setStep(xhr.responseJSON.step);

          // And start the livediff polling
          symcodeApp.livediff();
        }
      }
    });
  },
  /**
   * Reset the app
   */
  reset: function(exit) {
    // First make sure the livediff stops
    clearTimeout(symcode.timeoutId);

    // Now reset the repo
    $.ajax({ 'url': '/repo/' + symcode.repo + '/symcode/reset', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Resetting symcode session complete');
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert("Cannot reset! An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          if (exit) location.href='/';
          else location.reload();
        }
      }
    });
  },
  /**
   * Run the livediff query, fill the accordion, then set a timeout
   * for continued polling (250ms).
   * TODO: Could be done on demand with fs watching, websockets
   */
  livediff: function() {
    // Perform the livediff call via AJAX
    $.ajax({ 'url': '/repo/' + symcode.repo + '/symcode/livediff', dataType: 'json',
      'complete': function(xhr, status) {
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert('An error occurred!\n\n' + xhr.responseJSON.error.message);
          // And schedule our next iteration with a delay
          symcode.timeoutId = setTimeout(symcodeApp.livediff, symcodeApp.LIVEDIFF_ERR_DELAY);
        }
        else
        {
          // Remove #livediff-loading (if present)
          $('#livediff-loading').remove();

          // Add the file changes to the segments div
          // TODO: include / check a last modified timestamp on each file
          var data = xhr.responseJSON;
          var livediffEls = {};
          for (var filename in data)
          {
            // First search for an existing segment matching this filename
            var el = $('#livediff-' + symcodeApp.strip(filename) + ' .code-wrap');
            if (el.length == 0)
            {
              // Appears to be a new file
              //   Add a new segment construct for this file
              var newSeg = '<div id="livediff-' + symcodeApp.strip(filename) + '" class="ui segment livediff">';
              newSeg += '  <div class="ui small header">' + symcodeApp.escape(filename) + '</div>';
              newSeg += '  <div class="ui segments">';
              newSeg += '    <div class="ui segment code-wrap"></div>';
              newSeg += '  </div>';
              newSeg += '</div>';
              
              $('#livediff-segments').append(newSeg);
              el = $('#livediff-' + symcodeApp.strip(filename) + ' .code-wrap');
            }

            // Segment content: Diff listing
            var content = '';
            for (var i = 0; i < data[filename].length; i++)
            {
              var line = symcodeApp.escape(data[filename][i]);
              if (/^@@.*/.test(line) || /^index.*/.test(line) || /^--- .*/.test(line) || /^\+\+\+ .*/.test(line))
                content += '<pre class="metadata">' + line + '</pre>';
              else if (/^\+.*/.test(line))
                content += '<pre class="addition">' + line + '</pre>';
              else if (/^-.*/.test(line))
                content += '<pre class="deletion">' + line + '</pre>';
              else
                content += '<pre>' + line + '</pre>';
            }
            content += '</div>';

            // Now replace that DOM element
            el.empty();
            el.append(content);

            // And keep track of the el name
            livediffEls['livediff-' + symcodeApp.strip(filename)] = 'found';
          }

          // Now clear any previous existing segments if all changes are completed
          $('#livediff-segments .livediff').each(function(idx, livediffEl) {
            if (!livediffEls[livediffEl.id]) livediffEl.remove();
          });

          // Check for the automatic trigger to move to the next step (no file changes)
          if ($('#livediff-segments .livediff').length == 0 && symcode.step + 1 < symcode.totalSteps)
          {
            var content = '<div class="ui segment">';
            content += '  <div class="ui medium header">Step Complete!</div>';
            content += '  <button class="ui labeled icon button" id="next-step">';
            content += '    <i class="right arrow icon"></i> Next Step';
            content += '  </button>';
            content += '</div>';

            $('#livediff-segments').empty();
            $('#livediff-segments').append(content);
            
            // Bind the button click handler
            $('#next-step').on('click', function(ev) {
              symcodeApp.nextStep();
            });
          }
          else if ($('#livediff-segments .livediff').length == 0 && symcode.step + 1 == symcode.totalSteps)
          {
            var content = '<div class="ui segment">';
            content += '  <div class="ui large header">All Steps Completed!</div>';
            content += '</div>';

            $('#livediff-segments').empty();
            $('#livediff-segments').append(content);
            // TODO: provide button to end session
            // TODO: provide option to preserve version history (by renaming branch before reset)
          }
          else
          {
            // Schedule our next iteration
            symcode.timeoutId = setTimeout(symcodeApp.livediff, symcodeApp.LIVEDIFF_REFRESH);
          }
        }
      }
    });
  },
  /**
   * Move to the next step, and restart the livediff timeout.
   */
  nextStep: function() {
    // Now move the repo to the next step
    $.ajax({ 'url': '/repo/' + symcode.repo + '/symcode/nextstep', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Nextstep request of "' + symcode.repo + '" complete');
        if (xhr.responseJSON.error) 
        {
          console.log(xhr.responseJSON.error);
          alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          // Empty the livediff content first
          $('#livediff-segments').empty();

          // Now move the UI to the next step
          symcodeApp.setStep(symcode.step + 1);

          // And restart our livediff timeout
          symcode.timeoutId = setTimeout(symcodeApp.livediff, symcodeApp.LIVEDIFF_REFRESH);
        }
      }
    });
  },
};

$(document).on('ready', function(ev) {
  //
  // Initialize our page, first check for a session lock
  //
  $.ajax({ 'url': '/repo/' + symcode.repo, dataType: 'json',
    'complete': function(xhr, status) {
      console.log('Querying for repo status of "' + symcode.repo + '" complete');
      if (xhr.responseJSON.error) 
      {
        console.log(xhr.responseJSON.error);
        alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
      }
      else if (xhr.responseJSON.locked)
      {
        //
        // Previously locked session (ask user how to proceed)
        //
        console.log('Session in progress! Querying for current step...');
        // TODO message to user, allow for 'reset' with data loss
        symcodeApp.resumeSession();
      }
      else if (!xhr.responseJSON.locked && xhr.responseJSON.valid)
      {
        console.log('No session, starting a new one...')
        //
        // Trigger the starting of the session
        //
        symcodeApp.startSession();
      }
      else if (!xhr.responseJSON.valid)
      {
        //
        // Something wrong with this repo, redirect to homepage
        //
        console.log('Bad repo...');
        // TODO message to user, with modal dialog that redirects to homepage
      }
    }
  });

  //
  // And request the steps overview for this repo
  //
  $.ajax({ 'url': '/repo/' + symcode.repo + '/steps', dataType: 'json',
    'complete': function(xhr, status) {
      console.log('Session steps overview request complete');
      if (xhr.responseJSON.error) 
      {
        console.log(xhr.responseJSON.error);
        alert('An error occurred!\n\n' + xhr.responseJSON.error.message);
      }
      else
      {
        // Add the steps to the table as table rows
        var steps = xhr.responseJSON.steps;
        symcode.totalSteps = steps.length;
        var rows = '', row = '';
        for (var i = 0; i < steps.length; i++)
        {
          row = '<td>' + i + '</td><td>' + steps[i].hash + '</td><td>' + steps[i].summary + '</td>';
          rows += '<tr>' + row + '</tr>';
        }
        $('#overview-table tbody').replaceWith('<tbody>' + rows + '</tbody>');
      }
    }
  });
});
