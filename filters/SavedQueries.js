function (doc, req) {
    "use strict";
    if (doc.Meta && doc.Meta.DocType) {
        return doc.Meta.DocType === "RunLog";
    }
    return false;
}
