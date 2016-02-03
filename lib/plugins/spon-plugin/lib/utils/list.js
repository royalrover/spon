var Promise = require('bluebird');
var path = require('path');
var glob = Promise.promisify(require('glob'));
var fs = Promise.promisifyAll(require('fs'));

function readJSON(jsonPath) {
  return fs.readFileAsync(jsonPath)
    .then(function(contents){
      return JSON.parse(contents);
    })
}

function join(arr) {
  return arr.reduce(function (a, item) {
    return a.concat(item)
  }, [])
}

module.exports = listModules;

function listModules(home, options) {
  options = options || {};
  function prefix(p){
    return path.join(home, p);
  }

  return Promise
    .map(['node_modules/*/package.json', 'node_modules/@*/*/package.json'], function (patten) {
      return glob(patten, {
        cwd: home
      });
    })
    .then(join)
    .filter(function(name){
      return options.filter ? options.filter.test(name) : true
    })
    .map(prefix)
    .map(readJSON)
}

listModules.plugin = function(home){
  return listModules(home, {
    filter: /^node_modules\/(@[^/]+\/)?def-/
  })
};

listModules.all = function(home){
  return listModules(home, {
    filter: /^node_modules\/(@[^/]+\/)?(def|builder|generator)-/
  })
};