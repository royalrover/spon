/**
 * Created by yuxiu on 16/1/25.
 * less解析
 */

module.exports = function(argName){
  var path = require('path');
  var fs = require('fs');
  var gulp = require('gulp');
  var less = require('gulp-less');
  var autoprefixer = require('gulp-autoprefixer');
  var minifyCss = require('gulp-minify-css');
  var rename = require('gulp-rename');
  var plumber = require('gulp-plumber');
  var notify = require('gulp-notify');
  var log = require('npmlog');
  var rem = require('./rem');
  var currPath = process.cwd();
  gulp.task('page-css',['page-build'],function(){
    log.info('spon: ','构建项目完毕！');
    log.info('spon: ','开始编译less ...');
    // TODO: 缓存js模块，可以制定缓存策略
//  var exec = require('child_process').exec;
//  exec('rm -rf ' + utils.getModulesPath());
    var srcPath = (typeof argName === 'string') ? ('/src/pages/' + argName + '/'+ argName +'.less') : '/src/pages/*/**.less';
    var destPath = (typeof argName === 'string') ? ('/build/src/pages/' + argName) : ('/build/src/pages/');

    var useRemReg = /@remSwitch: true/gi;
    var remConfigReg = /@(\w+)\s*?:(.+?);/gi;
    var remConfig = {},updateRem,lessContent;

    if (path.extname(srcPath) == '.less' && typeof argName === 'string') {
      lessContent = fs.readFileSync(path.join(currPath, srcPath), 'utf8');
      if (lessContent.match(useRemReg)) {
        lessContent.replace(remConfigReg, function (str, k, v) {
          switch (k) {
            case 'remSwitch':
              remConfig[k] = Boolean(v);
              break;
            case 'rootValue':
            case 'unitPrecision':
            case 'minPixelValue':
              remConfig[k] = v >> 0;
              break;
            case 'blackList':
              remConfig[k] = eval(v);
              break;
          }

        });
        updateRem = rem(remConfig);
        return gulp.src(path.join(currPath, srcPath))
          .pipe(less())
          .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
          }))
          .pipe(updateRem())
          .pipe(gulp.dest(path.join(currPath, destPath)))
          .pipe(rename({suffix: '.min'}))
          .pipe(minifyCss())
          .pipe(gulp.dest(path.join(currPath, destPath)));
      } else {
        return gulp.src(path.join(currPath, srcPath))
          .pipe(less())
          .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
          }))
          .pipe(gulp.dest(path.join(currPath, destPath)))
          .pipe(rename({suffix: '.min'}))
          .pipe(minifyCss())
          .pipe(gulp.dest(path.join(currPath, destPath)));
      }
    } else {

      return gulp.src(path.join(currPath, srcPath))
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        //  .pipe(plumber())
        .pipe(less())
        .pipe(autoprefixer({
          browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
          cascade: true, //是否美化属性值 默认：true 像这样：
          //-webkit-transform: rotate(45deg);
          //        transform: rotate(45deg);
          remove: true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(gulp.dest(path.join(currPath, destPath)))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(path.join(currPath, destPath)));
    }

  });

  gulp.task('join-css',['join'],function(){
    log.info('spon: ','构建项目完毕！');
    log.info('spon: ','开始编译less ...');
    // TODO: 缓存js模块，可以制定缓存策略
//  var exec = require('child_process').exec;
//  exec('rm -rf ' + utils.getModulesPath());
    var srcPath = (typeof argName === 'string') ? ('/src/pages/' + argName + '/'+ argName +'.less') : '/src/pages/*/**.less';
    var destPath = (typeof argName === 'string') ? ('/build/src/pages/' + argName) : ('/build/src/pages/');

    var useRemReg = /@remSwitch: true/gi;
    var remConfigReg = /@(\w+)\s*?:(.+?);/gi;
    var remConfig = {},updateRem,lessContent;

    if (path.extname(srcPath) == '.less' && typeof argName === 'string') {
      lessContent = fs.readFileSync(path.join(currPath, srcPath), 'utf8');
      if (lessContent.match(useRemReg)) {
        lessContent.replace(remConfigReg, function (str, k, v) {
          switch (k) {
            case 'remSwitch':
              remConfig[k] = Boolean(v);
              break;
            case 'rootValue':
            case 'unitPrecision':
            case 'minPixelValue':
              remConfig[k] = v >> 0;
              break;
            case 'blackList':
              remConfig[k] = eval(v);
              break;
          }

        });
        updateRem = rem(remConfig);
        return gulp.src(path.join(currPath, srcPath))
          .pipe(less())
          .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
          }))
          .pipe(updateRem())
          .pipe(gulp.dest(path.join(currPath, destPath)))
          .pipe(rename({suffix: '.min'}))
          .pipe(minifyCss())
          .pipe(gulp.dest(path.join(currPath, destPath)));
      } else {
        return gulp.src(path.join(currPath, srcPath))
          .pipe(less())
          .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove: true //是否去掉不必要的前缀 默认：true
          }))
          .pipe(gulp.dest(path.join(currPath, destPath)))
          .pipe(rename({suffix: '.min'}))
          .pipe(minifyCss())
          .pipe(gulp.dest(path.join(currPath, destPath)));
      }
    } else {

      return gulp.src(path.join(currPath, srcPath))
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        //  .pipe(plumber())
        .pipe(less())
        .pipe(autoprefixer({
          browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
          cascade: true, //是否美化属性值 默认：true 像这样：
          //-webkit-transform: rotate(45deg);
          //        transform: rotate(45deg);
          remove: true //是否去掉不必要的前缀 默认：true
        }))
        .pipe(gulp.dest(path.join(currPath, destPath)))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(path.join(currPath, destPath)));
    }
  });
};
