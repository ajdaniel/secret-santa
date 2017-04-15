var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var secretsanta = require('./santa.js');
var path = require('path');

var winston = require('winston');
var winstonRotate = require('winston-logrotate');
var expressWinston = require('express-winston');

var app = express();
app.use(bodyParser.json());

var logFilePath = path.join(__dirname, "../santaREST.log");

if (process.env.OPENSHIFT_DATA_DIR) {
    logFilePath = path.join(process.env.OPENSHIFT_DATA_DIR, 'santaREST.log');
}

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true
        }),
        new winstonRotate.Rotate({
            file: logFilePath,
            colorize: false,
            timestamp: true,
            keep: 5,
            compress: false,
            level: 'info'
        })
    ],
    msg: "HTTP {{req.method}} {{req.url}}",
    meta: false,
    expressFormat: true
}));


// HTML Static pages
app.use('/', express.static('public'));

// APIs
app.use('/api', secretsanta);

var port = process.env.OPENSHIFT_NODEJS_PORT || '8080';
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

http.createServer(app).listen(port, ipaddress);
/*eslint no-console:0*/
console.log('App started on port ' + port + ' at ' + (new Date()));
