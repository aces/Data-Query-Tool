/*global self: false, Blob: false */
importScripts("../vendor/jszip.min.js");
self.addEventListener('message', function (e) {
    "use strict";
    var i = 0,
        FileList = e.data.Files,
        onLoadHandler = function (File, idx) { return function (data) {
            var dataVal = this.response, i, zipVal;
            //console.log(File);
            //console.log(data);
            self.Zip.file(File, dataVal);
            self.xhrMask[idx] = true;

            for(i = 0; i < self.xhrMask.length; i += 1) {
                if(self.xhrMask[i] !== true) {
                    // They aren't all finished, so don't
                    // post the message below
                    return;
                }

            }
            // Didn't return in the loop above, which means everything
            // is finished. We can save the file.
            zipVal = self.Zip.generate({ type: "blob" });
            self.postMessage({ message: 'Done', zip:zipVal });
            }
        };
    self.Zip = new JSZip();
    self.xhr = [];
    self.xhrMask = [];

    for (i = 0; i < FileList.length; i += 1) {
        // Not finished
        self.xhrMask[i] = false;
        self.xhr[i] = new XMLHttpRequest();
        // WebWorker is in script directory, so file is up a level..
        self.xhr[i].open('GET', "../" + FileList[i]);
        self.xhr[i].timeout = 3000;
        self.xhr[i].responseType = "arraybuffer";
        self.xhr[i].onload = onLoadHandler(FileList[i], i);
        //xhr[i].onloadend = function (e) { self.postMessage({ hello: e}) };
        self.xhr[i].send();

    }
});
