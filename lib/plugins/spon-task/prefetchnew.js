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


module.exports = function(utils, argName){
  var webpackConfig = require(utils.getWebpackPath());
  var currPath = process.cwd();
  var mobiConfig = require(path.join(currPath,'mobi.json'));

  // 在OS X下目录中存在隐藏文件.DS_Store，会影响构建
  var checkDirsExceptDSStore = function(dirs){
    var nameReg = /^[a-z0-9]/i;
    var ret = [];
    dirs.forEach(function(v,i){
      if(v.match(nameReg)){
        ret.push(v);
      }
    });
    return ret;
  };

  // fetch showjoy组件到开发目录，进行构建
  gulp.task('fetch', function(asyncCb){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon/mobi/fecomponent');
    var base = 'http://git.showjoy.net/';
    var dirs;
    log.info('spon: ','努力加载所需的fecomponents ...');

    try{
      var array = [];
      var ret;
      if (typeof argName === 'string') {
        array.push(argName);
      }
      dirs = (typeof argName === 'string') ?  (array) : fs.readdirSync(path.join(currPath,'src/pages'));

      // 判断是否工程是否包含components目录，兼容性处理
      try{
        ret = fs.statSync(path.join(currPath,'src/components'));
        if(ret.isDirectory()){
          dirs = dirs.concat(fs.readdirSync(path.join(currPath,'src/components')));
        }
      }catch(e){
      }
    }catch(e){
      log.error('spon: ',e);
      process._exit(1,e);
      return;
    }

    dirs = checkDirsExceptDSStore(dirs);

    var generateTree = function(dirs){
      var showjoyBase = path.join(home,'.spon/mobi/');
      var cdnModuleWithVersion = /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)$/i;
      var tree,version,cpntName,matchRet;
      var deffer = q.defer();
      tree = {
        roots: []
      };

      /**
       *
       * @param cpnts 依赖的组件数组
       * @param parent 引用cpnts依赖的父组件，即parent引用了cpnts依赖
       * @description: 由于采用“组件缓存”策略，针对缓存的组件，需要解析其依赖，并判断是否加载依赖，最后构建一颗模块树
       */
      function recurse(cpnts,parent){
        var def = q.defer();

        // 设置树的root
        if(parent.entry){
          tree.roots.push(parent);
        }

        async.map(cpnts,function(cpnt,callback){
          var tmpArr,_path,tmparr;
          var deps,url,depInfo;
          matchRet = cpnt.match(cdnModuleWithVersion);

          // TODO: 针对引用版本号的组件，需要额外fetch对应的package.json，处理依赖
          // 引用带有版本号的组件
          if(matchRet){
            cpntName = matchRet[1];
            version = matchRet[2];
            // 设置alias
            if(!mobiConfig['dependencies']['fecomponent/' + cpntName]){
              log.error('spon: ','your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
              process._exit(1,'your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
              return;
            }

            // 处理alias
            tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['alias']).split('/');
            tmpArr[2] = version;

            if(parent.entry){
              webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,tmpArr.join('/'));
            }else if(cpnt.match(cdnModuleWithVersion)){
              tmparr = cpnt.split('/');
              tmparr.pop();
              webpackConfig.resolve['alias'][tmparr.join('/')] = path.join(showjoyBase,tmpArr.join('/'));
            }


            // 处理url
            tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['url']).split('/');
            tmpArr[4] = version;

            _path = path.join(showjoyBase,cpnt,'index.js');

            if(fs.existsSync(_path)){
              try{
                deps = require(path.join(showjoyBase,cpnt,'package.json')).dependencies.map(function(c){
                  var spls,alias = [];
                  spls = c.alias.split('/');
                  alias[0] = spls[0]; // fecomponent
                  alias[1] = spls[1];
                  alias[2] = spls[2];
                  return alias.join('/');
                });
              }catch(e){
                deps = utils.parseRequire(fs.readFileSync(_path, 'utf-8'));
              }

              depInfo = {
                entry: false,
                name: cpntName,
                path: _path,
                url: '',
                deps: []
              };
              parent.deps.push(depInfo);

              if(deps.length){
                recurse(deps,depInfo);
              }

              callback(null,depInfo);
            }else{
              url = base + tmpArr.join('/');
              // 加载依赖
              request(url.replace(/index\.js$/gi,'package.json'),function(error,res,body){
                var packageConfig,deps,p,dirname;
                if(error){
                  log.error('spon:fetch: ',error);
                  callback(error);
                }

                if(res.statusCode == 200){
                  // 写package.json
                  p = path.join(showjoyBase,cpnt,'package.json');
                  dirname = path.dirname(p);
                  utils.mkdirsSync(dirname);

                  if(fs.existsSync(p)){
                    fs.unlinkSync(p);
                  }

                  fs.writeFileSync(p, body);

                  packageConfig = JSON.parse(body);
                  deps = packageConfig.dependencies;
                  var depInfo = {
                    entry: false,
                    name: cpntName,
                    path: '',
                    url: tmpArr.join('/'),
                    deps: []
                  };
                  parent.deps.push(depInfo);

                  if(deps.length){
                    depInfo.callback = callback;
                    recurse(deps.map(function(c){
                      var spls,alias = [];
                      spls = c.alias.split('/');
                      alias[0] = spls[0]; // fecomponent
                      alias[1] = spls[1];
                      alias[2] = spls[2];
                      return alias.join('/');
                    }),depInfo);
                  }else{
                    callback(null,depInfo);
                  }
                }else{
                  callback(new Error('some thing wrong when load package.json, url:' + url.replace(/index\.js$/gi,'package.json')),'');
                  log.error('spon: ','some thing wrong when load package.json, url:' + url.replace(/index\.js$/gi,'package.json'));
                  process._exit(1,'some thing wrong when load package.json, url:' + url.replace(/index\.js$/gi,'package.json'));
                  return;
                }
              });
            }
          }else{
            // 设置alias
            if(!mobiConfig['dependencies'][cpnt]){
              log.error('spon: ','your mobi.json does not have the component:' + cpnt + ', please check your file or exec the command "spon mb upgrade"');
              process._exit(1,'your mobi.json does not have the component:' + cpnt + ', please check your file or exec the command "spon mb upgrade"');
              return;
            }
            webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,mobiConfig['dependencies'][cpnt]['alias']);

            _path = path.join(showjoyBase,cpnt,mobiConfig.dependencies[cpnt]['alias'].split('/')[2],'index.js');
            if(fs.existsSync(_path)){
              var content = fs.readFileSync(_path, 'utf-8');
              deps = utils.parseRequire(content);

              depInfo = {
                entry: false,
                name: cpnt,
                path: _path,
                url: '',
                deps: []
              };
              parent.deps.push(depInfo);

              if(deps.length){
                recurse(deps,depInfo);
              }

              callback(null,depInfo);
            }else{
              if(mobiConfig.dependencies[cpnt]){
                depInfo = {
                  entry: false,
                  name: cpnt,
                  path: '',
                  url: mobiConfig.dependencies[cpnt].url,
                  deps: []
                };
                parent.deps.push(depInfo);

                if(mobiConfig.dependencies[cpnt].requires.length){
                  var depNames = [];
                  mobiConfig.dependencies[cpnt].requires.forEach(function(c){
                    var spls,alias = [];
                    try{
                      spls = c.alias.split('/');
                      alias[0] = spls[0]; // fecomponent
                      alias[1] = spls[1];
                      depNames.push(alias.join('/'));
                    }catch(e){
                      log.error('spon:', e.message);
                      process._exit(1, e.stack);
                      return;
                    }
                  });

                  recurse(depNames,depInfo);
                }

                callback(null,depInfo);
              }else{
                callback(new Error('not found fecomponent,name: ' + cpnt),'');
              }

            }
          }

        },function(err,ret){
          if(err){
            def.reject(err);
            return;
          }
          parent.callback && parent.callback();
          def.resolve(ret);
        });

        return def.promise;
      }

      async.map(dirs,function(item,cb){
        var p = path.join(currPath,'src/pages',item,item + '.js');
        var comp = path.join(currPath,'src/components',item,item + '.js');
        var content,cpnts;
        if(fs.existsSync(p) && fs.existsSync(comp)){
          content = fs.readFileSync(p, 'utf-8');
          cpnts = utils.parseRequire(content);

          recurse(cpnts,{
            entry: true,
            type: 'page',
            name: item,
            path: p,
            url: '',
            deps: []
          }).then(function(){
            var content = fs.readFileSync(comp, 'utf-8');
            cpnts = utils.parseRequire(content);

            return recurse(cpnts,{
              entry: true,
              type: 'component',
              name: item,
              path: comp,
              url: '',
              deps: []
            });
          },function(e){
            cb(e);
          }).then(function(){
            cb();
          },function(e){
            cb(e);
          });
        }else if(!fs.existsSync(p) && fs.existsSync(comp)){
          content = fs.readFileSync(comp, 'utf-8');
          cpnts = utils.parseRequire(content);

          recurse(cpnts,{
            entry: true,
            type: 'component',
            name: item,
            path: comp,
            url: '',
            deps: []
          }).then(function(){
            cb();
          },function(e){
            cb(e);
          });
        }else if(fs.existsSync(p) && !fs.existsSync(comp)){
          content = fs.readFileSync(p, 'utf-8');
          cpnts = utils.parseRequire(content);

          recurse(cpnts,{
            entry: true,
            type: 'page',
            name: item,
            path: p,
            url: '',
            deps: []
          }).then(function(){
            cb();
          },function(e){
            cb(e);
          });
        }
      },function(e){
        if(e){
          deffer.reject(e);
          npm.error('spon:', e.message);
          process._exit(1, e.stack);
          return;
        }

        deffer.resolve(tree);
      });

      return deffer.promise;
    };

    var load = function(child,cb){
      request(base + child.url,function(error,res,body){
        var p,dirname;
        var spls;
        if(error){
          cb(error);
          log.error('spon:fetch: ',error);
          process._exit(1,error);
          return;
        }
        if(res.statusCode == 200){
          log.info('spon:fetch get: ',base + child.url);
          spls = child.url.split('/');
          p = path.join(showjoyBase,'mobi-' + spls[1]/*名称*/,spls[4]/*版本号*/,'index.js'/*入口*/);
          dirname = path.dirname(p);
          utils.mkdirsSync(dirname);

          if(fs.existsSync(p)){
            fs.unlinkSync(p);
          }

          var relativeDeps = utils.parseRelativeRequires(body);

          var final = (function(cb){
            return function(){
              try{
                fs.writeFileSync(p, body);
                cb();
              }catch(e){
                cb(e);
                process._exit(1,e);
                return;
              }
            };
          })(cb);

          // 加载相对路径的依赖
          if(relativeDeps.length){
            utils.loadRelativeRequires(relativeDeps,p,base + child.url,final);
          }else{
            final();
          }
        }
      });
    };

    var loadFromTree = function(tree){
      var def = q.defer();
      var cdnModuleWithVersion = /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)$/i;

      async.map(tree.roots,function(root,cb){

        if(!root.deps || !root.deps.length){
          // 针对非本地缓存文件加载
          if(root.url){
            load(root,cb);
            return;
          }
          // 本地缓存文件
          cb();
          return;
        }

        async.map(root.deps,function(child,cb1){
          var tmparr = [];
          if(child.path){
            // 根部的第一层依赖模块无需在设置alias，这在generateTree过程中已设置完
            if(!root.entry){
              // 设置alias
              if(child.name.match(cdnModuleWithVersion)){
                tmparr = child.name.split('/');
                tmparr.pop();
                webpackConfig.resolve['alias'][tmparr.join('/')] = child.path;
              }else{
                webpackConfig.resolve['alias'][child.name] = child.path;
              }

            }

            cb1();
          }else{
            if(child.deps && child.deps.length){
              loadFromTree({roots: child.deps}).then(function(){
                load(child,cb1);
              });

            }else{
              load(child,cb1);
            }

          }
        },function(err){
          if(err){
            cb(err);
            return;
          }

          cb();
        });

      },function(err,ret){
        if(err){
          def.reject(err);
          return;
        }
        def.resolve();
      });

      return def.promise;
    };

    generateTree(dirs).then(function(t){
      return loadFromTree(t);
    },function(e){
      log.error('spon:', e.message);
      process._exit(1,'generate component tree error!');
      return;
    }).then(function(){
      module.exports.webpackConfig = webpackConfig;
      log.info('spon: ','加载fecomponents完毕！');
      asyncCb();
    })

  });
};

