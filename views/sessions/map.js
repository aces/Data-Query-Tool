function(doc) {
    if(doc.Meta && doc.Meta.DocType && doc.Meta.identifier) {
        emit(doc.Meta.identifier, null)
    }
}
