/**
 * Created by yuxiu on 15/12/11.
 * mobiFactory完成mobi命令的实现，后期可以封装
 * 为npm模块
 */

module.exports = {
  /**
   * @param op [type] {option: '子命令|init|build'，plugin: 'mobi'}
   */
  _init: function(op){
    require('./mobi-init').generate(op);
  },
  _add: function(op){
    require('./mobi-add').generate(op);
  },
  _build: function(op){
    require('./mobi-build').generate(op);
  },
  _publish: function(op){
    require('./mobi-publish').generate(op);
  },
  _dev: function(op){
    require('./mobi-dev').generate(op);
  },
  _rem: function(op){
    require('./mobi-rem').generate(op);
  },
  _join: function(op){
    require('./mobi-join').generate(op);
  },
  _upgrade:function(){
    // 更新工程下的mobi.json
    var upgradeModule = require('./mobi-upgrade');
    var urls = [
      {
        url: 'http://assets.showjoy.net/mobi.json',
        fileName: 'mobi.json'
      }
    ];
    upgradeModule.request(urls);
  },
  publish: function(methodName,options){
    var self = this;
    switch(methodName) {
      case 'init':
        self._init(options);
        break;
      case 'add':
        self._add(options);
        break;
      case 'build':
        self._build(options);
        break;
      case 'publish':
        self._publish(options);
        break;
      case 'dev':
        self._dev(options);
        break;
      case 'upgrade':
        self._upgrade();
        break;
      case 'rem':
        self._rem(options);
        break;
      case 'join':
        self._join(options);
        break;
      default:
        break;
    }
  }
};