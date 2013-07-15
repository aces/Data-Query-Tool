function(doc, req) {
    var i, sites = ['UNC', 'SEA', 'PHI', 'STL'];
    if (doc.Meta && doc.Meta.identifier) {
        for (i = 0; i < sites.length; i+= 1) {
            if (doc.Meta.identifier[0].indexOf(sites[i]) === 0) {
                return true;
            }
        }
    } else if(doc.Meta && doc.Meta.DataDict == true) {
        return true;
    }
    return false;
}
