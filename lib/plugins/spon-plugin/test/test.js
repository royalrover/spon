'use strict';

var core = require('../lib/core')({
  env: {
    home: 'test/fixtures/home',
    softHome: 'test/fixtures/softHome'
  }
});

describe('all test', function () {
  describe('install', function () {
    it('test base install', function (done) {
      this.timeout(10000);
      core.install(['@ali/def-ssh'], {type: 'install'}, done);
    });
  });

  describe('update', function () {
    it('test base update', function (done) {
      this.timeout(10000);
      core.install(['@ali/def-ssh'], {type: 'update'}, done);
    });

    it('test update all', function (done) {
      core.install('', {type: 'update'}, done);
    });
  });

  describe('remove', function () {
    it('test base remove', function (done) {
      core.remove(['@ali/def-ssh'], {type: 'install'}, done);
    });
  });

});