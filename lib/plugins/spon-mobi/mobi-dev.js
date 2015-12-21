var shelljs = require('shelljs');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var npmlog = require('npmlog');
var error = function(msg){
  console.log(chalk.bold.red(msg));
};


module.exports = {
  /**
   * 针对page工程，提供http服务器调试
   * @param options [type] {type: 'RN|component|page'}
   */
  generate: function(options){
    var self = this;
    options = Object.create(options);
    var originOptions = options.originOptions;
    self._generatePage(originOptions);

  },
  _generatePage: function(originOptions){
    var sponConfig = require(path.join(process.cwd(),'spon.json'));
    if(originOptions.port){
      sponConfig.options.port = +originOptions.port;
    }
    if(originOptions.livereload){
      sponConfig.options.livereloadPort = +originOptions.livereload;
    }
    fs.writeFileSync('spon.json',JSON.stringify(sponConfig));

    //  复制gulpfile
    var silentState = shelljs.config.silent; // save old silent state
    shelljs.config.silent = true;
    var gulpfilePath = path.resolve(__dirname,'..','..','generator-spon/generators/app/templates/gulpfile.js');
    shelljs.cp(gulpfilePath,process.cwd());
    shelljs.config.silent = silentState;

    if(shelljs.exec('gulp s').code !== 0){
      npmlog.error('spon:mobi: ','dev encounter an error!\n see in the plugin of spon-mobi!!');
      return 1;
    }
    shelljs.rm(path.join(process.cwd(),'gulpfile.js'));
  }
};