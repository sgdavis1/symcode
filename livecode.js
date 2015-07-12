/** 
 * Live code project
 *   Utilities library
 */

var exec = require('child_process').exec;

/**
 * Repo check (private method)
 */
function verifyRepo(repo)
{
  // TODO check that directory exists, and has a ".git" subdir
  return true;
};

/**
 * Convert the git log into a JSON object of commit hashes/summaries.
 *
 * @return
 *   If error occurred, JSON with a single key of 'error'. Otherwise,
 *   JSON with numerical keys indicating step number, and a value of
 *   a nested object containing { hash: hash, summary: summary }.
 */
module.exports.getSteps = function(repo, callback) {
  // Verify valid repo name
  if (!verifyRepo(repo))
  {
    process.nextTick(function() { callback({'error': 'Bad demo name "' + repo + '"'}) });
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
    process.nextTick(function() { callback(ret) });
  });
};

