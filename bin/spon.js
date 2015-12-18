#!/usr/bin/env node 
var cli = require('commander');
var appInfo = require('../package.json');
var spon = require('../lib/spon-manager');
var chalk = require('chalk');

var log = console.log;
var cyanLog = function(msg){
    console.log(chalk.italic.cyan(msg));
};

cli
    // .allowUnknownOption()//不报错误
    .version(appInfo.version)
    .usage('欢迎使用showjoy前端解决方案－spon [options] <package>')
    .parse(process.argv);

/*cli
  .description('mobi 命令集合')
  .action(function(cmd) {
      console.log(cmd);
  });*/

cli
  .command('init')
  .description('初始化spon环境')
  .action(function(){
    spon.request('spon-env:init',{option: '', plugin: 'env',originOptions: ''})
      .then(function(){
        cyanLog('exec cmd: spon init ');
        cyanLog('ok!');
      },spon.fatal);
  });


cli
  .command('mobi [cmd]')
  .alias('mb')
  .description('移动前端开发方案－mobi')
  .option("-r, --ReactNative [type]", "初始化RN目录")
  .option("-c, --component [type]", "初始化模块")
  .option("--page [type]", "初始化页面目录,默认操作")
  .option("-p,--port [type]", "设置端口")
  .option("-l,--livereload [type]","设置reload端口")
  .option("-o,--online","发布至线上环境")
  .action(function(cmd, options){
    if(!cmd){
      log();
      cyanLog('mobi usage:spon mobi init/add/dev/build/publish');
      log();
      return;
    }
    var op;
    switch(cmd){
      case 'init':
      case 'add':
          op = options.page ? 'page' :
            options.component ? 'component' :
              options.ReactNative ? 'ReactNative' :
                'page';
          break;
      case 'build':
        op = 'build';
        break;
      case 'publish':
        op = options.online ? 'online' : 'dev';
        break;
        // TODO

      default:
        break;
    }


    // 执行相关请求
    spon.request('spon-mobi:' + cmd,{option: op, plugin: 'mobi',originOptions: options})
      .then(function(){
          log('exec cmd: spon mobi '+ cmd);
      },spon.fatal);

  }).on('--help', function() {
      log();
      log('    rs  预览简历');
      log();
      log('    -b, --basicinfo 基本信息');
      for (var a in basicinfo.data) {
          log("       "+ a + ': ' + basicinfo.data[a].info)
      };
      log('    -e, --education 教育经历');
      log('    -i, --itskill 教育经历');
      // log('    $ wcj resume ss');
      log();
  });

//默认不传参数输出help
if (!process.argv[2]) {
    cli.help();
    console.log();
}

cli.parse(process.argv);
