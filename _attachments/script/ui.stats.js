/*global self: false, importScripts: false, jStat: false*/
importScripts("../vendor/jquery/jstat.js");
self.addEventListener("message", function (e) {
    "use strict";
    var data = e.data,
        arrayConvertNumbers = function (arr) {
            var r = [], i;
            for (i = 0; i < arr.length; i += 1) {
                if (arr[i] instanceof Array) {
                    r[i] = arrayConvertNumbers(arr[i]);
                } else {
                    if (parseInt(arr[i], 10) == arr[i]) {
                        r[i] = parseInt(arr[i], 10);
                    } else if (parseFloat(arr[i], 10) == arr[i]) {
                        r[i] = parseFloat(arr[i], 10);
                    } else if (arr[i] === '.') {
                        r[i] = null;
                    } else {
                        r[i] = arr[i];
                    }
                }
            }
            return r;
        };
    switch (data.cmd) {
    case 'PopulateTable':
        self.populateStatsTable(data.Headers, arrayConvertNumbers(data.Data));
        break;
    }
});

self.populateStatsTable = function (headers, data) {
    "use strict";
    var d = jStat(data),
        quartiles = d.quartiles(),
        min = d.min(),
        max = d.max(),
        stdev = d.stdev(),
        mean = d.mean(),
        meandev = d.meandev(),
        meansqerr = d.meansqerr(),
        i;

    for (i = 1; i < headers.length; i += 1) {
        quartiles = d.quartiles();
        self.postMessage({
            Cmd: 'TableAddRow',
            Header : headers[i],
            RowData: {
                'Minimum' : min[i],
                'Maximum' : max[i],
                'Standard Deviation' : stdev[i],
                'Mean' : mean[i],
                'Mean Deviation' : meandev[i],
                'Mean Squared Error' : meansqerr[i],
                'First Quartile': quartiles[i][0],
                'Second Quartile': quartiles[i][1],
                'Third Quartile': quartiles[i][2]
            }
        });
    }
};
