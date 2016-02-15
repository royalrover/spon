var spon = require('../../lib/spon-manager')(require('commander'));
var aliasPlugin = require('../../lib/plugins/spon-alias');
var should = require('should');

describe('alias test', function(){
  before(function(){
    aliasPlugin(spon);
  });

  it('should get config',function(){
    spon.config['commands'] = {
      ttt: 'test'
    };
    spon.consume('getAlias','',function(config){
      should.exist(config);
    })
  });

  it('should get "ttt" when exec "spon alias plugin test"',function(){
    spon.consume('setAlias',{
      aliasName: 'tttest',
      commandName: 'plugin abcdefg'
    },function(){
      console.log('setAlias');
    });

    spon.consume('getAlias','plugin abcdefg',function(d){
      d.should.be.String();
    });
  });
});