var shelljs = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var npmlog = require('npmlog');

module.exports = {
  /**
   * 针对page工程，更新rem
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    self.update(options);
  },
  update: function(options){
    var spon = options.spon;
    spon.request('spon-task:rem',{plugin: 'mobi',args: {
      b: options.originOptions.blacklist,
      w: options.originOptions.whitelist,
      name: options.originOptions.name
    }});
  }

};