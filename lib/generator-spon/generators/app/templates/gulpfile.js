var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var C_KEY = 'showjoyf2espon';
// 记录所有pages工程的引用模块
var MODULES = {};

var sponConfig = require('./spon.json');
var mobiConfig = require('./mobi.json');
var showjoyBase;

// 工具类
var utils = {
  getNPMGlobalPath: function(algorithm,password){
    //var decipher = crypto.createDecipher('aes-256-cbc',C_KEY);
    var decipher = crypto.createDecipher(algorithm,password);

    // 解密
    var dcs=decipher.update(sponConfig.base,'hex','utf8');
    dcs += decipher.final('utf8');
    return dcs;
  },
  getWebpackPath : function(){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon');
    var mobiBase = path.join(showjoyBase,'mobi');
    return path.join(mobiBase, 'webpack.config.js');
  },
  createMobiSandbox: function(){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    showjoyBase = path.join(home,'.spon');
    var mobiBase = path.join(showjoyBase,'mobi');
    var modulesBase = path.join(mobiBase,'fecomponent');

    if(!fs.existsSync(showjoyBase)){
      // 创建 .spon目录
      fs.mkdirSync(showjoyBase);
    }
    if(!fs.existsSync(mobiBase)){
      fs.mkdirSync(mobiBase);
    }
    if(!fs.existsSync(modulesBase)){
      fs.mkdirSync(modulesBase);
    }
    return;
  },
  getModulesPath: function(){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon');
    var mobiBase = path.join(showjoyBase,'mobi');
    //  console.log(path.join(mobiBase,'fecomponent'))
    return path.join(mobiBase,'fecomponent');
  },
  removeComments: function(content){
    return content.replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n').replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
  },
  parseRequire: function(content){
    // 替换JS中require为全路径[组/仓库/版本/文件名s]
    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      cdnModule: /^fecomponent\//gi
    };

    var cdnModules = [];
    content = utils.removeComments(content);
    content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '/index');
      ret = ret.replace(/\.js$/, '');

      // 判断是否引用cdn模块
      if(ret.match(Reg.cdnModule)){
        if(!MODULES[ret]){
          MODULES[ret] = 1;
          cdnModules.push(ret);
        }
      }

    });
    return cdnModules;
  },
  // 解析线上组件所引用的相对依赖，如 require('./index.css'),require('./lib/abc.js');
  parseRelativeRequires: function(content){
    var result = [];
    content = utils.removeComments(content);

    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      relativeRequire: /^\.\//i
    };

    content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '/index');
      ret = ret.replace(/\.js$/, '');

      // 判断是否引用cdn模块
      if(ret.match(Reg.relativeRequire)){
        result.push(ret);
      }
    });

    return result;
  },
  /*
   * 替换require（'fecomponent/mobi-answer'）--> require('fecomponent/mobi-answer/0.0.1')
   */
  replaceRequire: function(content,deps){
    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      cdnModule: /^fecomponent\//gi,
      cdnModuleWithVersion: /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)$/i
    };

    content = utils.removeComments(content);

    content = content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '');
      ret = ret.replace(/\.js$/, '');
      var alias;
      for(var i=0,len=deps.length;i<len;i++){
        var arr = deps[i].alias.split('/');
        arr.pop();
        alias = arr.join('/');
        console.log(alias+"*****"+ret)
        if(alias.indexOf(ret) !== -1 && alias !== ret){
          return 'require(\''+ alias +'\')';
        }
      }
    });
    return content;
  },
  // 加载组件相对路径引用的模块
  loadRelativeRequires: function(relativeDeps,cpntUrl){
    async.map(relativeDeps,function(rd,cb){

    },function(){

    });
  },
  /*
   * 恢复require为require（‘fecomponent/say’）格式
   */
  restoreRequire: function(content,path,encode){
    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      cdnModuleWithVersion: /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)\/index$/gi
    };
    content = content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '');
      ret = ret.replace(/\.js$/, '');

      // 判断是否引用cdn模块
      if(Reg.cdnModuleWithVersion.test(ret)){
        return 'require(\''+ ret.replace(Reg.cdnModuleWithVersion,function(a,b,c){
            return 'fecomponent/' + b;
          }) + '\')';
      }
      return all;
    });
    fs.writeFileSync(path,content,encode);
  },
  commandOpen : function commandOpen (target, callback) {
    var os  = require('os');
    var exec = require('child_process').exec;

    switch (os.platform()) {
      case 'win32':
        exec('start ' + target, callback);
        break;
      case 'darwin':
        exec('open ' + target, callback);
        break;
      case 'linux':
        var cmd = 'type -P gnome-open &>/dev/null  && gnome-open ' + target +
          ' || { type -P xdg-open &>/dev/null  && xdg-open ' + target + '; }';
        exec(cmd, callback);
        break;
      default:
        var error = new Error();
        error.message = 'Can\'t Open it';
        callback && callback(error);
    }
  },
  //递归创建目录 同步方法
  mkdirsSync: function (dirname, mode){
    if(fs.existsSync(dirname)){
      return true;
    }else{
      if(utils.mkdirsSync(path.dirname(dirname), mode)){
        fs.mkdirSync(dirname, mode);
        return true;
      }
    }
  }
};

var baseNPMPath = utils.getNPMGlobalPath('aes-256-cbc',C_KEY);
baseNPMPath = baseNPMPath.replace(/\n+/g,'');
baseNPMPath = path.join(baseNPMPath,'spon/node_modules');

// gulp模块必须在node_modules路径下
var gulp = require('gulp');

// 引用绝对路径下的模块
var myWebpack = require(path.join(baseNPMPath,'my-webpack'));
var del = require(path.join(baseNPMPath,'del'));
var connect = require(path.join(baseNPMPath,'gulp-connect'));
var webpack = require(path.join(baseNPMPath,'my-gulp-webpack'));
var less = require(path.join(baseNPMPath,'gulp-less'));
var autoprefixer = require(path.join(baseNPMPath,'gulp-autoprefixer'));
var minifyCss = require(path.join(baseNPMPath,'gulp-minify-css'));
var rename = require(path.join(baseNPMPath,'gulp-rename'));
var notify = require(path.join(baseNPMPath,'gulp-notify'));
var htmlhint = require(path.join(baseNPMPath,'gulp-htmlhint'));
var jshint = require(path.join(baseNPMPath,'gulp-jshint'));

var request = require(path.join(baseNPMPath,'request'));
var async = require(path.join(baseNPMPath,'async'));
var log = require(path.join(baseNPMPath,'npmlog'));
var q = require(path.join(baseNPMPath,'q'));

// 获取绝对路径下的webpackConfig
var webpackConfig = require(utils.getWebpackPath());

gulp.task('clean', function () {
  del(['build']);
});

// prepare 预处理
utils.createMobiSandbox();

// fetch showjoy组件到开发目录，进行构建
gulp.task('fetch', function(asyncCb){
  var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var showjoyBase = path.join(home,'.spon/mobi/fecomponent');
  var base = 'http://git.showjoy.net/';
  var deps = require('./mobi.json').dependencies;
  var dirs;

  try{
    dirs = fs.readdirSync('src/pages');
  }catch(e){
    log.error('spon:mobi: ',e);
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
          return;
        }

        // 加载该模块
        request(u || base + deps[c]['url'],function(error,res,body){
          var p,dirname;
          var spls;
          if(error){
            errHandler();
            log.error('spon:mobi:fetch: ',error);
          }
          if(!error && res.statusCode == 200){
            log.info('spon:mobi:fetch get: ',base + deps[c]['url']);
            spls = deps[c]['alias'].split('/');
            spls.shift();
            p = path.join(showjoyBase,spls.join('/') + '.js');
            console.log('****'+spls.join('/'));
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
          utils.loadRelativeRequires(relativeDeps,u);
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
      var p = path.join('src/pages',item,item + '.js');
      var content = fs.readFileSync(p, 'utf-8');

      var cpnts = utils.parseRequire(content);
      var errHandler = function(){
        //  utils.restoreRequire(content,p,'utf-8');
      };

      cpnts.forEach(function(cpnt){
        var tmpArr;
        matchRet = cpnt.match(cdnModuleWithVersion);

        // TODO: 针对引用版本号的组件，需要额外fetch对应的package.json，处理依赖
        // 引用带有版本号的组件
        if(matchRet){
          cpntName = matchRet[1];
          version = matchRet[2];
          // 设置alias
          if(!mobiConfig['dependencies']['fecomponent/' + cpntName]){
            log.error('spon:mobi: ','your mobi.json does not have the component:' + 'fecomponent/' + cpntName + ', please check your file or exec the command "spon mb upgrade"');
            return 1;
          }

          // 处理alias
          tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['alias']).split('/');
          tmpArr[2] = version;
          webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,tmpArr.join('/'));

          // 处理url
          tmpArr = (mobiConfig['dependencies']['fecomponent/' + cpntName]['url']).split('/');
          tmpArr[4] = version;

          // 针对require('fecomponent/mobi-say/0.0.5')方式的引用，只实现单层引用
          recurseLoadComponentWithVersion(cpnt,base + tmpArr.join('/'),null,errHandler);
        //  recurseLoad(cpnt,base + tmpArr.join('/'),null,errHandler);
        }else{
          // 设置alias
          if(!mobiConfig['dependencies'][cpnt]){
            log.error('spon:mobi: ','your mobi.json does not have the component:' + cpnt + ', please check your file or exec the command "spon mb upgrade"');
            return 1;
          }
          webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,mobiConfig['dependencies'][cpnt]['alias']);

          recurseLoad(cpnt,null,null,errHandler);
        }

      });

    });
  };


  loadFormDirs(dirs);

  // 保证fetch任务在build之前运行
  // TODO：暂时没有好的方案
  setTimeout(function(){
    asyncCb();
  },3000);
});

gulp.task('lint',['fetch'],function(){
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default', { verbose: true }));
});

gulp.task('page-build', ['fetch','lint'],function (callback) {
  var prefix = 'src/pages/';
  var dirs;
  try{
    dirs = fs.readdirSync('src/pages');
  }catch(e){
    log.error('spon:mobi: ',e);
  }

  dirs.forEach(function(dir){
    webpackConfig.entry[path.join(prefix,dir,dir)] = path.join(webpackConfig['__APP_PATH'],'/'+dir,dir + '.js');
  });

//  console.log(webpackConfig);
  return gulp.src('')
    .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'))
    .pipe(notify({ message: 'build js task complete' }));
});

gulp.task('page-css',['page-build'],function(){
  // 删除js模块
  var exec = require('child_process').exec;
  exec('rm -rf ' + utils.getModulesPath());

  return gulp.src('./src/pages/*/**.less')
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('./build/src/pages/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifyCss())
    .pipe(gulp.dest('./build/src/pages/'))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('page-html',['page-build'],function(){
  gulp.src('./src/pages/*/**.htm*')
    .pipe(htmlhint())
    .pipe(htmlhint.reporter())
    .pipe(htmlhint.failReporter({ suppress: true }));
  return gulp.src('./src/pages/*/**.htm*')
    .pipe(gulp.dest('./build/src/pages/'))
    .pipe(notify({ message: 'Htmls task complete' }));
});

gulp.task('serve', function () {
  connect.server({
    port: sponConfig.options.port,
    livereload: {
      port: sponConfig.options.livereloadPort
    },
    debug: true
  });
  utils.commandOpen('http://localhost:'+ sponConfig.options.port,function(err){
    if(err){
      log.error('spon:mobi: ',err);
    }
  });
});

gulp.task('reload', function () {
  return gulp.src('./**.*')
    .pipe(connect.reload())
    .pipe(notify({ message: 'reload-assets task complete' }))
});

gulp.task('page-watch', function () {
  gulp.watch(['./src/**/*.*'], ['reload']);
  gulp.watch(['./build/**/*.html'], ['reload']);
  // gulp.watch(['./src/p/**/*.js'], ['page-build']);
  // gulp.watch(['./src/p/**/*.less'], ['page-css']);
});

gulp.task('page-default', ['clean', 'fetch', 'lint', 'page-build', 'page-css', 'page-html']);
gulp.task('f');
gulp.task('s',['serve', 'page-watch']);
