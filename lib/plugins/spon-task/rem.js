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
  var difflib = require('difflib');

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

      // diff算法
      var diff = new difflib.Differ();
      var tokenCurrent = content.split(';'),tokenOrigin = file.contents.toString().split(';');
      var ret = diff.compare(tokenCurrent,tokenOrigin);
      // diff比较结果

      // [ 
      //   '  /* generator by mobi */\n\n\n/* 导入全局方法 */\n@import "../../mixins/mixins.less"',
      //   '  \n\n.spon-test {\n  background: red',
      //   '- \n}\n.abc {\n  width: 20rem',
      //   '?                    ^ ^^^\n',
      //   '+ \n}\n.abc {\n  width: 750px',
      //   '?                    ^^ ^^\n',
      //   '- \n  font-size: 0.8533rem',
      //   '+ \n  font-size: 32px',
      //   '  \n  line-height: 0.4267rem',
      //   '  \n  height: 1.3333rem',
      //   '  \n  border: 1px solid red',
      //   '- \n  margin: 1.3333rem 0.2667rem',
      //   '+ \n  margin: 50px 10px',
      //   '  \n  padding-top: 0.2667rem',
      //   '+ \n  .clearfix()',
      //   '+ \n  .abc()',
      //   '- \n  \n  \n   @color: #eee',
      //   '? ------\n',
      //   '+ \n   @color: #eee',
      //   '   color: @color',
      //   '  \n}\n\n#header {\n  color: (@base-color * 3)',
      //   '  \n  border-left: @the-border',
      //   '  \n  border-right: (@the-border * 2)',
      //   '- \n  width: 20rem',
      //   '+ \n  width: 750px',
      //   '  \n  h1 {\n    font-size: 0.6933rem',
      //   '  \n    font-weight: bold',
      //   '  \n  }\n  p {\n    font-size: 0.32rem',
      //   '  \n    a {\n      text-decoration: none',
      //   '  \n      &:hover {\n        border-width: 1px\n      }\n    }\n  }\n}'
      // ]

      // 针对diff，仅分析“＋”标志位。由于在postcss分析less时，会默认针对less中的mixin函数
      // 进行解析，抛出“unknown word”错误，因此需要修改postcss模块。同时，修改完的postcss会默认
      // 丢弃无法解析（不属于css属性规范）mixin函数，如".clearfix(),.abc"，因此解析后的less文件
      // 没有这些mixin，需要额外添加。
      var postRet = [];
    //  console.log(ret);
      _(ret).forEach(function(v){
        var token = v.slice(2);
        var mixinReg = /\.[A-Za-z]+(\([^\(\)]*\))?/i;

        switch(v[0]){
          case '+':
            // 判断是否mixin，通过“｛”判断是否为选择器还是mixin
            if(token.match(mixinReg) && token.indexOf('{') == -1){
              postRet.push(token);
            }
            break;
          case '?':
            // idle();
            break;
          case '-':
          case ' ':
          default:
            // 处理完成的less中会出现空行，原因是增加了换行符
            // if(v[0] == '-'){
            //   token = token.replace(/\n\s*/gi,function(m,a){
            //     count += 1;
            //     if(count > 1){
            //       return '';
            //     }else{

            //       return m;
            //     }
            //   });
            // }  

            postRet.push(token);
            break;
        }

      });

      file.contents = new Buffer(postRet.join(';'));

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