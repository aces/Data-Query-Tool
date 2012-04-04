self.addEventListener('message', function(e) {
    var data = e.data;
    switch(data.cmd) {
        case 'ConvertObject':
            self.RowNum = 0;
            self.GroupLevel = data.group_level;
            self.SelectedElements = data.SelectedElements;
            self.ConvertObjectToTable(data.obj);
            break;
        case 'ConvertResults':
            //self.postMessage(CreateTableBody(data.results);
            break;
        default:
            self.postMessage('Unknown cmd');
            break;
    }
});

self.ConvertObjectToTable = function (obj) {
    var tbl = [];
    var tblrow = [];
    var objrow;
    var columnsIdx = ['Identifier'];
    var group_level = self.GroupLevel;
    var Selected = self.SelectedElements;
    var prefix, sPrefix;
    var FieldName;
    var i = parseInt(group_level, 10), j;
    var existingRows = {}
    var Prefixes = [];
    var numEls = Object.keys(obj).length;
    var numProcessed = 0;
    var numRows = Object.keys(existingRows);
    self.RowNum = 0;
    for(el in obj) if(obj.hasOwnProperty(el)) {
            identifier = el.split(',');
            i = parseInt(group_level, 10);
            prefix = [];
            while(i--) {
                prefix.push(identifier.pop());
            }
            sPrefix = prefix.join("_").toUpperCase();
            row = new Array((Selected.length*(group_level+1))+1);
            row[0] = identifier.join(",");
            for(j = 1; j < row.length; j++) {
                row[j] = '.';
            }
            existingRows[identifier.join(",")] = row;
            if(Prefixes.indexOf(sPrefix) === -1) {
                Prefixes.push(sPrefix);
            }
    }
    Prefixes.sort();

    i = 0;
    for(i = 0; i < Selected.length; i++) {

        for(var j = 0; j < Prefixes.length; j++) {
            prefix = Prefixes[j];
            if(prefix) {
                columnsIdx[1 + i + (Selected.length*j)] = Prefixes[j] + "_" +  Selected[i];
            } else {
                columnsIdx[1 + i + (Selected.length*j)] = Selected[i];
            }
        }
    }
    // Instruct the main thread to create the table headers
    self.postMessage({ cmd: 'PopulateHeaders', Headers: columnsIdx});

    // Now go through the data, and convert it to rows. Join the different
    // documents together into a single array if there's multiple instruments
    // and add the prefix to put everything in its right column.
    numProcessed = 0;
    for(el in obj) if(obj.hasOwnProperty(el)) {
            numProcessed +=1;

            identifier = el.split(',');
            i = parseInt(group_level, 10);
            prefix = [];
            while(i--) {
                prefix.push(identifier.pop());
            }
            sPrefix = prefix.join("_").toUpperCase();

            tblrow = existingRows[identifier.join(",")];
            objrow = obj[el];
            for(j = 0; j < Selected.length; j++) if(objrow.hasOwnProperty(Selected[j])) {
                var FieldName;
                if(sPrefix) {
                    FieldName = sPrefix + "_" + Selected[j];
                } else {
                    FieldName = Selected[j];
                }
                idx = columnsIdx.indexOf(FieldName);
                val = objrow[Selected[j]];
                if(val === undefined || val === null) {
                    tblrow[idx] = '.';
                } else {
                    tblrow[idx] = objrow[Selected[j]];
                }
            }
            self.RowNum = numProcessed;
            self.postMessage({ cmd: 'Status', RowNum: numProcessed, Total: numEls });
    }


    // Data has been processed, send message to begin adding it to the table. Include RowNum and
    // TotalRows so that we can update a status.
    numRows = Object.keys(existingRows).length;
    var i = 1;
    for(el in existingRows) if(existingRows.hasOwnProperty(el)) {
        self.postMessage({ cmd: 'AddRow', Row: existingRows[el], RowNum: i, TotalRows: numRows });
        i += 1;
    }
    self.close();

    /*
    results = { Headers: columnsIdx, Table: tbl };
    self.postMessage({ cmd: 'ConvertResults', results: results});
    self.EmitTableBody(tbl);
    */
}

self.createElement = function(str) {
    var el = { TagName: str, children: [], textContent: ''};
    el.appendChild = function(child) { 
        this.children.push(child);
    }
    el.render = function() {
        if(this.children.length == 0 && this.textContent == '') {
            return "<" + this.TagName + " />";
        }
        var rendered = "<" + this.TagName + ">";
        if(this.hasOwnProperty('textContent') && this.textContent != '') {
            rendered += this.textContent;
        }
        if(this.children.length > 0) {
            for(var i = 0; i < this.children.length; i += 1) {
                if(this.children.hasOwnProperty(i)) {
                rendered += this.children[i].render();
                }
                
            }
        }
        rendered += "</" + this.TagName + ">";
        return rendered;
    }

    return el;

}

self.EmitTableBody = function(tbl) {
    return;
}
self.CreateTableBody = function(Obj) {
    var row = self.createElement("tr");
    var section;
    var cell;
    var i = 0;
    var tbl = self.createElement("table");
    for(i = 0; i < Obj.Headers.length; i++) {
        cell = self.createElement("th");
        cell.textContent = Obj.Headers[i];
        row.appendChild(cell);
    }

    row.render();
    section = self.createElement("thead");
    section.appendChild(row);

    tbl.appendChild(section);

    section = self.createElement("tbody");
    var length = Obj.Table.length;
    for(i = 0; i < length; i++) {
        row = self.createElement("tr");
        for(j = 0; j < Obj.Headers.length; j++) {
            cell = self.createElement("td");
            if(Obj.Table[i][j] === undefined) {
                cell.textContent = ".";
            } else {
                cell.textContent = Obj.Table[i][j];
            }
            row.appendChild(cell);
        }
        section.appendChild(row);
        self.postMessage({ cmd: 'Status', RowNum: i, Total: length});

    }
    tbl.appendChild(section);
    self.postMessage({ cmd: 'CreateTableResults', Table: tbl.render()});
    //console.log(Obj);
}
