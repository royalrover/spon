/**
 * Created by yuxiu on 16/2/2.
 * 命令行别名
 */
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var GLOBAL_ALIAS_KEY = 'commands';

module.exports = function(spon) {
  var cli = spon.cli;

  function setAlias(an, cn) {
    if(!an || !cn) {
      spon.log.warn('aliasName or commandName was empty');
      return;
    }

    var alias = spon.config[GLOBAL_ALIAS_KEY] || {};

    if(alias[an]) {
      spon.log.info('alias was replaced by command \"' + cn + '\"');
    }

    alias[an] = cn;

    spon.config[GLOBAL_ALIAS_KEY] = alias;

    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var showjoyBase = path.join(home,'.spon');
    fs.writeFileSync(path.join(showjoyBase,'config.json'),JSON.stringify(spon.config,null,2),'utf8',function(err){
      if(err){
        spon.log.error(err);
      }
    });
    spon.log.info('alias was saved');
  }

  function showAlias(name) {
    var alias = spon.config[GLOBAL_ALIAS_KEY] || {};
    console.log();
    if(_.keys(alias).length == 0) {
      spon.log.info('alias was empty');
    }
    _.forEach(alias, function(commandName, aliasName) {
      if(!name) {
        console.log(aliasName + ' <= ' +commandName);
      } else if(name && commandName == name) {
        console.log(aliasName + ' <= ' +commandName);
      }
    });
    console.log();
  }
  //
  //cli.action(function(){
  //  showAlias();
  //});

  cli
    .command('set <alias_name> <command_name>')
    .description('add/edit a short command  name')
    .action(function(name, command){
      setAlias(name, command);
    });

  cli
    .command('alias [command_name]')
    .description('list the alias command')
    .action(function(name){
      showAlias(name);
    });

  spon.publish('getAlias', function(data,cb){
    var alias = spon.config[GLOBAL_ALIAS_KEY] || {};
    var d;
    _.forIn(alias,function(v,k){
      var arr1 = v.split(' ');
      var arr2 = data.split && data.split(' ');
      if(!arr2){
        d = null;
      }
      if(_.isEqual(arr1,arr2)){
        d = k;
      }
    });

    cb(d ? d: alias);
  });

  spon.publish('setAlias', function(data,cb){
    setAlias(data.aliasName, data.commandName);
    cb();
  });
};
