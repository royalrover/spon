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
var gulp = require('gulp');

var error = function(msg){
  console.log(chalk.bold.red(msg));
};

var log = function(msg){
  console.log(chalk.bold.cyan(msg));
};

var sponGenerator = module.exports = function (args, options, config) {
  yeoman.generators.Base.apply(this, arguments);
  this._updateRem = options._updateRem;
  this.SRC_BASE = options.SRC_BASE;
  this._currPath = options._currPath;
  this._name = options._name;
};

util.inherits(sponGenerator, yeoman.generators.Base);

sponGenerator.prototype.prompting = function(){
  var prompts;

  var cb = this.async();
  if(this._name && typeof this._name !== 'function'){
    prompts = [{
      type: 'input',
      name: 'confirm',
      message: '你确定针对'+ this._name +'页面采用rem规范么(输入 Y or N)?',
      default: 'y'
    }];

    this.prompt(prompts, function (props) {
      this.confirm = props.confirm;
      var updateRem = this._updateRem;
      var SRC_BASE = this.SRC_BASE;
      var currPath = this._currPath;
      var name = this._name;
      if(this.confirm.toLowerCase() == 'n'){
        return;
      }else if(this.confirm.toLowerCase() == 'y'){
        gulp.task('updaterem', function() {


          return gulp.src(path.join(currPath,'/src/pages/'+ name +'/**/*.less'), {
            cwd: SRC_BASE,
            base: SRC_BASE
          }).pipe(updateRem())
            .pipe(gulp.dest(SRC_BASE));
        });
      }else{
        error('输入字符错误！');
      }

      cb();
    }.bind(this));
  }else{
    prompts = [{
      type: 'input',
      name: 'confirm',
      message: '你确定针对当前所有页面采用rem规范么(输入 Y or N)?',
      default: 'n'
    }];

    this.prompt(prompts, function (props) {
      this.confirm = props.confirm;
      var updateRem = this._updateRem;
      var SRC_BASE = this.SRC_BASE;
      var currPath = this._currPath;
      if(this.confirm.toLowerCase() == 'n'){
        return;
      }else if(this.confirm.toLowerCase() == 'y'){
        gulp.task('updaterem', function() {


          return gulp.src(path.join(currPath,'/src/pages/**/*.less'), {
            cwd: SRC_BASE,
            base: SRC_BASE
          }).pipe(updateRem())
            .pipe(gulp.dest(SRC_BASE));
        });
      }else{
        error('输入字符错误！');
      }

      cb();
    }.bind(this));
  }

};

sponGenerator.prototype.writing = function(){
  gulp.start('updaterem');
};