/**
 * Created by yuxiu on 16/1/25.
 * 完成gulp的前期准备
 */
var path = require('path');
var del = require('del');
var gulp = require('gulp');
var fs = require('fs');
var log = require('npmlog');
module.exports = function(utils, argName) {
  var currPath = process.cwd();
  if (typeof argName === 'string') {
    var _path = path.join(currPath, 'src/pages/', argName, argName + '.js');
    if (!fs.existsSync(_path)) {
      log.error('can\'t found ' + argName +' page. checkout if we have this page');
    }
  }
  gulp.task('clean', function () {
    if (typeof argName === 'string') {
      del([path.join(process.cwd(),'build/src/pages',argName)]);
    } else {
      del([path.join(process.cwd(),'build')]);
    }
  });

  gulp.task('prepare',['clean'], function(){
    // prepare 预处理
    log.info('spon: ','环境准备中 ...');
    utils.createMobiSandbox();
    log.info('spon: ','环境准备完毕！');
  });

};