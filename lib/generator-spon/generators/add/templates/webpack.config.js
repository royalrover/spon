var path = require('path');
var webpack = require('webpack');
//var HtmlwebpackPlugin = require('html-webpack-plugin');
//定义了一些文件夹的路径
var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'src/page');
var VENDER_PATH = path.resolve(ROOT_PATH, 'src/vendor');
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');

module.exports = {
  //项目的文件夹 可以直接用文件夹名称 默认会找index.js 也可以确定是哪个文件名字
  entry: {
 //   jQuery: VENDER_PATH + '/jQuery.js',
    hello: APP_PATH + '/hello.js',
 //   Zepto: VENDER_PATH + '/Zepto.js'
    vendor: VENDER_PATH + '/**'
  },
  //输出的文件名 合并以后的js会命名为bundle.js
  output: {
    path: BUILD_PATH,
    filename: '[id].js'
  },
  //添加我们的插件 会自动生成一个html文件
  plugins: [

  //这个使用uglifyJs压缩你的js代码
  new webpack.optimize.UglifyJsPlugin({minimize: true}),
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
  devtool: 'eval-source-map'
};