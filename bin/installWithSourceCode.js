#!/usr/bin/env node

var shelljs = require('shelljs');
var path = require('path');
var fs = require('fs');
var http = require('http');
var log = require('npmlog');

var pkgConfig = require('../package.json');
var ver = pkgConfig.version;
var fileName = 'spon.'+ ver +'.tar.gz';
shelljs.exec('tar --exclude=.DS_Store --exclude=.git --exclude=.gitignore --exclude=.idea --exclude=node_modules --exclude=test --exclude=README.md  -zcvf spon.'+ ver +'.tar.gz ./*',function(code, stdout, stderr){
  if(stderr){
    console.dir(stderr.stack);
    return;
  }


  function upload(){

    var boundaryKey = '----' + Date.now();

    var options = {

      host: '192.168.0.61',

      port: 8110,

      method: 'POST',

      path:'/uploadTar?fileName='+ fileName,

      headers:{
        'Content-Type':'multipart/form-data; boundary=' + boundaryKey
      }

    };

    var req = http.request(options,function(res){

      res.setEncoding('utf8');

      res.on('data',function(trunk){
      });

      res.on('end',function(err){
        if(err){
          log.error('spon:','哎呀，上传tar包失败');
          return;
        }

        log.info('spon:','上传tar包成功');
        shelljs.exec('rm -rf ' + process.cwd() + '/spon.*');
      });

    });

    req.write(
      '--' + boundaryKey + '\r\n' +
      'Content-Disposition: form-data; name="'+ fileName +'"; filename="'+ fileName +'"\r\n' +
      'Content-Type: application/x-tar\r\n\r\n'
    );

    //设置1M的缓冲区
    var fileStream = fs.createReadStream('./' + fileName,{bufferSize:500 * 1024});
    fileStream.pipe(req,{end:false});

    fileStream.on('end',function(){

      req.end('\r\n--' + boundaryKey + '--');

    });

  }

  upload();
});
