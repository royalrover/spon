var _ = require('lodash');
/**
 * Get User's Home Directory
 * 获取用户目录
 * 如果是Linux Mac，获取 HOME ~ 目录， Windows 我的文档
 * @returns {*}
 */
exports.getUserHome = function() {
  var path = require('path');
  var home =  process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

  var args = _.toArray(arguments);
  return path.resolve.apply(path, [home].concat(args));
};

/**
 * Determine a command exists or not
 * 检查一个命令行命令是否存在
 * @param cmd
 * @param callback
 */
exports.detectCommand = function detectCommand(cmd, callback) {
  var exec = require('child_process').exec;
  var os = require('os');
  //not detect windows
  if (os.platform().match(/^win/)) {
    callback(true);
    return;
  }

  exec("hash " + cmd + " 2>/dev/null || { exit 1; }", function (err) {
    callback(null === err);
  });
};


/**
 * Open sth with default Application of based on Your OS
 * 在用系统的默认工具打开一个文档
 * @param target {String} target to Open
 * @param callback {Function}
 */
exports.commandOpen = function commandOpen (target, callback) {

  var os  = require('os');
  var exec = require('child_process').exec;

  switch (os.platform()) {
    case 'win32':
      exec('start ' + target, callback);
      break;
    case 'darwin':
      exec('open ' + target, callback);
      break;
    case 'linux':
      var cmd = 'type -P gnome-open &>/dev/null  && gnome-open ' + target +
        ' || { type -P xdg-open &>/dev/null  && xdg-open ' + target + '; }';
      exec(cmd, callback);
      break;
    default:
      var error = new Error();
      error.message = 'Can\'t Open it';
      callback && callback(error);
  }
};

