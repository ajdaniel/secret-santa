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
        db.userData = backup;
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

var backup = [
    {
        "id": "10153592912873575",
        "displayName": "Andrew James Daniel",
        "isAllowed": true,
        "firstName": "Andrew",
        "middleName": "James",
        "lastName": "Daniel",
        "email": "andrewjd1@gmail.com",
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/13938418_10154032665328575_3728926885623270969_n.jpg?oh=8e8771da5a10b76c1f085377af9eb6b2&oe=58D30543",
        "admin": true,
        "preferences": {
            "likes": "Classic Uno (the original design), Board games or things about Game of thrones, harry potter, etc. If you buy something on my wishlist please mark it as such, and if possible, tell Steph so she knows too",
            "dislikes": "Food, blu-rays, chocolate, clothes",
            "wishlist": "http://www.amazon.co.uk/registry/wishlist/1ORDSNG2PDKYE",
            "lastUpdated": 1478788612633
        }
    },
    {
        "id": "10157284530635517",
        "displayName": "Andrew Church",
        "firstName": "Andrew",
        "lastName": "Church",
        "email": "asc236@gmail.com",
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/c17.0.50.50/p50x50/552691_10151856704245517_1115118596_n.jpg?oh=5d0cc4d72e15f94698de9cc6277672b1&oe=583E8895",
        "admin": false,
        "preferences": {
            "likes": "Todo",
            "dislikes": "Todo",
            "wishlist": "http://todo.com",
            "lastUpdated": 1478765936922
        }
    },
    {
        "id": "10100490368022396",
        "displayName": "Matt Bailey",
        "firstName": "Matt",
        "lastName": "Bailey",
        "email": "matt@epsilonzero.co.uk",
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/10257086_10100114836745086_973788613858224690_n.jpg?oh=0bda15c0370e88ec275d2d2f67d8b6f6&oe=5849F284",
        "admin": false,
        "preferences": {
            "likes": "Board games, video games, F1/motorsport things, LEGO or something on the Wishlist...",
            "dislikes": "Food (unless on Wishlist), baby stuff, 'dad' stuff",
            "wishlist": "https://www.amazon.co.uk/registry/wishlist/JLONGNSMYZM3",
            "lastUpdated": 1478767430368
        }
    },
    {
        "id": "10153804363766021",
        "displayName": "Richard Pilot",
        "firstName": "Richard",
        "lastName": "Pilot",
        "email": "richardpilot2000@hotmail.com",
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14079646_10153646005136021_1501636606695494462_n.jpg?oh=60f7553a590cb1cab47390a51f32c62b&oe=58A53B88",
        "admin": false,
        "preferences": []
    },
    {
        "id": "10153924937672805",
        "displayName": "Steve Thornton",
        "email": "steevot@hotmail.co.uk",
        "isAllowed": false,
        "admin": false,
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/p50x50/14448893_10153822361687805_8477114285786463117_n.jpg?oh=f0a440980f51c63a1c02d2d0e30670dc&oe=5897729D",
        "firstName": "Steve",
        "lastName": "Thornton",
        "preferences": []
    },
    {
        "id": "907844917447",
        "displayName": "Caroline Church",
        "email": "cazfletch@gmail.com",
        "firstName": "Caroline",
        "lastName": "Church",
        "photo": "https://scontent.xx.fbcdn.net/v/t1.0-1/c0.0.50.50/p50x50/1450809_690553336517_312090919_n.jpg?oh=4bc9f4cf941a3b4f00d7699949861edd&oe=5897C8FB",
        "admin": false,
        "isAllowed": true,
        "preferences": {
            "likes": "3ds zelda game, latest pokemon game, board game, ps4 lego game",
            "dislikes": "Food, a pet",
            "wishlist": "https://www.amazon.co.uk/registry/wishlist/1RGW7VKVJK0EB/ref=cm_sw_r_cp_an_wl_o_hn8gybHDEX85D",
            "lastUpdated": "2016-11-03T23:09:44.129Z"
        }
    }
];

module.exports = db;