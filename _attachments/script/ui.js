/*global document: false, $: false, window: false, Worker: false, defineManager: false, QueryManager: false, popManager: false, jStat: false, FileReader: false, jQuery: false  */
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

function plot(columns, data) {
    var yAxis, i, d, j, column, plots = [], subscale, identifier, dataSetNo = 1, columnData = {},
        mean = data.mean(), stdev = data.stdev(), normal, showNormal = false, normals = [], min = data.min().min(), max = data.max().max(),
        NormalPlot = function (x) { return [x, normal.pdf(x)]; };
    if (document.getElementById("shownormals").checked === true) {
        showNormal = true;
    }
    for (j = 0; j < columns.length; j += 1) {
        column = columns[j].Index;
        yAxis = [];
        for (i = 0; i < data.length; i += 1) {
            identifier = data[i][0].split(',');
            subscale = identifier.pop();
            d = data[i][column];
            if (yAxis[d]) {
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
        if (showNormal) {
            if (columns[j].Header) {
                normal = jStat.normal(mean[column], stdev[column]);
                normals.push({
                    label: 'Normal of ' + columns[j].Header,
                    data: jStat.seq(min, max, 101, NormalPlot),
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
    if (showNormal) {
        plots = plots.concat(normals);
    }
    $.plot("#plotdiv", plots, {
        yaxes: [{}, { position: "right" } ]
    });
}
function populateStatsTable(headers, data) {
    var d = jStat(data),
        tbl = $("#stats"),
        thead = $("#stats thead"),
        tbody = $("#stats tbody"),
        trow,
        i,
        addStatsRow = function (header, data, func) {
            var results = func.call(data),
                i;

            trow = $('<tr><th>' + header + '</th></tr>');
            for (i = 1; i < (results.length - 1); i += 1) {
                trow.append('<td>' + results[i] + '</td>');
            }
            tbody.append(trow);
        },
        quartiles,
        fqrow,
        sqrow,
        tqrow,
        mean,
        cols,
        group_cols,
        xaxis,
        yaxis,
        el,
        groups;

    thead.children().remove();
    thead.append('<tr>');
    trow = $("#stats thead tr");
    trow.append('<th class="header">Measure</th>');
    for (i = 1; i < headers.length; i += 1) {
        trow.append('<th class="header">' + headers[i] + "</th>");
    }

    tbody.children().remove();

    addStatsRow('Minimum', d, d.min);
    addStatsRow('Maximum', d, d.max);
    addStatsRow('Mean', d, d.mean);
    addStatsRow('Standard Deviation', d, d.stdev);
    // I'm not actually sure what these mean
    addStatsRow('Mean Deviation', d, d.meandev);
    addStatsRow('Mean Square Error', d, d.meansqerr);

    quartiles = d.quartiles();
    fqrow = $('<tr><th>First Quartile</th></tr>');
    sqrow = $('<tr><th>Second Quartile</th></tr>');
    tqrow = $('<tr><th>Third Quartile</th></tr>');
    for (i = 1; i < (quartiles.length - 1); i += 1) {
        if (quartiles[i] === null) {
            fqrow.append('<td>null</td>');
            sqrow.append('<td>null</td>');
            tqrow.append('<td>null</td>');
        } else {
            fqrow.append('<td>' + quartiles[i][0] + '</td>');
            sqrow.append('<td>' + quartiles[i][1] + '</td>');
            tqrow.append('<td>' + quartiles[i][2] + '</td>');
        }
    }
    tbody.append(fqrow);
    tbody.append(sqrow);
    tbody.append(tqrow);

    mean = d.mean();
    cols = [];
    group_cols = [];
    for (i = 0; i < mean.length; i += 1) {
        if (!isNaN(mean[i])) {
            cols.push({ Header: headers[i], Index: i });
        } else {
            group_cols.push({ Header: headers[i], Index: i });
        }
    }
    plot(cols, d);

    // Update list of fields for scatterplot
    xaxis = document.getElementById("scatter-xaxis");
    yaxis = document.getElementById("scatter-yaxis");
    $(xaxis).children().remove();
    $(yaxis).children().remove();
    for (i = 0; i < cols.length; i += 1) {
        el = document.createElement('option');
        el.textContent = cols[i].Header;
        el.value = cols[i].Index;
        xaxis.appendChild(el);
        yaxis.appendChild(el.cloneNode(true));
    }
    groups = document.getElementById("scatter-group");
    $(groups).children().remove();
    $(groups).append("<option value=\"ungrouped\">Ungrouped</option>");
    for (i = 1; i < group_cols.length; i += 1) {
        // Start at 1, because grouping by identifier is meaningless
        el = document.createElement('option');
        el.textContent = group_cols[i].Header;
        el.value = group_cols[i].Index;
        groups.appendChild(el);
    }


}
function convertObjectToTable(object) {
    if (worker) {
        worker.terminate();
    }
    worker = new Worker('script/ui.tablerender.js');
    worker.postMessage({ cmd: 'ConvertObject', obj: object, group_level: document.getElementById("group_level").value, SelectedElements: defineManager.getSelectedNames()});
    var progress = document.getElementById("progress"),
        cols = 0,
        headers;

    worker.addEventListener('message', function (e) {
        var i, tbl, thead, trow, headers, headersEl, csvworker;
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
                dataTable.fnDraw();
                headers = [];
                headersEl = $("#data thead th");
                csvworker = new Worker('script/ui.savecsv.js');

                for (i = 0; i < headersEl.length; i += 1) {
                    headers[i] = headersEl[i].textContent;
                }

                csvworker.addEventListener('message', function (e) {
                    var dataURL, link;
                    if (e.data.cmd === 'SaveCSV') {
                        dataURL = window.URL.createObjectURL(e.data.message);
                        link = document.getElementById("DownloadCSV");
                        link.download = "data.csv";
                        link.type = "text/csv";
                        link.href = dataURL;
                        //$(link).click();
                        //window.URL.revokeObjectURL(dataURL);

                    }
                });
                csvworker.postMessage({ cmd: 'SaveFile',
                    data: $("#data").dataTable().fnGetData(),
                    headers: headers
                    });


                populateStatsTable(headers, dataTable.fnGetData().convertNumbers());
                worker.terminate();
            }
        }
    }, true);
    worker.postMessage({ cmd: 'ConvertObject', obj: object, group_level: document.getElementById("group_level").value, SelectedElements: defineManager.getSelectedNames()});
    //return { Headers: columnsIdx, Table: tbl };
}
function PopulateDataTable() {
}



$(document).ready(function () {
    var qmanager = new QueryManager("current_filter"),
        lsFit = function (data) {
            var i = 0, means = jStat(data).mean(),
                xmean = means[0], ymean = means[1], interim = 0,
                numerator  = 0, denominator = 0, slope, xi, yi;

            for (i = 0; i < data.length; i += 1) {
                xi = data[i][0];
                yi = data[i][1];
                numerator += (xi - xmean) * (yi - ymean);
                denominator += ((xi - xmean) * (xi - xmean));
            }

            slope = numerator / denominator;

            return [(ymean - slope * xmean), slope];
        },
        minmaxx = function (arr) {
            var i, min, max;

            for (i = 0; i < arr.length; i += 1) {
                if (arr[i][0] < min || min === undefined) {
                    if (arr[i][0] !== undefined && arr[i][0] !== null) {
                        min = arr[i][0];
                    }
                }
                if (arr[i][0] > max || max === undefined) {
                    if (arr[i][0] !== undefined && arr[i][0] !== null) {
                        max = arr[i][0];
                    }
                }
            }
            return [min, max];
        },
        updateScatterplot = function () {
            var xaxis = document.getElementById("scatter-xaxis").value,
                yaxis = document.getElementById("scatter-yaxis").value,
                grouping = document.getElementById("scatter-group").value,
                data = dataTable.fnGetData(),
                points = [],
                min,
                max,
                field1 = [],
                field2 = [],
                grouped_points = {},
                i = 0,
                group_label,
                minmax,
                LS,
                slope,
                start,
                plots = [],
                label,
                plotY = function (x) { return [x, start + (slope * x)]; },
                dataset;

            for (i = 0; i < data.length; i += 1) {
                points.push([data[i][xaxis], data[i][yaxis]]);
                field1.push(data[i][xaxis]);
                field2.push(data[i][yaxis]);
                if (grouping) {
                    group_label = data[i][grouping];
                    if (!(grouped_points[group_label] instanceof Array)) {
                        grouped_points[group_label] = [];
                    }
                    grouped_points[group_label].push([data[i][xaxis], data[i][yaxis]]);
                }
            }



            if (grouping === 'ungrouped') {
                minmax = minmaxx(points.convertNumbers());
                min = minmax[0];
                max = minmax[1];
                LS = lsFit(points.convertNumbers());
                slope = LS[1];
                start = LS[0];

                $.plot("#scatterplotdiv", [{

                    label: 'Data Points',
                    data: points,
                    points: { show: true }
                }, // Least Squares Fit
                    {
                        label: 'Least Squares Fit',
                        data: jStat.seq(min, max, 3, plotY),
                        lines: { show: true }
                    }], {});
            } else {
                minmax = minmaxx(points.convertNumbers());
                min = minmax[0];
                max = minmax[1];
                i = 0;

                for (dataset in grouped_points) {
                    if (grouped_points.hasOwnProperty(dataset)) {
                        label = document.getElementById("scatter-group").selectedOptions.item().textContent + " = " + dataset;
                        plots.push({
                            color: i,
                            label: dataset,
                            data: grouped_points[dataset],
                            points: { show: true }
                        });
                        LS = lsFit(grouped_points[dataset].convertNumbers());
                        slope = LS[1];
                        start = LS[0];
                        plots.push({
                            color: i,
                            // label: "LS Fit for " + dataset,
                            data: jStat.seq(min, max, 3, plotY),
                            lines: { show: true }
                        });
                        i += 1;
                    }
                }
                $.plot("#scatterplotdiv", plots, {});
            }

            $("#correlationtbl tbody").children().remove();
            $("#correlationtbl tbody").append("<tr><td>" + jStat.covariance(field1, field2) + "</td><td>" + jStat.corrcoeff(field1, field2) + "</td></tr>");
        };
    $("#tabs").tabs();
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
    $("#drawGraph").click(function () {
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
                CompleteBitmask = [],
                WaitForCallback = !(that.populationExplicit()),
                create_callback = function (DocType, docidx, maxdocidx, callback) {
                    return function (data, textStatus) {
                        var i = 0,
                            j = 0,
                            row,
                            elements = Fields[DocType],
                            group_level = document.getElementById("group_level").value,
                            prefix,
                            Completed;
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
                        CompleteBitmask[docidx] = true;
                        Completed = true;
                        for (i = 0; i < maxdocidx; i += 1) {
                            if (CompleteBitmask[i] !== true) {
                                Completed = false;
                            }
                        }

                        if (callback && Completed) {
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
            $("a[href='#ViewData']").fadeTo('fast', 0.25);
            $("a[href='#ViewData']").fadeTo('slow', 1);
        });
    });
    $("#UploadPopulation").change(function (e) {
        var file = e.target.files[0],
            reader = new FileReader();
        reader.onload = function (data) {
            var lines = data.target.result.split("\n"),
                tabDelimited = lines[0].split("\t"),
                commaDelimited = lines[0].split(","),
                delimiter = '\t',
                population = [],
                i = 0;

            if (commaDelimited.length >= tabDelimited.length) {
                delimiter = ',';
            }
            for (i = 0; i < lines.length; i += 1) {
                if (lines[i] !== '') {
                    population.push(lines[i].split(delimiter));
                }

            }

            qmanager.setPopulation(population);
        };
        reader.readAsText(file);
    });
    $("#addAll").click(function () {
        var fields = document.getElementById("fields"),
            allElements = $(fields).children("tbody").children(),
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
            allElements = $(fields).children("tbody").children(),
            curEl,
            i;
        for (i = 0; i < allElements.length; i += 1) {
            curEl = allElements[i];
            if ($(curEl).hasClass("selected")) {
                defineManager.remove(curEl);
            }
        }
    });

    $("#scatter-xaxis").change(updateScatterplot);
    $("#scatter-yaxis").change(updateScatterplot);
    $("#scatter-group").change(updateScatterplot);

    // HTML tooltips courtesy of Tarek
    $(".html_tool_tip_trigger").live("mouseenter", function (event) {
        var trigger = jQuery(this),
            tool_tip_id = trigger.attr("data-tool-tip-id"),
            tool_tip = jQuery("#" + tool_tip_id),
            offset_x = trigger.attr("data-offset-x") || '30',
            offset_y = trigger.attr("data-offset-y") || '0',
            x,
            y;

        if ((tool_tip.css('top') === '' || tool_tip.css('top') === '0px')
                && (tool_tip.css('left') === '' || tool_tip.css('left') === '0px')) {
            x = trigger.position().left + parseInt(offset_x, 10);
            y = trigger.position().top  + parseInt(offset_y, 10);

            tool_tip.css('top',  y + 'px');
            tool_tip.css('left', x + 'px');
        }

        tool_tip.show();
    }).live("mouseleave", function (event) {
        var trigger = jQuery(this),
            tool_tip_id = trigger.attr("data-tool-tip-id"),
            tool_tip = jQuery("#" + tool_tip_id);

        tool_tip.hide();
    });
});
