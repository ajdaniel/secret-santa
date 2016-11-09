var fs = require('fs');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var winston = require('winston');

// Winston use a file
winston.add(winston.transports.File, { filename: 'santa.log' });
var transporter = nodemailer.createTransport(process.env.SS_SMTP);
var userData = [], fileName = 'data/santa_users.json', isMatching = false, updateMails = {};

if (process.env.HOMEWEBENV === 'development') {
	fileName = 'data/santa_users_dev.json';
}

function createNewUserIfNeeded(profile) {
	if (_.findIndex(userData, {id: profile.id }) === -1) {
		winston.info(profile, 'Creating new user');
		var isAllowed = false;
		// Apply defaults so nothing goes bang
		_.defaults(profile, {
			emails: [{ value: '(no email)' }],
			photos: [{ value: 'https://thebenclark.files.wordpress.com/2014/03/facebook-default-no-profile-pic.jpg' }],
			name: {
				givenName: '',
				middleName: '',
				familyName: ''
			}
		});

		var user = {
			id: profile.id,
			displayName: profile.displayName,
			firstName: profile.name.givenName,
			middleName: profile.name.middleName,
			lastName: profile.name.familyName,
			email: profile.emails[0].value,
			photo: profile.photos[0].value,
			admin: false,
			preferences: [],
			allowed: isAllowed
		};
		winston.info({ user: user }, 'New user has been created');
		userData.push(user);

		// save the file too
		saveData();
	} else {
		// user exists
		var existingUser = _.find(userData, {id:profile.id});

		// update their profile picture if needed
		if (existingUser.photo !== profile.photos[0].value) {
			existingUser.photo = profile.photos[0].value;
			saveData();
			winston.info({user:existingUser}, 'User photo updated');
		}
	}
}

function getUserByID(id) {
	return _.find(userData, { id: id });
}

function getAllUsers() {
	return userData.map(function (user) {
		return {
			id: user.id,
			displayName: user.displayName,
			email: user.email,
			isAllowed: user.allowed,
			match: user.match
		};
	});
}

function toggleUserAllowed(userId) {
	winston.info('Toggling user allowed for '+userId);
	var user = getUserByID(userId);
	if (user) {
		user.allowed = !user.allowed;
		saveData();
		return returnBody(true, user.displayName + ' has been updated');
	} else {
		return returnBody(false, 'Could not find user in database');
	}
}

function setUserPrefs(id, prefs) {
	var user = _.find(userData, { id: id });
	winston.info({id:id, prefs:prefs}, 'Updating user prefs');
	if (user) {
		user.preferences = _.merge(user.preferences, prefs);
		user.preferences.lastUpdated = _.now();
		winston.info({ userData: user }, 'User updated preferences');
		saveData();

		// if the user has a santa, tell them!
		if (_.findIndex(userData, {match : user.id}) > -1) {
			// Tell the santa!
			if (!updateMails[user.id]) {
				winston.info('Telling santa for '+user.displayName+' they updated their prefs');
				updateMails[user.id] = function () {
					var santa = _.find(userData, {match:user.id});
					if (santa) {
						sendMail(santa.email, 'Your match updated their profile!',
							'<h2>Your match updated their preferences!</h2> \
							<p>Go visit <a href="http://home.andrewdaniel.co.uk/santa">the Secret Santa site</a> to see what they wrote</p>');
						delete updateMails[user.id];
					}
				};
			}
			// debounce after a minute
			_.debounce(updateMails[user.id], 60000);
		}

		return returnBody(true, 'Preferences successfully updated');
	}
	return returnBody(false, 'User doesn\'t exist');
}

function isEmail(text) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(text);
}

function setUserEmail(id, email) {
	winston.info('User '+id+' is changing email to '+email);
	if (!isEmail(email)) {
		return returnBody(false, 'Invalid email address');
	}

	var userIndex = _.findIndex(userData, { id: user.id });

	if (userIndex > -1) {
		userData[userIndex].email = email;
		winston.info({ displayName: userData[userIndex].displayName, email: userData[userIndex].email }, 'User email has been updated');
		saveData();
		return returnBody(true, 'Email successfully updated');
	} else {
		return returnBody(false, 'User doesn\'t exist');
	}
}

function init() {
	winston.info('Initializing');
	fs.readFile(fileName, { encoding: 'utf8' }, function (err, data) {
		// if the file didn't exist'
		if (err && err.code === 'ENOENT') {
			fs.writeFile(fileName, '[]', function (err) {
				if (err) {
					winston.info(err);
				} else {
					winston.info('santa: created user json file');
				}
			});
		} else {
			try {
				userData = JSON.parse(data);
				winston.info({userData:userData}, 'Loaded up user data from disk');
			} catch (ex) {
				winston.info(ex);
			}
		}
	});

}

function matchUsers() {
	var success = false, iterations = 0, users, shuffleIts;
	winston.info('Attempting to match users');

	// iterative function, repeat until matches are matched
	function attemptMatch() {
		iterations++;
		winston.info('Attempt number '+iterations);

		// Get a subset of users and shuffle them
		users = _.filter(userData, { allowed: true });

		winston.log(users.length + ' users to match up');

		// _.shuffle is deterministic, so randomly iterate
		shuffleIts = _.random(12, 300);
		var shuffledUsers;
		for (var i = 0; i < shuffleIts; i++) {

			// get a copy of the users in a shuffled order
			shuffledUsers = _.shuffle(users);	
		}

		// Loop through each eligible user
		for (var x = 0; x < users.length; x++) {
			user = users[x];
			var userIsMatched = false;

			// loop through the shuffled user list
			for (var i = 0; i < shuffledUsers.length; i++) {
				// pull the first shuffled user from the list so they're not used in future
				var shuffledUser = shuffledUsers.shift();

				// Is this match a good match?
				if (shuffledUser.id !== user.id &&
					shuffledUser.lastName.toLowerCase() !== user.lastName.toLowerCase()) {
					// successful match, so move onto the next user in the array
					user.match = shuffledUser.id;
					userIsMatched = true;
					// break from the shuffled user loop
					break;
				}
				// bad match, so put the shuffled user back in the array
				shuffledUsers.push(shuffledUser);
			}

			if (!userIsMatched) {
				
				// if we got here, we couldn't match this user successfully, so try again
				if (iterations < 10) {
					return attemptMatch();
				} else {
					// bomb out, too many attempts
					winston.log(shuffledUsers,'Couldnt match '+user.displayName+' with anyone!');
					return false;
				}
			}
		}

		// if we got this far, then all users were matched!
		return true;
	}

	// kick off the loop
	var succeeded = attemptMatch();
	winston.info('Attempt ' + (succeeded ? 'succeeded' : 'failed'));
	if (succeeded) {
		// if we get this far, success
		saveData();
		// email everybody
		users.forEach(function(user) {
			var match = getUserByID(user.match);
			winston.info('Attempting to email '+match);
			var msg = 	'<h2>Congratulations! You have been matched!</h2>';
			msg +=		'<p>You have been matched with <strong>'+match.displayName+'</strong></p>';
			msg += 		'<p>Head over to <a href="http://home.andrewdaniel.co.uk/santa">the Secret Santa site</a>';
			msg +=		' to see what they have asked for!</a>';
			sendMail(user.email, 'You have a new match!', msg);
		});

		return returnBody(true, 'Matching complete with '+shuffleIts+' shuffles and '+iterations+' iterations');
	} else {
		return returnBody(false, 'Matching exceeded 10 attempts!');;
	}
}

function clearMatches() {
	winston.info('Attempting to clear matches');
	for(var i = 0; i < userData.length; i++) {
		delete userData[i].match;
	}
	saveData();
	return returnBody(true, 'All matches cleared');
}

function saveData() {
	winston.info('Saving data...')
	fs.writeFile(fileName, JSON.stringify(userData), 'utf8', function (err) {
		if (err) return console.error(err);
		winston.info('Saving successful!');
	});
}

function isAdminUser(user) {
	return user && _.find(userData, { id: user.id, admin: true });
}

function returnBody(success, msg) {
	winston.info('Sending return message '+msg);
	return {
		success: success,
		message: msg
	};
}

function sendMail(to, subject, message) {
	if (!isEmail(to)) {
		winston.info(to+' is not an email, not sending one');
		return;
	}
	winston.info({ to: to }, 'Sending an email');
	var mailOptions = {
		from: '"🎅🏻 Secret Santa" <santa@andrewdaniel.co.uk>',
		to: to,
		subject: subject,
		html: '<html><body>'+message+'</body><html>'
	};

	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return winston.info(error);
		}
		winston.info({ response: info.response }, 'Message sent!');
	});
}

module.exports = {
	createNewUserIfNeeded: createNewUserIfNeeded,
	getUserByID: getUserByID,
	toggleUserAllowed: toggleUserAllowed,
	clearMatches: clearMatches,
	getAllUsers: getAllUsers,
	setUserPrefs: setUserPrefs,
	setUserEmail: setUserEmail,
	init: init,
	matchUsers: matchUsers,
	saveData: saveData,
	isAdminUser: isAdminUser
};