/*global document: false, $: false, QueryRun: false */
"use strict";
var Categories = {};
var defineManager;
var popManager;

var helpers = {};
helpers.addCell = function (row, value) {
    var el = document.createElement("td");
    el.textContent = value;
    row.appendChild(el);
    return row;
};

helpers.createInputForType = function (type) {
    var select, options, el, i, option_str;
    if (type.indexOf('enum') === 0) {
        select = document.createElement("select");
        select.setAttribute("class", "queryParam");
        options = type.substring(5, type.length - 1).split(",");
        for (i = 0; i < options.length; i += 1) {
            option_str = $.trim(options[i]);
            el = document.createElement("option");
            el.textContent = option_str.substring(1, option_str.length - 1);
            select.appendChild(el);
        }
        return select;
    }
    /* jslint prefers the falling through to having an else with a return
     * so consider below to be "else" .. */
    el = document.createElement("input");
    el.setAttribute("type", "text");
    el.setAttribute("class", "queryParam");
    return el;
};

helpers.createOperatorElement = function (args) {
    var el, op, i;
    el = document.createElement("select");
    el.setAttribute("class", "queryOp");
    op = document.createElement("option");
    op.textContent = '=';
    el.appendChild(op);
    op = document.createElement("option");
    op.textContent = '!=';
    el.appendChild(op);
    op = document.createElement("option");
    op.textContent = '<=';
    el.appendChild(op);
    op = document.createElement("option");
    op.textContent = '>=';
    el.appendChild(op);
    op = document.createElement("option");
    op.textContent = "startsWith";
    el.appendChild(op);

    return el;
};

helpers.createValueInputForField = function (fieldname, cell) {
    var i, split_fieldname = fieldname.split(","),
        jKey = '["' + split_fieldname.join('","') + '"]',
        fields;
    fields = $.getJSON("_view/datadictionary", {
        key: jKey,
        reduce: false
    }, function (d) {
        var type, el;
        type = d.rows[0].value.Type;
        el = helpers.createInputForType(type);
        cell.appendChild(el);
    });
};


Categories.list = function (selectBox) {
    var that = this, categories;
    $.ajaxSetup({'beforeSend': function (xhr) {
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain");
        }
    }});

    categories = $.ajax({
        url: "_view/categories",
        dataType: 'json',
        data: { reduce: true, group_level: 2 },
        success: function (data) {
            var i, el, categoriesSelect = document.getElementById(selectBox);
            for (i = 0; i < data.rows.length; i += 1) {
                el = document.createElement("option");
                el.textContent = data.rows[i].key;
                categoriesSelect.appendChild(el);
            }
            $(categoriesSelect).change();
        },
        error: function (e) {
        }
    });

};

Categories.show = function (category, output_div, options) {
    var createOptionElement = function (args) {
        var el, i, options, option_str;
        if (args === null || args.Type === undefined) {
            el = document.createElement("span");
            el.textContent = "Empty";
        }
        return el;
    };
    $("#tabs").css("cursor", "progress");
    $.get("_view/datadictionary", {
        reduce: false,
        startkey: '["' + category + '"]',
        endkey: '["' + category + '\u9999"]',
    }, function (d) {
        var i,
            data = $.parseJSON(d),
            fieldsSelect = document.getElementById(output_div),
            el,
            checkBox,
            row;
        fieldsSelect.textContent = '';

        // Remove the previous category
        if (fieldsSelect.hasChildNodes()) {
            while (fieldsSelect.childNodes.length >= 1) {
                fieldsSelect.removeChild(fieldsSelect.firstChild);
            }
        }

        for (i = 0; i < data.rows.length; i += 1) {
            if (data.rows[i].value !== null || !options.showOptions) {
                row = document.createElement("tr");

                if (options.selectedManager && options.selectedManager.contains(data.rows[i].key)) {
                    row.setAttribute("class", "selectable selected ui-state-highlight");
                } else {
                    row.setAttribute("class", "selectable");
                }

                row = helpers.addCell(row, data.rows[i].key);
                row = helpers.addCell(row, data.rows[i].value.Description);

                fieldsSelect.appendChild(row);
            }
        }
        $("#tabs").css("cursor", "auto");
    });
};

var SelectedManager = function (divname, options) {
    var that = this,
        container = document.getElementById(divname),
        description = {};
    return {
        add: function (el) {
            var AddedRow, ClickedRow, FieldName, Description, cell, i, row;
            if (!$(el).hasClass("selectable")) {
                return;
            }
            $(el).addClass("selected");
            $(el).addClass("ui-state-highlight");
            if (container.tagName === 'TBODY') {
                ClickedRow = $(el).children();

                FieldName = ClickedRow[0].textContent;
                Description = ClickedRow[1].textContent;

                row = document.createElement("tr");
                row.setAttribute("id", container.id + "_" + FieldName);

                for (i = 0; i < options.order.length; i += 1) {
                    if (options.order[i] === "field") {
                        row = helpers.addCell(row, FieldName);
                    } else if (options.order[i] === "description") {
                        row = helpers.addCell(row, Description);
                    } else if (options.order[i] === "operator") {
                        row.appendChild(helpers.createOperatorElement());
                    } else if (options.order[i] === "value") {
                        cell = document.createElement("td");
                        row.appendChild(cell);
                        helpers.createValueInputForField(FieldName, cell);
                    } else if (options.order[i] === "sessions") {
                        row = helpers.addCell(row, "");
                    } else {
                        row = helpers.addCell(row, options.order[i]);
                    }
                }

                container.appendChild(row);

            }
        },
        remove: function (el) {
            var id = container.id + "_" + $(el).children()[0].textContent,
                selecto = document.getElementById(id);
            $(el).removeClass("selected");
            $(el).removeClass("ui-state-highlight");
            if (selecto && selecto.parentNode) {
                selecto.parentNode.removeChild(selecto);
            }
        },
        toggle: function (el) {
            var jel = $(el);
            if (jel.hasClass("selectable")) {
                if (jel.hasClass("selected")) {
                    this.remove(el);
                } else {
                    this.add(el);
                }
            }
        },
        contains: function (el) {
            var selecto = document.getElementById(container.id + "_" + el);
            if (selecto) {
                return true;
            }
            return false;
        },
        setSessions: function (fieldname, value) {
            var i, selecto, span;
            selecto = document.getElementById(container.id + "_" + fieldname);
            for (i = 0; i < options.order.length; i += 1) {
                if (options.order[i] === 'sessions') {
                    span = document.createElement("span");
                    span.textContent = "See sessions";
                    span.setAttribute("title", "[" + value.join(", ") + "]");

                    $(selecto).children()[i].appendChild(span);
                    //textContent  = "<span title=\"" + value.join(", ") + "]\">See sessions</span>";
                }
            }
        },
        getSelected: function () {
            var selectedEl = $(container).children("tr");
            return selectedEl;
        },
        getSelectedNames: function () {
            var selectedEl = $(container).children("tr"),
                selected = [],
                i = 0,
                val;

            for (i = 0; i < selectedEl.length; i += 1) {
                val = selectedEl[i].childNodes[0].textContent;
                if (val && val !== '') {
                    selected.push(val);
                }
            }
            return selected;
        },
        getValue: function (id) {
            var allEls = $(container).children(),
                i = 0;

            for (i = 0; i < allEls.length; i += 1) {
                if (allEls[i].childNodes[1].textContent === id) {
                    return $(allEls[i]).children(".queryParam").val();
                }
            }
        },
        getOperator: function (id) {
            var allEls, i;
            allEls = $(container).children();
            i = 0;

            for (i = 0; i < allEls.length; i += 1) {
                if (allEls[i].childNodes[1].textContent === id) {
                    return $(allEls[i]).children("select.queryOp").val();
                }
            }
        }

    };
};

$(document).ready(function () {
    defineManager = new SelectedManager("selectedfields", { order: ["field", "description"] });
    popManager = new SelectedManager("population_selected", { order: ["field", "operator", "value", "sessions"] });
    Categories.list("categories");
    Categories.list("categories_pop");
    $("#DefinePopulation .selectable").live("click", function (e) {
        var el = e.currentTarget;
        popManager.toggle(el);
    });
    $("#DefineFields .selectable").live("click", function (e) {
        var el = e.currentTarget;
        defineManager.toggle(el);
        if (QueryRun === true) {
            $("#runquery").click();
        }
    });
});

