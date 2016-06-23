/**
 * Created by yuxiu on 16/1/25.
 * 监听文件，本地调试服务器，livereload
 */
var path = require('path');
var connect = require('gulp-connect');
var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
module.exports = function(utils){
  var currPath = process.cwd();
  var sponConfig = require(path.join(currPath,'spon.json'));
  // 此处用作watcher执行的任务
  gulp.task('parse-less',function(){

    return gulp.src(path.join(currPath,'/src/pages/*/**.less'))
      .pipe(less())
      .pipe(autoprefixer({
        browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
        cascade: true, //是否美化属性值 默认：true 像这样：
        //-webkit-transform: rotate(45deg);
        //        transform: rotate(45deg);
        remove: true //是否去掉不必要的前缀 默认：true
      }))
      .pipe(gulp.dest(path.join(currPath,'/src/pages/')));
  });

  gulp.task('serve', function () {
    connect.server({
      port: sponConfig.options.port,
      livereload: {
        port: sponConfig.options.livereloadPort
      },
      debug: true,
      root: currPath
    });
    utils.commandOpen('http://localhost:'+ sponConfig.options.port,function(err){
      if(err){
        log.error('spon: ',err);
      }
    });
  });

  gulp.task('reload', function () {
    return gulp.src(path.join(currPath,'/**.*'))
      .pipe(connect.reload());
  });

  gulp.task('page-watch', function () {
    gulp.watch([path.join(currPath,'/src/**/*.less')],['parse-less']);
    gulp.watch([path.join(currPath,'/src/**/*.*')], ['reload']);
    gulp.watch([path.join(currPath,'/build/**/*.html')], ['reload']);
  });
};