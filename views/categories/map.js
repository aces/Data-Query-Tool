function(doc) {
    if(doc.Meta && doc.Meta.DocType && doc.Meta.DocType !== 'SavedQuery' && doc.Meta.DocType !== 'ServerConfig') {
        emit(doc.Meta.DocType, null);
    }
};
