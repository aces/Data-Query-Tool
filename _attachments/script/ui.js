var qmanager;
var QueryRun = false;
var worker;
var dataTable;
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

function ConvertObjectToTable(object) {
    if(worker) {
        worker.terminate();
    }
    worker = new Worker('script/ui.tablerender.js');
    var progress = document.getElementById("progress");
    var cols = 0;

    worker.addEventListener('message', function(e) {
        if (e.data.cmd == 'Status') {
            if(e.data.RowNum % 100 == 0) {
                progress.textContent = "Processed " + e.data.RowNum + " / " + e.data.Total
            }
        } else if (e.data.cmd == "PopulateHeaders") {
            if(dataTable && dataTable.fnClearTable) {
                dataTable.fnClearTable();
            }
            var tbl = $("#data");
            var thead = $("#data thead");
            thead.children().remove();
            thead.append('<tr>');
            trow = $("#data thead tr");
            cols = e.data.Headers.length;
            for(var i = 0; i < cols; i += 1) {
                trow.append("<th>" + e.data.Headers[i] + "</th>");
            }
            dataTable = $("#data").dataTable({ 
                bJQueryUI: true, 
                sPaginationType: "full_numbers",
                bDestroy: true
            });
            $("#data").css('width', 'auto');
            dataTable.fnAdjustColumnSizing();

        } else if (e.data.cmd == 'AddRow') {
            if(e.data.RowNum % 100 == 0) {
                progress.textContent = ("Loading data " + e.data.RowNum + " / " + e.data.TotalRows);
            }
            if(dataTable.fnAddData) {
                dataTable.fnAddData(e.data.Row, false);
            }
            if(e.data.RowNum == e.data.TotalRows) {
                progress.textContent = '';
                worker.terminate();
                dataTable.fnDraw();
            }
        }
    });
    worker.postMessage({ cmd: 'ConvertObject', obj: object, group_level: document.getElementById("group_level").value, SelectedElements: defineManager.getSelectedNames()});
    //return { Headers: columnsIdx, Table: tbl };
}
function PopulateDataTable() {
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
        $("#ViewData").css("cursor", "progress");
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
                                DataObject[row.value][row.key[0] + "," + elements[j]] = row.doc.data[elements[j]];
                            }
                        }
                    }
                    if(docidx+1 == maxdocidx && callback) {
                        callback(ConvertObjectToTable(DataObject));
                        $("#ViewData").css("cursor", "auto");
                    }

                }
            }
            for(i = 0; i < fields.length; i++) {
                field_split = $(fields[i]).children()[0].textContent.split(",");
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
                    reduce: false,
                    stale: 'ok'
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
    $("#addAll").click(function() {
        var fields = document.getElementById("fields");
        var allElements = $(fields).children();
        var curEl;
        for(i = 0; i < allElements.length; i++) {
            curEl = allElements[i];
            if(!($(curEl).hasClass("selected"))) {
                defineManager.add(curEl);
            }
        }
        //popManager.toggle(document.getElementById(selected[i]));
    });
    $("#removeAll").click(function() {
        var fields = document.getElementById("fields");
        var allElements = $(fields).children();
        var curEl;
        for(i = 0; i < allElements.length; i++) {
            curEl = allElements[i];
            if($(curEl).hasClass("selected")) {
                defineManager.remove(curEl);
            }
        }
    });
});
