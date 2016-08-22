var fs = require('fs');
var path = require('path');

exports.preHandle = function(template,location){
  var loc = path.join(location,'demo.tmpl');

  // 参数设置为KV键值对，可以设置为多个
  setCache({
    f2e_shopDemoRender: template.compile(fs.readFileSync(loc,'utf8'))
  })
};

// 模块热加载，必须
module.hotload = 1;