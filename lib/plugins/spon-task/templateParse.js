/**
 * Created by yuxiu on 16/1/25.
 * template解析
 */
var path = require('path');
var gulp = require('gulp');
var C_KEY = 'showjoyf2espon';
module.exports = function(utils){
  var currPath = process.cwd();
  gulp.task('parse', function() {
    var command = utils.getNPMGlobalPath('aes-256-cbc',C_KEY);
    command = command.replace(/\n+/g,'');
    command = path.join(command,'spon/bin/tmpl-parser.js');
    require('child_process').execSync('node ' + command + ' '+ path.join(currPath,'src/') + ' --output '+ path.join(currPath,'src/') + ' --no-watch --no-cache');
  });
};

