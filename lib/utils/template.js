'use strict';

var log = require('npmlog');
exports.template = function(content){
  var keywords = ['require','use','stub']
    , borderReg = /\{\{([^\{\}\s]+)\((?:(['"])[^'"]+\2)(\,\$data\.\w+)?\)\}\}/g
    , joyuiReg = /^joyui\/[^\/\s]+\/\d+\.\d+\.\d+$/g;

  try{
    content.replace(borderReg,function(str,action,joyui,data){
      if(keywords.indexOf(action) == -1){
        var e = new Error('the method is now allowed!');
        log.error('spon:util:template: ',e);
        throw e;
      }

      if(!joyuiReg.test(joyui)){
        var e = new Error('the reference of  JOYUI module is error!');
        log.error('spon:util:template: ',e);
        throw new Error('the reference of  JOYUI module is error!');
      }

      // TODO: 模板解析

    });
  }catch(e){
    return 1;
  }

};