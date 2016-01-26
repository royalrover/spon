/**
 * Created by yuxiu on 15/12/11.
 * mobiFactory完成mobi命令的实现，后期可以封装
 * 为npm模块
 */
var initModule = require('./mobi-init');
var addModule = require('./mobi-add');
var buildModule = require('./mobi-build');
var publishModule = require('./mobi-publish');
var devModule = require('./mobi-dev');
var remModule = require('./mobi-rem');
// 更新工程下的mobi.json
var upgradeModule = require('./mobi-upgrade');
module.exports = {
  /**
   * @param op [type] {option: '子命令|init|build'，plugin: 'mobi'}
   */
  _init: function(op){
    initModule.generate(op);
  },
  _add: function(op){
    addModule.generate(op);
  },
  _build: function(op){
    buildModule.generate(op);
  },
  _publish: function(op){
    publishModule.generate(op);
  },
  _dev: function(op){
    devModule.generate(op);
  },
  _rem: function(op){
    remModule.generate(op);
  },
  _upgrade:function(){
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
      case 'rem':
        self._rem(options);
      default:
        break;
    }
  }
};