var exec = require('child_process').exec;
var chalk = require('chalk');
var path = require('path');

var generatorPath = path.resolve(__dirname,'..','..','generator-spon/generators/pc-app/index');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var sponGenerator = require(generatorPath);

module.exports = {
  /**
   * 根据option来创建对应的目录
   * @param options [type] {type: 'page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    switch(options.option){
      case 'page':
        self._generatePage();
        break;
    }
  },
  _generatePage: function(){
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'page'
    });

    generator.run();
  }
};