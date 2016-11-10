var path = require('path');
var winston = require('winston');
var winstonRotate = require('winston-logrotate');

var logFilePath = path.join(__dirname, "../santa.log");

if (process.env.OPENSHIFT_DATA_DIR) {
    logFilePath = path.join(process.env.OPENSHIFT_DATA_DIR, 'santa.log');
}

winston.emitErrs = true;

winston.add(winstonRotate.Rotate, {
    file: logFilePath,
    colorize: false,
    timestamp: true,
    keep: 5,
    compress: false,
    level: 'info'
});

winston.info('Logs output to '+logFilePath);

winston.__filePath = logFilePath;

module.exports = winston;