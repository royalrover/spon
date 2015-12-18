var path = require('path');
var chalk = require('chalk');
var shelljs = require('shelljs');
//var Q = require('q');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

module.exports = {
  /**
   * @param options [type]
   */
  generate: function(options){
    var self = this;
    self._build(options);
  },
  _build: function(){
    if(shelljs.exec('gulp f').code !== 0){
      error('ERR: build(fetch step) encounter an error!\n see in the plugin of spon-mobi!!');
    }
    if(shelljs.exec('gulp page-default').code !== 0){
      error('ERR: build(default step) encounter an error!\n see in the plugin of spon-mobi!!');
    }

  }
};