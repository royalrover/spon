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
    /*
    // 复制gulpfile
    var silentState = shelljs.config.silent; // save old silent state
    shelljs.config.silent = true;
    var gulpfilePath = path.resolve(__dirname,'..','..','generator-spon/generators/app/templates/gulpfile.js');
    shelljs.cp(gulpfilePath,process.cwd());
    shelljs.config.silent = silentState;
    */

    self._build(options);
  },
  _build: function(options){
    /*if(shelljs.exec('gulp parse-tmpl').code !== 0){
      npmlog.error('spon:mobi: ','build(compile step) encounter an error!\n see in the plugin of spon-mobi!!');
    }
    if(shelljs.exec('gulp page-default').code !== 0){
      npmlog.error('spon:mobi: ','build(default step) encounter an error!\n see in the plugin of spon-mobi!!');
    }
    shelljs.rm(path.join(process.cwd(),'gulpfile.js'));*/
    var spon = options.spon;
    var utils = options.utils;
    var originOptions = options.originOptions;
    spon.request('spon-task:build',{plugin: 'mobi',utils: utils, 'originOptions': originOptions});
  }
};