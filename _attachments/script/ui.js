var qmanager;
var QueryRun = false;
var resizeAll = function() {
    var header = $(".ui-tabs-nav");
    var tabs = $("#tabs");
    var windowSize = window.innerHeight;
    tabs.css("height", windowSize-25);
    var workspace_height = tabs.outerHeight() - header.outerHeight(); //tabs[0].clientHeight - header[0].clientHeight;
    workspace_height -= 15;
    $(".ui-tabs-panel").css("height", workspace_height);;
    var halfsizes = $(".half");
    $(".half").css("height", (workspace_height / 2) - 5);
}

function ConvertObjectToTable(obj) {
    var tbl = [];
    var tblrow = [];
    var objrow;
    var columnsIdx = ['Identifier'];
    var group_level = document.getElementById("group_level").value;
    var prefix, sPrefix;
    var FieldName;
    var i = parseInt(group_level, 10);
    var existingRows = {}
    var Prefixes = [];
    for(el in obj) if(obj.hasOwnProperty(el)) {
            identifier = el.split(',');
            i = parseInt(group_level, 10);
            prefix = [];
            while(i--) {
                prefix.push(identifier.pop());
            }
            sPrefix = prefix.join("_").toUpperCase();
            if(Prefixes.indexOf(sPrefix) === -1) {
                Prefixes.push(sPrefix);
                Prefixes.sort();
            }

            if(existingRows[identifier]) {
                tblrow = existingRows[identifier];
            } else {
                tblrow = [identifier.join(",")];
                existingRows[identifier] = tblrow;
            }
            objrow = obj[el];
            for(col in objrow) if(objrow.hasOwnProperty(col)) {
                var FieldName;
                if(sPrefix) {
                    FieldName = sPrefix + "_" + col;
                } else {
                    FieldName = col;
                }
                if(columnsIdx.indexOf(FieldName) === -1) {
                    columnsIdx.push(FieldName);
                }
                idx = columnsIdx.indexOf(FieldName);
                tblrow[idx] = objrow[col];
            }
    }
    for(el in existingRows) if(existingRows.hasOwnProperty(el)) {
        tbl.push(existingRows[el]);
    }

    return { Headers: columnsIdx, Table: tbl };
}

function PopulateDataTable(Obj) {
    $("#data").dataTable().fnDestroy();
    $("#data").css('width', '');
    var tbl = document.getElementById("data");
    var row = document.createElement("tr");
    var section;
    var cell;
    var i = 0;
    $(tbl).children().remove();
    for(i = 0; i < Obj.Headers.length; i++) {
        cell = document.createElement("th");
        cell.textContent = Obj.Headers[i];
        row.appendChild(cell);
    }

    section = document.createElement("thead");
    section.appendChild(row);

    tbl.appendChild(section);

    section = document.createElement("tbody");
    for(i = 0; i < Obj.Table.length; i++) {
        row = document.createElement("tr");
        for(j = 0; j < Obj.Headers.length; j++) {
            cell = document.createElement("td");
            if(Obj.Table[i][j] === undefined) {
                cell.textContent = ".";
            } else {
                cell.textContent = Obj.Table[i][j];
            }

            row.appendChild(cell);
        }
        section.appendChild(row);

    }
    tbl.appendChild(section);
    $("#data").dataTable();

    //console.log(Obj);
}
$(document).ready(function() {
    qmanager = new QueryManager("current_filter");
    $("#tabs").tabs();
    //$("#tabs a[href='#ViewPopulation']").hide();
    resizeAll();
    $(window).resize(resizeAll);
    $("#newpopulation").click(function() {
        var selected = popManager.getSelected();
        var i;
        for(i = 0; i < selected.length; i++) {
            qmanager.add(selected[i], popManager.getValue(selected[i]), popManager.getOperator(selected[i]));

            popManager.toggle(document.getElementById(selected[i]));
        }
        QueryRun = true;
        $("#runquery").click();
    });
    $("#runquery").click(function() {
        var that = qmanager;
        QueryRun = true;
        qmanager.run(function() {
            var fields = defineManager.getSelected();
            var sessions = that.getSessions();
            var field_split = undefined;
            var DocTypes = [];
            var i = 0;
            var Fields = {};
            var DataObject = {};
            var create_callback = function(DocType, docidx, maxdocidx, callback) {
                return function(data, textStatus) {
                    var i = 0, j = 0;
                    var row = undefined;
                    var elements = Fields[DocType];
                    var group_level = document.getElementById("group_level").value;
                    var prefix;
                    for(i = 0; i < data.rows.length; i++) {
                        row = data.rows[i];
                        prefix = row.value.clone();
                        j = group_level;
                        while(j--) {
                            prefix.pop();
                        }
                        if(sessions.containsPrefix(prefix)) {
                            for(j = 0; j < elements.length; j++) {
                                if(!DataObject[row.value]) {
                                    DataObject[row.value] = [];
                                }
                                DataObject[row.value][elements[j]] = row.doc.data[elements[j]];
                            }
                        }
                    }
                    if(docidx+1 == maxdocidx && callback) {
                        callback(ConvertObjectToTable(DataObject));
                    }

                }
            }
            for(i = 0; i < fields.length; i++) {
                field_split = fields[i].split(",");
                DocTypes.push(field_split[0]);
                if(Fields[field_split[0]] == undefined) {
                    Fields[field_split[0]] = [];
                }
                Fields[field_split[0]].push(field_split[1]);
            }

            DocTypes = DocTypes.unique();

            for(i = 0; i < DocTypes.length; i++) {
                $.getJSON("_view/instruments", {
                    startkey: '["' + DocTypes[i]+ '"]',
                    endkey: '["' + DocTypes[i]+ '", {}]',
                    include_docs: true,
                    reduce: false
                }, create_callback(DocTypes[i], i, DocTypes.length, PopulateDataTable));
            }
            document.getElementById("current_sessions").textContent = "[" + sessions.join("], [") + "]";
            $("a[href='#ViewData']").fadeTo('fast', 0.25); $("a[href='#ViewData']").fadeTo('slow', 1);
        });
    });
    $("#DownloadCSV").click(function() {
        var i = 0;
        var data = $("#data").dataTable().fnGetData();
        var headers = $("#data thead th");
        var row = [];
        var content = new BlobBuilder();
        for(i = 0; i < headers.length; i++) {
            row[i] = headers[i].textContent;
        }
        row = row.map(function(val) { return val.replace('"', '""') });
        //console.log('"' + row.join('","') + '"');
        content.append('"' + row.join('","') + '"' + "\r\n");
        for(i = 0; i < data.length; i++) {
            row = data[i].map(function(val) { return val.replace('"', '""'); });
            content.append('"' + row.join('","') + '"' + "\r\n");
            //console.log('"' + row.join('","') + '"');
        }
        var fs = saveAs(content.getBlob("text/csv;charset=utf-8"), "data.csv");

    });
});
