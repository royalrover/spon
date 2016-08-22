/**
 * Created by yuxiu on 16/1/25.
 * 拆分gulpfile为单独的模块
 */

module.exports = {
  /**
   * @param op [type] {option: '子命令|init|build'，plugin: 'mobi'}
   */

  _build: function(op){
    var gulp = require('gulp');
    var q = require('q');
    var log = require('npmlog');

    // 由于加载相关插件，因此需要“提示加载中”，提供用户可用度
    log.info('spon: ','正在加载相关构建组件，请稍后...');

    var preHandle = require('./preHandle');
    var lessParse = require('./lessParse');
    var lint = require('./lint');
    var preFetch = require('./prefetch');
    var build = require('./build');
    var templateParse = require('./templateParse');

    var utils = op.utils;
    var argName = op.originOptions.name;
    templateParse(utils);
    gulp.start('parse');
    preHandle(utils, argName);
    preFetch(utils, argName);

    lessParse(argName);
    lint(argName);


    var def = q.defer();
    var thenFn = function(){
      gulp.start('fetch',function(){
        def.resolve(preFetch.webpackConfig);
      });
      return def.promise;
    };
    thenFn().then(function(webpackConfig){
      build(webpackConfig, argName);
      gulp.start(['clean','prepare','lint','page-build','page-css','page-html'],function(){
        log.info('spon: ','页面规范检测完毕！');
        log.info('spon: ','构建完毕，感谢支持🙏！');
      });
    });
  },

  _dev: function(op){
    var gulp = require('gulp');
    var dev = require('./dev');
    var utils = op.utils;
    dev(utils);
    gulp.start(['serve','page-watch']);
  },

  _updateRem: function(op){
    var rem = require('./rem');
    rem(op.args);
  },

  _join: function(op){
    var join = require('./join');
    join();
  },

  publish: function(methodName,options){
    var self = this;
    switch(methodName) {
      case 'build':
        self._build(options);
        break;
      case 'dev':
        self._dev(options);
        break;
      case 'rem':
        self._updateRem(options);
        break;
      case 'join':
        self._join(options);
        break;
      default:
        break;
    }
  }
};