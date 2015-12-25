//  模块外面不用包一层define，dev和build时工具会自动加上，遵循CommonJS规范，像node一样写就可以了，如下

'use strict';


// 支持在项目文件中使用基于src根目录下的绝对路径
// var Common = require('components/abc/abc');
// 使用 fecomponent 组件
// var say = require('fecomponent/mobi-say');

function Index() {
  // console.log('test');
}

// $.extend(Index.prototype, Common.prototype, init: function() {

// });

module.exports = Index;


