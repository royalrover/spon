/**
 * Created by yuxiu on 16/8/19.
 * 解析JOYUI源码搭建入口
 */
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var gulp = require('gulp');
var webpack = require('my-gulp-webpack');
var myWebpack = require('my-webpack');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var log = require('npmlog');
var utils = require('../../utils/index');

module.exports = function(webpackConfig, argName){
  var currPath = process.cwd();

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

  var current_extensions = {};
  var original_handlers = {};

  // 注册对应后缀文件的执行方式
  function register_extension(ext, type)
  {
    if (current_extensions[ext]) return;

    // preserving original catchers
    if (!original_handlers[ext]) {
      original_handlers[ext] = require.extensions[ext];
    }

    require.extensions[ext] = extension_js.bind(this, type);

    current_extensions[ext] = type;
  }

  // restore original handler for extension
  function restore_extension(ext)
  {
    if (!current_extensions[ext]) return;

    if (original_handlers[ext]) {
      require.extensions[ext] = original_handlers[ext];
    } else {
      delete require.extensions[ext];
    }
    delete current_extensions[ext];
    delete original_handlers[ext];
  }

  function extension_js(type, module, filename)
  {
    var content = get_file_contents(filename);
    if (type == 'tmpl') {
      module.exports = content;
    }
  }

  // from node.js source code
  function stripBOM(content)
  {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    return content;
  }

  function get_file_contents(filename)
  {
    var content = fs.readFileSync(filename, 'utf8');
    return stripBOM(content);
  }

  // 注册“.tmpl”模块加载机制
  register_extension('.tmpl','tmpl');

  /*
  gulp.task('page-join',['lint'],function (callback) {

    var srcPath = (typeof argName === 'string') ? ('src/pages/' + argName) : ('src/pages/');
    var prefix = 'src/pages/';
    var dirs;
    try{
      var array = [];
      if (typeof argName === 'string') {
        array.push(argName);
      }
      dirs = (typeof argName === 'string') ? (array) : fs.readdirSync(path.join(currPath,'src/pages'));
    }catch(e){
      log.error('spon: ',e);
      throw e;
    }

    dirs = checkDirsExceptDSStore(dirs);

    try{
      dirs.forEach(function(dir){
        webpackConfig.entry[path.join(prefix,dir,dir)] = path.join(webpackConfig['__APP_PATH'],'/'+dir,dir + '.js');
      });
    }catch(e){
      log.error('spon: ','构建项目失败，请检查主目录 src/pages/ 下是否存在非期望的文件（目录），如隐藏文件.DS_Store');
      log.error('spon: ',e.message);
      return;
    }

    log.info('spon: ','开始构建项目 ...');
    return gulp.src(srcPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(gulp.dest('build/'));
  });
  */
};