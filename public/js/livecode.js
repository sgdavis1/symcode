/**
 * Client side library for LiveCode
 * NOTE: requires jQuery
 */

var livecodeApp = {
  /**
   * Basic HTML escape function.
   */
  'escape': function(str) {
    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;')
      .replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  },
  /**
   * Set the set in memory and the UI. This call will trigger a load for the
   * #current-step-details accordion element (Semantic UI).
   */
  'setStep': function(num) {
    // Memory
    livecode.step = num;
    // UI
    $('#current-step span').replaceWith('<span>1</span>');

    // Get the file change list, parse, and display
    $.ajax({ 'url': '/repo/' + livecode.repo + '/step/' + livecode.step, dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Session current step details request complete');
        if (xhr.responseJSON.error) 
        {
          alert('An error occurred!\n\n' + xhr.responseJSON.error.message);
        }
        else
        {
          // Add the file changes to the accordion
          var accordion = '';
          var data = xhr.responseJSON
          for (var filename in data)
          {
            // Filename
            accordion += '<div class="title">' + filename + '<i class="dropdown icon"></i></div>';
            // Diff listing
            accordion += '<div class="content"><div class="code-wrap">';
            for (var i = 0; i < data[filename].length; i++)
            {
              var line = livecodeApp.escape(data[filename][i]);
              if (/^@@.*/.test(line) || /^index.*/.test(line) || /^--- .*/.test(line) || /^\+\+\+ .*/.test(line))
                accordion += '<div class="metadata">' + line + '</div>';
              else if (/^\+.*/.test(line))
                accordion += '<div class="addition">' + line + '</div>';
              else if (/^-.*/.test(line))
                accordion += '<div class="deletion">' + line + '</div>';
              else
                accordion += '<div>' + line + '</div>';
            }
            accordion += '</div></div>';

            // Apply to the UI
            $('#current-step-accordion div').replaceWith(accordion);
            $('#current-step-accordion').accordion();
          }
        }
      }
    });
  },
  /**
   * Start up a new session on the named repository.
   */
  startSession: function(repo) {
    $.ajax({ 'url': '/repo/' + livecode.repo + '/livecode/start', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Session start request complete');
        if (xhr.responseJSON.error) 
        {
          alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          // Update our in memory object to indicate this has been completed
          livecode.sessionStarted = new Date();
          livecodeApp.setStep(1);
        }
      }
    });
  },
  /**
   * Resume a session according to the last step recorded on the server.
   */
  resumeSession: function(repo) {
    $.ajax({ 'url': '/repo/' + livecode.repo + '/livecode/step', dataType: 'json',
      'complete': function(xhr, status) {
        console.log('Querying for current step complete');
        if (xhr.responseJSON.error) 
        {
          alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
        }
        else
        {
          livecodeApp.setStep(xhr.responseJSON.step);
        }
      }
    });
  },
};

$(document).on('ready', function(ev) {
  // Initialize our page, first check for a session lock
  $.ajax({ 'url': '/repo/' + livecode.repo, dataType: 'json',
    'complete': function(xhr, status) {
      console.log('Querying for repo status of "' + livecode.repo + '" complete');
      if (xhr.responseJSON.error) 
      {
        alert("An error occurred!\n\n" + xhr.responseJSON.error.message);
      }
      else if (xhr.responseJSON.locked)
      {
        console.log('Session in progress! Querying for current step...');
        // TODO message to user, allow for 'reset' with data loss
        livecodeApp.resumeSession();
      }
      else if (!xhr.responseJSON && xhr.responseJSON.valid)
      {
        console.log('No session, starting a new one...')
        // Trigger the starting of the session
        livecodeApp.startSession();
      }
      else if (!xhr.responseJSON.valid)
      {
        console.log('Bad repo...');
        // TODO message to user, with modal dialog that redirects to homepage
      }
    }
  });

  // And request the steps overview for this repo
  $.ajax({ 'url': '/repo/' + livecode.repo + '/steps', dataType: 'json',
    'complete': function(xhr, status) {
      console.log('Session steps overview request complete');
      if (xhr.responseJSON.error) 
      {
        alert('An error occurred!\n\n' + xhr.responseJSON.error.message);
      }
      else
      {
        // Add the steps to the table as table rows
        var steps = xhr.responseJSON.steps;
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
