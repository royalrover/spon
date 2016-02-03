#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var cli = require('commander');
var appInfo = require('../package.json');
var utils = require('../lib/utils');
var chalk = require('chalk');
var npmlog = require('npmlog');
var _ = require('lodash');

var log = console.log;
var cyanLog = function(msg){
    console.log(chalk.italic.cyan(msg));
};

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var showjoyBase = path.join(home,'.spon');
var pluginsBase = path.join(showjoyBase,'plugins');
if(!fs.existsSync(pluginsBase)){
    fs.mkdirSync(pluginsBase);
}

var spon = require('../lib/spon-manager')(cli);

/*
cli
    // .allowUnknownOption()//不报错误
    .version(appInfo.version)
    .usage('欢迎使用showjoy前端解决方案－spon <cmd> [subcmd]')
    .action(function(cmd){
        var cmds = ['init','mobi','mb','pc'];
        var flag = false;
        cmds.forEach(function(c){
            if(c == cmd){
                flag = true;
            }
        });
        if(!flag){
            npmlog.error('spon:mobi: ','sorry, do not have the command of "'+ cmd +'", please exacute "spon" to find something helpful!');
            process.exit(1);
        }
    })
    .parse(process.argv);

cli
    .command('init')
    .description('初始化spon环境')
    .action(function(){
        spon.request('spon-env:init',{option: '', plugin: 'env',originOptions: ''})
            .then(function(){
                npmlog.info('spon:mobi: ','exec cmd: "spon init" successfully!');
            },spon.fatal);
    });
*/

cli.parse(process.argv);
