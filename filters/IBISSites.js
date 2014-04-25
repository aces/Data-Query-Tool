function (doc, req) {
    "use strict";
    var i, sites = ['UNC', 'SEA', 'PHI', 'STL'];
    if(doc._deleted === true) {
        return true;
    }
    if (doc.Meta && doc.Meta.identifier) {
        for (i = 0; i < sites.length; i += 1) {
            if (doc.Meta.identifier[0].indexOf(sites[i]) === 0) {
                return true;
            }
        }
    } else if (doc.Meta && (doc.Meta.DataDict === true || doc.Meta.DocType === 'RunLog')) {
        return true;
    }
    return false;
}
