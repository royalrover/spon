/**
 * Created by yuxiu on 16/1/25.
 * 构建模块及其依赖
 */
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var webpack = require('gulpp-webpack');
var myWebpack = require('my-webpack');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var log = require('npmlog');
var utils = require('../../utils/index');
module.exports = function(webpackConfig, argName){
  var currPath = process.cwd();

  // 在OS X下目录中存在隐藏文件.DS_Store，会影响构建
  var checkDirsExceptDSStore = function(dirs){
    var nameReg = /^[a-z0-9]/i;
    var ret = [];
    dirs.forEach(function(v,i){
      if(v.match(nameReg)){
        ret.push(v);
      }
    });
    return ret;
  };

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
      process._exit(1,e,'build');
    }

    dirs = checkDirsExceptDSStore(dirs);

    try{
      dirs.forEach(function(dir){
        webpackConfig.entry[path.join(prefix,dir,dir)] = path.join(webpackConfig['__APP_PATH'],'/'+dir,dir + '.js');
      });
    }catch(e){
      log.error('spon: ','构建项目失败，请检查主目录 src/pages/ 下是否存在非期望的文件（目录），如隐藏文件.DS_Store');
      log.error('spon: ',e.message);
      process._exit(1,e,'build');
    }

    log.info('spon: ','开始构建项目 ...');
    return gulp.src(srcPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(gulp.dest('build/'));
  });
};