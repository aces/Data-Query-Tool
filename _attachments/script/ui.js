/*global document: false, $: false, window: false, Worker: false, defineManager: false, QueryManager: false, popManager: false, BlobBuilder: false, saveAs: false */
"use strict";
var qmanager;
var QueryRun = false;
var worker;
var dataTable;
var resizeAll = function () {
    var header = $(".ui-tabs-nav"),
        tabs = $("#tabs"),
        windowSize = window.innerHeight,
        workspace_height,
        halfsizes;
    tabs.css("height", windowSize - 25);
    workspace_height = tabs.outerHeight() - header.outerHeight();
    workspace_height -= 15;
    $(".ui-tabs-panel").css("height", workspace_height);
    halfsizes = $(".half");
    $(".half").css("height", (workspace_height / 2) - 5);
};

function convertObjectToTable(object) {
    if (worker) {
        worker.terminate();
    }
    worker = new Worker('script/ui.tablerender.js');
    var progress = document.getElementById("progress"),
        cols = 0;

    worker.addEventListener('message', function (e) {
        var i, tbl, thead, trow;
        if (e.data.cmd === 'Status') {
            progress.textContent = "Processed " + e.data.RowNum + " / " + e.data.Total;
        } else if (e.data.cmd === "PopulateHeaders") {
            if (dataTable && dataTable.fnClearTable) {
                dataTable.fnClearTable();
            }
            tbl = $("#data");
            thead = $("#data thead");
            thead.children().remove();
            thead.append('<tr>');
            trow = $("#data thead tr");
            cols = e.data.Headers.length;
            for (i = 0; i < cols; i += 1) {
                trow.append("<th>" + e.data.Headers[i] + "</th>");
            }
            dataTable = $("#data").dataTable({
                bJQueryUI: true,
                sPaginationType: "full_numbers",
                bDestroy: true
            });
            $("#data").css('width', 'auto');
            dataTable.fnAdjustColumnSizing();

        } else if (e.data.cmd === 'AddRow') {
            progress.textContent = ("Loading data " + e.data.RowNum + " / " + e.data.TotalRows);
            if (dataTable.fnAddData) {
                dataTable.fnAddData(e.data.Row, false);
            }
            if (e.data.RowNum === e.data.TotalRows) {
                progress.textContent = '';
                worker.terminate();
                dataTable.fnDraw();
            }
        }
    }, true);
    worker.postMessage({ cmd: 'ConvertObject', obj: object, group_level: document.getElementById("group_level").value, SelectedElements: defineManager.getSelectedNames()});
    //return { Headers: columnsIdx, Table: tbl };
}
function PopulateDataTable() {
}

$(document).ready(function () {
    var qmanager = new QueryManager("current_filter");
    $("#tabs").tabs();
    //$("#tabs a[href='#ViewPopulation']").hide();
    resizeAll();
    $(window).resize(resizeAll);
    $("#newpopulation").click(function () {
        var selected = popManager.getSelected(),
            i;
        for (i = 0; i < selected.length; i += 1) {
            qmanager.add(selected[i], popManager.getValue(selected[i]), popManager.getOperator(selected[i]));

            popManager.toggle(document.getElementById(selected[i]));
        }
        QueryRun = true;
        $("#runquery").click();
    });
    $("#runquery").click(function () {
        var that = qmanager;
        QueryRun = true;
        $("#ViewData").css("cursor", "progress");
        qmanager.run(function () {
            var fields = defineManager.getSelected(),
                sessions = that.getSessions(),
                field_split,
                DocTypes = [],
                i = 0,
                Fields = {},
                DataObject = {},
                create_callback = function (DocType, docidx, maxdocidx, callback) {
                    return function (data, textStatus) {
                        var i = 0,
                            j = 0,
                            row,
                            elements = Fields[DocType],
                            group_level = document.getElementById("group_level").value,
                            prefix;
                        for (i = 0; i < data.rows.length; i += 1) {
                            row = data.rows[i];
                            prefix = row.value.clone();
                            j = group_level;
                            while (j > 0) {
                                j -= 1;
                                prefix.pop();
                            }
                            if (sessions.containsPrefix(prefix)) {
                                for (j = 0; j < elements.length; j += 1) {
                                    if (!DataObject[row.value]) {
                                        DataObject[row.value] = [];
                                    }
                                    if (row.doc.data) {
                                        DataObject[row.value][row.key[0] + "," + elements[j]] = row.doc.data[elements[j]];
                                    } else {
                                        DataObject[row.value][row.key[0] + "," + elements[j]] = '.';
                                    }
                                }
                            }
                        }
                        if (docidx + 1 === maxdocidx && callback) {
                            callback(convertObjectToTable(DataObject));
                            $("#ViewData").css("cursor", "auto");
                        }

                    };
                };
            for (i = 0; i < fields.length; i += 1) {
                field_split = $(fields[i]).children()[0].textContent.split(",");
                DocTypes.push(field_split[0]);
                if (Fields[field_split[0]] === undefined) {
                    Fields[field_split[0]] = [];
                }
                Fields[field_split[0]].push(field_split[1]);
            }

            DocTypes = DocTypes.unique();

            for (i = 0; i < DocTypes.length; i += 1) {
                $.getJSON("_view/instruments", {
                    startkey: '["' + DocTypes[i] + '"]',
                    endkey: '["' + DocTypes[i] + '", {}]',
                    include_docs: true,
                    reduce: false,
                    stale: 'ok'
                }, create_callback(DocTypes[i], i, DocTypes.length, PopulateDataTable));
            }
            document.getElementById("current_sessions").textContent = "[" + sessions.join("], [") + "]";
            $("a[href='#ViewData']").fadeTo('fast', 0.25); $("a[href='#ViewData']").fadeTo('slow', 1);
        });
    });
    $("#DownloadCSV").click(function () {
        var i = 0,
            data = $("#data").dataTable().fnGetData(),
            headers = $("#data thead th"),
            row = [],
            content = new BlobBuilder(),
            escapeQuote = function (val) { return val.replace('"', '""'); },
            fs;
        for (i = 0; i < headers.length; i += 1) {
            row[i] = headers[i].textContent;
        }
        row = row.map(function (val) { return val.replace('"', '""'); });
        //console.log('"' + row.join('","') + '"');
        content.append('"' + row.join('","') + '"' + "\r\n");
        for (i = 0; i < data.length; i += 1) {
            row = data[i].map(escapeQuote);
            content.append('"' + row.join('","') + '"' + "\r\n");
            //console.log('"' + row.join('","') + '"');
        }
        fs = saveAs(content.getBlob("text/csv;charset=utf-8"), "data.csv");

    });
    $("#addAll").click(function () {
        var fields = document.getElementById("fields"),
            allElements = $(fields).children(),
            curEl,
            i;
        for (i = 0; i < allElements.length; i += 1) {
            curEl = allElements[i];
            if (!($(curEl).hasClass("selected"))) {
                defineManager.add(curEl);
            }
        }
        //popManager.toggle(document.getElementById(selected[i]));
    });
    $("#removeAll").click(function () {
        var fields = document.getElementById("fields"),
            allElements = $(fields).children(),
            curEl,
            i;
        for (i = 0; i < allElements.length; i += 1) {
            curEl = allElements[i];
            if ($(curEl).hasClass("selected")) {
                defineManager.remove(curEl);
            }
        }
    });
});
