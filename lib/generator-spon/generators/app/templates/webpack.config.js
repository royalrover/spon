var path = require('path');
var exec = require('child_process').execSync;

//定义了一些文件夹的路径
var ROOT_PATH = path.resolve(process.cwd());
var APP_PATH = path.resolve(ROOT_PATH, 'src/pages');
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var showjoyBase = path.join(home,'.spon');
var modulesBase = path.join(showjoyBase,'mobi');
var reletiveBase = path.join(ROOT_PATH, 'src/');

var webpack;
try{
  webpack = require('my-webpack');
}catch(e){
  webpack = require(path.join(exec('npm root -g',{encoding: 'utf8'}).replace(/[\r\n]{1,}/g,''),'spon/node_modules/my-webpack'));
}


module.exports = {
  __APP_PATH : APP_PATH,
  //项目的文件夹 可以直接用文件夹名称 默认会找index.js 也可以确定是哪个文件名字
  entry: {
    //   jQuery: VENDER_PATH + '/jQuery.js',
    //   hello: APP_PATH + '/hello.js',
    //   Zepto: VENDER_PATH + '/Zepto.js'
    //      vendor: VENDER_PATH + '/**'
  },
  //输出的文件名 合并以后的js会命名为bundle.js
  output: {
    path: BUILD_PATH,
    filename: '[name].min.js'
  },
  //添加我们的插件 会自动生成一个html文件
  plugins: [

    //这个使用uglifyJs压缩你的js代码
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false
      },
      comments: false,
      mangle: {
        except: ['$', 'exports', 'require']
      }
    }),
    //把入口文件里面的数组打包成verdors.js
    //new webpack.optimize.CommonsChunkPlugin('vendor', 'vendors.js'),
    //provide $, jQuery and window.jQuery to every script
    //
    //new webpack.ProvidePlugin({
    //  //$: "jQuery",
    //  //jQuery: "jQuery",
    //  //"window.jQuery": "jQuery"
    //  //$: "jquery",
    //  //jQuery: "jquery",
    //  //"window.jQuery": "jquery"
    //  $: 'Zepto'
    //})
  ],
  devtool: '#source-map',
  resolve: {
    root: [process.cacheDir,modulesBase,reletiveBase],
    extentions: ['', 'js', 'tmpl'],
    alias: {}
  },
  // 配置loader的目录
  resolveLoader: {
    root: process.cacheDir
  },
  module: {
    loaders: [
      {test: /\.css$/,    loader: 'style!css'},
      {test: /\.less$/,   loader: 'style!css!less'},
      {test: /\.tmpl$/,   loader: 'joyuiTmpl'},
      {test: /joyui\/[^\/]+?\/\d+\.\d+\.\d+/,   loader: 'joyui'}
    ]
  }
};
