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
 * Utility function to get the diffs (per file) into an object.
 */
function getDiffObjs(data)
{
  var ret = {};

  var lines = data.split(/\r?\n/);
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

  // All done
  return ret;
}

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
    if (num == json.steps.length - 1)
    {
      // Final step
      res.json({}); 
      return;
    }
    else if (!parseInt(num) || num <= 0 || num >= json.steps.length)
    {
      res.json({'error': {'command': 'step-details', 'message': 'Bad step number: ' + num}});
      return;
    }

    var startHash = json.steps[num - 1].hash;
    var endHash = json.steps[num].hash;
    exec('git --no-pager diff ' + startHash + '..' + endHash, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      var ret = {};
      if (error !== null)
      {
        ret = {'error': {'on': 'diff', 'command': 'step-details', 'message': error}};
      }
      else
      {
        ret = getDiffObjs(stdout);
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
  res.render('livecode', {repo: repo});
});
livecodeRouter.get('/start', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Starting livecode session for ' + repo);

  // Deny request if currently locked
  try
  {
    var lockStats = fs.statSync('data/' + repo + '.lock');
    if (lockStats.isFile())
    {
      res.json({'status': 'locked'});
      return;
    }
  }
  catch (err) 
  {
    // NOTE: assume error indicates absence of lockfile
  }
  
  // Get all steps, create branch off of initial commit (step 0)
  livecode.getSteps(repo, function(json) {
    if (json.error) 
    {
      res.json({'error': {'on': 'getSteps', 'command': 'start', 'message': json.error}});
      return;
    }

    // Create branch
    console.log('Livecode branch "' + LIVECODE_BRANCH + '" will be created off of hash "' + json.steps[0].hash + '"');
    exec('git branch ' + LIVECODE_BRANCH + ' ' + json.steps[0].hash, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      if (error !== null) 
      {
        res.json({'error': {'on': 'branch', 'command': 'start', 'message': error}});
        return;
      }

      // Now checkout the branch
      exec('git checkout ' + LIVECODE_BRANCH, { cwd: 'data/' + repo }, function(error, stdout, stderr) {
        if (error !== null) 
        {
          res.json({'error': {'on': 'checkout', 'command': 'start', 'message': error}});
          return;
        }

        // Finally (last nest) create our lock file with the current step number(1)
        fs.writeFile('data/' + repo + '.lock', '1', function(error) {
          if (error !== null) 
          {
            res.json({'error': {'on': 'writeFile', 'command': 'start', 'message': error}});
            return;
          }

          // All done!
          res.json({'success' : true });
        });
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

      // And delete our lock file
      fs.unlink('data/' + repo + '.lock', function() {
        // All done!!
        res.json({'success': true});
      });
    });
  });
});
livecodeRouter.get('/step', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Getting current step for Livecode session of repo "' + repo + '"');
  
  try
  {
    var lockStats = fs.statSync('data/' + repo + '.lock');
    if (lockStats.isFile())
    {
      // Read the current step from the lockfile
      livecode.getCurrentStep(repo, function(data) {
        // Check for an error on checkout
        if (data.error) 
        {
          res.json({'error': {'on': 'getCurrentStep', 'command': 'step', 'message': data.error}});
        }
        else
        {
          // All done
          res.json({ 'step': parseInt(data.step) });
        }
      });
    }
    else
    {
      res.json({'error': {'on': 'lockfile', 'command': 'step', 'message': 'lockfile is not a file'}});
    }
  }
  catch (err)
  {
    // NOTE: assume error indicates absence of lockfile
    res.json({'status': 'nosession'});
  }
});
livecodeRouter.get('/livediff', function(req, res, next) {
  var repo = req.params['name'];
  //console.log('Doing livediff for repo "' + repo + '"');
  livecode.getCurrentStep(repo, function(data) {
    // Check for an error on checkout
    if (data.error) 
    {
      res.json({'error': {'on': 'getCurrentStep', 'command': 'livediff', 'message': data.error}});
      return;
    }

    var step = data.step;
    livecode.getSteps(repo, function(json) {
      if (json.error) 
      {
        res.json({'error': {'on': 'getSteps', 'command': 'livediff', 'message': json.error}});
        return;
      }
      else if (step <= 0 || step >= json.steps.length)
      {
        res.json({'error': {'on': 'getSteps', 'command': 'livediff', 'message': 'Bad step number: ' + step}});
        return;
      }

      exec('git --no-pager diff ' + json.steps[step].hash + ' --', {cwd: 'data/' + repo}, function(error, stdout, stderr) {
        var ret = {};
        if (error !== null)
        {
          ret = {'error': {'on': 'diff', 'command': 'livediff', 'message': error}};
          ret.error.message['stderr'] = stderr;
        }
        else
        {
          ret = getDiffObjs(stdout);
        }
        res.json(ret);
      });
    });
  });
});
livecodeRouter.get('/nextstep', function(req, res, next) {
  var repo = req.params['name'];
  console.log('Moving repo "' + repo + '" to next step');

  // Get the current step for this repo
  livecode.getCurrentStep(repo, function(data) {
    // Check for an error on checkout
    if (data.error) 
    {
      res.json({'error': {'on': 'getCurrentStep', 'command': 'nextstep', 'message': data.error}});
      return;
    }

    var step = parseInt(data.step);
    exec('git add -A', { cwd: 'data/' + repo }, function(error, stdout, stderr) {
      if (error !== null) 
      {
        res.json({'error': {'on': 'add', 'command': 'nextstep', 'message': error}});
        return;
      }

      // Now checkout the branch
      exec('git commit -m "Livecode demo [Step ' + step + ' completed]"', { cwd: 'data/' + repo }, function(error, stdout, stderr) {
        // NOTE: distinguish errors, and simply no difference. This might be fragile as it
        //   is relying on current git stdout message.
        if (error && error.code == 1 && /nothing to commit, working directory clean/.test(stdout.toString('utf-8')))
        {
          console.log('Moving to next step (' + (step + 1) + '), despite no difference in working directory');
        }
        else if (error !== null) 
        {
          ret = {'error': {'on': 'commit', 'command': 'nextstep', 'message': error}};
          ret.error.message.stderr = stderr;
          res.json(ret);
          return;
        }

        // TODO: check if completed (or 'nextstep' can trigger going beyond last step of the demo)

        // Finally (last nest) create our lock file with the current step number(1)
        fs.writeFile('data/' + repo + '.lock', step + 1, function(error) {
          if (error !== null) 
          {
            res.json({'error': {'on': 'writeFile', 'command': 'nextstep', 'message': error}});
            return;
          }

          // All done!
          res.json({'success' : true, 'currentstep' : (step + 1) });
        });
      });
    });
  });
});
