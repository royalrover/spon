'use strict';

var fs = require('fs');
var path = require('path');

// 过滤隐藏文件
var checkDirsExceptDSStore = function(dirs){
  var nameReg = /^[a-z0-9]/i;
  var ret = [];
  dirs.forEach(function(v,i){
    if(v.match(nameReg)){
      ret.push(v);
    }
  });
  return ret;
};
var controllers = fs.readdirSync(__dirname);
controllers = checkDirsExceptDSStore(controllers);
// 删除controllers数组中的“index.js”项
controllers.splice(controllers.indexOf('index.js'),1);

exports.bind = function(Extends){
  var MidProxy = Extends.MidProxy;
  var View = Extends.View;
  var log = Extends.log;
  var _ = Extends.lodash;

  Extends.get('/api/shop/getConditions', function* (){
    var proxy = MidProxy.create('Shop.*'),ret;
    proxy
      .getConditions();

    ret = yield new Promise(function(resolve,reject){
      proxy._done(resolve,reject);
    });

    if(ret instanceof Error){
      this.body = ret.stack;
      return;
    }

    this.set({
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    });
    this.body = ret[0];
  });

  Extends.post('/api/shop/upgrade', function* (){
    var proxy = MidProxy.create('Shop.*'),ret;
    proxy
      .upgrade();

    ret = yield new Promise(function(resolve,reject){
      proxy._done(resolve,reject);
    });

    if(ret instanceof Error){
      this.body = ret.stack;
      return;
    }

    this.set({
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    });
    this.body = ret[0];
  });

  // 加载其他控制器
  controllers.forEach(function(ctl){
    require(path.join(__dirname,ctl)).bind(Extends);
  });
};

module.hotload = 1;