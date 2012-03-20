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
    for(el in obj) {
        if(obj.hasOwnProperty(el)) {
            tblrow = [el];
            objrow = obj[el];
            for(col in objrow) {
                if(objrow.hasOwnProperty(col)) {
                    if(columnsIdx.indexOf(col) === -1) {
                        columnsIdx.push(col);
                    }
                    idx = columnsIdx.indexOf(col);
                    tblrow[idx] = objrow[col];
                }
            }
            tbl.push(tblrow);

        }
    }

    return { Headers: columnsIdx, Table: tbl };
}

function PopulateDataTable(Obj) {
    $("#data").dataTable().fnDestroy();
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
            cell.textContent = Obj.Table[i][j];
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
    resizeAll();
    $(window).resize(resizeAll);
    $("#newpopulation").click(function() {
        var selected = popManager.getSelected();
        var i;
        for(i = 0; i < selected.length; i++) {
            qmanager.add(selected[i], popManager.getValue(selected[i]), "=");

            popManager.toggle(document.getElementById(selected[i]));
        }
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
                    for(i = 0; i < data.rows.length; i++) {
                        row = data.rows[i];
                        if(sessions.contains(row.value)) {
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
        });
    });
    //$("#data").dataTable();
});
