function(doc) {
    var DocType;
    var Field;
    var Dict = doc.DataDictionary;
    var attachments = doc._attachments;
    if(doc._attachments) {
        for(file in attachments ) if(attachments.hasOwnProperty(file)) {
            emit(file, attachments[file]);
        }
    }
}
