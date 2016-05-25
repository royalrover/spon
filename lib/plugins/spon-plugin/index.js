'use strict';
var isConfirm = true;

module.exports = function(spon){

  spon.cli
    .command('install')
    .alias('i')
    .description('Install plugins')
    .action(function(){
      var core = require('./lib/core')(spon);
      var args = [].slice.call(arguments);
      var options = args.pop();

      if (!args.length) {
        console.log('Nothing to install!');
        return;
      }

      var installOptions = {
        type: 'install',
        noConfirm: !isConfirm
      };

      core.install(args, installOptions, function (err) {
        if (err) {
          spon.log.error('plugin', err);
          return;
        }

        spon.log.info('plugin', 'Install Done!');
      });
    });


  spon.cli
    .command('remove')
    .alias('rm')
    .description('Remove a plugin')
    .action(function(){
      var core = require('./lib/core')(spon);
      var baseUtil = require('./lib/utils/baseUtil');
      var modules = baseUtil.formatPluginName([].slice.call(arguments));
      if (modules.length) {
        core.remove(modules, {}, function () {
          spon.log.info('plugin', 'Uninstall Done!');
        });
      } else {
        spon.log.info('plugin', 'Uninstall Done!');
      }
    });

  spon.cli
    .command('update')
    .alias('up')
    .option('-t|--tag <tagName>', 'stable(default) or latest')
    .description('Update plugins')
    .action(function () {
      var core = require('./lib/core')(spon);
      var args = [].slice.call(arguments);

      var options = args.pop();

      var installOptions = {
        noConfirm: !isConfirm,
        type: 'update',
      };

      function run(mods) {
        core.install(mods, installOptions, function (err) {
          if (err) {
            def.fatal(err);
          }
        });
      }

      if (args.length) {
        run(args);
      }
    });

  spon.cli
    .command('list')
    .alias('info')
    .description('list plugins and version')
    .action(function (cmd) {
      var Table = require('easy-table');
      var _ = require('lodash');
      var table = new Table;

      _.keys(spon._plugins).forEach(function(p){
        table.cell('#', '  ');
        table.cell('Name', p);
        table.newRow();
      });
      console.log();
      console.log(table.print());
    });

};
