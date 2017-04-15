var path = require('path');
var fs = require('fs');
var logger = require('./logger');

// Set the file name
var fileName = path.join(__dirname, "../data/santa_users.log");

if (process.env.OPENSHIFT_DATA_DIR) {
    fileName = path.join(process.env.OPENSHIFT_DATA_DIR, 'santa_users.json');
}

var db = {
    userData: []
};

// Kick off the file reading
fs.readFile(fileName, {encoding: 'utf8'}, function (err, data) {
    logger.info('Pulling data from '+fileName);
    // if the file didn't exist, create it
    if (err && err.code === 'ENOENT') {
        logger.info('File doesn\'t exist, creating the file with backup');
        fs.writeFile(fileName, JSON.stringify(db.userData), 'utf8', function (err) {
            if (err) {
                logger.info(err, 'failed to create the file');
            } else {
                logger.info('santa: created user json file');
            }
        });
    } else {
        try {
            db.userData = JSON.parse(data);
            logger.info({ userData: db.userData }, 'Loaded up user data from disk');
        } catch (ex) {
            logger.info(ex);
        }
    }
});

db.saveData = function() {
    logger.info('Saving data');
    fs.writeFile(fileName, JSON.stringify(db.userData), 'utf8', function (err) {
        if (err) return logger.info(err, 'failed to save data');
        logger.info('Saving successful!');
    });
};

module.exports = db;