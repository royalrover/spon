#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var cli = require('commander');
var utils = require('../lib/utils');

// 设置NODE_PATH
if(!process.env.NODE_PATH) {
    process.env.NODE_PATH = path.join(utils.getNPMGlobalPath());
}else{
    process.env.NODE_PATH += ';' + path.join(utils.getNPMGlobalPath());
}
// 重新设置全局的依赖加载路径
module.constructor._initPaths();

var spon = require('../lib/spon-manager')(cli);

cli.parse(process.argv);
