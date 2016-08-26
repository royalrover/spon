/**
 * Created by yuxiu on 16/8/19.
 * 解析JOYUI源码搭建入口
 */
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var gulp = require('gulp');
var webpack = require('my-gulp-webpack');
var myWebpack = require('my-webpack');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var log = require('npmlog');
var through2 = require('through2');
var utils = require('../../../utils/index');

/**
 * @param webpackConfig 构建配置信息
 * @param tokens JOYUI组件名称及配置信息构成的数组
 * @param argName 需要单独构建的项目名称
 */
module.exports = function(webpackConfig,tokens, argName){
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

  gulp.task('join',['clean'],function () {

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
      process.exit(1);
    }

    dirs = checkDirsExceptDSStore(dirs);

    try{
      dirs.forEach(function(dir){
        webpackConfig.entry[path.join(prefix,dir,dir)] = path.join(webpackConfig['__APP_PATH'],'/'+dir,dir + '.js');
      });
    }catch(e){
      log.error('spon: ','构建项目失败，请检查主目录 src/pages/ 下是否存在非期望的文件（目录），如隐藏文件.DS_Store');
      log.error('spon: ',e.message);
      process.exit(1);
    }

    log.info('spon: ','开始构建项目 ...');
    return gulp.src(srcPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(gulp.dest('build/'));
  });

  gulp.task('generate-html',['join'],function(){
    var srcPath = (typeof argName === 'string') ? path.join('src/pages/',argName,argName + '.html') : ('src/pages/');

    function dataSource(){
      return through2.obj(function(file, encoding, done){
        var outHtml = utils.template(String(file.contents),tokens);
        file.contents = new Buffer(outHtml);
        this.push(file);
        done();
      })
    }

    return gulp.src(srcPath)
      .pipe(dataSource())
      .pipe(gulp.dest(path.join('build','src/pages',argName)));
  });
};