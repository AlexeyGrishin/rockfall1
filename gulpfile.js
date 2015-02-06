var gulp = require('gulp')
  , gutil = require('gulp-util')
  , watch = require('gulp-watch')
  , less = require('gulp-less')
  , coffee = require('gulp-coffee');

gulp.task('coffee', function() {
    gulp.src('./src/coffee/**/*.coffee')
      .pipe(coffee({bare: true}).on('error', gutil.log))
      .pipe(gulp.dest('./public/js'))
});

gulp.task('less', function() {
  gulp.src('./src/less/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('./public/css'))
});

gulp.task('default', ['coffee', 'less']);

gulp.task('watch', ['coffee', 'less'], function() {
  gulp.watch("./src/coffee/**/*.coffee", ['coffee']);
  gulp.watch("./src/less/**/*.less", ['less']);
});