function (doc, req) {
    "use strict";
    if (doc.Meta && doc.Meta.DocType) {
        return doc.Meta.DocType === "SavedQuery";
    }
    return false;
}
