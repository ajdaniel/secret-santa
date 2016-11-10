var fs = require('fs');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var logger = require('./logger');
var db = require('./db');

var transporter = nodemailer.createTransport(process.env.SS_SMTP);
var isMatching = false, updateMails = {};

function createNewUserIfNeeded(profile) {
	if (_.findIndex(db.userData, {id: profile.id }) === -1) {
		logger.info(profile, 'Creating new user');
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
		logger.info({ user: user }, 'New user has been created');
		db.userData.push(user);

		// save the file too
		db.saveData();
	} else {
		// user exists
		var existingUser = _.find(db.userData, {id:profile.id});

		// update their profile picture if needed
		if (!existingUser.photo || existingUser.photo !== profile.photos[0].value) {
			existingUser.photo = profile.photos[0].value;
			db.saveData();
			logger.info({user:existingUser}, 'User photo updated');
		}
	}
}

function getUserByID(id) {
	return _.find(db.userData, { id: id });
}

function getAllUsers() {
	return db.userData.map(function (user) {
		return {
			id: user.id,
			displayName: user.displayName,
			email: user.email,
			isAllowed: user.allowed,
			match: user.match,
			preferences: user.preferences
		};
	});
}

function toggleUserAllowed(userId) {
	logger.info('Toggling user allowed for '+userId);
	var user = getUserByID(userId);
	if (user) {
		user.allowed = !user.allowed;
		db.saveData();
		return returnBody(true, user.displayName + ' has been updated');
	} else {
		return returnBody(false, 'Could not find user in database');
	}
}

function setUserPrefs(id, prefs) {
	var user = _.find(db.userData, { id: id });
	logger.info({id:id, prefs:prefs}, 'Updating user prefs');
	if (user) {
		user.preferences = {
			likes: prefs.likes,
			dislikes: prefs.dislikes,
			wishlist: prefs.wishlist,
			lastUpdated: _.now()
		};
		logger.info({userData: user}, 'User updated preferences');
		db.saveData();

		// if the user has a santa, tell them!
		if (_.findIndex(db.userData, {match : user.id}) > -1) {
			// Tell the santa!
			if (!updateMails[user.id]) {
				logger.info('Telling santa for '+user.displayName+' they updated their prefs');
				updateMails[user.id] = function () {
					var santa = _.find(db.userData, {match:user.id});
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
	} else {
		return returnBody(false, 'User doesn\'t exist');
	}
}

function isEmail(text) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(text);
}

function setUserEmail(id, email) {
	logger.info('User '+id+' is changing email to '+email);
	if (!isEmail(email)) {
		return returnBody(false, 'Invalid email address');
	}

	var userIndex = _.findIndex(db.userData, { id: user.id });

	if (userIndex > -1) {
		db.userData[userIndex].email = email;
		logger.info({ displayName: db.userData[userIndex].displayName, email: db.userData[userIndex].email }, 'User email has been updated');
		db.saveData();
		return returnBody(true, 'Email successfully updated');
	} else {
		return returnBody(false, 'User doesn\'t exist');
	}
}

function matchUsers() {
	var success = false, iterations = 0, users, shuffleIts;
	logger.info('Attempting to match users');

	// iterative function, repeat until matches are matched
	function attemptMatch() {
		iterations++;
		logger.info('Attempt number '+iterations);

		// Get a subset of users and shuffle them
		users = _.filter(db.userData, { allowed: true });

		logger.log(users.length + ' users to match up');

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
					logger.log(shuffledUsers,'Couldnt match '+user.displayName+' with anyone!');
					return false;
				}
			}
		}

		// if we got this far, then all users were matched!
		return true;
	}

	// kick off the loop
	var succeeded = attemptMatch();
	logger.info('Attempt ' + (succeeded ? 'succeeded' : 'failed'));
	if (succeeded) {
		// if we get this far, success
		db.saveData();
		// email everybody
		users.forEach(function(user) {
			var match = getUserByID(user.match);
			logger.info('Attempting to email '+match);
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
	logger.info('Attempting to clear matches');
	for(var i = 0; i < db.userData.length; i++) {
		delete db.userData[i].match;
	}
	db.saveData();
	return returnBody(true, 'All matches cleared');
}

function isAdminUser(user) {
	return user && _.find(db.userData, { id: user.id, admin: true });
}

function returnBody(success, msg) {
	logger.info('Sending return message '+msg);
	return {
		success: success,
		message: msg
	};
}

function sendMail(to, subject, message) {
	if (!isEmail(to)) {
		logger.info(to+' is not an email, not sending one');
		return;
	}
	logger.info({ to: to }, 'Sending an email');
	var mailOptions = {
		from: '"🎅🏻 Secret Santa" <santa@andrewdaniel.co.uk>',
		to: to,
		subject: subject,
		html: '<html><body>'+message+'</body><html>'
	};

	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return logger.info(error);
		}
		logger.info({ response: info.response }, 'Message sent!');
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
	matchUsers: matchUsers,
	isAdminUser: isAdminUser
};