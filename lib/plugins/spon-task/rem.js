/**
 * Created by yuxiu on 16/1/26.
 * 更新rem规范，目前针对750设计稿做约定
 */
module.exports = function(args){
  var path = require('path');
  var postcss = require('spon-postcss');
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
      propWhiteList: ['font','font-size','line-height', 'letter-spacing','text-indent',
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
            return toFixed((pixels / opts.rootValue * 2), opts.unitPrecision) + 'rem';
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

      var tokenCurrent = content.split('}'),tokenOrigin = file.contents.toString().split('}');
      var contentCurrent = content,contentOrigin = file.contents.toString();
      var contentCurrentTmp = contentCurrent,contentOriginTmp = contentOrigin;
      var mixinReg = /\.[A-Za-z_-]+(\([^\(\)]*\))?\s*;/i;

      var cur,ret = [];

      if(tokenCurrent.length == tokenOrigin.length){
        tokenCurrent.forEach(function(token,i){
          var tmpCurrent,tmpOrigin;
          if(!tokenOrigin[i].match(mixinReg)){
            ret.push(token);
          }else{
            // 此处，tokenCurrent和tokenOrigin的某一项不同
            tmpCurrent = token.split(';');
            tmpOrigin = tokenOrigin[i].split(';');

            for(var j=0,len=tmpOrigin.length;j<len;j++){
              var item = tmpOrigin[j];

              // 如果当前token没有";",意味着当前选择器只有mixin函数，因此使用原token
              // div{
              //  .loop(5);
              //  .my-optional-style();
              // }
              if(token.indexOf(';') == -1){
                tmpCurrent = tmpOrigin
              }else if((item + ';').match(mixinReg) && !item.match(/@extend/i)){
                cur = j;
                tmpCurrent.splice(j,0,item);
                // if((tmpCurrent[j] && tmpCurrent[j].match(lineReg)) || !tmpCurrent[j]) {
                //   tmpCurrent[j] = item;
                // }else{
                //   tmpCurrent.splice(j,0,item);
                // }
              }
            }

            ret.push(tmpCurrent.join(';'));
          }
        });
      }

      // mixin删除后，出现空白行。
      ret.forEach(function(it,i){
        var lineReg = /(\n+\s*){1,}\n(\s*)/gi;
        console.log('index: '+i);
        it = it.replace(lineReg,function(m,$1,$2){
          return '\n' + $2;
        });
        ret[i] = it;
      });

      file.contents = new Buffer(ret.join('}'));

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