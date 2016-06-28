/**
 * Created by yuxiu on 15/12/11.
 * spon runtime
 * 处理spon的子命令
 */
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var chalk = require('chalk');
var Q = require('q');
var npmlog = require('npmlog');
var utils = require('../utils/index');
var exec = require('child_process').execSync;

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

module.exports = function(cli){
  var spon = {};

  spon.cli = cli;

  spon.log = npmlog;

  // 存放默认插件的目录
  spon.baseRoot = path.resolve(__dirname,'..','plugins');
  // 存放命令行安装的插件目录
  spon.pluginRoot = utils.getPluginsPath();

  // 存放各个插件，如mobi
  spon._plugins = {};

  // 存放配置信息，如alias
  spon.config = {};

  // 存储插件的api
  spon.store = {};

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

  // 针对线上安装的plugin，在加载时执行
  spon.loadPlugins = function(){
    var base = this.baseRoot;
    var pluginsBase = this.pluginRoot;
    var self = this;
    var dirs;

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

    try{
      dirs = fs.readdirSync(base);
      if(fs.existsSync(path.join(pluginsBase,'node_modules'))){
        dirs = dirs.concat(fs.readdirSync(path.join(pluginsBase,'node_modules')));
      }
      dirs = checkDirsExceptDSStore(dirs);
    }catch(e){
      self.fatal(e,'fs.readdirSync');
    }

    _.forEach(dirs,function(d,i){
      var file = path.join(base,d,'index.js');
      if(!fs.existsSync(file)){
        file = path.join(pluginsBase,'node_modules',d,'index.js');
        if(!fs.existsSync(file)){
          error('*****加载插件失败,请检查插件目录*****');
          return;
        }
      }

      var plugin = require(file);
      self._plugins[d] = plugin;

      if(typeof plugin == 'function'){
        plugin(spon);
      }
    });

    var aliasService = function(){
      var defaultAlias;
      var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
      var showjoyBase = path.join(home,'.spon');
      var filePath = path.join(showjoyBase,'config.json');
      try{
        if(fs.existsSync(filePath))
          defaultAlias = JSON.parse(fs.readFileSync(filePath,'utf8'))['commands'];
        else
          throw new Error('need catched');
      }catch(e){
        defaultAlias = {
          install: 'plugin install',
          i: 'plugin install',
          remove: 'plugin remove',
          rm: 'plugin remove',
          list: 'plugin list',
          ls: 'plugin list',
          update: 'plugin update',
          up: 'plugin update'
        };
      }

      spon.config['commands'] = defaultAlias;

      spon.consume('getAlias',{},function(alias){
        var head = process.argv.slice(0, 2);
        var tail = process.argv.slice(2);

        alias = _.defaults(alias || {},defaultAlias);

        _.forIn(alias,function(v,k){
          var cmd = k;
          var aAlias = v.split(' ');
          var match = true;

          aAlias.forEach(function (a, index) {
            if (a !== tail[index]) {
              match = false;
            }
          });

          if (match) {
            tail = cmd.split(/\s+/).concat(tail.splice(aAlias.length));

            // stdout 输出信息到tty
            //console.log((exec(head.join(' ') + ' ' + tail.join(' '),{
            //  timeout: 20000
            //})).toString());
          //  process.exit();
            var argv = head.concat(tail);

            spon.cli.parse(argv);
            return;
          }
        });
      });
    };

    aliasService();


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
      defer.resolve(fn.call(plugin,method,options,spon));
    }else if(typeof (fn = plugin) == 'function'){
      defer.resolve(fn.call(null,spon));
    }else{
      defer.reject('plugin \'' + pluginName + '\' has no method \'' + method + '\'');
    }
    return defer.promise;

  };

  spon.publish = function(method,fn){
    this.store[method] = fn;
  };

  spon.consume = function(method,data,cb){
    this.store[method](data,cb);
  };

  spon.start = function(){
    this.loadPlugins();
  };

  spon.start();

  process.on('uncaughtException', function(err) {
    if(spon && spon.fatal) {
      console.log(err.stack);
      spon.fatal(err, 'uncaughtException');
    }
  });

  return spon;
};

