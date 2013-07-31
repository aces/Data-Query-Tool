function(doc) {
    var data = doc.data;
    var DocType = doc.Meta.DocType;
    var val;
    if(data && DocType && doc.Meta.identifier && doc.Meta.DocType !== 'SavedQuery') {
        for(el in data) {
            if(data.hasOwnProperty(el) && el[0] != '_') {
                val = data[el];
                // If it seems to be numeric data, convert it to a number
                if(parseFloat(val, 10) == data[el]) {
                    val = parseFloat(val, 10);
                }
                emit([DocType, el, val], doc.Meta.identifier);
            }
        }
    }
}
