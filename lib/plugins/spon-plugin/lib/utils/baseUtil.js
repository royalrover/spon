var formatPluginName = function(args) {
    if (!args) {
        return args;
    }

    return args.filter(function(arg){
            return 'string' === typeof arg;
        })
        .map(function(arg) {
            if(!/^spon-/.test(arg)) {
                arg = 'spon-' + arg;
            }
            return arg;
        });
};

exports.formatPluginName = formatPluginName;