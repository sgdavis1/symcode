var express = require('express');
var fs = require('fs');
var exec = require('child_process').exec;

var livecode = require('../livecode');

var router = express.Router();
var livecodeRouter = express.Router({ mergeParams: true });

// Constants
var LIVECODE_BRANCH = 'livecode';

// Setup the sub-route to livecode calls
router.use('/:name/livecode', livecodeRouter);
// Setup the '/repo' routes, as our only export
module.exports = function(app) {
  app.use('/repo', router);
};

/**
 * Repository metadata routes
 */
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
      res.json({'error': {'command': 'step-details', 'message': 'Bad step number: ' + num}});
      return;
    }

    var startHash = json[num - 1].hash;
    var endHash = json[num].hash;
    exec('git --no-pager diff ' + startHash + '..' + endHash, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      var ret = {};
      if (error !== null)
      {
        ret = {'error': {'on': 'diff', 'command': 'step-details', 'message': error}};
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


/**
 * Livecode routes
 *   (Specified repo name stored in req.params.name)
 */
livecodeRouter.get('/', function(req, res, next) {
  var repo = req.params['name'];
  console.log('name: ' + repo);
  res.send('TODO: page template');
});
livecodeRouter.get('/start', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Starting livecode session for ' + repo);

  // Get all steps, create branch off of initial commit (step 0)
  livecode.getSteps(repo, function(steps) {
    if (steps.error) 
    {
      res.json(steps);
      return;
    }

    // Create branch
    console.log('Livecode branch "' + LIVECODE_BRANCH + '" will be created off of hash "' + steps[0].hash + '"');
    exec('git branch ' + LIVECODE_BRANCH + ' ' + steps[0].hash, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      if (error !== null) 
      {
        res.json({'error': {'on': 'branching', 'command': 'start', 'message': error}});
        return;
      }

      // Now checkout the branch
      exec('git checkout ' + LIVECODE_BRANCH, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
        if (error !== null) 
        {
          res.json({'error': {'on': 'checkout', 'command': 'start', 'message': error}});
          return;
        }

        // All done!
        res.json({'success' : true });
      });
    });
  });
});
livecodeRouter.get('/reset', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Resetting ' + repo + ' to normal state');
  exec('git checkout -f master', { cwd: 'data/' + repo }, function(error, stdout, stderr) {
    // Check for an error on checkout
    if (error !== null) 
    {
      res.json({'error': {'on': 'checkout', 'command': 'reset', 'message': error}});
      return;
    }

    // No errors, so force branch deletion
    exec('git branch -D ' + LIVECODE_BRANCH, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      // Check for an error on branch deletion
      if (error !== null) 
      {
        res.json({'error': {'on': 'branch-del', 'command': 'reset', 'message': error}});
        return;
      }

      // All done!!
      res.json({'success': true});
    });
  });
});
livecodeRouter.get('/livediff', function(req, res, next) {
  var repo = req.params['name'];
  res.send('TODO: livediff');
});
livecodeRouter.get('/nextstep/:step', function(req, res, next) {
  var repo = req.params['name'];
  res.send('TODO: nextstep (specify, or from session?)');
});
