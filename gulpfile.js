var gulp = require('gulp'),
  concat = require('gulp-concat'),
  jasmine = require('gulp-jasmine');
  
gulp.task('build', function() {
  var modules = [
    './src/initialize.js',
    './src/events.js',
    './src/return.js'
  ];
  
  gulp.src(modules)
    .pipe(concat('resolve.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('events-spec', function() {
  return gulp.src('./spec/events.js')
    .pipe(jasmine({includeStackTrace: true}));
});