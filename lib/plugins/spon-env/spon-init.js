var fs = require('fs');
var statSync = fs.statSync;
var path = require('path');
var shelljs = require('shelljs');
var chalk = require('chalk');
var npmlog = require('npmlog');
var utils = require('../../utils');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};
/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
/*var copy = function(src,dst){
  // 读取目录中的所有文件/目录
  var paths = fs.readdirSync(src);
  paths.forEach(function(path){
    var _src = src + '/' + path,
      _dst = dst + '/' + path,
      readable, writable;
    var st;
    st = statSync( _src);
    // 判断是否为文件
    if(st.isFile()){
      // 创建读取流
      readable = fs.createReadStream(_src);
      // 创建写入流
      writable = fs.createWriteStream(_dst);
      // 通过管道来传输流
      readable.pipe(writable);
    }
    // 如果是目录则递归调用自身
    else if(st.isDirectory()){
      exists(_src,_dst,copy);
    }
  });
};*/

var isDos = process.platform == 'win32' ? true : false;

var copy = function(src,dst){
  if(isDos){
    shelljs.exec('xcopy '+ src + ' ' + dst +' /s /e /h');
  }else{
    shelljs.exec('cp -rf '+ src + ' ' + dst);
  }
};
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function( src, dst, callback ){
  if(fs.existsSync(dst)){
    callback(src,dst);
  }else{
    fs.mkdirSync(dst);
    callback(src,dst);
  }
};


module.exports = {
  init: function(){
    var sponRoot,ret;
    if(this.__install() == 1){
      return;
    }

    npmlog.info('spon:','正在配置相关依赖，请等待...');
    this.createMobiSandbox();
    // copy webpackConfigFile
    copy(path.join(utils.getNPMGlobalPath(),'spon/lib/generator-spon/generators/app/templates/webpack.config.js '),this.getWebpackPath());
  },
  __install: function(){
    if(shelljs.exec('which node',{silent: true}).output.indexOf('/') == -1){
      npmlog.error('spon:','检测到当前环境并未安装node，请您去nodejs社区寻找相关资源安装！');
      return 1;
    }
    return 0;
  },
  getWebpackPath : function(){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon');
    var mobiBase = path.join(showjoyBase,'mobi');
    return path.join(mobiBase, 'webpack.config.js');
  },
  createMobiSandbox: function(){
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon');
    var pluginsBase = path.join(showjoyBase,'plugins');
    var mobiBase = path.join(showjoyBase,'mobi');
    var modulesBase = path.join(mobiBase,'fecomponent');
    var joyuiBase = path.join(mobiBase,'joyui');

    if(!fs.existsSync(showjoyBase)){
      // 创建 .spon目录
      fs.mkdirSync(showjoyBase);
    }
    if(!fs.existsSync(pluginsBase)){
      fs.mkdirSync(pluginsBase);
    }
    if(!fs.existsSync(path.join(pluginsBase,'local'))){
      fs.mkdirSync(path.join(pluginsBase,'local'));
    }
    if(!fs.existsSync(path.join(pluginsBase,'node_modules'))){
      fs.mkdirSync(path.join(pluginsBase,'node_modules'));
    }
    if(!fs.existsSync(mobiBase)){
      fs.mkdirSync(mobiBase);
    }
    if(!fs.existsSync(modulesBase)){
      fs.mkdirSync(modulesBase);
    }
    if(!fs.existsSync(joyuiBase)){
      fs.mkdirSync(joyuiBase);
    }
    return;
  }
};