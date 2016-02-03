var wget = require('wget'),
    progress = require('./progress');

module.exports = {
    download: function(url, output, cb) {
        var download = wget.download(url, output),
            step = 0;

        var bar = new progress('  downloading [:bar] :percent :etas', {
            complete: '='
            , incomplete: ' '
            , width: 20
            , total: 1
        });

        download.on('error', function(err) {
            console.log(err);
            cb(err);
        });
        download.on('end', function(output) {
            clearInterval(handler);
            bar.tick(step);
            cb();
        });
        download.on('progress', function(progress) {
            step = progress;
        });

        var handler = setInterval(function() {
            bar.tick(step);
        }, 1000);
    }
};