/**
 * @fileoverview 工具模块
 * @author 欲休
 * @date 2015-12-14 6:12:12
 */
var info = require('./info');
var parseRequire = require('./require');
var system = require('./system');

var utils = {};
utils.info = info;
utils.parseRequire = parseRequire;
utils.system = system;

module.exports = utils;
