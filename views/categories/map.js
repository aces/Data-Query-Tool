function(doc) {
    if(doc.Meta && doc.Meta.DocType && doc.Meta.DocType !== 'SavedQuery' && doc.Meta.DocType !== 'ServerConfig' && doc.Meta.DocType !== 'RunLog') {
        emit(doc.Meta.DocType, null);
    }
};
