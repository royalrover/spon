#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var cli = require('commander');
var utils = require('../lib/utils');
var chalk = require('chalk');
var npmlog = require('npmlog');
var _ = require('lodash');

var log = console.log;

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var showjoyBase = path.join(home,'.spon');
var pluginsBase = path.join(showjoyBase,'plugins');
if(!fs.existsSync(showjoyBase)){
    fs.mkdirSync(showjoyBase);
}
if(!fs.existsSync(pluginsBase)){
    fs.mkdirSync(pluginsBase);
}

var spon = require('../lib/spon-manager')(cli);

cli.parse(process.argv);
