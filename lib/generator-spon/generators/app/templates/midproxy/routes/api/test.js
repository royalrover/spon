'use strict';

exports.bind = function(Extends){
  var MidProxy = Extends.MidProxy;
  var View = Extends.View;
  var log = Extends.log;
  var _ = Extends.lodash;

  Extends.get('/api/shop/itemDetail', function* (){
    var proxy = MidProxy.create('Shop.*'),ret;
    proxy
      .getItemInfo()
      .withCookie('abc=2');

    ret = yield new Promise(function(resolve,reject){
      proxy._done(resolve,reject);
    });

    console.dir(ret);

    if(ret instanceof Error){
      this.body = ret.stack;
      return;
    }

    this.set({
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    this.body = ret[0];
  });
};

module.hotload = 1;