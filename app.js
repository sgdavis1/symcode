var express = require('express');
var session = require('client-sessions');
var exec = require('child_process').exec;

var livecode = require('./livecode');

/** Setup the Express server **/
app = express();

/** Controllers **/
require('./controllers/repo')(app);


/** Sessions **/
app.use(session({cookieName: 'session', secret: 'livecodeRocks!!', duration: 0 }));

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
