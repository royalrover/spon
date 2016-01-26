/**
 * Created by yuxiu on 16/1/26.
 * 更新rem规范，目前针对750设计稿做约定
 */
/**
 * Created by yuxiu on 16/1/25.
 * 监听文件，本地调试服务器，livereload
 */
module.exports = function(args){
  var path = require('path');
  var postcss = require('postcss');
  var gulp = require('gulp');
  var gutil = require('gulp-util');
  var through = require('through2');
  var _ = require('lodash');

  var generatorPath = path.resolve(__dirname,'..','..','generator-spon/generators/confirm-rem/index');
  var sponGenerator = require(generatorPath);

  var currPath = process.cwd();
  var SRC_BASE = path.join(process.cwd(),'src');
  var px2rem;
  var updateRem = function(){

    var defaults = {
      rootValue: 75,
      unitPrecision: 4,
      propWhiteList: ['line-height', 'letter-spacing','text-indent',
        'word-spacing','width','height','max-height','max-width','min-height','min-width',
        'left','top','right','bottom','margin','margin-left',
        'margin-top','margin-right','margin-bottom','padding','padding-left',
        'padding-top','padding-right','padding-bottom','background','background-position',
        'vertical-align'],
      minPixelValue: 2
    };
    var pxRegex = /"[^"]+"|'[^']+'|url\([^\)]+\)|(\d*\.?\d+)px/ig;
    // 获取参数传递的黑名单列表
    var blacklist = typeof args.b == 'string' && args.b.split(' ');
    var whitelist = typeof args.w == 'string' && args.w.split(' ');

    px2rem = postcss.plugin('postcss-px2rem', function(){

      function toFixed(number, precision) {
        var multiplier = Math.pow(10, precision + 1),
          wholeNumber = Math.floor(number * multiplier);
        return Math.round(wholeNumber / 10) * 10 / multiplier;
      }

      function declarationExists(decls, prop, value) {
        return decls.some(function (decl) {
          return (decl.prop === prop && decl.value === value);
        });
      }

      var opts = _.extend({}, defaults);

      return function (css) {

        css.walkDecls(function (decl, i) {
          // 黑名单过滤
          if(blacklist.length && blacklist.indexOf(decl.prop) != -1) return;

          if (decl.value.indexOf('px') === -1) return;

          opts.propWhiteList = opts.propWhiteList.concat(whitelist);
          if (opts.propWhiteList.length && opts.propWhiteList.indexOf(decl.prop) === -1) return;

          var value = decl.value.replace(pxRegex, function(m,num){
              if (!num) return m;
              var pixels = parseFloat(num);
              if (pixels < opts.minPixelValue) return m;
              return toFixed((pixels / opts.rootValue), opts.unitPrecision) + 'rem';
          });

          if (declarationExists(decl.parent, decl.prop, value)) return;

          decl.value = value;
        });

      };
    });

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
      var content = postcss(px2rem({

      })).process(file.contents.toString()).css;
      file.contents = new Buffer(content);

      // 下面这两句基本是标配啦，可以参考下 through2 的API
      this.push(file);

      cb();
    });
  };

  var generator;
  generator = new sponGenerator([], {
    resolved: generatorPath,
    env: {
      cwd: process.cwd()
    },
    _updateRem : updateRem,
    SRC_BASE: SRC_BASE,
    _currPath: currPath,
    _name: args.name
  });
  generator.run();

};