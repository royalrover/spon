var Promise = require('bluebird');
var spawn = require('./spawn-command');
var path = require('path');
var readline    = require('readline');

/**
 * install npm package
 * @param {Array} modules
 * @param {String} where
 * @returns {Promise}
 */
module.exports = function install(modules, where) {
  var functionArgs = Array.prototype.slice.call(arguments);
  return new Promise(function(resolve, reject) {
    var args = ['install'].concat(modules).concat('--color=always', '-d');

    var child = spawn('npm', args, { cwd: where });

    child.on('error', function(error) {
      reject('npm install module encounter an error.');
    });

    var output = '';

    child.stderr.on('data', function(data) {
      output += data.toString();
    }).pipe(process.stderr);

    child.stdout.on('data', function(data) {
      output += data.toString();
    }).pipe(process.stdout);

    child.on('exit', function(code) {
      if (!code) {
        resolve();
        return;
      }

      if (output.match(/'EACCES'/)) {
        var eaccessError = 'Error: EACCES. Please try "[sudo] chown -R $USER ~/.spon" to fix the problem.';
        if (process.env.USER && process.env.HOME) {
          var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          rl.question('遇到目录权限问题，是否尝试自动修复 (Y/n)？ ', function(answer) {
            rl.close();
            answer = answer || 'Y';
            if (/y/i.test(answer)) {
              var chown = spawn('sudo', ['chown', '-R', process.env.USER, path.join(process.env.HOME, '.spon')], {
                stdio: 'inherit'
              });
              chown.on('close', function() {
                process.nextTick(function() {
                  install.apply(null, functionArgs);
                });
              });
            } else {
              reject(eaccessError);
            }
          });
        } else {
          reject(eaccessError);
        }
      } else {
        reject('npm exit with code ' + code);
      }
    });
  });
};
