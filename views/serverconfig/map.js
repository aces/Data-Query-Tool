/*global emit:false */
function (doc) {
    "use strict";
    var config, option;
    if (doc.Meta && doc.Meta.DocType === 'ServerConfig') {
        if (doc.Config) {
            config = doc.Config;
            for (option in config) {
                if (config.hasOwnProperty(option)) {
                    emit(option, config[option]);
                }
            }
        }
    }
}
