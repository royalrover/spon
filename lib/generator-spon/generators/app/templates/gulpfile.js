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

var request = require('request');
var async = require('async');
var log = require('npmlog');

var sponConfig = require('./spon.json');
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
      if(Reg.cdnModule.test(match)){
        cdnModules.push(match);
      }

    });
    log.info('fetch deps',cdnModules);
    return cdnModules;
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
  }
};

var webpackConfig = require(utils.getWebpackPath());

gulp.task('clean', function () {
  del(['build']);
});

// prepare 预处理
utils.createMobiSandbox();

// fetch showjoy组件到开发目录，进行构建
gulp.task('fetch', function(){
  var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var showjoyBase = path.join(home,'.spon/mobi/fecomponent');
  var base = 'http://git.showjoy.net/';
  var deps = require('./mobi.json').dependencies;
  var dirs;

  try{
    dirs = fs.readdirSync('src/p');
  }catch(e){
    log.error(e);
  }

  // 删除js模块
  del([utils.getModulesPath()]);

  dirs.forEach(function(item,i){
    log.info('fetch',item);
    var content = fs.readFileSync(path.join('src/p',item,item + '.js'), 'utf-8');

    async.map(utils.parseRequire(content), function(item,cb){
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
  });
});

gulp.task('page-build', function (callback) {
  var prefix = 'src/p/';
  var dirs;
  try{
    dirs = fs.readdirSync('src/p');
  }catch(e){
    log.error(e);
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
  del([utils.getModulesPath()]);

  return gulp.src('./src/p/*/**.less')
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('./build/src/p/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifyCss())
    .pipe(gulp.dest('./build/src/p/'))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('page-html',['page-build'],function(){
  gulp.src('./src/p/*/**.htm*')
    .pipe(htmlhint())
    .pipe(htmlhint.reporter())
    .pipe(htmlhint.failReporter({ suppress: true }));
  return gulp.src('./src/p/*/**.htm*')
    .pipe(gulp.dest('./build/src/p/'))
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
      log.error(err);
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

gulp.task('page-default', ['clean', 'page-build', 'page-css', 'page-html']);
gulp.task('f', ['fetch']);
gulp.task('s',['serve', 'page-watch']);
