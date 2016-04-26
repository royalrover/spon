/**
 * Created by yuxiu on 16/1/25.
 * 针对js，html做link
 */
var path = require('path');
var gulp = require('gulp');
var htmlhint = require('gulp-htmlhint');
// var jshint = require('gulp-jshint');
var eslint = require('gulp-eslint');
var lesshint = require('gulp-lesshint');
var colors = require('colors');
module.exports = function(argName){
  var currPath = process.cwd();
  var srcPath = (typeof argName === 'string') ? ('/src/pages/' + argName + '/**') : '/src/pages/*/**';
  var destPath = (typeof argName === 'string') ? ('/build/src/pages/' + argName) : ('/build/src/pages/'); 
  gulp.task('lint',['prepare'],function(){
    // ---------
    // gulp.src(path.join(currPath, srcPath + '.js'))
    //   .pipe(eslint({
    //     extends: 'sj-eslint.json'
    //   }))
    //   .pipe(eslint.formatEach('compact', process.stderr))
    //   .pipe(eslint.results(function (results) {
    //     console.log('\n');
    //   }));

    // gulp.src(path.join(currPath, srcPath + '.less'))
    //   .pipe(lesshint())
    //   .pipe(lesshint.reporter());

    // ---------
    gulp.src(path.join(currPath, srcPath + '.less'))
      .pipe(lesshint({
        configPath: process.env.NODE_PATH + "/../lib/plugins/spon-task/lint-config/sj-lesshint.json"
      }))
      .pipe(lesshint.reporter());

    gulp.src(path.join(currPath, srcPath + '.js'))
      .pipe(eslint({
        rulePaths: [
          process.env.NODE_PATH + "/../lib/plugins/spon-task/lint-config/rules/"
        ], 
        configFile: process.env.NODE_PATH + "/../lib/plugins/spon-task/lint-config/sj-eslint.json"
      }))
      // .pipe(eslint.formatEach('compact', process.stderr))
      .pipe(eslint.results(function (results) {
        for(var i = 0; i < results.length; i++){
          console.log(colors.green('---------javascript files build results as below:---------\n') + results[i].filePath);
          var info = results[i].messages;
          var infoLength = info.length;
          for(var length = 0; length < infoLength; length++){
            var log = '';
            if(info[length].severity == 2){
              log = colors.red("Error  : Line: " + info[length].line + "  Column: " + info[length].column + " " + colors.red(info[length].message)+ " (" + info[length].ruleId + ")" );
            } else if(info[length].severity == 1){
              log = colors.yellow("Warning: Line: ") + info[length].line + "  Column: " + info[length].column + " " + info[length].message+ " (" + colors.yellow(info[length].ruleId) + ")";
            }
            console.log(log);
          }
        }
        console.log('\n');
      }))
      .pipe(eslint.failAfterError());

  });

  gulp.task('page-html',['page-build'],function(){
    gulp.src(path.join(currPath, srcPath + '.htm*'))
      .pipe(htmlhint())
      .pipe(htmlhint.reporter());
      // .pipe(htmlhint.failReporter({ suppress: true }));
    return gulp.src(path.join(currPath, srcPath + '.htm*'))
      .pipe(gulp.dest(path.join(currPath, destPath)));
  });
};
