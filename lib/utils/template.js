'use strict';

var path = require('path');
var fs = require('fs');
var vm = require('vm');
var log = require('npmlog');
var template = require('art-template');

var keywords = ['require','use','stub']
  , borderReg = /\{\{[\s\r\n]*?(([^\{\}\s]+)[\s\r\n]*?\(\s*(?:(['"])([^'"]+)\3)(?:[\s\r\n]*?\,[\s\r\n]*?[^)]+)?\))[\s\r\n]*?\}\}/g // /\{\{\s*(([^\{\}\s]+)\s*\(\s*(?:(['"])([^'"]+)\3)(?:\,\s*[^)]+)?\))\s*\}\}/g
  , joyuiReg = /joyui\/[^\/\s]+\/\d+\.\d+\.\d+/
  // UI模块可嵌套
  , joyuiSlabReg = /<joyui:view>/ig
  , filePathReg = /joyui\/[^\/\s]+\/\d+\.\d+\.\d+\/.+?\.(js|less|tmpl|css)/ig;

exports.parseEntrance = function(content,utils){

  // 保存JOYUI模块
  var uis = [];
  // 保存文件引用
  var refs = [];
  // 占位符
  var placeholders = [];
  // 模块嵌套表，位置与标记需对应
  var slabs = {};

  var use = function(joyui,data){
    var options = data && data.options || {
        useTemplate: true
      },slabs = data && data.slabs || [];

    uis.push({
      name: joyui,
      options: options,
      slabs: slabs,
      data: data && data.$data
    });
  };

  // TODO: stab
  var require = function(filepath,data){
    if(!filepath){
      log.error('spon: JOYUI模块引用路径不正确！');
      process._exit(1,'spon: JOYUI模块引用路径不正确！');
      return;
    }

    // 目前，data参数无效
    refs.push({
      name: filepath,
      path: filepath
    });
  };


  try{
    content.replace(borderReg,function(str,fn,action,quotation,joyui,data){
      if(keywords.indexOf(action) == -1){
        var e = new Error('the method is now allowed!');
        log.error('spon:util:template: ',e);
        process._exit(1,e);
        return;
      }

      // TODO: 模板解析，由于远程引用模板或文件，因此“解析”更像是“spon mb build”，首先fetch操作，接着
      // TODO: 判断模块或文件是否需要渲染（根据是否传入$data），最后替换占位符
      switch(action){
        case 'use':
          if(!joyui.match(joyuiReg)){
            var e = 'the reference of JOYUI module is error!';
            log.error('spon:util:template: ',e);
            process._exit(1,e);
            return;
          }

          vm.runInContext(fn,vm.createContext({
            use: use
          }));
          break;
        case 'require':
          if(!joyui.match(filePathReg)){
            log.error('spon:util:template: ','the reference of JOYUI module is error!');
            process._exit(1,'the reference of JOYUI module is error!');
            return;
          }

          vm.runInContext(fn,vm.createContext({
            require: require
          }));
          break;
        case 'stub':
          placeholders.push(joyui);
          break;
      }

    });

  }catch(e){
    log.error(e);
    process._exit(1,e);
    return;
  }
  return {
    uis: uis,
    refs: refs,
    placeholders: placeholders
  };
};

/**
 * 绑定slab相关信息至process，主要在task of join和joyuiLoader中使用
 * @param content
 */
exports.bindSlabs = function(content){
  var hashstr = function(s){
    var hash = 0;
    if (s.length == 0) return hash;
    var char;
    for (var i = 0; i < s.length; i++) {
      char = s.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  var use = function(joyui,data){
    var slabs = data && data.slabs || [];
    var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var joyuiBase = path.join(home,'.spon/mobi/');
    var uiName = joyui.split('/')[1];
    var tmplContent = fs.readFileSync(path.join(joyuiBase,joyui,uiName + '.tmpl'),'utf8');
    if(slabs && slabs.length > 0){
      // 保存slabs属性值process，在loader中重用
      process.slabs = process.slabs || {};
      process.joyuis = process.joyuis || {};
      process.slabs[hashstr(tmplContent)] = {
        slabs: slabs,
        name: uiName
      };
      process.joyuis[joyui] = slabs;
    }else{
      process.slabs = process.slabs || {};
      process.slabs[hashstr(tmplContent)] = null;
      process.joyuis = process.joyuis || {};
      process.joyuis[joyui] = null;
    }
  };

  try{
    content.replace(borderReg,function(str,fn,action,quotation,joyui,data){
      if(keywords.indexOf(action) == -1){
        var e = new Error('the method is now allowed!');
        log.error('spon:util:template: ',e);
        process._exit(1,e);
        return;
      }

      switch(action){
        case 'use':
          if(!joyuiReg.test(joyui)){
            e = new Error('the reference of JOYUI module is error!');
            log.error('spon:util:template: ',e);
            process._exit(1,e);
            return;
          }

          vm.runInContext(fn,vm.createContext({
            use: use
          }));
          break;
      }
    });
  }catch(e){
    log.error(e);
    process._exit(1,e);
    return;
  }
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
  var originContent = content;

  var generateFinalHTML = function(joyui,data){
    var options = data && data.options || {
        useTemplate: true
      },
      slabs = data && data.slabs || [],
      $data = data && data.$data;
    var uiName = joyui.split('/')[1];

    // 拥有占位符的JOYUI模板
    var tmplContent = fs.readFileSync(path.join(joyuiBase,joyui,uiName + '.tmpl'),'utf8');
    if(slabs && slabs.length > 0){
      // 查询模板中的占位符个数
      var slabsInTemplate = tmplContent.match(joyuiSlabReg);

      if(!slabsInTemplate || slabs.length != slabsInTemplate.length){
        log.error('spon: 当前模块 '+ joyui + ' 模板中占位符数量与传入数据的数量不相等！');
        process._exit(1,'spon: 当前模块 '+ joyui + ' 模板中占位符数量与传入数据的数量不相等！');
        return;
      }

      slabs.forEach(function(slab,i){
        var uiName,slabContent;
        if(typeof slab == 'object'){
          uiName = slab.name.split('/')[1];
          slabContent = fs.readFileSync(path.join(joyuiBase,slab.name,uiName + '.tmpl'),'utf8');
          tmplContent = tmplContent.replace(/<joyui:view>/i,template.render(slabContent)(slab.$data));
        }else{
          uiName = slab.split('/')[1];
          // 占位符对应的JOYUI模块的模板
          slabContent = fs.readFileSync(path.join(joyuiBase,slab,uiName + '.tmpl'),'utf8');
          tmplContent = tmplContent.replace(/<joyui:view>/i,slabContent);
        }
      });

      if(options.useTemplate){
        // 如果提供该模块的数据$data，则直接使用渲染好的模板
        if($data && Object.keys($data).length){
          return template.render(tmplContent)($data);
        }
        return tmplContent;
      }else{
        return '';
      }

    }else{
      if(options.useTemplate){
        // 如果提供该模块的数据$data，则直接使用渲染好的模板
        if($data && Object.keys($data).length){
          return template.render(tmplContent)($data);
        }
        return tmplContent;
      }else{
        return '';
      }
    }
  };

  var replaceRequire = function(filePath,data){
    var deployDir,requireContent;
    switch(path.extname(filePath)){
      case '.js':
      case '.less':
      case '.css':
        deployDir = path.join(process.cwd(),'build/src/pages',process.projName,filePath + '.min.js');
        if(fs.existsSync(deployDir)){
          requireContent = fs.readFileSync(deployDir,'utf8');
          return '<script>' + requireContent + '<\/script>';
        }
        return '';
    }
    return '';
  };

  try{
    content = content.replace(borderReg,function(str,fn,action,quotation,joyui,data){
      if(!joyuiReg.test(joyui)){
        var e = new Error('the reference of JOYUI module is error!');
        log.error('spon:util:template: ',e);
        process._exit(1,e);
        return;
      }

      var uis = tokens.uis,refs = tokens.refs,placeholders = tokens.placeholders;
      switch(action){
        case 'use':
          return vm.runInContext(fn,vm.createContext({
            use: generateFinalHTML,
            joyuiSlabReg: joyuiSlabReg
          }),{
            filename: 'utils/template'
          });

          /*for(let i=0,len=uis.length;i<len;i++){
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
          }*/
          break;
        case 'require':
          return vm.runInContext(fn,vm.createContext({
            require: replaceRequire
          }),{
            filename: 'utils/template'
          });
          break;
      }
    });
  }catch(e){
    log.error('spon: ',e);
    process._exit(1,e);
    return;
  }
  return content;
};