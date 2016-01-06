var path = require('path');
var chalk = require('chalk');
var shelljs = require('shelljs');
var npmlog = require('npmlog');
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

    // 复制gulpfile
    var silentState = shelljs.config.silent; // save old silent state
    shelljs.config.silent = true;
    var gulpfilePath = path.resolve(__dirname,'..','..','generator-spon/generators/app/templates/gulpfile.js');
    shelljs.cp(gulpfilePath,process.cwd());
    shelljs.config.silent = silentState;

    // 设置NODE_PATH
    if(!process.env.NODE_PATH) {
      process.env.NODE_PATH = '/usr/local/lib/node_modules/spon/node_modules';
    }else{
      process.env.NODE_PATH += ';/usr/local/lib/node_modules/spon/node_modules';
    }
    self._build(options);
  },
  _build: function(){
    if(shelljs.exec('gulp f').code !== 0){
      npmlog.error('spon:mobi: ','build(fetch step) encounter an error!\n see in the plugin of spon-mobi!!');
    }
    if(shelljs.exec('gulp page-default').code !== 0){
      npmlog.error('spon:mobi: ','build(default step) encounter an error!\n see in the plugin of spon-mobi!!');
    }
    shelljs.rm(path.join(process.cwd(),'gulpfile.js'));
  }
};