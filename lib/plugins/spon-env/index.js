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
    require('./spon-init').init(op);
  },
  publish: function(methodName,options){
    var self = this;
    switch(methodName) {
      case 'init':
        self._init(options);
        break;
      default:
        break;
    }
  }
};

