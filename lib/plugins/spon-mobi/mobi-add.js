var exec = require('child_process').exec;
var chalk = require('chalk');
var path = require('path');

var generatorPath = path.resolve(__dirname,'..','..','generator-spon/generators/add/index');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var sponGenerator = require(generatorPath);

module.exports = {
  /**
   * 根据option（-r -p -c）来添加对应的目录
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    var originOptions = options.originOptions;
    switch(options.option){
      case 'page':
        self._generatePage(originOptions);
        break;
      case 'component':
        self._generateComp(originOptions);
        break;
      case 'ReactNative':
        self._generateRN(originOptions);
        break;
    }

  },
  _generatePage: function(originOptions){
    var pV = originOptions.page ? originOptions.page.split(' ') : [];
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'page',
      _my_data: pV
    });

    generator.run();
  },
  _generateComp: function(){
    var cV = originOptions.component ? originOptions.component.split(' ') : [];
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'component',
      _my_data: cV
    });

    generator.run();
  },
  _generateRN: function(){
    var rV = originOptions.ReactNative ? originOptions.ReactNative.split(' ') : [];
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'ReactNative',
      _my_data: rV
    });

    generator.run();
  }

};