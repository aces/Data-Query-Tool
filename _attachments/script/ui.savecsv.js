/*global self: false, Blob: false */
self.addEventListener('message', function (e) {
    "use strict";
    var i = 0,
        data = e.data.data, //$("#data").dataTable().fnGetData(),
        headers = e.data.headers, //$("#data thead th"),
        row = [],
        content = '', //new Blob(),
        escapeQuote = function (val) {
            if (val) {
                return val.replace(/"/g, '""');
            }
            return val;
        },
        fs,
        contentBlob;

    row = headers;
    row = row.map(function (val) {
        if (val) {
            return val.replace('"', '""');
        }
        return val;
    });
    content += '"' + row.join('","') + '"' + "\r\n";
    for (i = 0; i < data.length; i += 1) {
        row = data[i].map(escapeQuote);
        content += '"' + row.join('","') + '"' + "\r\n";
    }
    contentBlob = new Blob([content], { type: "text/csv" });
    //fs = saveAs(contentBlob, "data.csv");
    //fs = new FileSaverSync(contentBlob, "data.csv");
    self.postMessage({ cmd: 'SaveCSV', message: contentBlob});

});
