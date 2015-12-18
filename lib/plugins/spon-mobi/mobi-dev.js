var shelljs = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};


module.exports = {
  /**
   * 针对page工程，提供http服务器调试
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    var originOptions = options.originOptions;
    self._generatePage(originOptions);

  },
  _generatePage: function(originOptions){
    var sponConfig = require(path.join(process.cwd(),'spon.json'));
    if(originOptions.port){
      sponConfig.options.port = +originOptions.port;
    }
    if(originOptions.livereload){
      sponConfig.options.livereloadPort = +originOptions.livereload;
    }
    fs.writeFileSync('spon.json',JSON.stringify(sponConfig));
    if(shelljs.exec('gulp s').code !== 0){
      error('ERR: dev encounter an error!\n see in the plugin of spon-mobi!!');
      return 1;
    }
  }
};