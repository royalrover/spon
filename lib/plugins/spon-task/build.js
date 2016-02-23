/**
 * Created by yuxiu on 16/1/25.
 * 构建模块及其依赖
 */
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var webpack = require('my-gulp-webpack');
var myWebpack = require('my-webpack');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var utils = require('../../utils/index');
module.exports = function(webpackConfig, argName){
  var currPath = process.cwd();
  gulp.task('page-build',['lint'],function (callback) {
    var srcPath = (typeof argName === 'string') ? ('src/pages/' + argName) : ('src/pages/');
    var prefix = 'src/pages/';
    var dirs;
    try{
      var array = [];
      if (typeof argName === 'string') {
        array.push(argName);
      }
      dirs = (typeof argName === 'string') ? (array) : fs.readdirSync(path.join(currPath,'src/pages'));
    }catch(e){
      log.error('spon: ',e);
      throw e;
    }

    dirs.forEach(function(dir){
      webpackConfig.entry[path.join(prefix,dir,dir)] = path.join(webpackConfig['__APP_PATH'],'/'+dir,dir + '.js');
    });

    return gulp.src(srcPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('build/'))
      .pipe(notify({ message: 'build js task complete' }));
  });
};