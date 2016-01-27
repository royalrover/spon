/**
 * Created by yuxiu on 16/1/25.
 * less解析
 */
var path = require('path');
var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');

module.exports = function(){
  var currPath = process.cwd();
  gulp.task('page-css',['page-build'],function(){
    // TODO: 缓存js模块，可以制定缓存策略
//  var exec = require('child_process').exec;
//  exec('rm -rf ' + utils.getModulesPath());

    return gulp.src(path.join(currPath,'/src/pages/*/**.less'))
      .pipe(less())
      .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
      .pipe(gulp.dest(path.join(currPath,'/build/src/pages/')))
      .pipe(rename({suffix: '.min'}))
      .pipe(minifyCss())
      .pipe(gulp.dest(path.join(currPath,'/build/src/pages/')));
  });
};
