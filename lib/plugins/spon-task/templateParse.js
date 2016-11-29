/**
 * Created by yuxiu on 16/1/25.
 * template解析
 */
var C_KEY = 'showjoyf2espon';
module.exports = function(utils){
  var gulp = require('gulp');
  var currPath = process.cwd();
  gulp.task('parse', function() {
    var log = require('npmlog');
    var path = require('path');
    var command = utils.getNPMGlobalPath('aes-256-cbc',C_KEY);
    command = command.replace(/\n+/g,'');
    command = path.join(command,'spon/bin/tmpl-parser.js');
    log.info('spon:','搜寻并解析模版 ...');
    require('child_process').execSync('node ' + command + ' '+ path.join(currPath,'src/') + ' --output '+ path.join(currPath,'src/') + ' --no-watch --no-cache');

    // 删除tmpl-parser产生的template.js文件
    var templateFile = path.join(currPath,'src/template.js');
    if(require('fs').existsSync(templateFile)){
      require('child_process').execSync('rm ' + templateFile);
    }

    log.info('spon:','模版解析完毕！');
  });
};

