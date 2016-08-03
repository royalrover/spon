'use strict';
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var readline = require('readline');

var _ = require('lodash');
var async = require('async');
var installMod = require('./utils/install');

var installer = require('./installer');
var baseUtil = require('./utils/baseUtil');

/**
 * get core function
 * @param spon
 * @returns {{install: install, remove: remove}}
 */
module.exports = function (spon) {
  var home = spon.pluginRoot;

  /**
   * 检查更新并安装
   * @param modules
   * @param options
   * @param options.noConfirm
   * @param options.type install,update
   * @param options.checkTimeout {Number} timeout check version
   * @param cb
   */
  function findAndInstall(modules, options, cb) {
    options = options || {};

    modules = baseUtil.formatPluginName(modules);

    var needConfirm;
    needConfirm = options.noConfirm ? [] : modules;

    function doInstall() {
      installMod(modules, home).
        then(function (result) {
          cb(null, result);
        }).
        catch(function (e) {
          cb(e);
        });
    }

    if (!options.noConfirm && needConfirm.length) {

      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      if(options.type == 'update'){
        rl.question('确认更新？ (Y/n) ', function (answer) {
          console.log(answer);
          answer = answer || 'Y';

          if (/y/i.test(answer)) {
            doInstall();
          } else {
            console.log('\n%s', '插件更新已经取消');
            cb(null);
          }

          rl.close();
        });
      }else if(options.type == 'install'){
        rl.question('确认安装？ (Y/n) ', function (answer) {
          console.log(answer);
          answer = answer || 'Y';

          if (/y/i.test(answer)) {
            doInstall();
          } else {
            console.log('\n%s', '插件安装已经取消');
            cb(null);
          }

          rl.close();
        });
      }

    } else {
      doInstall();
    }
  }


  return {
    install: function (modules, options, cb) {
      options = options || {};
      if (_.isEmpty(modules)) {
        cb();
      } else {
        findAndInstall(modules, options, function (err) {
          if (err && err.code === 'ENOENT') {
            console.error('出错了！现在安装插件必须安装 npm');
            console.error('如果提示有权限问题请用 sudo');
          }

          modules = baseUtil.formatPluginName(modules);
          // 移动此插件的位置
          modules.forEach(function(m,i){
            if(/^spon-/i.test(m)){
              exec('cp -rf node_modules/' + m + ' local/',{cwd: home})
            }
          });

          cb(err);
        });
      }
    },

    remove: function (modules, options, cb) {
      modules = baseUtil.formatPluginName(modules);
      // 删除local目录中的该插件
      modules.forEach(function(m){
        if(/^spon-/i.test(m)){
          exec('rm -rf local/' + m,{cwd: home})
        }
      });
      installer.run('remove', modules, {
        cwd: home,
        stdio: [0,1] //不输出stderr信息
      }, cb);
    }
  };
};
