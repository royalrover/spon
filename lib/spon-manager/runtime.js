/**
 * Created by yuxiu on 16/2/2.
 * 运行时环境，用于暴露接口
 */

var _ = require('lodash');
var q = require('q');

module.exports = getClass;

/**
 * create a runtime class
 * @param def
 * @param def.config
 * @param def.home
 * @param def.version
 * @param def.softHome
 * @param def.log
 * @param def.fatal
 * @param def.parseAction
 * @param def.request
 * @param def.getPlugin
 * @param def.cli
 * @returns {PluginRuntime}
 */
function getClass(spon) {

  /**
   * Runtime of plugin
   * @param where path of plugin
   * @optional
   * @param pkg the plugin package name
   * @optional
   * @constructor
   */
  function Runtime(where, pkg) {
    this._root = where;
    this._loaded = false;

    if (!where) {
      where = process.cwd();
    }

    if (!pkg) {
      pkg = require(path.join(where, 'package.json'));
    }

    this.pkg = pkg;

    this.env = {
      home: spon.home,
      version: def.version,
      softHome: def.softHome
    };

    this.published = {};
    this.name = pkg.name.replace(/^spon-/, '');
    this.log = spon.log;


    if (!/[a-z0-9-_]/.test(this.name)) {
      throw new Error('plugin name error');
    }

  }

  Runtime.prototype.__proto__ = require('events').EventEmitter.prototype;

  Runtime.prototype.fatal = function fatal(error) {
    spon.fatal(error);
  };


  /**
   * call a plugins method
   * @param action
   * @param data
   * @returns {promise|*|Promise.promise}
   */
  Runtime.prototype.request = function request(action, data) {
    return new Promise(function (resolve, reject) {
      var p = def.parseAction(action);
      var pkg = this.pkg;
      var pluginName = 'def-' + p.plugin;
      // 请求非当前插件，而且这个插件又不在 defDependencies 的时候，警告一下
      if ((p.plugin !== this.name) && (!pkg.defDependencies || !_.find(pkg.defDependencies, function (elem) {
          return elem.replace(/^@ali\//, '') === pluginName
        }))) {
        def.log.warn('the plugin "' + pluginName + '" you used is not found in defDependencies of your package.json;');
      }
      def.request(action, data, this).then(resolve, reject);
    }.bind(this));

  };

  /**
   * Publish a api to def
   * @param method
   * @param cb
   */
  Runtime.prototype.publish = function publish(method, cb) {
    spon.log.verbose('runtime', 'plugin ' + this.name + ' publish a method ' + method);
    this.published[method] = cb;
  };


  /**
   * List apis of a plugin, or check a api is exist
   * @param {string} name
   * @param {string} method
   * @optional
   * @return {Array|Boolean|null}  return null if no plugin
   */
  Runtime.prototype.api = function api(name, method) {
    var plugin = spon.getPlugin(name);

    if (!plugin) {
      return null;
    }

    var apis = _.keys(plugin.published);

    if (method) {
      return apis.indexOf(method) !== -1;
    } else {
      return apis;
    }

  };

  /**
   * load plugin
   * @private
   */
  Runtime.prototype.load = function () {
    if (this._loaded) {
      return;
    }
    def.log.verbose('runtime', 'load plugin %s', this.name);

    var command = def.cli.program.command(this.name);

    if (this.pkg.description) {
      command.description(this.pkg.description);
    }

    this.cli = command;


    try {
      require(this._root).call(this, this);
      this._loaded = true;
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        def.log.error('plugin', 'Failed to load plugin "%s". Re-installing the plugin (def install %s) may fix this problem', this.name, this.pkg.name);
      }
      throw e;
    }
  };

  function getConf(name) {

    /**
     * prefix with name space
     * @param key
     * @returns {string}
     */
    function getKey(key) {
      return 'plugin:' + name + ':' + key
    }

    return {
      get: function (key) {
        return def.config.get(getKey(key))
      },
      set: function (key, value) {
        return def.config.set(getKey(key), value);
      },
      save: function () {
        return def.config.save();
      }
    }
  }

  return Runtime;
}
