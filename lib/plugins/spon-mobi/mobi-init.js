var exec = require('child_process').exec;
var chalk = require('chalk');
var path = require('path');

var generatorPath = path.resolve(__dirname,'..','..','generator-spon');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var sponGenerator = require(generatorPath);

module.exports = {
  /**
   * 根据option（-r -p -c）来创建对应的目录
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    switch(options.option){
      case 'page':
        self._generatePage();
        break;
      case 'component':
        self._generateComp();
        break;
      case 'joyui':
        self._generateJoyui();
        break;
      case 'React':
        self._generateReact();
        break;
      case 'midproxy':
        self._generateMidProxy();
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
  },
  _generateComp: function(){
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'component'
    });

    generator.run();
  },
  _generateJoyui: function(){
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'joyui'
    });

    generator.run();
  },
  _generateReact: function(){
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'React'
    });

    generator.run();
  },
  _generateMidProxy: function(){
    var generator = new sponGenerator([], {
      resolved: generatorPath,
      env: {
        cwd: process.cwd()
      },
      _my_op: 'midproxy'
    });

    generator.run();
  }

};