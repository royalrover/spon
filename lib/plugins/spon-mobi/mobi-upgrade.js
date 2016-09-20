var fs = require('fs');
var path = require('path');
var request = require('request');
var log = require('npmlog');
var async = require('async');
var sponRoot = process.cwd();

module.exports = {
  request: function(urls){
    if(!urls.length){
      log.error('spon:upgrade: ','params\'s type should be Array!');
      return 1;
    }
    async.mapSeries(urls, function(u,cb){
      request(u.url,function(err,res,body){
        var p;
        if(err){
          cb(err);
          return;
        }
        p = path.join(sponRoot,u.fileName);
        if(fs.existsSync(p)){
          fs.unlinkSync(p);
        }
        fs.writeFileSync(p,body);
        cb();
      });
    },function(err){
      if(err){
        process.emit('upgrade_error');
        return;
      }
      process.emit('upgrade');
      log.info('spon: ','更新成功！');
    });
  }
};