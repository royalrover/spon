var fs = require('fs');
var path = require('path');

exports.preHandle = function(cache,template,location){
  var loc = path.join(location,'upgrade.tmpl');
  cache._shopUpgradeRender = template.compile(fs.readFileSync(loc,'utf8'));
};

module.hotload = 1;