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
    var path = require('path');
    var fs = require('fs');
    var log = require('npmlog');
    var gulp = require('gulp');
    var q = require('q');
    var preHandle = require('./preHandle');
    var lessParse = require('./lessParse');
    var fetchUI = require('./join/fetchUI');
    var join = require('./join');

    var utils = op.utils;
    var argName = op.originOptions.name;
    var tokens,fileContent;

    // 入口为 xxx.html
    var filename = path.join(process.cwd(),'src/pages/',argName,argName + '.html');
    if(fs.existsSync(filename)){
      fileContent = fs.readFileSync(filename,'utf8')
      // 解析模板文件，并开始加载依赖
      tokens = utils.parseEntrance(fileContent,utils);

      preHandle(utils, argName);
      // fetch对应模块、文件和占位符
      fetchUI(utils,tokens);
      lessParse(argName);

      var def = q.defer();
      var thenFn = function(){
        gulp.start('fetch-joyui',function(){
          def.resolve(fetchUI.webpackConfig);
        });
        return def.promise;
      };

      thenFn().then(function(webpackConfig){
        try{
          join(webpackConfig,tokens,argName);

          gulp.start(['clean','prepare','join','join-css','generate-html'],function(){
            log.info('spon: ','页面规范检测完毕！');
            log.info('spon: ','构建完毕，感谢支持🙏！');
          });
        }catch(e){
          throw e
        }

      });

    }else{
      log.error('spon: 请输入正确的文件名');
      process.exit(1);
    }

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