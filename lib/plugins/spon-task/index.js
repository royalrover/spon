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
    var utils = op.utils;
    var argName = op.originOptions.name;

    // 强制指定具名page工程
    if(typeof argName !== 'string'){
      log.error('spon:','请指定构建页面的名称');
      process._exit(1,'请指定构建页面的名称');
      return;
    }

    // 由于加载相关插件，因此需要“提示加载中”，提供用户可用度
    log.info('spon:','正在加载相关构建组件，请稍后...');

    var preHandle = require('./preHandle');
    var lessParse = require('./lessParse');
    var lint = require('./lint');
    // 采用新的模块加载机制
    var preFetch = require('./prefetchnew');
    var build = require('./build');
    var templateParse = require('./templateParse');

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
      gulp.start(['clean','prepare','less-lint','js-lint','page-build','page-css','page-html'],function(){
        log.info('spon:','页面规范检测完毕！');
        log.info('spon:','构建完毕，感谢支持🙏！');
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
    var del = require('del');
    var preHandle = require('./preHandle');
    var lessParse = require('./lessParse');
    var fetchUI = require('./join/fetchUI');
    var join = require('./join');

    var utils = op.utils;
    var argName = process.projName =  op.originOptions.name;
    var tokens,fileContent;

    // 入口为 xxx.html
    var filename = path.join(process.cwd(),'src/pages/',argName,argName + '.html');
    if(fs.existsSync(filename)){
      fileContent = fs.readFileSync(filename,'utf8');
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
          utils.bindSlabs(fileContent);
          join(webpackConfig,tokens,argName);

          gulp.start(['clean','prepare','join','join-css','generate-html'],function(){
            fs.writeFileSync(process.join.entryPath,process.join.entryContent);

            // 删除{{require(filepath)}}的文件，不缓存
            var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
            var mobiBase = path.join(home,'.spon/mobi/joyui');
            del.sync([path.join(mobiBase,'joyui')],{
              force: true
            });

            log.info('spon:','页面规范检测完毕！');
            log.info('spon:','构建完毕，感谢支持🙏！');
          });
        }catch(e){
          log.error('spon:',e);
          process._exit(1,e);
          return;
        }

      });

    }else{
      log.error('spon: 请输入正确的文件名');
      process._exit(1,'spon: 请输入正确的文件名');
      return;
    }

  },

  // 在执行spon mb pack之前，需要给joyui模块添加mobi.json文件用来抓取依赖（spon mb upgrade）
  _pack: function(op){
    var path = require('path');
    var fs = require('fs');
    var exec = require('child_process').exec;
    var log = require('npmlog');
    var gulp = require('gulp');
    var q = require('q');
    var del = require('del');
    var preHandle = require('./preHandle');
    var lessParse = require('./lessParse');
    var fetchUI = require('./pack/fetchUI');
    var pack = require('./pack');
    var utils = op.utils;

    preHandle(utils);
    var loadMobiFile = function(){
      var d = q.defer();
      require('../spon-mobi')._upgrade();
      process.on('upgrade',function(){
        d.resolve();
      });

      process.on('upgrade_error',function(){
        log.error('spon:','无法更新，请检查网络接入！');
        process._exit(1,'无法更新，请检查网络接入！');
        return;
      });
      return d.promise;
    };

    loadMobiFile().then(function(){
      // fetch对应模块、文件和占位符
      fetchUI(utils);

      var def = q.defer();

      var thenFn = function(){
        gulp.start('fetch-joyui-pack',function(){
          def.resolve(fetchUI.webpackConfig);
        });
        return def.promise;
      };

      thenFn().then(function(webpackConfig){
        try{
          pack(webpackConfig);

          gulp.start(['clean','prepare','pack','generate-template'],function(){
            log.info('spon:','打包完毕，感谢支持🙏！');
          });
        }catch(e){
          log.error('spon:',e);
          process._exit(1,e);
          return;
        }
      });
    });

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
      case 'pack':
        self._pack(options);
      default:
        break;
    }
  }
};