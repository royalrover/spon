/**
 * Created by yuxiu on 16/1/26.
 * 更新rem规范，目前针对750设计稿做约定
 */
/**
 * Created by yuxiu on 16/1/25.
 * 监听文件，本地调试服务器，livereload
 */
module.exports = function(){
  var path = require('path');
  var gulp = require('gulp');
  var gutil = require('gulp-util');
  var through = require('through2');

  var currPath = process.cwd();
  var SRC_BASE = path.join(process.cwd(),'src');

  var updateRem = function(options){
    function updateRemFn(content) {

      return content.replace(/([\:\s]+)(\d*\.?\d*)rem([;\s\\n\\r]+)/ig, function(match, match1, match2, match3) {
        var number = match2;
        var newNum = number / 10;
        console.log(number + ' --> ' + newNum);
        return match1 + newNum + 'rem' + match3;
      });

    }

    return through.obj(function (file, enc, cb) {
      // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
      if (file.isNull()) {
        this.push(file);
        return cb();
      }

      // 插件不支持对 Stream 对直接操作，跑出异常
      if (file.isStream()) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
        return cb();
      }

      // 将文件内容转成字符串，并调用 preprocess 组件进行预处理
      // 然后将处理后的字符串，再转成Buffer形式
      var content = updateRemFn(file.contents.toString());
      file.contents = new Buffer(content);

      // 下面这两句基本是标配啦，可以参考下 through2 的API
      this.push(file);

      cb();
    });
  };

  gulp.task('updaterem', function() {
    return gulp.src(path.join(currPath,'/src/pages/**/*.less'), {
      cwd: SRC_BASE,
      base: SRC_BASE
    }).pipe(updateRem())
      .pipe(gulp.dest(SRC_BASE));
  });
};