var express = require('express');
var fs = require('fs');
var exec = require('child_process').exec;

var livecode = require('../livecode');

var router = express.Router();

// Setup the '/repo' routes, as our only export
module.exports = function(app) {
  app.use('/repo', router);
};

router.get('/:name', function(req, res, next) {
  var name = req.params.name;

  try
  {
    var dirStats = fs.statSync('data/' + name);
    var repoStats = fs.statSync('data/' + name + '/.git');
    var lockStats = fs.statSync('data/' + name + '.lock');
  }
  catch (err) {}

  // Test presence, validity, lock status
  // TODO could test for repo with single master branch, maybe count number of commits too...
  var ret = { 
    'name' : name, 
    'valid': dirStats && repoStats && dirStats.isDirectory() && repoStats.isDirectory(),
    'locked' : lockStats && lockStats.isFile()
  };
  res.json(ret);
});

/**
 * Get the step list for a demo.
 */
router.get('/:name/steps', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Getting step list for repo: "data/' + repo + '/"');

  // Read the steps and respond with JSON
  livecode.getSteps(repo, function(json) { res.json(json); });
});

/**
 * Get the step instructions for a named step of a demo.
 */
router.get('/:name/step/:num', function(req, res, next) {
  var repo = req.params['name'];
  var num = req.params['num'];
  console.log('Getting step #' + num + ' instructions for repo: "data/' + repo + '/"');

  // Get step list, then read step instructions
  livecode.getSteps(repo, function(json) {
    if (json.error) 
    {
      res.json(json);
      return;
    }

    // Now parse the steps
    if (json[num - 1] && !(json[num]))
    {
      // Final step
      res.json({}); 
      return;
    }
    else if (!json[num - 1])
    {
      res.json({'error': 'Bad step number'}); 
      return;
    }

    var startHash = json[num - 1].hash;
    var endHash = json[num].hash;
    exec('git --no-pager diff ' + startHash + '..' + endHash, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      var ret = {};
      if (error !== null)
      {
        ret = {'error': 'exec error: ' + error};
      }
      else
      {
        var lines = stdout.split(/\r?\n/);
        var file = '';
        var diff = [];
        for (var i = 0; i < lines.length; i++)
        {
          // Check for the start of a new file
          var matches = /diff --git a\/(.*) b\/(.*)/.exec(lines[i]);
          if (matches)
          {
            if (file) ret[file] = diff;
            // Reset
            file = matches[1];
            diff = [];
          }
          else
          {
            // Append to diff
            diff.push(lines[i]);
          }
        }

        // Push the final file listing
        if (file) ret[file] = diff;
      }
      res.json(ret);
    });
  });
});


