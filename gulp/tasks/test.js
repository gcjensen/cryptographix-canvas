var gulp = require('gulp');
var Karma = require('karma').Server;

gulp.task('test', function (done) {
  new Karma({
    configFile: __dirname + '/../../karma.conf.js',
    singleRun: true
  }, done).start();
});

// watch for file changes and re-run tests on each change
gulp.task('tdd', function (done) {
  new Karma({
    configFile: __dirname + '/../../karma.conf.js'
  }, done).start();
});