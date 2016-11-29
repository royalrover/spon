'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var exec = require('child_process').exec;
var shelljs = require('shelljs');
var npmlog = require('npmlog');

var error = function(msg){
  npmlog.error('spon:',msg);
};

var log = function(msg){
  npmlog.info('spon:',msg);
};

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);
};

util.inherits(sponGenerator, yeoman.generators.Base);

sponGenerator.prototype.prompting = function(){
  var prompts = [
    {
      type: 'input',
      name: 'msg',
      message: '本次git提交信息（git commit -m "$msg",必填）:'
    }];

  if (prompts.length) {
    var cb = this.async();

    this.prompt(prompts, function (props) {
      this.msg = props.msg;

      if(shelljs.exec('git commit -m " ' + this.msg + '"').code !== 0){
        npmlog.error('spon:','mobi-component project publish encounter an error when execuate "git commit"!');
        return 1;
      }

      if(shelljs.exec('git push origin master').code !== 0){
        npmlog.error('spon:','mobi-component project publish encounter an error when execute "git push"!');
        return 1;
      }

      var tags;
      try{
        tags = shelljs.exec('git tag',{silent:true}).output;
        tags = tags.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/\n/g,' ');
        tags = tags.split(' ');
      }catch(e){
        npmlog.error('spon:','mobi-component project publish encounter an error when execute "git tag"!');
      }
      tags = tags.filter(function(item){
        return /^publish\/\d\.\d\.(\d)+$/g.test(item);
      });

      var maxTagNumber = function(tags){
        var tagNumber = [];
        tags.forEach(function(tag){
          tagNumber.push(+tag.split('.')[2]);
        });
        return Math.max.apply(null,tagNumber);
      };

      var pTag = typeof +(maxTagNumber(tags) + 1) == 'number' && isFinite(maxTagNumber(tags)) ? maxTagNumber(tags) + 1 : 1;
      if(shelljs.exec('git tag publish/0.0.'+ pTag).code !== 0){
        npmlog.error('spon:','mobi-component project publish encounter an error when execute "git tag tagname"!');
        return 1;
      }
      if(shelljs.exec('git push  origin publish/0.0.'+ pTag).code !== 0){
        npmlog.error('spon:','mobi-component project publish encounter an error when execute "git push tag"!');
        return 1;
      }

      npmlog.info('spon:','publish successfully, current tag: publish/0.0.' + pTag);
      cb();
    }.bind(this));
  }
};
