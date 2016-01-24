var gulp = require('gulp');
var fs = require('fs');

var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
var root = __dirname;

config = {
  root: root,
  doc: root + '/doc/',
  project: root + '/src/tsconfig.json',
  karma: root + '/karma.conf.js',
  tests: root + '/test/**/*.ts',
  typings: [ root + '/dist/'+pkg.name+'*.d.ts', root + '/jspm_packages/**/*.d.ts' ],
  output: root + '/dist/',
  packageName: pkg.name,
  packageVersion: pkg.version
};

require('cgfx-build-tools');

