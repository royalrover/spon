//  模块外面不用包一层define，dev和build时工具会自动加上，遵循CommonJS规范，像node一样写就可以了，如下

'use strict';

require('./index.css');

// 支持在项目文件中使用基于src根目录下的绝对路径
// var Common = require('common/index');
// var detail = require('p/detail/index');
// 使用 tbc 组件
// var slider = require('tbc/km-slider');
// var mtop = require('mtb/lib-mtop');

function Index() {
	// console.log('test');
}

// $.extend(Index.prototype, Common.prototype, init: function() {

// });

module.exports = Index;


