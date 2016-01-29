/**
 * @fileoverview 工具模块
 * @author 欲休
 * @date 2015-12-14 6:12:12
 */
// 引用绝对路径下的模块
var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var log = require('npmlog');
var q = require('q');
var info = require('./info');
var system = require('./system');
var crypto = require('crypto');

// 记录所有pages工程的引用模块
var MODULES = {};
var showjoyBase;

var utils = {
  getNPMGlobalPath: function(algorithm,password){
    var sponConfig = require(path.join(process.cwd(),'spon.json'));
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
  // 同时解析less模块引用，@import "abc.less"
  parseRelativeRequires: function(content){
    var result = [];
    content = utils.removeComments(content);

    var Reg = {
      require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
      relativeRequire: /^\.\//i,
      relativeImport: /@import\s*(['"])([^'"]*)\1/g
    };

    content.replace(Reg.require, function (all, method, match, postfix) {
      var ret = match;

      // 项目内模块处理
      ret = ret.replace(/\/$/, '/index');
      if(!ret.match(/\.js$/i) && !ret.match(/\.less$/i) && !ret.match(/\.css$/i)){
        ret += '.js';
      }

      // 判断是否引用cdn模块
      if(ret.match(Reg.relativeRequire)){
        result.push(ret);
      }
    });

    // 解析less文件中的依赖
    content.replace(Reg.relativeImport,function(all, method, match){
      result.push(match);
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
        if(alias.indexOf(ret) !== -1 && alias !== ret){
          return 'require(\''+ alias +'\')';
        }
      }
      return all;
    });
    return content;
  },
  // 加载组件相对路径引用的模块
  // cpntPath: 组件的路径  cpntUrl: 组件的url
  loadRelativeRequires: function(relativeDeps,cpntPath,cpntUrl){
    var self = this;

    async.map(relativeDeps,function(rd,cb){
      var relDepUrl,relDepPath;
      function getRelDepUrl(rd,cpnt){
        var tmp;
        tmp = path.resolve(__dirname,rd);
        return tmp.replace(__dirname,path.dirname(cpnt));
      }

      relDepUrl = getRelDepUrl(rd,cpntUrl);
      relDepPath = getRelDepUrl(rd,cpntPath);

      // 请求该文件
      request(relDepUrl,function(error,res,body){
        if(error){
          log.error('spon:fetch: ',error);
          cb();
          throw error;
          return;
        }
        if(!error && res.statusCode == 200){

          if(fs.existsSync(relDepPath)){
            fs.unlinkSync(relDepPath);
          }
          self.mkdirsSync(path.dirname(relDepPath));

          // 判断文件是否使用相对路径下载，递归fetch
          var rDeps = utils.parseRelativeRequires(body);

          // 加载相对路径的依赖
          if(rDeps.length !== 0){
            utils.loadRelativeRequires(rDeps,relDepPath,relDepUrl);
          }

          fs.writeFile(relDepPath, body,function(err){
            if(err) {
              cb();
              throw error;
              return;
            }

            log.info('spon:fetch relative deps: ' + relDepUrl + ' successfully');
            cb();
          });
        }
      });
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
utils.info = info;
utils.system = system;

module.exports = utils;
