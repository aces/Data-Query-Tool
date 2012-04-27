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
        cols = 0,
        headers;

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
            headers = e.data.Headers;

        } else if (e.data.cmd === 'AddRow') {
            progress.textContent = ("Loading data " + e.data.RowNum + " / " + e.data.TotalRows);
            if (dataTable.fnAddData) {
                dataTable.fnAddData(e.data.Row, false);
            }
            if (e.data.RowNum === e.data.TotalRows) {
                progress.textContent = '';
                worker.terminate();
                dataTable.fnDraw();
                PopulateStatsTable(headers, dataTable.fnGetData().convertNumbers());
            }
        }
    }, true);
    worker.postMessage({ cmd: 'ConvertObject', obj: object, group_level: document.getElementById("group_level").value, SelectedElements: defineManager.getSelectedNames()});
    //return { Headers: columnsIdx, Table: tbl };
}
function PopulateDataTable() {
}

function PopulateStatsTable (headers, data)  {
    var d = jStat(data),
        tbl = $("#stats"),
        thead = $("#stats thead"),
        tbody = $("#stats tbody"),
        trow,
        i;

    thead.children().remove();
    thead.append('<tr>');
    trow = $("#stats thead tr");
    trow.append('<th class="header">Measure</th>');
    for(i = 1; i < headers.length; i += 1) {
        trow.append('<th class="header">' + headers[i] + "</th>");
    }

    tbody.children().remove();

    var addStatsRow = function(header, data, func) {
        var results = func.call(data)

        trow = $('<tr><th>' + header + '</th></tr>');
        for(i = 1; i < (results.length - 1); i++) {
            trow.append('<td>' + results[i] + '</td>');
        }
        tbody.append(trow);
    }

    addStatsRow('Minimum', d, d.min);
    addStatsRow('Maximum', d, d.max);
    addStatsRow('Mean', d, d.mean);
    addStatsRow('Standard Deviation', d, d.stdev);
    // I'm not actually sure what these mean
    addStatsRow('Mean Deviation', d, d.meandev);
    addStatsRow('Mean Square Error', d, d.meansqerr);

    var quartiles = d.quartiles();
    var fqrow = $('<tr><th>First Quartile</th></tr>');
    var sqrow = $('<tr><th>Second Quartile</th></tr>');
    var tqrow = $('<tr><th>Third Quartile</th></tr>');
    for(i = 1; i < (quartiles.length-1); i++) {
        fqrow.append('<td>' + quartiles[i][0] + '</td>');
        sqrow.append('<td>' + quartiles[i][1] + '</td>');
        tqrow.append('<td>' + quartiles[i][2] + '</td>');
    }
    tbody.append(fqrow);
    tbody.append(sqrow);
    tbody.append(tqrow);

    var mean = d.mean();
    var cols = []
    for(i = 0; i < mean.length; i++) {
        if(!isNaN(mean[i])) {
            console.log('Column' + i + 'is numerical. Should plot');
            cols.push({ Header: headers[i], Index: i });
        }
    }
    plot(cols, d);

}
function plot(columns, data) {
    var yAxis, i, d, j , column, plots = [], subscale, identifier, dataSetNo = 1, columnData = {},
        mean = data.mean(), stdev = data.stdev(), normal, showNormal = false, normals = [], min = data.min().min(), max = data.max().max();
    if(document.getElementById("shownormals").checked === true) {
        showNormal = true;
    }
    for(j = 0; j < columns.length; j += 1) {
        column = columns[j].Index;
        yAxis = [];
        for(i = 0; i < data.length; i += 1) {
            identifier = data[i][0].split(',');
            subscale = identifier.pop();
            d = data[i][column];
            if(yAxis[d]) {
                yAxis[d][1] += 1;
            } else {
                yAxis[d] = [d, 1];
            }
        }
        plots.push({
            label: columns[j].Header,
            data: yAxis,
            stack: false,
            //xaxis: dataSetNo,
            lines: { show: false, steps: false },
            bars: { show: true, barWidth: 0.9, align: 'center' }
        });
        if(showNormal) {
            if(columns[j].Header) {
                normal = jStat.normal(mean[column], stdev[column]);
                normals.push({
                    label: 'Normal of ' + columns[j].Header,
                    data: jStat.seq(min, max, 101, function(x) { return [x, normal.pdf(x)] }),
                    //xaxis: 2,
                    yaxis: 2,
                    lines: { show: true, fill: true },
                    bars: { show: false }
                });
            }
        }
        dataSetNo += 1;
    }
    // Normals are put into a separate array and concatenated so
    // that we don't lose the order/colour of the already existing
    // fields when "show normals" is toggled
    if(showNormal) {
        plots = plots.concat(normals);
    }
    $.plot("#plotdiv", plots, {
        yaxes: [{}, { position: "right" } ]
    });
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
    $("#shownormals").click(function () {
        // All the data is already cached, so just rerun it to
        // update the graph
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
