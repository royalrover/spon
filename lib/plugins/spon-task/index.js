/**
 * Created by yuxiu on 16/1/25.
 * 拆分gulpfile为单独的模块
 */
var gulp = require('gulp');
var preHandle = require('./preHandle');
var lessParse = require('./lessParse');
var lint = require('./lint');
var preFetch = require('./prefetch');
var build = require('./build');
var dev = require('./dev');
var rem = require('./rem');
var templateParse = require('./templateParse');
var q = require('q');
module.exports = {
  /**
   * @param op [type] {option: '子命令|init|build'，plugin: 'mobi'}
   */

  _build: function(op){
    var utils = op.utils;
    templateParse(utils);
    gulp.start('parse');
    preHandle(utils);
    preFetch(utils);
    lessParse();
    lint();


    var def = q.defer();
    var thenFn = function(){
      gulp.start('fetch',function(){
        def.resolve(preFetch.webpackConfig);
      });
      return def.promise;
    };
    thenFn().then(function(webpackConfig){
      build(webpackConfig);
      gulp.start(['clean','prepare','lint','page-build','page-css','page-html']);
    });
  },

  _dev: function(op){
    var utils = op.utils;
    dev(utils);
    gulp.start(['serve','page-watch']);
  },

  _updateRem: function(op){
    rem(op.args);
  },

  publish: function(methodName,options){
    var self = this;
    switch(methodName) {
      case 'build':
        self._build(options);
        break;
      case 'dev':
        self._dev(options);
      case 'rem':
        self._updateRem(options);
      default:
        break;
    }
  }
};