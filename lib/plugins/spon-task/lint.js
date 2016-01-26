/**
 * Created by yuxiu on 16/1/25.
 * 针对js，html做link
 */
var path = require('path');
var gulp = require('gulp');
var htmlhint = require('gulp-htmlhint');
var jshint = require('gulp-jshint');
module.exports = function(){
  var currPath = process.cwd();
  gulp.task('lint',function(){
    return gulp.src(path.join(currPath,'src/**/*.js'))
      .pipe(jshint())
      .pipe(jshint.reporter('default', { verbose: true }));
  });

  gulp.task('page-html',['page-build'],function(){
    gulp.src(path.join(currPath,'/src/pages/*/**.htm*'))
      .pipe(htmlhint())
      .pipe(htmlhint.reporter())
      .pipe(htmlhint.failReporter({ suppress: true }));
    return gulp.src(path.join(currPath,'/src/pages/*/**.htm*'))
      .pipe(gulp.dest(path.join(currPath,'/build/src/pages/')));
  });
};
