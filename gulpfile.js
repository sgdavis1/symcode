var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  plumber = require('gulp-plumber'),
  livereload = require('gulp-livereload'),
  jshint = require('gulp-jshint'),
  gutil = require('gulp-util'),
  sass = require('gulp-sass');
var fs = require('fs-extra');

// Lint Task
gulp.task('lint', function() {
  gulp.src('./public/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default', {verbose: true}));
});

gulp.task('sass', function () {
  gulp.src('./sass/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  gulp.watch('./sass/*.scss', ['sass']);
});

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'app.js',
    ext: 'js coffee swig',
  }).on('restart', function () {
    setTimeout(function () {
      livereload.changed(__dirname);
    }, 500);
  });
});

gulp.task('default', [
  'lint',
  'sass',
  'develop',
  'watch'
]);
