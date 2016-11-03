var express = require('express');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var fs = require('fs');
var _ = require('lodash');
var lib = require('./lib');

var callback = 'http://home.andrewdaniel.co.uk/santa/api/login/return';

// if this is running locally, switch the callback
if (process.env.HOMEWEBENV === 'development') {
	console.log('development version of secretsanta');
	callback = 'http://localhost:8080/api/login/return';
}

passport.use(new Strategy({
	clientID: process.env.FB_CLIENT_ID,
	clientSecret: process.env.FB_CLIENT_SECRET,
	callbackURL: callback,
	profileFields: ['email', 'name', 'displayName', 'photos']
},
	function (accessToken, refreshToken, profile, cb) {
		lib.createNewUserIfNeeded(profile);
		return cb(null, profile);
	}));

passport.serializeUser(function (user, cb) { cb(null, user); });
passport.deserializeUser(function (obj, cb) { cb(null, obj); });

// Create a new Express application.
var app = express();

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'elephant cheese seal', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Facebook login routes
app.get('/login', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/login/return', passport.authenticate('facebook', {
	successRedirect: '/',
	failureRedirect: '/'
}));

// require('connect-ensure-login').ensureLoggedIn('/santa/api/login'),

// Secret santa routes
app.get('/profile/me', function (req, res) {
	if (req.user) {
		user = _.clone(lib.getUserByID(req.user.id));

		if (user.match) {
			var matchId = user.match;
			var matchUser = _.clone(lib.getUserByID(matchId));
			if (matchUser) {
				user.match = matchUser;
			}
		}

		res.json({ profile: user, fb: req.user });
	} else {
		res.json({ user: 'logged_out' });
	}
});

app.put('/profile/me/preferences', function (req, res) {
	if (req.user) {
		var msg = lib.setUserPrefs(req.user.id, req.body);
		res.json(msg);
	} else {
		res.sendStatus(401);
	}
});

app.put('/profile/me/email', function (req, res) {
	if (req.user) {
		res.json(lib.setUserEmail(req.user.id, req.body.email));
	} else {
		res.sendStatus(401);
	}
});

app.get('/profile/:id', function (req, res) {
	if (req.user) {
		var user = lib.getUserByID(req.params.id);
		if (user) {
			return res.json({ user: user });
		} else {
			return res.sendStatus(404);
		}
	} else {
		res.sendStatus(401);
	}
});

app.get('/admin/users', function (req, res) {
	if (lib.isAdminUser(req.user)) {
		res.json(lib.getAllUsers());
	} else {
		res.sendStatus(401);
	}
});

app.post('/admin/actions', function (req, res) {
	if (lib.isAdminUser(req.user)) {
		if (req.body.action === 'match') {
			res.json(lib.matchUsers());
		} else if (req.body.action === 'clear') {
			res.json(lib.clearMatches());
		} else if (req.body.action === 'toggleAllowed' && req.body.userId) {
			res.json(lib.toggleUserAllowed(req.body.userId));
		}
	} else {
		res.json({ success: false, text: 'invalid access' });
	}
});

lib.init();

module.exports = app;