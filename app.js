var express = require('express');
var exec = require('child_process').exec;
app = express();

/**
 * Repo check.
 */
function verifyRepo()
{
  // TODO check that directory exists, and has a ".git" subdir
  return true;
}

/**
 * Convert the git log into a JSON object of commit hashes/summaries.
 *
 * @return
 *   If error occurred, JSON with a single key of 'error'. Otherwise,
 *   JSON with numerical keys indicating step number, and a value of
 *   a nested object containing { hash: hash, summary: summary }.
 */
function getSteps(repo, callback)
{
  // Verify valid repo name
  if (!verifyRepo())
  {
    callback({'error': 'Bad demo name "' + repo + '"'});
    return;
  }

  // Perform the log parsing
  exec('git --no-pager log --oneline --reverse master', { cwd: 'data/' + repo }, function(error, stdout, stderr) {
    var ret = {};
    if (error !== null)
    {
      ret = {'error': 'exec error: ' + error};
    }
    else
    {
      var lines = stdout.split(/\r?\n/);
      var numSteps = 0;
      for (var i = 0; i < lines.length; i++)
      {
        var hash = lines[i].substring(0, 7);
        var summary = lines[i].substring(8);
        if (hash)
        {
          ret[numSteps] = {'hash': hash, 'summary': summary};
          numSteps++;
        }
      }
    }

    // Result to caller
    callback(ret);
  });
}


/**
 * Get the step list for a demo.
 */
app.get('/repo/:name/steps', function(req, res) {
  var repo = req.params['name'];
  console.log('Getting step list for repo: "data/' + repo + '/"');

  // Read the steps and respond with JSON
  getSteps(repo, function(json) { res.json(json); });
});
/**
 * Get the step instructions for a named step of a demo.
 */
app.get('/repo/:name/step/:num', function(req, res) {
  var repo = req.params['name'];
  var num = req.params['num'];
  console.log('Getting step #' + num + ' instructions for repo: "data/' + repo + '/"');

  // Get step list, then read step instructions
  getSteps(repo, function(json) {
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

/**
 * Main Homepage
 */
app.get('/', function(req, res) {
  res.send("Hello!!");
});

/** Static assets **/
app.use(express.static('public'));

app.listen(3000);

console.log('!!Express Server started on port 3000!!');
