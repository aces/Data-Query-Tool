function(doc) {
    if(doc.Meta && doc.Meta.DocType) {
        emit(doc.Meta.DocType, null);
    }
};
