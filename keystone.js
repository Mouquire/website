// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');

keystone.init({
	'name': 'Mouquire',
	'brand': 'Mouquire',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'pug',

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'adminui custom styles': 'public/styles/admin.less',
	'cookie secret': process.env.COOKIE_SECRET,
	'cloudinary config': process.env.CLOUDINARY_URL,
	'cloudinary secure': true,
	'cloudinary folders': true,
});

keystone.import('models');

keystone.set('locals', {
	_: require('lodash'),
	moment: require('moment'),
	env: keystone.get('env'),
	process: process,
	utils: keystone.utils,
	editable: keystone.content.editable,
});

keystone.set('routes', require('./routes'));

keystone.set('nav', {
	users: 'users',
});

keystone.start();
