'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var exec = require('child_process').exec;

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // 存储init类型，如 -r -p -c
  // @deprecate
  this.type = options._my_op;

  // 存储添加模块名称，为数组
  // @deprecate
  this.data = options._my_data;

};

util.inherits(sponGenerator, yeoman.generators.Base);

/*sponGenerator.prototype.initializing = function(){
  var self = this;
  var cb = this.async();
  fs.readFile('spon.json','utf-8',function(error,data){
    if(error){
      error(error);
      return;
    }
    self.csstype = JSON.parse(data).csstype || 'less';
    cb();
  });
};*/

var userConfig = {};


function exec_defer(cmd,cb){
  var defer = Q.defer();
  exec(cmd, function (err, stdout, stderr) {
    if(err) {
      defer.reject(err);
    }

    cb && cb(stdout,defer);
  });
  return defer.promise;
}

sponGenerator.prototype.initializing = function(){
  var done = this.async();
  var self = this;
  // 获取当前分支
  exec_defer('git config --list',function(std,defer){
    var reg = /user\.name=([^\n]+)\nuser\.email=([^\n]+)/,
      match = std.match(reg);

    if (match) {

      userConfig.author = {

        name: match[1],
        email: match[2]

      };

    }
    defer.resolve(userConfig);
  }).then(function(){
    return exec_defer("git remote -v  | grep origin | sed -n '1p;1q'",function(std,defer){
      var arr;
      arr = std.split(/\s+/g);
      if(/git@git/ig.test(std)){
        userConfig.group = arr[1].split('\:')[1].split('\/')[0];
        userConfig.project = arr[1].split('\/')[1].split('\.')[0];
      }else{
        userConfig.group = arr[1].split('\/')[3];
        userConfig.project = arr[1].split('\/')[4].split('\.')[0];
      }
      defer.resolve(userConfig);

      // 继续执行之后的生命周期方法
      fs.readFile('spon.json','utf-8',function(error,data){
        if(error){
          error(error);
          return;
        }
        self.csstype = JSON.parse(data).csstype || 'less';
        done();
      });

    });
  },function(err){
    error("*****执行git config命令出错，请确保gitlab服务器有对应工程*****");
  }).catch(function(err){
    error('*****获取工程名称错误*****');
  });
};

sponGenerator.prototype.prompting = function(){

  // Have Yeoman greet the user.
  this.log('*****在当前mobi工程添加page工程:*****');

  var prompts = [];
  prompts.push(
    {
      type: 'input',
      name: 'name',
      message: 'name of page?'
    }
  );

  // TODO：针对page选项做提示处理，有待扩展
  if (prompts.length) {
    var cb = this.async();
    var spon = require('./templates/spon.json');

    this.prompt(prompts, function (props) {
      this.group = userConfig.group;
      this.pages = props.name ? props.name.split(/\s+/): this.pages;
      cb();
    }.bind(this));
  }
};

sponGenerator.prototype.writing = function(){
  var self = this;
  self.sourceRoot(path.join(__dirname,'./templates'));

  switch(self.type){
    case 'component':
      break;
    case 'ReactNative':
      break;
    case 'page':
    default:
      if(!fs.existsSync('src')){
        this.mkdir('src');
      }

      if(!fs.existsSync('src/p')){
        this.mkdir('src/p');
      }

      self.data = self.data.concat(self.pages);
      self.data.forEach(function(name) {
        var root =  path.join(process.cwd(),'src/p', name).toLocaleLowerCase();
        var demoPage = path.join(root, name + '.html');
        if(fs.existsSync(demoPage)){
          console.log(name +'该页面已经存在');
          return ;
        }

        self.copy('index.js', path.join(root, name + '.js'));
        self.copy('index.css', path.join(root, name + '.' + self.csstype));
        self.template('index_tmpl.html', path.join(root, name + '.html'));

      });
      break;
  }
};
