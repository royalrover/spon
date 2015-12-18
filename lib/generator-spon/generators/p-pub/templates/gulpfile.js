var gulp = require('gulp');
var del = require('del');
var connect = require('gulp-connect');
var webpack = require('gulp-webpack');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var  notify = require('gulp-notify');

var webpackConfig = require('./webpack.config.js');

var port = process.env.PORT || 8080;
var reloadPort = process.env.RELOAD_PORT || 35729;

gulp.task('clean', function () {
  del(['build']);
});

gulp.task('build', function (callback) {
/*
  var myConfig = Object.create(webpackConfig);
  // run webpack
  webpack(
    // configuration
    myConfig
    , function(err, stats) {
      // if(err) throw new gutil.PluginError("webpack", err);
      // gutil.log("[webpack]", stats.toString({
      //     // output options
      // }));
      callback();
    });
  notify({ message: 'build js task complete' });*/
  return gulp.src(webpackConfig.entry.hello)
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('build/'))
    .pipe(notify({ message: 'build js task complete' }));
});

gulp.task('css',function(){
  return gulp.src('./less/**.less')
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifyCss())
    .pipe(gulp.dest('./build/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('serve', function () {
  connect.server({
    port: port,
    livereload: {
      port: reloadPort
    }
  });
});

gulp.task('reload-js', function () {
  return gulp.src('./build/*.js')
    .pipe(connect.reload())
    .pipe(notify({ message: 'reload-js task complete' }))
});

gulp.task('watch', function () {
  gulp.watch(['./build/*.js'], ['reload-js']);

  gulp.watch(['./src/page/*.js'], ['build']);
  gulp.watch(['./less/**'], ['css']);
});

gulp.task('default', ['clean', 'build', 'css', 'watch']);
