'use strict';
/**
 * Created by yuxiu on 16/8/23.
 * fetch JOYUI组件
 */
var fs = require('fs');
var path = require('path');
var del = require('del');
var gulp = require('gulp');
var async = require('async');
var log = require('npmlog');
var q = require('q');

module.exports = function(utils){
  var webpackConfig = require(utils.getWebpackPath());
  var currPath = process.cwd();
  var mobiConfig = require(path.join(currPath,'mobi.json'));
  // fetch showjoy组件到开发目录，进行构建
  gulp.task('fetch-joyui-pack', function(asyncCb){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon/mobi/fecomponent');
    var base = 'http://git.showjoy.net/';
    var deps = mobiConfig.dependencies;
    var entryScript = 'index.js';

    log.info('spon: ','努力加载所需的JOYUIs ...');

    // 加载JOYUI模块依赖的fecomponent模块
    // c = 模块alias u ＝ 模块url
    var recurseLoad = function(c,u,callback,errHandler){
      var orginC = c;
      var Reg = {
        cdnModuleWithVersion: /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)(\/)?(index)?$/gi
      };

      // 判断是否引用cdn模块
      if(Reg.cdnModuleWithVersion.test(c)){
        c = c.replace(Reg.cdnModuleWithVersion,function(a,b,c){
          return 'fecomponent/' + b;
        });
      }

      // 加载该模块的依赖，待依赖加载完毕，再加载模块
      if(deps[c]['requires'].length){

        // 遍历所有依赖，并行加载
        async.map(deps[c]['requires'], function(d,cb){
          var spls,alias = [];
          spls = d.alias.split('/');
          alias[0] = spls[0]; // fecomponent
          alias[1] = spls[1];
          spls.shift();

          // 设置alias
          webpackConfig.resolve['alias'][alias.join('/')] = path.join(showjoyBase,spls.join('/'));

          // 递归加载
          recurseLoad(d.alias, base + d.url,cb,errHandler);

        },function(err,rets){
          if(err){
            errHandler();
            log.error('spon:fetch '+ d +'(deps) of '+ c +': ',err);
            process._exit(1,err,'pack/fetchUI');
          }

          // 加载该模块
          request(u || base + deps[c]['url'],function(error,res,body){
            var p,dirname,spls;
            if(error){
              errHandler();
              log.error('spon:fetch: ',error);
              process._exit(1,error,'pack/fetchUI');
            }
            if(!error && res.statusCode == 200){
              log.info('spon:fetch get: ',base + deps[c]['url']);
              spls = deps[c]['alias'].split('/');
              spls.shift();
              p = path.join(showjoyBase,spls.join('/') + '.js');
              if(u){
                spls = orginC.split('/');
                spls.shift();

                // Format: fecomponent/mobi-say/0.0.4/index
                if(orginC.indexOf('index') != -1){
                  p = path.join(showjoyBase,spls.join('/') + '.js');
                }else{
                  // Format: fecomponent/mobi-say/0.0.4
                  p = path.join(showjoyBase,spls.join('/'),'index.js');
                }
              }
              dirname = path.dirname(p);
              utils.mkdirsSync(dirname);

              if(fs.existsSync(p)){
                fs.unlinkSync(p);
              }


              var relativeDeps = utils.parseRelativeRequires(body);
              // 加载相对路径的依赖
              if(relativeDeps.length !== 0){
                utils.loadRelativeRequires(relativeDeps,p,u || base + deps[c]['url']);
              }

              fs.writeFile(p, body,function(err){
                if(err) {
                  errHandler();
                  process._exit(1,err,'pack/fetchUI');
                }

                log.info('spon:fetch ' + c + ' successfully');
                callback && callback(err);
              });
            }
          });

        });

      }else{
        // 检测是否重复加载依赖
        // 若无依赖，则直接加载该模块
        request(u || base + deps[c]['url'],function(error,res,body){
          var p,dirname,spls;
          if(error){
            errHandler();
            log.error('spon:fetch: ',error);
            process._exit(1,error,'pack/fetchUI');
          }

          if(!error && res.statusCode == 200){
            log.info('spon:fetch: ', u || base + deps[c]['url']);
            spls = deps[c]['alias'].split('/');
            spls.shift();
            p = path.join(showjoyBase,spls.join('/') + '.js');
            if(u){
              spls = orginC.split('/');
              spls.shift();

              // Format: fecomponent/mobi-say/0.0.4/index
              if(orginC.indexOf('index') != -1){
                p = path.join(showjoyBase,spls.join('/') + '.js');
              }else{
                // Format: fecomponent/mobi-say/0.0.4
                p = path.join(showjoyBase,spls.join('/'),'index.js');
              }

            }
            dirname = path.dirname(p);
            utils.mkdirsSync(dirname);
            if(fs.existsSync(p)){
              fs.unlinkSync(p);
            }

            var relativeDeps = utils.parseRelativeRequires(body);
            // 加载相对路径的依赖
            if(relativeDeps.length !== 0){
              utils.loadRelativeRequires(relativeDeps,p,u || base + deps[c]['url']);
            }


            fs.writeFile(p, body,function(err){
              if(err) {
                errHandler();
                process._exit(1,err,'pack/fetchUI');
              }

              log.info('spon:fetch ' + c + ' successfully');
              callback && callback(err);
            });
          }
        });
      }

    };

    // 递归加载带有版本号的组件
    var recurseLoadComponentWithVersion = function(c,u,callback,errHandler){
      var packageFile = u.replace(/index\.js$/gi,'package.json');

      q.promise(function(resolve,reject){
        // 加载依赖
        request(packageFile,function(error,res,body){
          var packageConfig,deps;
          if(error){
            errHandler();
            log.error('spon:fetch: ',error);
            reject(error);
          }

          if(!error && res.statusCode == 200){
            try{
              packageConfig = JSON.parse(body);
            }catch(e){
              log.error('spon:fetch: 模块配置文件获取错误,请检查工程的权限！');
            }

            deps = packageConfig.dependencies;

            // 递归加载
            async.map(deps,function(dep,cb){
              var cpntWithVer = dep.alias.replace(/\/index$/i,'');
              var spls = cpntWithVer.split('/');
              spls.shift();

              // Format: fecomponent/mobi-say/0.0.4
              var p = path.join(showjoyBase,spls.join('/'),'index.js');
              webpackConfig.resolve['alias'][cpntWithVer] = p;

              recurseLoad(dep.alias, base + dep.url,cb,errHandler);
            });
            resolve(deps);
          }
        });
      }).then(function(deps){
        // fetch 模块
        request(u,function(error,res,body){
          var p,dirname,spls;
          if(error){
            errHandler();
            log.error('spon:fetch: ',error);
            process._exit(1,error,'pack/fetchUI');
          }

          if(!error && res.statusCode == 200){
            log.info('spon:fetch: ', u);
            spls = (c + '/index').split('/');
            spls.shift();
            p = path.join(showjoyBase,spls.join('/') + '.js');
            dirname = path.dirname(p);
            utils.mkdirsSync(dirname);
            if(fs.existsSync(p)){
              fs.unlinkSync(p);
            }

            // 将组件的require依赖添加版本号
            body = utils.replaceRequire(body,deps);

            var relativeDeps = utils.parseRelativeRequires(body);

            // 加载相对路径的依赖
            if(relativeDeps.length !== 0){
              utils.loadRelativeRequires(relativeDeps,p,u);
            }

            fs.writeFile(p, body,function(err){
              if(err) {
                errHandler();
                process._exit(1,err,'pack/fetchUI');
              }

              log.info('spon:fetch ' + c + ' successfully');
              callback && callback(err);
            });
          }
        });
      });
    };


    var load = function(){
      var showjoyBase = path.join(home,'.spon/mobi/');
      var cdnModuleWithVersion = /^[^\/\s]+\/([^\/]+)\/(\d+\.\d+\.\d+)/i;
      var version,cpntName,matchRet;

      var errHandler = function(){
      };
      var entryPath = path.join(currPath,entryScript);
      if(!fs.existsSync(entryPath)){
        log.error('spon: JOYUI模块打包失败，没有找到对应js文件！');
        process._exit(1,'spon: JOYUI模块打包失败，没有找到对应js文件！');
      }
      var entryContent = fs.readFileSync(entryPath,'utf8');
      var cpnts = utils.parseRequire(entryContent);

      // 由于采用“组件缓存”策略，针对缓存的组件，需要解析其依赖，并判断是否加载依赖
      function recurse(cpnts){
        var checkAndLoad = function (cpnt){
          var tmpArr,_path,dependencies;
          matchRet = cpnt.match(cdnModuleWithVersion);
          if(!matchRet){
            log.error('spon: the reference of component('+ cpnt +') should own version!');
            process._exit(1,'spon: the reference of component('+ cpnt +') should own version!');
          }

          // 针对引用版本号的组件，需要额外fetch对应的package.json，处理依赖
          // 引用带有版本号的组件
          cpntName = matchRet[1];
          version = matchRet[2];
          if(!mobiConfig['dependencies']['fecomponent/' + cpntName]){
            log.error('spon: ','your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
            process._exit(1,'spon: ','your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
          }

          // 处理alias
          tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['alias']).split('/');
          tmpArr[2] = version;
          webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,tmpArr.join('/'));

          // 处理url
          tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['url']).split('/');
          tmpArr[4] = version;

          _path = path.join(showjoyBase,cpnt,'index.js');
          if(fs.existsSync(_path)){
            var content = fs.readFileSync(_path, 'utf-8');
            deps = utils.parseRequire(content);
            if(deps.length){
              recurse(deps);
            }
            return;
          }
          // 针对require('fecomponent/mobi-say/0.0.5')方式的引用
          recurseLoadComponentWithVersion(cpnt,base + tmpArr.join('/'),null,errHandler);

        };

        // 抓取组件
        cpnts.forEach(function(cpnt){
          checkAndLoad(cpnt);
        });
      }
      try{
        recurse(cpnts);

      }catch(e){
        log.error('spon',e)
      }

    };

    load();

    // 保证fetch任务在build之前运行
    // TODO：暂时没有好的方案
    setTimeout(function(){
      module.exports.webpackConfig = webpackConfig;
      log.info('spon: ','加载JOYUIs完毕！');
      asyncCb();
    },3000);
  });
};

