function(doc) {
    var Dict;
    var DocType;
    var Field;
    var Dict = doc.DataDictionary;
    if(doc.Meta && doc.Meta.DataDict === true) {

        for(DocType in Dict) if(Dict.hasOwnProperty(DocType)) {
            DocTypeJSON = Dict[DocType];
            for(Field in DocTypeJSON) if (DocTypeJSON.hasOwnProperty(Field)) {
                emit([DocType, Field], DocTypeJSON[Field])
            }
        }
        
    }
}
