'use strict';

exports.bind = function(Extends){
  var MidProxy = Extends.MidProxy;
  var log = Extends.log;
  var _ = Extends.lodash;

  /**
   * @description 创建一个或多个MidProxy实例
   * @returns MidProxy实例或该实例数组
   */
  var createProxies = function(){
    var proxy = MidProxy.create('Shop.*');

    // 准备MidProxy即将调用的接口，此处并未发起请求
    proxy
      // getConfig的参数为get请求的查询字符串，默认使用真是请求的查询字符串
      // 由于服务端采用OAuth2认证，请求须携带cookie
      .getHomepageInfo()
      .withCookie(this.request.header['cookie']);

    // 返回值可以为数组，也可以为单个MidProxy实例
    return [proxy];
  };

  /**
   * @param ret 与createProxies函数返回值对应，如果createProxies返回数组，则ret对应也为数组
   [
   [
   { count: 1, data: [Object], isRedirect: 0, isSuccess: 1, login: 0 },
   { count: 0, data: [Object], isRedirect: 0, isSuccess: 1, login: 0 },
   undefined,
   [ undefined, undefined ]
   ],
   [
   { count: 0, data: [Object], isRedirect: 1, isSuccess: 1, login: 0 },
   undefined,
   [ undefined ]
   ]
   ]
   * @param app 当前应用实例，用于获取当前环境的配置
   * @description 处理渲染数据
   * @returns Object
   */
  var handleRenderData = function(ret,app){
    try{
      var globalConfig = ret[0][0].data;

      var renderObj = {
        title: globalConfig.pageBO.title
      };

    }catch(e){
      log.error(e.stack);
      throw e;
    }

    return renderObj;
  };

  // 模板的keys集合
  var keys = ['f2e_TestDemoRender'];

  // out函数生成业务逻辑，开发者只需提供五个参数即可
  Extends.get('/shop/test',out({
    keys: keys,
    createProxies: createProxies,
    handleRenderData: handleRenderData,
    Extends: Extends,
    isSetCookie: false
  }));

  // 解析当前目录下其他的业务逻辑，如果只有一个模块则可以忽略
  resolveOtherControllers(Extends,__dirname)
};

// 模块热加载
module.hotload = 1;