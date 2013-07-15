function (doc) {
    if (doc.Meta && doc.Meta.DocType === 'SavedQuery' && doc.Meta.user) {
        emit(doc.Meta.user, null);
    }
};
