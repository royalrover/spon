/**
 * Created by yuxiu on 16/9/7.
 * 打包JOYUI模块，用于浏览器端渲染
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
var template = require('art-template');
var utils = require('../../../utils/index');

/**
 * @param webpackConfig 构建配置信息
 * @param tokens JOYUI组件名称及配置信息构成的数组
 * @param argName 需要单独构建的项目名称
 */
module.exports = function(webpackConfig){
  var entryPath;
  gulp.task('pack',function () {
    try{
      entryPath = path.join(process.cwd(),'index.js');
      webpackConfig.entry['dist'] = entryPath;
    }catch(e){
      log.error('spon: ','构建项目失败，请检查主目录 src/pages/ 下是否存在非期望的文件（目录），如隐藏文件.DS_Store');
      log.error('spon: ',e.message);
      process._exit(1,e);
      return;
    }

    return gulp.src(entryPath)
      .pipe(webpack(webpackConfig,myWebpack)) //此处添加myWebpack对象，调用我们修改过的webpack库
      .pipe(gulp.dest('build/'));
  });

  gulp.task('generate-template',['pack'],function(){
    var currentPath = process.cwd();
    var dataFilePath = path.join(currentPath,'data.json');
    var packageJson = require(path.join(currentPath,'package.json'));
    if(!fs.existsSync(dataFilePath)){
      log.error('spon: 当前' + packageJson.name + '模块没有提供data.json文件！');
      process._exit(1,'spon: 当前' + packageJson.name + '模块没有提供data.json文件！');
      return;
    }
    var data = require(dataFilePath);
    var sp = packageJson.name.split('/');
    sp.shift();
    var templateName = sp.join('/') + '.tmpl';
    var templatePath = path.join(currentPath,templateName);
    if(!fs.existsSync(templatePath)){
      log.error('spon: 当前' + packageJson.name + '模块没有提供' + templateName + '文件！');
      process._exit(1,'spon: 当前' + packageJson.name + '模块没有提供' + templateName + '文件！');
      return;
    }

    function dataSource(){
      return through2.obj(function(file, encoding, done){
        try{
          var pageContent = fs.readFileSync(path.join(require.resolve('./joyui.html')),'utf8');
          var content = template.render(file.contents.toString())(data);
          file.contents = new Buffer(content);

          pageContent = pageContent.replace('{{stub}}',content);
          // 创建调试文件
          fs.writeFile(path.join(process.cwd(),'build/dev.html'),pageContent,function(err){
            if(err){
              log.error('spon: ','无法创建测试页面！');
              process._exit(1,err);
              return;
            }
          });
        }catch(e){
          log.error('spon: 渲染JOYUI模块失败，请检查模板和数据是否对应！');
          process._exit(1,e,'through2流错误');
          return;
        }

        this.push(file);
        done();
      });
    }

    var dest = path.join('build');

    return gulp.src(templatePath)
      .pipe(dataSource())
      .pipe(gulp.dest(dest));
  });

};