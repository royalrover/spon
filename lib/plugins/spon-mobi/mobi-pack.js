var path = require('path');
var chalk = require('chalk');
var shelljs = require('shelljs');
var npmlog = require('npmlog');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

module.exports = {
  /**
   * @param options [type]
   */
  generate: function(options){
    var self = this;
    // 设置NODE_PATH
    if(!process.env.NODE_PATH) {
      process.env.NODE_PATH = '/usr/local/lib/node_modules/spon/node_modules';
    }else{
      process.env.NODE_PATH += ';/usr/local/lib/node_modules/spon/node_modules';
    }
    self._join(options);
  },
  _join: function(options){
    var spon = options.spon;
    var utils = options.utils;
    var originOptions = options.originOptions;
    spon.request('spon-task:pack',{plugin: 'mobi',utils: utils, 'originOptions': originOptions});
  }
};