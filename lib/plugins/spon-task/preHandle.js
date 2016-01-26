/**
 * Created by yuxiu on 16/1/25.
 * 完成gulp的前期准备
 */
var path = require('path');
var del = require('del');
var gulp = require('gulp');
module.exports = function(utils) {

  gulp.task('clean', function () {
    del([path.join(process.cwd(),'build')]);
  });

  gulp.task('prepare', function(){
    // prepare 预处理
    utils.createMobiSandbox();
  });

};