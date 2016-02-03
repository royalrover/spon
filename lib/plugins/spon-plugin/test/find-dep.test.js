'use strict';
var findDep = require('../lib/find-dep');
var nock = require('nock');
var expect = require('expect.js');
var _ = require('lodash');

describe('find-dep', function () {
  describe('with beta tag', function () {

    beforeEach(function () {

      nock('http://registry.npm.alibaba-inc.com/')
        .get('/def-xcake')
        .reply(200, {
          "dist-tags": {
            "latest": "0.8.2",
            "beta": "0.9.18"
          },
          "versions": {
            "0.8.2": {
              "name": "def-xcake",
              "version": "0.8.2",
              "defDependencies": ["def-foo"]
            },
            "0.9.18": {
              "name": "def-xcake",
              "version": "0.9.18",
              "defDependencies": ["def-foo"]
            }
          }

        })
        .get('/def-foo')
        .reply(200, {
          "dist-tags": {
            "latest": "0.1.0",
            "beta": "0.1.99"
          },
          "versions": {
            "0.1.0": {
              "name": "def-foo",
              "version": "0.1.0",
              "defDependencies": ["def-xcake"]
            },
            "0.1.99": {
              "name": "def-foo",
              "version": "0.1.99",
              "defDependencies": ["def-xcake"]
            }
          }

        });
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('should find all beta deps', function (done) {

      findDep('def-xcake', {beta: true}, function (err, deps) {
        expect(err).to.not.be.ok();
        expect(deps).to.be.an('array');
        expect(deps).to.have.length(2);


        expect(_.find(deps, {
          name: 'def-xcake',
          version: '0.9.18',
          tag: 'beta'
        })).to.be.ok();

        expect(_.find(deps, {
          name: 'def-foo',
          version: '0.1.99',
          tag: 'beta'
        })).to.be.ok();

        done();
      });
    });

    it('should find all latest deps', function (done) {

      findDep('def-xcake', {}, function (err, deps) {
        expect(err).to.not.be.ok();
        expect(deps).to.be.an('array');
        expect(deps).to.have.length(2);


        expect(_.find(deps, {
          name: 'def-xcake',
          version: '0.8.2',
          "tag": 'latest'
        })).to.be.ok();

        expect(_.find).withArgs(deps, {
          name: 'def-foo',
          version: '0.0.99',
          "tag": 'stable'
        }).to.be.ok();

        done();
      });
    });
  });

  describe('no stable tag', function () {

    beforeEach(function () {
      nock('http://registry.npm.alibaba-inc.com/')
        .get('/def-xcake')
        .reply(200, {
          "dist-tags": {
            "latest": "0.8.2"
          },
          "versions": {
            "0.8.2": {
              "name": "def-xcake",
              "version": "0.8.2",
              "defDependencies": ["def-foo"]
            },
            "0.7.18": {
              "name": "def-xcake",
              "version": "0.7.18",
              "defDependencies": ["def-foo"]
            }
          }

        })
        .get('/def-foo')
        .reply(200, {
          "dist-tags": {
            "latest": "0.1.0"
          },
          "versions": {
            "0.1.0": {
              "name": "def-foo",
              "version": "0.1.0",
              "defDependencies": ["def-xcake"]
            },
            "0.0.99": {
              "name": "def-foo",
              "version": "0.0.99",
              "defDependencies": ["def-xcake"]
            }
          }

        });
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('should find all latest deps', function (done) {
      findDep('def-xcake', {}, function (err, deps) {
        expect(err).to.not.be.ok();
        expect(deps).to.be.an('array');
        expect(deps).to.have.length(2);


        expect(_.find(deps, {
          "name": "def-xcake",
          "version": "0.8.2",
          "defDependencies": ["def-foo"]
        })).to.be.ok();

        expect(_.find).withArgs(deps, {
          "name": "def-foo",
          "version": "0.1.0",
          "defDependencies": ["def-xcake"],
          "tag": 'latest'
        }).to.be.ok();

        done();
      });
    });

    it('should get latest ', function (done) {
      findDep('def-xcake', {tag: 'stable'}, function (err, deps) {
        expect(err).to.not.be.ok();
        expect(deps).to.be.an('array');
        expect(deps).to.have.length(2);


        expect(_.find(deps, {
          "name": "def-xcake",
          "version": "0.8.2",
          "defDependencies": ["def-foo"]
        })).to.be.ok();

        expect(_.find).withArgs(deps, {
          "name": "def-foo",
          "version": "0.1.0",
          "defDependencies": ["def-xcake"],
          "tag": 'latest'
        }).to.be.ok();

        done();
      });
    });
  });


});