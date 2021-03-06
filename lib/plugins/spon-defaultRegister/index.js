/**
 * Created by yuxiu on 16/2/2.
 * spon默认注册机，默认 spon-env spon-mobi spon-pc spon-plugin spon-task
 */
var path = require('path');
var fs = require('fs');
var request = require('request');
var appInfo = require(path.join('../../..','package.json'));

var chalk = require('chalk');
var npmlog = require('npmlog');

var log = console.log;
var cyanLog = function(msg){
  console.log(chalk.italic.cyan(msg));
};

module.exports = function(spon){

  /**
   * 后台只针对code非零且有错误堆栈信息下处理
   * @param code 错误码，非零
   * @param error Error示例
   * @param msg 错误说明
   */
  process._exit = function(code,error,msg){
    if(!error){
      npmlog.error('spon:','should provide Error when exit!');
      process.exit(code);
    }

    if(!(error instanceof Error) && typeof error == 'string' ){
      error = new Error(error);
    }

    var formData = {
      stack: error.stack,
      code: code,
      msg: msg ? msg : ''
    };

    request.post({
      url:'http://mip.showjoy.net/spon/exit',
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        return npmlog.error('spon:', 'spon is locating off-line state!');
      }
      process.exit(code);
    });

  };


  spon.cli
    // .allowUnknownOption()//不报错误
    .version(appInfo.version)
    .usage('欢迎使用showjoy前端解决方案－spon <cmd> [subcmd]')
    .parse(process.argv);

  spon.cli
    .command('init')
    .description('初始化spon环境')
    .action(function(){
      spon.request('spon-env:init',{option: '', plugin: 'env',originOptions: ''})
        .then(function(){
          npmlog.info('spon:','初始化完毕！');
        },spon.fatal);
    });

  spon.cli
    .command('cmt')
    .alias('commit')
    .description('包装git commit命令')
    .action(function(){
      var bootstrap = require('my-commitizen/dist/cli/git-cz').bootstrap;
      bootstrap({
        //cliPath: path.join(__dirname, '../node_modules/commitizen')'',
        config: {
          "path": "sj-conventional-changelog"
        }
      });
    });

  spon.cli
    .command('upgrade')
    .description('更新组件配置文件')
    .action(function(){
      spon.request('spon-mobi:upgrade',{option: '', plugin: 'upgrade',originOptions: ''})
        .then(function(){
          npmlog.info('spon:','更新配置文件完毕！');
        },spon.fatal);
    });

  spon.cli
    .command('pc [cmd]')
    .description('传统前端开发方案')
    .option("-o, --online [type]", "发布至线上环境")
    .option("-c, --component [type]", "初始化模块工程")
    .option("--page [type]", "初始化页面工程,默认操作")
    .option("-p,--port [type]", "设置本地服务器端口")
    .option("-l,--livereload [type]","设置reload端口")
    .option("-n,--name [type]","针对具体的页面使用命令操作")
    .action(function(cmd,options){
      // 由于pc端和mobile端的开发规范相同，因此大多数情况下
      // 命令可以共用
      var utils = require('../../utils');
      var op;
      switch(cmd){
        case 'init':
          var op = options.page ? 'page' :
            options.component ? 'component' :
              'page';
          if(options.component){
            spon.request('spon-mobi:' + cmd,{option: op, plugin: 'pc',originOptions: options,spon: spon,utils: utils})
              .then(function(){
              //  npmlog.info('spon:pc:','exec cmd: spon pc '+ cmd + ' successfully');
              },spon.fatal);
          }else{
            spon.request('spon-pc:' + cmd,{option: op, plugin: 'pc',originOptions: options})
              .then(function(){
              //  npmlog.info('spon:pc: ','exec cmd: spon pc '+ cmd);
              },spon.fatal);
          }

          break;
        // pc端模块复用mobi插件
        case 'add':
        case 'build':
        case 'dev':
        case 'upgrade':
        case 'publish':
          if(cmd == 'add'){
            op = 'page';
          }else if(cmd == 'publish'){
            op = options.online ? 'online' : 'dev';
          }
          spon.request('spon-mobi:' + cmd,{option: op, plugin: 'pc',originOptions: options,spon: spon,utils: utils})
            .then(function(){
            //  npmlog.info('spon:pc:','exec cmd: spon pc '+ cmd + ' successfully');
            },spon.fatal);
          break;
        /*// 针对未拆分的portal工程，做简单的发布使用
         case 'publish':
         op = options.online ? 'online' : 'dev';
         // 执行相关请求
         spon.request('spon-pc:' + cmd,{option: op, plugin: 'pc',originOptions: options})
         .then(function(){
         npmlog.info('spon:pc: ','exec cmd: spon pc '+ cmd);
         },spon.fatal);
         break;
         */
        default:
          break;
      }


    });

  spon.cli
    .command('mobi [cmd]')
    .alias('mb')
    .description('移动前端开发方案－mobi')
    .option("-r, --React [type]", "初始化R工程")
    .option("-c, --component [type]", "初始化模块工程")
    .option("-d, --dependences [type]","添加模块依赖")
    .option("--joyui [type]","创建JOYUI模块")
    .option("--mp [type]", "初始化MidProxy工程")
    .option("--page [type]", "初始化页面工程,默认操作")
    .option("-p,--port [type]", "设置本地服务器端口")
    .option("-l,--livereload [type]","设置reload端口")
    .option("-o,--online","发布至线上环境")
    .option("-n,--name [type]","针对具体的页面使用命令操作")
    .option("-b,--blacklist [type]","rem规范的黑名单机制")
    .option("-w,--whitelist [type]","rem规范的白名单机制")
    .action(function(cmd, options){
      if(!cmd){
        log();
        cyanLog('          ___  ___   _____   _____   _');
        cyanLog('         /   |/   | /  _  \\ |  _  \\ | |');
        cyanLog('        / /|   /| | | | | | | |_| | | |');
        cyanLog('       / / |__/ | | | | | | |  _  { | |');
        cyanLog('      / /       | | | |_| | | |_| | | |');
        cyanLog('     /_/        |_| \\_____/ |_____/ |_|');
        log();

        cyanLog('mobi usage: spon mobi/mb init/add/dev/build/publish');
        log();
        log();
        log();
        cyanLog('           spon mobi init： 默认初始化页面工程');
        log();
        cyanLog('           spon mobi init -c： 初始化模块工程');
        log();
        cyanLog('           spon mobi init -r： 初始化React工程');
        log();
        cyanLog('           spon mobi init --joyui： 创建JOYUI模块');
        log();
        cyanLog('           spon mobi init --mp： 初始化MidProxy工程');
        log();
        cyanLog('           spon mobi add： 在当前mobi工程下添加一个或多个page工程');
        log();
        cyanLog('           spon mobi build： 本地构建');
        log();
        cyanLog('           spon mobi join： 解析使用JOYUI模块源码搭建的页面');
        log();
        cyanLog('           spon mobi dev： 调试模式，默认开启本地服务器，端口为8009');
        log();
        cyanLog('           spon mobi dev -p 8080： 调试模式，开启本地服务器，端口为8080');
        log();
        cyanLog('           spon mobi publish： 提交至dev分支，并同步到测试环境（对于模块工程，并不会发布至线上cdn环境和测试环境，其工程仅仅存在于gitlab仓库中）');
        log();
        cyanLog('           spon mobi publish -o： 提交至master分支，并同步到线上环境（仅对页面工程有效）');
        log();
        log();
        return;
      }
      var op;
      var utils = require('../../utils');
      switch(cmd){
        case 'init':
        case 'add':
          op = options.page ? 'page' :
            options.component || options.dependences ? 'component' :
              options.joyui ? 'joyui' :
                options.mp ? 'midproxy' :
                  options.React ? 'React' :
                  'page';
          break;
        case 'build':
          op = 'build';
          break;
        case 'join':
          op = 'join';
          break;
        // 针对JOYUI模块做打包，在页面搭建系统渲染
        case 'pack':
          op = 'pack';
          break;
        case 'publish':
          op = options.online ? 'online' : 'dev';
          break;
        // TODO

        default:
          break;
      }

      // 执行相关请求
      spon.request('spon-mobi:' + cmd,{option: op, plugin: 'mobi',originOptions: options,spon: spon,utils: utils})
        .then(function(){
        //  npmlog.info('spon:mobi:','exec cmd: spon mobi '+ cmd + ' successfully');
        },spon.fatal);

    })
    .on('--help',function(){

      log();
      cyanLog('          ___  ___   _____   _____   _');
      cyanLog('         /   |/   | /  _  \\ |  _  \\ | |');
      cyanLog('        / /|   /| | | | | | | |_| | | |');
      cyanLog('       / / |__/ | | | | | | |  _  { | |');
      cyanLog('      / /       | | | |_| | | |_| | | |');
      cyanLog('     /_/        |_| \\_____/ |_____/ |_|');
      log();
    });

//默认不传参数输出help
  if (!process.argv[2]) {
    log();
    cyanLog('     _____   _____   _____   __   _');
    cyanLog('    /  ___/ |  _  \\ /  _  \\ |  \\ | |');
    cyanLog('    | |___  | |_| | | | | | |   \\| |');
    cyanLog('    \\___  \\ |  ___/ | | | | | |\\   |');
    cyanLog('     ___| | | |     | |_| | | | \\  |');
    cyanLog('    /_____/ |_|     \\_____/ |_|  \\_|');
    log();
    spon.cli.help();
  }
};
