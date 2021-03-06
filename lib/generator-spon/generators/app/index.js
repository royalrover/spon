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
var shelljs = require('shelljs');
var mkdirp = require('mkdirp');

var crypto = require('crypto');
var C_KEY = 'showjoyf2espon';

console.dir(88888)
var mobiUrl = 'http://assets.showjoy.net/mobi.json';

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var isReturn = false;

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);
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
      try{
        arr = std.split(/\s+/g);
        if(/git@git/ig.test(std)){
          userConfig.group = arr[1].split('\:')[1].split('\/')[0];
          userConfig.project = arr[1].split('\/')[1].split('\.')[0];
        }else{
          userConfig.group = arr[1].split('\/')[3];
          userConfig.project = arr[1].split('\/')[4].split('\.')[0];
        }
        defer.resolve(userConfig);
      }catch(e){
        npmlog.error('spon:','所属工程应该是git工程！');
        process.exit(1);
      }
      // 继续执行之后的生命周期方法
      done();
    });
  },function(err){
    npmlog.error('spon:',"*****执行git config命令出错，请确保gitlab服务器有对应工程*****");
  }).catch(function(err){
    npmlog.error('spon:','*****获取工程名称错误*****');
  });
};

sponGenerator.prototype.prompting = function(){

  if(isReturn)
    return;
  // Have Yeoman greet the user.
  this.log('*****为您初始化 spon 项目: '+ userConfig.project +'*****');

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
    case 'React':
      prompts.push(
        {
          type: 'input',
          name: 'name',
          message: 'name of React Project?',
          default: userConfig.project
        },
        {
          type: 'input',
          name: 'info',
          message: 'information of the React Project?'
        }
      );

      if (prompts.length) {
        var cb = this.async();

        this.prompt(prompts, function (props) {
          this.name = props.name;
          fs.writeFile('package.json',JSON.stringify({
            type: "React",
            name: props.name,
            info: props.info
          },null,2),function(err){
            if(err){
              npmlog.error('spon:mobi: ',err);
            }
            npmlog.info('spon:','create package.json successfully');
            cb();
          });
        }.bind(this));
      }
      break;
    case 'component':
      prompts.push(
        {
          type: 'input',
          name: 'name',
          message: 'name of component?',
          default: userConfig.project
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
          try{
            tmp.forEach(function(d){
              d = d.replace(/^\s+|\s+$/g,'');
              //  console.log(d);
              if(!d.match(/^[^\/]+\/[^\/]+\/\d+\.\d+\.\d+$/g)){
                npmlog.error('spon:','format of deps is error!');
                throw new Error('format of deps is error!')
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
          }catch(e){
            npmlog.error('spon:','init failure!');
            return 1;
          }
          this.deps = deps;

          // 加密‘npm root －g’路径
          var cipher = crypto.createCipher('aes-256-cbc',C_KEY);
          var base_path = shelljs.exec('npm root -g',{silent: true}).output;
          var cryto_path = cipher.update(base_path,'utf8','hex');
          cryto_path += cipher.final('hex');


          spon.name = userConfig.project;
          spon.group = this.group;
          spon.csstype = this.csstype;
          spon.developer = userConfig.author && userConfig.author.name;
          spon.spec = 'component';
          spon.base = cryto_path;

          fs.writeFile('spon.json',JSON.stringify(spon,null,2),function(err){
            if(err){
              npmlog.error('spon:mobi: ',err);
            }
            npmlog.info('spon:','create spon.json successfully');
            cb();
          });
        }.bind(this));
      }
      break;
    case 'joyui':
      prompts.push(
        {
          type: 'input',
          name: 'name',
          message: 'name of JOYUI module?',
          default: userConfig.project
        },
        {
          type: 'input',
          name: 'deps',
          message: 'dependencies of the current JOYUI module(FORMAT: "fecomponent/mobi-say/0.0.1 fecomponent/mobi-chart/0.0.2"):\n',
          default: 'fecomponent/mobi-art-template/0.0.3'
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
          this.joyui = props.name;
          deps = [];

          // 格式化依赖
          tmp = props.deps ? props.deps.split(/\s+/g) : [];
          try{
            tmp.forEach(function(d){
              d = d.replace(/^\s+|\s+$/g,'');
              //  console.log(d);
              if(!d.match(/^[^\/]+\/[^\/]+\/\d+\.\d+\.\d+$/g)){
                npmlog.error('spon:','format of deps is error!');
                throw new Error('format of deps is error!')
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
          }catch(e){
            npmlog.error('spon:','init failure!');
            return 1;
          }

          this.deps = deps;

          // 加密‘npm root －g’路径
          var cipher = crypto.createCipher('aes-256-cbc',C_KEY);
          var base_path = shelljs.exec('npm root -g',{silent: true}).output;
          var cryto_path = cipher.update(base_path,'utf8','hex');
          cryto_path += cipher.final('hex');


          spon.name = userConfig.project;
          spon.group = this.group;
          spon.csstype = this.csstype;
          spon.developer = userConfig.author && userConfig.author.name;
          spon.spec = 'JOYUI';
          spon.base = cryto_path;

          fs.writeFile('spon.json',JSON.stringify(spon,null,2),function(err){
            if(err){
              npmlog.error('spon:mobi: ',err);
            }
            npmlog.info('spon:','create spon.json successfully');
            cb();
          });
        }.bind(this));
      }
      break;
    case 'midproxy':
      /*prompts.push(
        {
          type: 'input',
          name: 'name',
          message: 'name of MidProxy Project?',
          default: userConfig.project
        },
        {
          type: 'input',
          name: 'info',
          message: 'information of the MidProxy Project?'
        }
      );

      if (prompts.length) {
        var cb = this.async();

        this.prompt(prompts, function (props) {

          fs.writeFile('package.json',JSON.stringify({
            type: "MidProxy",
            name: props.name,
            info: props.info,
            views: []
          },null,2),function(err){
            if(err){
              npmlog.error('spon:mobi: ',err);
            }
            npmlog.info('spon:','create package.json successfully');
            cb();
          });
        }.bind(this));
      }*/
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

          // 加密‘npm root －g’路径
          var cipher = crypto.createCipher('aes-256-cbc',C_KEY);
          var base_path = shelljs.exec('npm root -g',{silent: true}).output;
          var cryto_path = cipher.update(base_path,'utf8','hex');
          cryto_path += cipher.final('hex');


          spon.name = userConfig.project;
          spon.group = this.group;
          spon.csstype = this.csstype;
          spon.developer = userConfig.author && userConfig.author.name;
          spon.spec = 'page';
          spon.base = cryto_path;

          fs.writeFile('spon.json',JSON.stringify(spon,null,2),function(err){
            if(err){
              error(err);
            }
            npmlog.info('spon:','create spon.json successfully');
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

      self.copy('README.md','README.md');
      fs.writeFile('package.json',JSON.stringify(packageJson,null,2),function(err){
        if(err){
          error(err);
        }
        npmlog.info('spon:','create package.json successfully');
      });
      break;
    case 'joyui':
      var root =  path.join(process.cwd()).toLocaleLowerCase();

      self.copy('index.js', path.join(root, 'index.js'));
      self.copy('joyui/data.json', path.join(root, 'data.json'));
      self.template('joyui/index.css', path.join(root, 'index.less'),{
        JoyUIName: self.joyui
      });
      self.template('demo.tmpl', self.joyui + '.tmpl',{
        JoyUIName: self.joyui
      });
      self.template('_gitattributes', '.gitattributes');
      self.template('_gitignore', '.gitignore');

      var packageJson = {
        version: '0.0.1',
        name: 'joyui/' + self.joyui,
        dependencies: self.deps,
        labels: 'JOYUI',
        alias: ''
      };

      self.copy('README.md','README.md');
      fs.writeFile('package.json',JSON.stringify(packageJson,null,2),function(err){
        if(err){
          error(err);
        }
        npmlog.info('spon:','create package.json successfully');
      });
      break;
    case 'React':
      self.template('_gitattributes', '.gitattributes');
      self.template('_gitignore', '.gitignore');
      self.template('react/index.jsx', 'index.jsx',{
        ComponentName: self.name
      });
      self.template('react/style.less', 'style.less',{
        ComponentName: self.name
      });
      self.copy('react/props.json','props.json');
      break;
    case 'midproxy':
      self.template('_gitattributes', '.gitattributes');
      self.template('_gitignore', '.gitignore');
      self.bulkDirectory('midproxy/api/', 'api/');
      self.bulkDirectory('midproxy/routes/page/', 'routes/page/');
      self.bulkDirectory('midproxy/views/', 'views/');
      self.copy('midproxy/package.json','package.json');
      self.copy('README.md','README.md');
      break;
    case 'page':
    default:
      // 创建目录
      mkdirp('img');
      mkdirp('src');
      mkdirp('src/pages');
      mkdirp('src/components');

      // 混入less脚本
      mkdirp('src/mixins');
      mkdirp('src/mixins/common');
      self.copy('mixins.less', path.join('src/mixins','mixins.less'));
      self.copy('common/animation-slide.less',path.join('src/mixins/common','animation-slide.less'));
      self.copy('common/grid.less',path.join('src/mixins/common','grid.less'));
      self.copy('common/recommend-list.less',path.join('src/mixins/common','recommend-list.less'));
      self.copy('common/sku-list.less',path.join('src/mixins/common','sku-list.less'));
      self.copy('common/user-level.less',path.join('src/mixins/common','user-level.less'));
      self.copy('common/welcome.less',path.join('src/mixins/common','welcome.less'));

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
          npmlog.error('spon:','fetch mobi.json from server encounter an error, please check your network. To make sure you can use components, you should download the newest mobi.json with the url '+ mobiUrl);
          self.template('mobi.json', 'mobi.json');
          return 1;
        }
        fs.writeFile('mobi.json', body, function (err) {
          npmlog.info('spon:','create mobi.json');
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

