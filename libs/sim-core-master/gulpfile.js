var gulp = require('gulp');
var fs = require('fs');
var runSequence = require( 'run-sequence' );
var cgfx = require('cgfx-build-tools');

var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
var root = __dirname;

cgfx.configure( {
  root: root,
  doc: root + '/doc/',
  project: root + '/src/tsconfig.json',
  karma: root + '/karma.conf.js',
  tests: [ root + '/test/**/*.ts' ],
  typings: [ root + '/dist/'+pkg.name+'*.d.ts', root + '/jspm_packages/**/*.d.ts' ],
  output: root + '/dist/',
  packageName: pkg.name,
  packageVersion: pkg.version
} );

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
//    'build-css', 'build-html',
    'build-amd', 'build-cjs', 'build-system',
    'build-tests',
    callback
  );
});

