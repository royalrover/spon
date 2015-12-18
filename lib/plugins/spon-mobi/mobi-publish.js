var shelljs = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var buildModule = require('./mobi-build');

var pageGeneratorPath = path.resolve(__dirname,'..','..','generator-spon/generators/p-pub/index');
var componentGeneratorPath = path.resolve(__dirname,'..','..','generator-spon/generators/c-pub/index');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var pageGenerator = require(pageGeneratorPath);
var componentGenerator = require(componentGeneratorPath);
module.exports = {
  /**
   * 根据option（-r -p -c）来添加对应的目录
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    var sponJson = require(path.join(process.cwd(),'spon.json'));
    switch(sponJson.spec){
      case 'page':
        self._generatePage(options);
        break;
      case 'component':
        self._generateComp(options);
        break;
      case 'ReactNative':
        self._generateRN(options);
        break;
    }

  },
  _generatePage: function(options){
    // TODO: 本地构建，发布
    buildModule.generate();

    switch(options.option){
      case 'online':
        shelljs.exec('git checkout master',{silent: true});
        break;
      case 'dev':
        if(shelljs.exec('git branch',{silent: true}).output.indexOf('dev') !== -1){
          shelljs.exec('git checkout dev',{silent: true});
        }else{
          shelljs.exec('git checkout -b dev',{silent: true});
        }
        break;
    }
    if(shelljs.exec('git add .').code !== 0){
      error('ERR: mobi-component project publish encounter an error when execute "git add ."!');
      return 1;
    }

    var generator = new pageGenerator([], {
      resolved: pageGeneratorPath,
      env: {
        cwd: process.cwd()
      },
      __isDev: options.option == 'dev'
    });

    generator.run();
  },
  // 针对component工程，仅需提交到gitlab即可，毋需进行线上发布
  _generateComp: function(){
    if(shelljs.exec('git add .').code !== 0){
      error('ERR: mobi-component project publish encounter an error when execute "git add ."!');
      return 1;
    }

    var generator = new componentGenerator([], {
      resolved: componentGeneratorPath,
      env: {
        cwd: process.cwd()
      }
    });

    generator.run();
  },
  _generateRN: function(){
    var rV = originOptions.ReactNative ? originOptions.ReactNative.split(' ') : [];
  }

};