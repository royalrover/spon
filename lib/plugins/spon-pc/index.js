/**
 * Created by yuxiu on 15/12/11.
 * mobiFactory完成mobi命令的实现，后期可以封装
 * 为npm模块
 */
var initModule = require('./pc-init');
var publishModule = require('./pc-publish');
module.exports = {
  /**
   * @param op [type] {option: '子命令|init|build'，plugin: 'mobi'}
   */
  _publish: function(op){
    publishModule.generate(op);
  },
  publish: function(methodName,options){
    var self = this;
    switch(methodName) {
      case 'init':
        initModule.generate(options);
        break;
      case 'publish':
        self._publish(options);
        break;
      default:
        break;
    }
  }
};