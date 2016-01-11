var shelljs = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var npmlog = require('npmlog');

var pageGeneratorPath = path.resolve(__dirname,'..','..','generator-spon/generators/pc-pub/index');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var pageGenerator = require(pageGeneratorPath);
module.exports = {
  /**
   * 根据option（-r -p -c）来添加对应的目录
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    options = Object.create(options);
    this._generatePage(options);
  },
  _generatePage: function(options){
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

    var generator = new pageGenerator([], {
      resolved: pageGeneratorPath,
      env: {
        cwd: process.cwd()
      },
      __isDev: options.option == 'dev'
    });

    generator.run();
  }

};