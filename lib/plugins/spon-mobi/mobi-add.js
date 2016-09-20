var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var chalk = require('chalk');
var log = require('npmlog');

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
  _generateComp: function(originOptions){
    var deps = originOptions.dependences ? originOptions.dependences.split(' ') : [];
    var base = process.cwd();
    var checkReg = /^[^\s]+?\/\d+\.\d+\.\d+$/i;
    var packageJson = require(path.join(base,'package.json'));
    if(!packageJson){
      log.error('spon: 当前目录下没有找到package.json文件！');
      process.exit(1);
    }
    deps.forEach(function(dep) {
      if (!dep.match(dep)) {
        log.error('spon: 依赖名称不正确！需保证依赖格式为"@name/x.x.x"');
        process.exit(1);
      }
      var assembles = dep.split('/');
      packageJson.dependencies = packageJson.dependencies || [];
      packageJson.dependencies.push({
        alias: 'fecomponent/mobi-' + dep + '/index',
        url: 'fecomponent/' + assembles[0] + '/raw/publish/' + assembles[1] + '/index.js'
      });
    });

    fs.writeFileSync(path.join(base,'package.json'),JSON.stringify(packageJson,null,2));
  },
  _generateRN: function(originOptions){
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