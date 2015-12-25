var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var del = require('del');
var connect = require('gulp-connect');
var webpack = require('gulp-webpack');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var htmlhint = require('gulp-htmlhint');
var jshint = require('gulp-jshint');

var request = require('request');
var async = require('async');
var log = require('npmlog');

var sponConfig = require('./spon.json');
var mobiConfig = require('./mobi.json');
var showjoyBase;

var utils = {
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
  parseRequire: function(content){
    // 替换JS中require为全路径[组/仓库/版本/文件名s]
    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      cdnModule: /^fecomponent\//gi
    };

    var cdnModules = [];
    content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '/index');
      ret = ret.replace(/\.js$/, '');

      // 判断是否引用cdn模块
      if(ret.match(Reg.cdnModule)){
        cdnModules.push(ret);
      }

    });
    return cdnModules;
  },
  /*
   * 替换require（'fecomponent/mobi-answer'）--> require('fecomponent/mobi-answer/0.0.1/index')
   */
  replaceRequire: function(content,path,encode){
    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      cdnModule: /^fecomponent\//gi,
      cdnModuleWithVersion: /^fecomponent\/([^\/]+)\/(\d+\.\d+\.\d+)\/index$/gi
    };
    content = content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '');
      ret = ret.replace(/\.js$/, '');

      // 判断是否引用cdn模块
      if(Reg.cdnModule.test(ret) && !Reg.cdnModuleWithVersion.test(ret)){
        // 若js文件没有对require设置alias替换
        console.log(ret)
        return 'require(\''+ mobiConfig['dependencies'][ret]['alias'] +'\')';
      }else if(Reg.cdnModule.test(ret) && Reg.cdnModuleWithVersion.test(ret)){
        // 若已替换问alias
        return all;
      }
      return all;

    });
    //  fs.writeFileSync(path,content,encode);
    return content;
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

      // 遍历所有依赖
      async.mapSeries(deps[c]['requires'], function(d,cb){
        var spls,alias = [];
        spls = d.alias.split('/');
        alias[0] = spls[0]; // fecomponent
        alias[1] = spls[1];
        spls.shift();

        // 设置alias
        webpackConfig.resolve['alias'][alias.join('/')] = path.join(showjoyBase,spls.join('/'));

        //if(fs.existsSync(path.join(showjoyBase,spls.join('/') + '.js'))){
        //  return;
        //}

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
            log.error('spon:mobi:fetch: ',err);
          }
          if(!error && res.statusCode == 200){
            log.info('spon:mobi:fetch get: ',base + deps[c]['url']);
            spls = deps[c]['alias'].split('/');
            spls.shift();
            p = path.join(showjoyBase,spls.join('/') + '.js');
            if(u){
              spls = orginC.split('/');
              spls.shift();
              p = path.join(showjoyBase,spls.join('/') + '.js');
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
              log.info('spon:mobi:fetch ' + c + 'successfully');
              callback && callback(err);
            });
          }
        });

      });

    }else{
      // 若无依赖，则直接加载该模块
      request(u || base + deps[c]['url'],function(error,res,body){
        var p;
        var spls;
        if(error){
          errHandler();
          log.error('spon:mobi:fetch: ',error);
        }

        if(!error && res.statusCode == 200){
          log.info('spon:mobi:fetch: ',base + deps[c]['url']);
          spls = deps[c]['alias'].split('/');
          spls.shift();
          p = path.join(showjoyBase,spls.join('/') + '.js');
          if(u){
            spls = orginC.split('/');
            spls.shift();
            p = path.join(showjoyBase,spls.join('/') + '.js');
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
            log.info('spon:mobi:fetch ' + c + 'successfully');
            callback && callback(err);
          });
        }
      });
    }


  };

  var loadFormDirs = function(dirs){
    var showjoyBase = path.join(home,'.spon/mobi/');
    dirs.forEach(function(item){
      var p = path.join('src/pages',item,item + '.js');
      var content = fs.readFileSync(p, 'utf-8');

      var cpnts = utils.parseRequire(content);
      var errHandler = function(){
        //  utils.restoreRequire(content,p,'utf-8');
      };

      cpnts.forEach(function(cpnt){
        // 设置alias
        webpackConfig.resolve['alias'][cpnt] = path.join(showjoyBase,mobiConfig['dependencies'][cpnt]['alias']);

        recurseLoad(cpnt,null,null,errHandler);
      });
      //    utils.replaceRequire(content,p,'utf-8');

    });
  };

  loadFormDirs(dirs);

  // 保证fetch任务在build之前运行
  // TODO：暂时没有好的方案
  setTimeout(function(){
    asyncCb();
  },3000);
  /*dirs.forEach(function(item,i){
   log.info('fetch',item);
   var content = fs.readFileSync(path.join('src/pages',item,item + '.js'), 'utf-8');

   async.map(utils.parseRequire(content), function(item,cb){
   // 加载该模块的依赖，待依赖加载完毕，再加载模块

   request(base + deps[item]['alias'],function(error,res,body){
   if(!error && res.statusCode == 200){
   log.info('fetch get:','url:' + base + deps[item]['alias'] + '\n');
   p = path.join(showjoyBase,item.split('/')[1] + '.js');
   if(fs.existsSync(p)){
   fs.unlinkSync(p);
   }

   fs.writeFile(p, body,function(err){
   if(err) throw err;
   //  notify('fetch successfully!');
   log.info('write',p);
   cb(err,body);
   });
   }
   });
   },function(err,rets){
   if(err){
   log.error(err);
   return;
   }
   });
   });*/
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
  return gulp.src('')
    .pipe(webpack(webpackConfig))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'))
    .pipe(notify({ message: 'build js task complete' }));
});

gulp.task('page-css',['page-build'],function(){
  // 删除js模块
  var exec = require('child_process').exec;
  exec('rm -rf ' + utils.getModulesPath());
  // 恢复修改的require（‘fecomponent/mobi-answer/0.0.1/index’）－－>require('fecomponent/mobi-answer')
  // var dirs;

  // try{
  //   dirs = fs.readdirSync('src/pages');
  // }catch(e){
  //   log.error('spon:mobi: ',e);
  // }
  // dirs.forEach(function(item){
  //   var p = path.join('src/pages',item,item + '.js');
  //   var content = fs.readFileSync(p, 'utf-8');
  //   utils.restoreRequire(content,p,'utf-8');
  // });

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
