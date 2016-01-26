/**
 * Created by yuxiu on 16/1/25.
 * fetch模块及依赖
 */
var fs = require('fs');
var path = require('path');
var del = require('del');
var gulp = require('gulp');
var request = require('request');
var async = require('async');
var log = require('npmlog');
var q = require('q');


module.exports = function(utils){
  var webpackConfig = require(utils.getWebpackPath());
  var currPath = process.cwd();
  var mobiConfig = require(path.join(currPath,'mobi.json'));
  // fetch showjoy组件到开发目录，进行构建
  gulp.task('fetch', function(asyncCb){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon/mobi/fecomponent');
    var base = 'http://git.showjoy.net/';
    var deps = require(path.join(currPath,'mobi.json')).dependencies;
    var dirs;
    log.info('spon:mobi:','fetching...');
    try{
      dirs = fs.readdirSync(path.join(currPath,'src/pages'));
      dirs = dirs.concat(fs.readdirSync(path.join(currPath,'src/components')));
    }catch(e){
      log.error('spon:mobi: ',e);
      throw e;
    }


    // 加载模块及其依赖模块
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
            log.error('spon:mobi:fetch '+ d +'(deps) of '+ c +': ',err);
            throw  err;
            return;
          }

          // 加载该模块
          request(u || base + deps[c]['url'],function(error,res,body){
            var p,dirname;
            var spls;
            if(error){
              errHandler();
              log.error('spon:mobi:fetch: ',error);
              throw  error;
            }
            if(!error && res.statusCode == 200){
              log.info('spon:mobi:fetch get: ',base + deps[c]['url']);
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
                  throw err;
                }
                //  notify('fetch successfully!');
                log.info('spon:mobi:fetch ' + c + ' successfully');
                callback && callback(err);
              });
            }
          });

        });

      }else{
        // 检测是否重复加载依赖

        // 若无依赖，则直接加载该模块
        request(u || base + deps[c]['url'],function(error,res,body){
          var p;
          var spls;
          if(error){
            errHandler();
            log.error('spon:mobi:fetch: ',error);
            throw  error;
          }

          if(!error && res.statusCode == 200){
            log.info('spon:mobi:fetch: ', u || base + deps[c]['url']);
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
                throw err;
              }

              log.info('spon:mobi:fetch ' + c + ' successfully');
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
            log.error('spon:mobi:fetch: ',error);
            reject(error);
          }

          if(!error && res.statusCode == 200){
            packageConfig = JSON.parse(body);
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
        request(u,function(error,res,body){
          var p;
          var spls;
          if(error){
            errHandler();
            log.error('spon:mobi:fetch: ',error);
            throw error;
          }

          if(!error && res.statusCode == 200){
            log.info('spon:mobi:fetch: ', u);
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
                throw err;
              }

              log.info('spon:mobi:fetch ' + c + ' successfully');
              callback && callback(err);
            });
          }
        });
      });
    };

    var loadFormDirs = function(dirs){
      var showjoyBase = path.join(home,'.spon/mobi/');
      var cdnModuleWithVersion = /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)$/i;
      var version,cpntName,matchRet;
      dirs.forEach(function(item){
        var p = path.join(currPath,'src/pages',item,item + '.js');
        var content;
        if(fs.existsSync(p)){
          content = fs.readFileSync(p, 'utf-8');
        }else{
          p = path.join(currPath,'src/components',item,item + '.js');
          content = fs.readFileSync(p, 'utf-8');
        }

        var cpnts = utils.parseRequire(content);
        var errHandler = function(){
          //  utils.restoreRequire(content,p,'utf-8');
        };

        // 由于采用“组件缓存”策略，针对缓存的组件，需要解析其依赖，并判断是否加载依赖
        function recurse(cpnts){
          cpnts.forEach(function(cpnt){
            var tmpArr,_path;
            var deps;
            matchRet = cpnt.match(cdnModuleWithVersion);

            // TODO: 针对引用版本号的组件，需要额外fetch对应的package.json，处理依赖
            // 引用带有版本号的组件
            if(matchRet){
              cpntName = matchRet[1];
              version = matchRet[2];
              // 设置alias
              if(!mobiConfig['dependencies']['fecomponent/' + cpntName]){
                log.error('spon:mobi: ','your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
                throw new ReferenceError('your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
                return 1;
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
              //  recurseLoad(cpnt,base + tmpArr.join('/'),null,errHandler);
            }else{

              // 设置alias
              if(!mobiConfig['dependencies'][cpnt]){
                log.error('spon:mobi: ','your mobi.json does not have the component:' + cpnt + ', please check your file or exec the command "spon mb upgrade"');
                throw ReferenceError('your mobi.json does not have the component:' + cpnt + ', please check your file or exec the command "spon mb upgrade"');
                return 1;
              }
              webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,mobiConfig['dependencies'][cpnt]['alias']);

              _path = path.join(showjoyBase,cpnt,mobiConfig.dependencies[cpnt]['alias'].split('/')[2],'index.js');
              if(fs.existsSync(_path)){
                var content = fs.readFileSync(_path, 'utf-8');
                deps = utils.parseRequire(content);
                if(deps.length){
                  recurse(deps);
                }
                return;
              }
              recurseLoad(cpnt,null,null,errHandler);
            }

          });
        }

        recurse(cpnts);

      });
    };


    loadFormDirs(dirs);

    // 保证fetch任务在build之前运行
    // TODO：暂时没有好的方案
    setTimeout(function(){
      module.exports.webpackConfig = webpackConfig;
      asyncCb();
    },3000);
  });
};
