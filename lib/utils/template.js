'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');
var log = require('npmlog');

var keywords = ['require','use','stub']
  , borderReg = /\{\{\s*(([^\{\}\s]+)\s*\(\s*(?:(['"])([^'"]+)\3)(?:\,\s*[^)]+)?\))\s*\}\}/g
  , joyuiReg = /^joyui\/[^\/\s]+\/\d+\.\d+\.\d+$/;

exports.parseEntrance = function(content,utils){

  // 保存JOYUI模块
  var uis = [];
  // 保存文件引用
  var refs = [];
  // 占位符
  var placeholders = [];

  var use = function(joyui,data){
    var options = data && data.options || {
        useTemplate: true
      };

    uis.push({
      name: joyui,
      options: options,
      data: data && data.$data
    });
  };

  try{
    content.replace(borderReg,function(str,fn,action,quotation,joyui,data){
      if(keywords.indexOf(action) == -1){
        var e = new Error('the method is now allowed!');
        log.error('spon:util:template: ',e);
        process.exit(1);
      }

      // TODO: 模板解析，由于远程引用模板或文件，因此“解析”更像是“spon mb build”，首先fetch操作，接着
      // TODO: 判断模块或文件是否需要渲染（根据是否传入$data），最后替换占位符
      switch(action){
        case 'use':
          if(!joyuiReg.test(joyui)){
            var e = new Error('the reference of JOYUI module is error!');
            log.error('spon:util:template: ',e);
            process.exit(1);
          }

          vm.runInContext(fn,vm.createContext({
            use: use
          }));
          break;
        case 'require':
          refs.push(joyui);
          break;
        case 'stub':
          placeholders.push(joyui);
          break;
      }

    });

  }catch(e){
    log.error(e);
    process.exit(1);
  }
  return {
    uis: uis,
    refs: refs,
    placeholders: placeholders
  };
};

/**
 *
 * @param content 页面数据
 * @param tokens 根据每个引用模板的配置作相应的操作
 * @returns 返回处理后的页面
 */
exports.template = function(content,tokens){
  var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var joyuiBase = path.join(home,'.spon/mobi/');
  try{
    content = content.replace(borderReg,function(str,fn,action,quotation,joyui,data){
      if(!joyuiReg.test(joyui)){
        var e = new Error('the reference of JOYUI module is error!');
        log.error('spon:util:template: ',e);
        process.exit(1);
      }

      var uis = tokens.uis,refs = tokens.refs,placeholders = tokens.placeholders;
      switch(action){
        case 'use':
          for(let i=0,len=uis.length;i<len;i++){
            let item = uis[i];
            if(item.name == joyui){
              let setting = item.options;
              let uiName = item.name.split('/')[1];
              if(setting.useTemplate){
                return fs.readFileSync(path.join(joyuiBase,joyui,uiName + '.tmpl'),'utf8');
              }else{
                return '';
              }
            }
          }
          break;
      }
    });
  }catch(e){
    log.error('spon: ',e);
    process.exit(1);
  }
  return content;
};