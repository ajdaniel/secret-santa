var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var secretsanta = require('./santa.js');
var app = express();

// HTML Static pages
app.use('/', express.static('public'));

// APIs
app.use('/api', secretsanta);

// Run the HTTP and HTTPS servers
var port = 80;

if (process.env.HOMEWEBENV === 'development') {
    console.log('running development');
    port = 8080;
}

http.createServer(app).listen(port);

console.log('App started on port ' + port + ' at ' + (new Date()));
