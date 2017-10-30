
/* ================================================================================ */
/* REQUIRES == REQUIRES == REQUIRES == REQUIRES == REQUIRES == REQUIRES == REQUIRES */
/* ================================================================================ */

var gulp = require('gulp'),
	fs = require('fs'),

	server = require('browser-sync').create(),
	nodemon = require('gulp-nodemon'),
	watch = require('gulp-watch'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	sequence = require('run-sequence'),
	run = require('gulp-run'),

	less = require('gulp-less'),
	cssmin = require('gulp-minify-css'),
	prefixer = require('gulp-autoprefixer'),

	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),

	imagemin = require('gulp-imagemin');


/* ==================================================================================== */
/* HELPERS == HELPERS == HELPERS == HELPERS == HELPERS == HELPERS == HELPERS == HELPERS */
/* ==================================================================================== */

var paths = {
	js : 'public/js', /* No file type is specified because of _compile.json */
	images : 'public/images',
	styles : 'public/styles',
	public : [
		'public/fonts/**/*.*',
		'public/images/**/*.*',
		'public/favicon.ico',
		'templates/**/*.pug'
	]
}

var onError = function(err) {
	notify.onError({
		title: 'Compilation error',
		message: '<%= error.message %>',
		sound: 'Tink'
	})(err);
	
	this.emit('end');
};


/* ======================================================================================= */
/* DEV TASKS == DEV TASKS == DEV TASKS == DEV TASKS == DEV TASKS == DEV TASKS == DEV TASKS */
/* ======================================================================================= */

gulp.task('mongo', function(){
	return gulp.src('.')
		// .pipe(run('rm -r node_modules/keystone/admin/bundles/js/* &'))
		.pipe(run('mongod --dbpath ./data/db/ &'))
		.pipe(run('nodemon keystone.js &'));
});

gulp.task('nodemon', function(){
	var started = false;

	var stream = nodemon({
		script: 'keystone.js',
		verbose: true,
		ignore: [
			"templates/*",
			"public/*",
			"data/*",
			"gulpfile.js",
			"bower_components/*",
			"README.md",
			"bower.json",
			"package.json",
			".gitignore",
			"Procfile"
		],
		env: { 'NODE_ENV': 'development' }
	})

	stream.on('start', function() {
	    setTimeout(function reload() {
	        server.reload();
	    }, 10000);
	}).on('crash', function() {
		console.error('Application has crashed!\n');
		notify({
			title: 'Application has crashed!',
			message: 'Restarting server in 5 seconds',
			sound: 'Tink'
		});
		stream.emit('restart', 5); // restart the server in 5 seconds 
    });

	setTimeout(function () {
		server.init({
			proxy: 'http://localhost:3000',
			port: '4000'
		});
	}, 10000);

	return stream;
});

gulp.task('public', function() {
	return watch(paths.public, function () {
		return gulp.src(paths.public)
			.pipe(server.reload());
	});
});

gulp.task('js', function(){
	watch([paths.js + '/**/*.*', '!' + paths.js + '/**/*.min.js'], {ignoreInitial: false}, function () {
		var scripts = JSON.parse(fs.readFileSync(paths.js + '/_compile.json', { encoding: 'utf8' }));
		return scripts.forEach(function(obj){
			return gulp.src(obj.src)
				.pipe(plumber({errorHandler: onError}))
				.pipe(sourcemaps.init())
				.pipe(concat(obj.name))
				.pipe(sourcemaps.write())
				.pipe(gulp.dest(paths.js))
				.pipe(server.reload());
		});
	});
});

gulp.task('less', function(){
	watch(paths.styles + '/**/*.less', {ignoreInitial: false}, function () {
		return gulp.src(paths.styles + '/*.less')
			.pipe(plumber({errorHandler: onError}))
			.pipe(sourcemaps.init())
			.pipe(less())
			.pipe(prefixer('last 4 versions'))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest(paths.styles))
			.pipe(server.reload({stream:true}));
	});
});


/* ============================================================================================== */
/* DIST TASKS == DIST TASKS == DIST TASKS == DIST TASKS == DIST TASKS == DIST TASKS == DIST TASKS */
/* ============================================================================================== */

gulp.task('js-dist', function() {
	var scripts = JSON.parse(fs.readFileSync(paths.js + '/_compile.json', { encoding: 'utf8' }));

	return scripts.forEach(function(obj){
		return gulp.src(obj.src)
			.pipe(concat(obj.name))
			.pipe(uglify())
			.pipe(gulp.dest(paths.js));
	});
});

gulp.task('less-dist', function(){
	return gulp.src(paths.styles + '/*.less')
		.pipe(less())
		.pipe(prefixer('last 4 versions'))
		.pipe(cssmin({
			compatibility: 'ie11',
			keepSpecialComments: 0,
			roundingPrecision: -1
		}))
		.pipe(gulp.dest(paths.styles));
});

gulp.task('imagemin', function(){
	return gulp.src(paths.images + '/**/*.*')
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 9}),
			imagemin.svgo({
				plugins: [
					{removeUselessStrokeAndFill: true},
					{removeEmptyAttrs: true},
					{removeViewBox: true},
					{cleanupIDs: false},
					{pretty:true},
					{convertStyleToAttrs:true}
				]
			})
		]))
		.pipe(gulp.dest(paths.images))
});

gulp.task('images-dist', ['imagemin'], function() {
	return gulp.src('.')
		.pipe(run('imageOptim -j -a -q -d ' + paths.images + '/'));
});

gulp.task('done', function() {
	return gulp.src('.')
		.pipe(run('open -a iterm'))
		.pipe(notify({
			title: 'Compilation completed',
			message: 'Your distribution folder is now ready',
			sound: 'Tink'
		}));
});


/* ==================================================================================== */
/* GLOBALS == GLOBALS == GLOBALS == GLOBALS == GLOBALS == GLOBALS == GLOBALS == GLOBALS */
/* ==================================================================================== */

gulp.task('default', function(callback) {
	sequence(
		'mongo',
		'nodemon',
		['js', 'less', 'public'],
	callback);
});

gulp.task('dist', function(callback) {
	sequence(
		['js-dist', 'less-dist', 'images-dist'],
		'done',
	callback);
});

gulp.task('dist-code', function(callback) {
	sequence(
		['js-dist', 'less-dist'],
		'done',
	callback);
});
