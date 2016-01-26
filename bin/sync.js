var path = require('path');
var shelljs = require('shelljs');
var fs = require('fs');
var current = process.cwd();
var currentGulpfile = path.join(current,'lib/generator-spon/generators/app/templates/gulpfile.js');
var currentWebpack = path.join(current,'lib/generator-spon/generators/app/templates/webpack.config.js');

var gulpfilePath = '/usr/local/lib/node_modules/spon/lib/generator-spon/generators/app/templates/gulpfile.js';
var webpackpath = '/Users/showjoy/.spon/mobi/webpack.config.js';

shelljs.exec('sudo cp '+ currentGulpfile +' '+gulpfilePath);
shelljs.exec('sudo cp '+ currentWebpack + ' ' +webpackpath);
shelljs.exec('sudo cp -r lib /usr/local/lib/node_modules/spon/');