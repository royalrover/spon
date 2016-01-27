/**
 * Created by yuxiu on 15/12/11.
 * 处理spon的子命令
 */
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');
var Q = require('q');
var npmlog = require('npmlog');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var spon = {};

spon.log = npmlog;

spon.baseRoot = path.resolve(__dirname,'..','plugins');

// 存放各个插件，如mobi
spon._plugins = {};

spon.parseAction = function(action){
  var arr = action.split(':');
  return arr;
};

/**
 * TODO: 错误处理函数
 * 通一的错误处理
 * @type {function}
 */
spon.fatal = function onError(err, from){
  this.log.error(err, from);


  if (err && err.stack && this.log.level < 1) {
    this.log.error(err.stack)
  }

  process.exit(1);
};

spon.loadPlugins = function(){
  var base = this.baseRoot;
  var self = this;
  var dirs;

  try{
    dirs = fs.readdirSync(base);
  }catch(e){
    self.fatal(e,'fs.readdirSync');
  }

  _.forEach(dirs,function(d,i){
    var file = path.join(base,d,'index.js');
    if(!fs.existsSync(file)){
      error('*****加载插件失败,请检查插件目录*****');
      return;
    }

    self._plugins[d] = require(file);
  });
};

spon.getPlugin = function(name){
  var p = this._plugins[name];
  if(!p){
    error('*****没有找到'+ name +'插件*****');
    return;
  }
  return p;
};

spon.request = function(action,options){
  var plugin,method,pluginName;
  pluginName = this.parseAction(action);
  method = pluginName[1];
  pluginName = pluginName[0];

  var defer = Q.defer();
  plugin = this.getPlugin(pluginName);
  var fn = plugin['publish'];

  if(fn){
    defer.resolve(fn.call(plugin,method,options));
  }else{
    defer.reject('plugin \'' + pluginName + '\' has no method \'' + method + '\'');
  }
  return defer.promise;

};

spon.start = function(){
  this.loadPlugins();
};

spon.start();

module.exports = spon;

process.on('uncaughtException', function(err) {
  if(spon && spon.fatal) {
    spon.fatal(err, 'uncaughtException');
  }
});