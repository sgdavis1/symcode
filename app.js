var express = require('express');
var swig = require('swig');
var session = require('client-sessions');

var livecode = require('./livecode');

/** Setup the Express server **/
app = express();

/** Views **/
app.engine('swig', swig.renderFile);
app.set('views', './views');
app.set('view engine', 'swig');

/** Controllers **/
require('./controllers/repo')(app);

/** Sessions **/
app.use(session({cookieName: 'session', secret: 'livecodeRocks!!', duration: 0 }));

/**
 * Main Homepage
 */
app.get('/', function(req, res) {
  res.render('welcome');
});

/** Static assets **/
app.use(express.static('public'));

app.listen(3000);

console.log('!!Express Server started on port 3000!!');
