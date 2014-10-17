var gulp = require('gulp'),
  concat = require('gulp-concat'),
  jasmine = require('gulp-jasmine');
  
gulp.task('build', function() {
  var modules = [
    './src/initialize.js',
    './src/utils.js',
    './src/events.js',
    './src/model.js',
    './src/return.js'
  ];
  
  gulp.src(modules)
    .pipe(concat('resolve.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build-static', function() {
  var modules = [
    './lib/static/object.js',
    './lib/static/string.js',
    './lib/static/function.js'
  ];
  
  gulp.src(modules)
    .pipe(concat('static.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('events-spec', function() {
  return gulp.src('./spec/events.js')
    .pipe(jasmine({includeStackTrace: true}));
});

gulp.task('model-spec', function() {
  return gulp.src('./spec/model.js')
    .pipe(jasmine({includeStackTrace: true}));
});