#!/usr/bin/env node
'use strict';

var TmodJS = require('../lib/tmpl-parser/src/tmod.js');

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var os = require('os');

var options = {
    type: 'commonjs'
};

var base;
var value;
var isWatch = true;
var args = process.argv.slice(2);


if (args[0] && /^[^-]|\//.test(args[0])) {
    base = args.shift();
}


while (args.length > 0) {
    value = args.shift();
    switch (value) {

        // 监控修改
        case '-w':
        case '--watch':
            isWatch = true;
            break;

        case '--no-watch':
            isWatch = false;
            break;

        // 调试模式
        case '-d':
        case '--debug':
            options.debug = true;
            break;

        case '--no-debug':
            options.debug = false;
            break;

        // 对输出值编码
        case '--escape':
            options.escape = true;
            break;

        case '--no-escape':
            options.escape = false;
            break;

        // 打包合并
        case '--combo':
            options.combo = true;
            break;

        case '--no-combo':
            options.combo = false;
            break;

        // 压缩代码
        case '--minify':
            options.minify = true;
            break;

        case '--no-minify':
            options.minify = false;
            break;

        // 使用缓存
        case '--cache':
            options.cache = true;
            break;
        case '--no-cache':
            options.cache = false;
            break;

        // 输出目录
        case '--output':
            options.output = args.shift();
            break;

        // 模板编码
        case '--charset':
            options.charset = args.shift();
            break;

         // 模板语法
        case '--syntax':
            options.syntax = args.shift();
            break;

        // 辅助方法路径
        case '--helpers':
            options.helpers = args.shift();
            break;

        default:

            if (!base) {
                base = value;
            }
    }
}


if (!base) {
    base = './';
}


if (!fs.existsSync(base)) {
    process.stdout.write('Error: directory does not exist\n');
    process.exit(1);
}


var tmodjs = new TmodJS(base, options);


tmodjs.on('compileError', function (data) {
    if (!isWatch) {
        process.exit(1);
    }
});


tmodjs.saveConfig();



tmodjs.compile();

if (isWatch) {
    tmodjs.watch();
}
    
