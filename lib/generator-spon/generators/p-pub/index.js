'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var fs = require('fs');
var Q = require('q');
var exec = require('child_process').exec;
var shelljs = require('shelljs');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var log = function(msg){
  console.log(chalk.bold.cyan(msg));
};

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // 是否发布到测试环境
  this.isDev = options.__isDev;
};

util.inherits(sponGenerator, yeoman.generators.Base);

sponGenerator.prototype.prompting = function(){
  var prompts;

  var cb = this.async();

  // 发布至线上
  if(!this.isDev){
    prompts = [
      {
        type: 'input',
        name: 'msg',
        message: '本次git提交线上环境信息（git commit -m "$msg",必填）:'
      },{
        type: 'input',
        name: 'tag',
        message: '本次提交线上 tag 信息（git push origin $tag,必填,如：publish/x.x.x）:'
      }];

    this.prompt(prompts, function (props) {
      this.msg = props.msg;
      this.tag = props.tag;

      if(this.msg.replace(/\s+/g,'').length == 0){
        error('ERR: you should input commit message!');
        return 1;
      }
      if(!/^publish\/\d+\.\d+\.\d+/g.test(this.tag)){
        error('ERR: format of the tag is wrong, FORMAT: publish/x.x.x');
        return 1;
      }

      if(shelljs.exec('git status',{silent: true}).output.indexOf('nothing to commit, working directory clean') == -1){
        if(shelljs.exec('git commit -m " ' + this.msg + '"').code !== 0){
          error('ERR: mobi-page project publish encounter an error when execuate "git commit"!');
          return 1;
        }
      }

      if(shelljs.exec('git push origin master').code !== 0){
        error('ERR: mobi-page project publish encounter an error when execute "git push"!');
        return 1;
      }
      if(shelljs.exec('git tag '+ this.tag).code !== 0){
        error('ERR: mobi-component project publish encounter an error when execute "git tag tagname"!');
        return 1;
      }
      if(shelljs.exec('git push  origin '+ this.tag).code !== 0){
        error('ERR: mobi-component project publish encounter an error when execute "git push tag"!');
        return 1;
      }

      log('INFO: publish to online env successfully, current tag: ' + this.tag);
      cb();
    }.bind(this));
  }else{
    // 测试
    prompts = [
      {
        type: 'input',
        name: 'msg',
        message: '本次git提交测试环境信息（git commit -m "$msg",必填）:'
      },{
        type: 'input',
        name: 'tag',
        message: '本次提交测试 tag 信息（git push origin $tag,必填,如：dev/x.x.x）:'
      }];
    this.prompt(prompts, function (props) {
      this.msg = props.msg;
      this.tag = props.tag;

      if(this.msg.replace(/\s+/g,'').length == 0){
        error('ERR: you should input commit message!');
        return 1;
      }
      if(!/^dev\/\d+\.\d+\.\d+/g.test(this.tag)){
        error('ERR: format of the tag is wrong, FORMAT: dev/x.x.x');
        return 1;
      }
      if(shelljs.exec('git status',{silent: true}).output.indexOf('nothing to commit, working directory clean') == -1) {
        if(shelljs.exec('git commit -m " ' + this.msg + '"').code !== 0){
          error('ERR: mobi-page project publish encounter an error when execuate "git commit"!');
          return 1;
        }
      }

      if(shelljs.exec('git push origin dev').code !== 0){
        error('ERR: mobi-page project publish encounter an error when execute "git push"!');
        return 1;
      }
      if(shelljs.exec('git tag '+ this.tag).code !== 0){
        error('ERR: mobi-component project publish encounter an error when execute "git tag tagname"!');
        return 1;
      }
      if(shelljs.exec('git push  origin '+ this.tag).code !== 0){
        error('ERR: mobi-component project publish encounter an error when execute "git push tag"!');
        return 1;
      }

      log('INFO: publish to test env successfully, current tag: ' + this.tag);
      cb();
    }.bind(this));
  }

};
