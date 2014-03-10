/*global self: false, Blob: false */
importScripts("../vendor/jszip.min.js");
self.addEventListener('message', function (e) {
    "use strict";
    var i = 0,
        FileList = e.data.Files,
        generateZip = function () {
            var zipVal;
            self.postMessage({
                cmd: "CreatingZip",
                FileNo : self.FileNo
            });
            zipVal = self.Zip.generate({
                base64: false,
                type: "blob"
            });

            self.postMessage({
                cmd : 'SaveFile',
                message : 'Done',
                zip : zipVal,
                Filename : "files-" + self.FileNo + ".zip"
            });

            self.Zip = new JSZip();
            self.TotalInCurrentZip = 0;
            self.FileNo += 1;
        },
        onLoadHandler = function (File, idx) { return function (data) {
            var dataVal = this.response,
                i,
                zipVal,
                splitFile = File.split("/");

            // File is currently "files/DocID/URIEncodedFilename"
            // we want the decoded filename only, without the DocID
            self.Zip.file("files/" + decodeURIComponent(splitFile[2]), dataVal);
            self.xhrMask[idx] = true;
            self.complete += 1;

            self.TotalInCurrentZip += self.xhr[idx].response.byteLength;
            // We don't need the XMLHttpRequest object anymore, let javascript 
            // garbage collect it if it wants to.
            self.xhr[idx] = undefined;

            self.postMessage({
                cmd: 'Progress',
                Complete: self.complete,
                Total: self.xhrMask.length
            });


            // Split into 512MB chunks
            if (self.TotalInCurrentZip > 536870912) {
                generateZip();
            }
            for (i = 0; i < self.xhrMask.length; i += 1) {
                if (self.xhrMask[i] !== true) {
                    // They aren't all finished, so don't
                    // post the message below
                    return;
                }

            }
            // Didn't return in the loop above, which means everything
            // is finished. We can save the file even if we haven't hit our
            // splitting limit.
            generateZip();
            self.postMessage({
                cmd: 'Finished'
            });
        };
    };
    self.Zip = new JSZip();
    self.xhr = [];
    self.xhrMask = [];
    self.complete = 0;
    self.FileNo = 1;
    self.TotalInCurrentZip = 0;

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
