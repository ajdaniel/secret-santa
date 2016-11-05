var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var secretsanta = require('./santa.js');
var app = express();

app.use(bodyParser.json());

// HTML Static pages
app.use('/', express.static('public'));

// APIs
app.use('/api', secretsanta);

var port = process.env.OPENSHIFT_NODEJS_PORT || '8080';
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

http.createServer(app).listen(port, ipaddress);

console.log('App started on port ' + port + ' at ' + (new Date()));
