/**
 * Created by yuxiu on 16/8/19.
 * 解析JOYUI源码搭建入口
 */
var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var del = require('del');
var gulp = require('gulp');
var webpack = require('gulpp-webpack');
var myWebpack = require('my-webpack');
var rename = require('gulp-rename');
var notify = require('gulp-notify');
var log = require('npmlog');
var through2 = require('through2');
var _ = require('lodash');
var utils = require('../../../utils/index');

var treeSearch = {
  makeTree: function(strKeys) {
    "use strict";
    var tblCur = {},
      tblRoot,
      key,
      str_key,
      Length,
      j,
      i
      ;
    tblRoot = tblCur;
    for ( j = strKeys.length - 1; j >= 0; j -= 1) {
      str_key = strKeys[j];
      Length = str_key.length;
      for ( i = 0; i < Length; i += 1) {
        key = str_key.charAt(i);
        if (tblCur.hasOwnProperty(key)) { //生成子节点
          tblCur = tblCur[key];
        } else {
          tblCur = tblCur[key] = {};
        }
      }
      tblCur.end = true; //最后一个关键字没有分割符
      tblCur = tblRoot;
    }
    return tblRoot;
  },
  search: function(content, tblRoot) {
    "use strict";
    var tblCur,
      p_star = 0,
      n = content.length,
      p_end,
      match,  //是否找到匹配
      match_key,
      match_str,
      arrMatch = [],  //存储结果
      arrLength = 0   //arrMatch的长度索引
      ;

    while (p_star < n) {
      tblCur = tblRoot; //回溯至根部
      p_end = p_star;
      match_str = "";
      match = false;
      do {
        match_key = content.charAt(p_end);
        if (!(tblCur = tblCur[match_key])) { //本次匹配结束
          p_star += 1;
          break;
        }else{
          match_str += match_key;
        }
        p_end += 1;
        if (tblCur.end === true) //是否匹配到尾部  //找到匹配关键字
        {
          match = true;
        }
      } while (true);

      if (match === true) { //最大匹配
        arrMatch[arrLength] = { //增强可读性
          key: match_str,
          begin: p_star - 1,
          end: p_end
        };
        arrLength += 1;
        p_star = p_end;
      }
    }
    return arrMatch;
  }
};

/**
 * @param webpackConfig 构建配置信息
 * @param tokens JOYUI组件名称及配置信息构成的数组
 * @param argName 需要单独构建的项目名称
 */
module.exports = function(webpackConfig,tokens, argName){
  var currPath = process.cwd();
  // 存储js文件内容
  var entryContent;
  var entryPath;
  var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var mobiBase = path.join(home,'.spon/mobi/joyui');

  gulp.task('join',function (cb) {

    if(!argName){
      log.error('spon: 使用JOYUI模式，需指定明确的页面名称，如“spon mb join -n @name”');
      process._exit(1,'spon: 使用JOYUI模式，需指定明确的页面名称，如“spon mb join -n @name”');
      return;
    }
    var srcPath = 'src/pages/' + argName;
    var HEADER = "/*** ADDED BY SPON ***/\n";
    var adds = [];
    try{
      entryPath = path.join(webpackConfig['__APP_PATH'],'/'+argName,argName + '.js');
      entryContent = fs.readFileSync(entryPath,'utf8');
      // 修改入口js文件，添加相应JOYUI模块的引用
      _.keys(tokens).forEach(function(k){
        if(k !== 'uis') return;
        var resources = tokens[k];
        resources.forEach(function(resource){
          if(resource.name){
            var value = 'require(' + JSON.stringify(resource.name) + ');';
            adds.push(value);

            if(resource.slabs && 'length' in resource.slabs){
              resource.slabs.forEach(function(slab){
                var value;
                if(typeof slab == 'object'){
                  value = "require(" + JSON.stringify(slab.name) + ");";
                }else{
                  value = "require(" + JSON.stringify(slab) + ");";
                }
                adds.push(value);
              });
            }
          }
        });
      });

      var prefix = HEADER + adds.join('\n') + '\n\n';
      var root = treeSearch.makeTree(adds);
      var searchResult = treeSearch.search(entryContent,root);

      // 已添加前缀的入口文件不用再次添加
      if(!searchResult || !searchResult.length){
        // 采用buffer的方式完成文件读写，由于当前计算机内存足以容纳单个js文件的内容因此直接访问内存的方式实现简单
        fs.writeFileSync(entryPath,prefix + entryContent);
      }

      webpackConfig.entry[path.join(srcPath,argName)] = entryPath;

      tokens.refs && tokens.refs.forEach(function(ref){
        webpackConfig.entry[path.join(srcPath,ref.path)] = path.join(mobiBase,ref.path);
      });
    }catch(e){
      // 保证js文件不变
      fs.writeFileSync(entryPath,entryContent);
      del.sync([path.join(mobiBase,'joyui')],{
        force: true
      });
      log.error('spon: ','构建项目失败，请检查主目录 src/pages/ 下是否存在非期望的文件（目录），如隐藏文件.DS_Store');
      log.error('spon: ',e.message);
      process._exit(1,e,'join/index');
      return;
    }

    process.join = {
      entryPath: entryPath,
      entryContent: entryContent
    };

    return gulp.src(srcPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(gulp.dest('build/'));

  });

  gulp.task('generate-html',['join'],function(cb){
    if(!argName){
      log.error('spon: 使用JOYUI模式，需指定明确的页面名称，如“spon mb join -n @name”');
      process._exit(1,'spon: 使用JOYUI模式，需指定明确的页面名称，如“spon mb join -n @name”');
      return;
    }

    var srcPath = path.join('src/pages/',argName,argName + '.html');

    function dataSource(){
      return through2.obj(function(file, encoding, done){
        var outHtml = utils.template(String(file.contents),tokens);
        file.contents = new Buffer(outHtml);
        // 删除join任务生成的require文件
        del.sync([path.join('build/src/pages/' + argName,'joyui')],{
          force: true
        });
        this.push(file);
        done();
      });
    }

    var dest = path.join('build','src/pages',argName);

    return gulp.src(srcPath)
      .pipe(dataSource())
      .pipe(gulp.dest(dest));
  });
};