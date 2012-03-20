function(doc) {
    var merged;
    if(doc.Meta && doc.Meta.DocType && doc.Meta.identifier) {
        merged = []
        merged.push(doc.Meta.DocType);
        merged = merged.concat(doc.Meta.identifier);
        emit(merged, doc.Meta.identifier)
    }
}
