function(doc) {
    if(doc.Meta && doc.Meta.DocType && doc.Meta.DocType !== 'SavedQuery') {
        emit(doc.Meta.DocType, null);
    }
};
