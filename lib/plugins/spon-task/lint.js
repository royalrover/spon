/**
 * Created by yuxiu on 16/1/25.
 * 针对js，html做link
 */
var path = require('path');
var gulp = require('gulp');
var htmlhint = require('gulp-htmlhint');
var jshint = require('gulp-jshint');
module.exports = function(argName){
  var currPath = process.cwd();
  var srcPath = (typeof argName === 'string') ? ('/src/pages/' + argName + '/**') : '/src/pages/*/**';
  var destPath = (typeof argName === 'string') ? ('/build/src/pages/' + argName) : ('/build/src/pages/'); 
  gulp.task('lint',['prepare'],function(){
    // return gulp.src(path.join(currPath, srcPath + '.js'))
    //   .pipe(jshint())
    //   .pipe(jshint.reporter('default', { verbose: true }));
  });

  gulp.task('page-html',['page-build'],function(){
    gulp.src(path.join(currPath, srcPath + '.htm*'))
      .pipe(htmlhint())
      .pipe(htmlhint.reporter())
      .pipe(htmlhint.failReporter({ suppress: true }));
    return gulp.src(path.join(currPath, srcPath + '.htm*'))
      .pipe(gulp.dest(path.join(currPath, destPath)));
  });
};
