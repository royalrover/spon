var fs = require('fs');
var statSync = fs.statSync;
var path = require('path');
var shelljs = require('shelljs');
var chalk = require('chalk');
var npmlog = require('npmlog');

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
    shelljs.exec('sudo cp -rf '+ src + ' ' + dst);
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
    if(this.__install() == 1){
      return;
    }
    var root = process.platform == 'win32' ? 'c:\\node_modules' : '/node_modules';
    if(!fs.existsSync(root)){
      shelljs.exec('sudo mkdir '+ root);
    }

    var sponRoot,ret;
    var dirs = ['async','chalk','css-loader','del','gulp','gulp-autoprefixer','gulp-connect',
    'gulp-less','gulp-minify-css','gulp-notify','gulp-rename','gulp-webpack','gulp-htmlhint','gulp-plumber','less-loader',
    'npmlog','request','style-loader','lodash','webpack'];
    ret = shelljs.exec('npm root -g',{silent:true});
    if(ret.code !== 0){
      error('ERR: spon init encounter an error when execute "npm root -g", confirm you have installed "node,npm"!');
    }
    sponRoot = ret.output.replace(/\n/g,'');

    npmlog.info('INFO:','正在配置相关依赖，请等待...');
    // 复制目录
    dirs.forEach(function(d){
      var dest = path.join(root,d);
      if(!fs.existsSync(dest)){
        shelljs.exec('sudo mkdir ' + dest);
      }

      exists(path.join(sponRoot,'spon/node_modules',d),root,copy);
    });
  },
  __install: function(){
    if(shelljs.exec('which node',{silent: true}).output.indexOf('/') == -1){
      error('ERR: 检测到当前环境并未安装node，请您去nodejs社区寻找相关资源安装！');
      return 1;
    }
    // 提示cnpm安装文案
    if(shelljs.exec('which cnpm',{silent: true}).output.indexOf('/') == -1){
      error('ERR: 检测到当前环境并未安装cnpm命令，为了您更便捷的安装使用npm的模块，十分建议您安装cnpm。\n您可以使用cnpm命令行工具代替默认的npm，安装方法：\nnpm install -g cnpm --registry=https://registry.npm.taobao.org');
      return 1;
    }

    npmlog.info('INFO:','检查并安装相关插件(gulp，yoman)');

    if(shelljs.exec('which gulp',{silent: true}).output.indexOf('/') == -1){
      npmlog.info('INFO:','安装gulp命令');
      if(shelljs.exec('cnpm --loglevel info i -g gulp').code !== 0){
        error('ERR: 安装gulp命令出错，请手动安装！');
        return 1;
      }
    }
    if(shelljs.exec('which yo',{silent: true}).output.indexOf('/') == -1){
      npmlog.info('INFO:','安装yo命令');
      if(shelljs.exec('cnpm --loglevel info i -g yo').code !== 0){
        error('ERR: 安装yo命令出错，请手动安装！');
        return 1;
      }
    }

    return 0;
  }
};