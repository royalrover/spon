/**
 * @filveoverview: 预处理require函数
 * @author: 欲休
 * @time: 2015-12-14 6:40:40
 */
module.exports = function(content){
  // 替换JS中require为全路径[组/仓库/版本/文件名s]
  var Reg = {
    require: /(\brequire|[^\S]\$\.use)\s*\(\s*['"]([^'"\s]+)['"](\s*[\),])/g,
    cdnModule: /^showjoy\//gi
  };

  var cdnModules = [];
  content.replace(Reg.require, function (all, method, match, postfix) {
    var ret = match;

    // 项目内模块处理
    ret = ret.replace(/\/$/, '/index');
    ret = ret.replace(/\.js$/, '');

    // 判断是否引用cdn模块
    if(Reg.cdnModule.test(match)){
      cdnModules.push(match);
    }

  });
  return cdnModules;
};