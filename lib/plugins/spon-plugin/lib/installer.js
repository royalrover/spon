var spawnCommand = require('./utils/spawn-command');

module.exports = {
  /**
   * run npm command
   * @param command  npm command name
   * @param paths
   * @param options
   * @param spawnOptions
   * @param cb
   * @returns {*}
   */
  run: function (command, paths, spawnOptions, cb) {
    spawnOptions = spawnOptions || {};

    cb = cb || function () {};

    paths = Array.isArray(paths) ? paths : (paths && paths.split(' ') || []);
    var args = [command].concat(paths);

    return spawnCommand('cnpm', args, spawnOptions)
    .on('error', cb)
    .on('exit', function (err) {
      if (err === 127) {
        err = new Error('cnpm not installed!');
        err.code = 'ENOENT';
        cb(err);
        return;
      }
      cb(err === 0 ? null : err);
    });
  }
};
