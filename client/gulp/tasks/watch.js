var gulp = require('gulp');
var paths = require('../paths');
var browserSync = require('browser-sync');

gulp.task('watch', ['serve'], function() {
  gulp.watch(paths.source, ['build-system', browserSync.reload]);
  gulp.watch(paths.html, ['build-html', browserSync.reload]);
  gulp.watch(paths.css, ['build-css', browserSync.reload]);
  gulp.watch(paths.style, browserSync.reload);
});