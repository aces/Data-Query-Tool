function (doc) {
    if (doc.Meta && doc.Meta.DocType === 'RunLog') {
        emit(doc.RunInfo.Time, doc.RunInfo );
    }
}
