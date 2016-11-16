'use strict';

exports.bind = function(Extends) {
  var MidProxy = Extends.MidProxy;
  var log = Extends.log;
  var _ = Extends.lodash;

  Extends.use('/shop/commission.html',{
    // TODO
    page: {
      type: 'shop',
      useCommonHeader: true,
      useCommonFooter: false,
      cacheKeys: ['f2e:shop:commissionRender'],
      title: '收益页',
      pageName: 'commission-home'
    },
    method: 'get',
    createProxies: function(){

      var proxy = MidProxy.create('Shop.*');
      // 准备MidProxy即将调用的接口，此处并未发起请求
      proxy
        // getConfig的参数为get请求的查询字符串，默认使用真是请求的查询字符串
        // 由于服务端采用OAuth2认证，请求须携带cookie
        .getCommission()
        .withCookie(this.request.header['cookie']);

      // 返回值必须为为数组
      return [proxy];
    },
    handleRenderData: function(ret,app){
      return ret[0][0].data;
    },
    isSetCookie: false
  });
}

module.hotload = 1;