'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var exec = require('child_process').exec;
var npmlog = require('npmlog');
var request = require('request');

var mobiUrl = 'http://assets.showjoy.net/mobi.json';

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var isReturn = false;

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);
  var sponFile = path.join(process.cwd(), 'spon.json');
  /*if (fs.existsSync(sponFile)) {
    this.spon = require(sponFile);
  } else {
    this.log.error('spon.json 不存在，请在Assets根目录下运行')
    process.exit(1);
  }*/

  // 存储init类型，如 -r -p -c
  this.type = options._my_op;

};

util.inherits(sponGenerator, yeoman.generators.Base);

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
      done();
    });
  },function(err){
    npmlog.error('spon:mobi: ',"*****执行git config命令出错，请确保gitlab服务器有对应工程*****");
  }).catch(function(err){
    npmlog.error('spon:mobi: ','*****获取工程名称错误*****');
  });
};

sponGenerator.prototype.prompting = function(){

  if(isReturn)
    return;
  // Have Yeoman greet the user.
  this.log('*****为您初始化 mobi 项目: '+ userConfig.project +'*****');

  var prompts = [
    {
      type: 'input',
      name: 'group',
      message: '该项目所属 gitlab 上的组:',
      default: userConfig.group
    },
    {
      type: 'input',
      name: 'author',
      message: '作者:',
      default: userConfig.author && userConfig.author.name
    }/*,
    {
      type: 'input',
      name: 'csstype',
      message: 'choose the type of the stylesheet：css|less|sass (less default)',
      default: 'less'
    }*/];

  switch(this.type){
    case 'ReactNative':
      break;
    case 'component':
      prompts.push(
        {
          type: 'input',
          name: 'name',
          message: 'name of component?'
        },
        {
          type: 'input',
          name: 'deps',
          message: 'dependencies of the current component(FORMAT: "fecomponent/mobi-say/0.0.1 fecomponent/mobi-chart/0.0.2"):\n'
        }
      );

      // TODO：针对page选项做提示处理，有待扩展
      if (prompts.length) {
        var cb = this.async();
        var spon = require('./templates/spon.json');

        this.prompt(prompts, function (props) {
          var tmp,deps;
          this.name = path.basename(process.cwd());
          this.group = props.group;
          this.author = props.author;
          this.csstype = props.csstype || 'less';
          this.component = props.name;
          deps = [];

          // 格式化依赖
          tmp = props.deps ? props.deps.split(/\s+/g) : [];
          tmp.forEach(function(d){
            d = d.replace(/^\s+|\s+$/g,'');
            console.log(d);
            if(!d.match(/^[^\/]+\/[^\/]+\/\d+\.\d+\.\d+$/g)){
              npmlog.error('spon:mobi: ','format of deps is error!');
              return 1;
            }
            var arr,name;
            d = d.replace(/\/$/g,'');
            arr = d.split('/');

            name = arr[1].split('-');
            name.shift();

            deps.push({
              alias: d + '/index',
              url: arr[0] + '/' + name.join('-') + '/raw/publish/' + arr[2] + '/index.js'
            })
          });
          this.deps = deps;

          spon.name = userConfig.project;
          spon.group = this.group;
          spon.csstype = this.csstype;
          spon.developer = userConfig.author && userConfig.author.name;
          spon.spec = 'component';

          fs.writeFile('spon.json',JSON.stringify(spon,null,2),function(err){
            if(err){
              npmlog.error('spon:mobi: ',err);
            }
            npmlog.info('spon:mobi: ','creat spon.json successfully');
            cb();
          });
        }.bind(this));
      }
      break;
    case 'page':
    default:
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
          this.name = path.basename(process.cwd());
          this.group = props.group;
          this.author = props.author;
          this.csstype = props.csstype || 'less';
          this.pages = props.name ? props.name.split(/\s+/): this.pages;

          spon.name = userConfig.project;
          spon.group = this.group;
          spon.csstype = this.csstype;
          spon.developer = userConfig.author && userConfig.author.name;
          spon.spec = 'page';
          fs.writeFile('spon.json',JSON.stringify(spon,null,2),function(err){
            if(err){
              error(err);
            }
            npmlog.info('spon:mobi: ','creat spon.json successfully');
            cb();
          });

        }.bind(this));
      }
      break;
  }

};

sponGenerator.prototype.writing = function(){
  if(isReturn)
    return;

  var self = this;
  self.sourceRoot(path.join(__dirname,'./templates'));

  //this.copy('index_tmpl.html', 'index_tmpl.html');

  switch(self.type){
    case 'component':
      var root =  path.join(process.cwd()).toLocaleLowerCase();

      self.copy('index.js', path.join(root, 'index.js'));
      self.template('_gitattributes', '.gitattributes');
      self.template('_gitignore', '.gitignore');

      var packageJson = {
        version: '0.0.1',
        name: self.group + '/mobi-' + self.component,
        dependencies: self.deps,
        labels: 'component',
        alias: ''
      };

      fs.writeFile('package.json',JSON.stringify(packageJson,null,2),function(err){
        if(err){
          error(err);
        }
        npmlog.info('spon:mobi: ','create package.json successfully');
      });
      break;
    case 'ReactNative':
      break;
    case 'page':
    default:
      // 创建目录
      this.mkdir('src');
      this.mkdir('src/pages');
      this.mkdir('src/components');

      // 混入less脚本
      this.mkdir('src/mixins');
      self.copy('mixins.less', path.join('src/mixins','mixins.less'));

      self.pages.forEach(function(name) {
        var root =  path.join(process.cwd(),'src/pages', name).toLocaleLowerCase();
        var demoPage = path.join(root, name + '.html');
        if(fs.existsSync(demoPage)){
          npmlog.info(name +'该页面已经存在');
          return ;
        }

        self.copy('index.js', path.join(root, name + '.js'));
        self.copy('index.css', path.join(root, name + '.' + self.csstype));
        self.template('index_tmpl.html', path.join(root, name + '.html'));

      });
      self.template('_gitattributes', '.gitattributes');
      self.template('_gitignore', '.gitignore');
      self.template('_jshintrc', '.jshintrc');

      // 修改mobi.json
      request(mobiUrl,function(err,res,body){
        if(err){
          npmlog.error('spon:mobi: ','fetch mobi.json from server encounter an error, please check your network. To make sure you can use components, you should download the newest mobi.json with the url '+ mobiUrl);
          self.template('mobi.json', 'mobi.json');
          return 1;
        }
        fs.writeFile('mobi.json', body, function (err) {
          npmlog.info('spon:mobi: ','create mobi.json');
        })

      });


      var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
      var showjoyBase = path.join(home,'.spon');
      var mobiBase = path.join(showjoyBase,'mobi');
      if(!fs.existsSync(path.join(mobiBase, 'webpack.config.js'))){
        self.copy('webpack.config.js', path.join(mobiBase, 'webpack.config.js'));
      }
      break;
  }

};

