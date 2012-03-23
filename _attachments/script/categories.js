var Categories = {};
var defineManager;
var popManager;

Categories.list = function(selectBox) {
    var that = this;
    var categories = $.get("_view/categories", { reduce: true, group_level: 2 }, function(d) {
        var i;
        var data = $.parseJSON(d);
        var categoriesSelect = document.getElementById(selectBox);
        var el;
        for(i =0; i < data.rows.length; i++) {
            el = document.createElement("option");
            el.innerText = data.rows[i].key;
            categoriesSelect.appendChild(el);
        }
        $(categoriesSelect).change();
    });

};

Categories.show = function(category, output_div, options) {
    var createOptionElement = function(args) {
        var el, i;
        if(args == null) {
            el = document.createElement("span");
            el.innerText = "Empty";
        } else {
            if(args == "many") {
                el = document.createElement("input");
                el.setAttribute("type", "text");
                el.setAttribute("class", "queryParam");
                return el;
            }
            select = document.createElement("select");
            select.setAttribute("class", "queryParam");
            args = args.sort();
            for(i = 0; i < args.length; i++) {
                el = document.createElement("option");
                el.innerText = args[i];
                select.appendChild(el);
            }
            return select;
        }
        return el;
    }
    var createOperatorElement = function(args) {
        var el, op, i;
        el = document.createElement("select");
        el.setAttribute("class", "queryOp");
        op = document.createElement("option");
        op.textContent = '=';
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

    }
    var fields = $.get("_view/search", { reduce: true, group_level: 2, startkey: 
        '["' + category + '"]',
        endkey: 
        '["' + category + '\u9999"]',
        }, function(d) {
        var i;
        var data = $.parseJSON(d);
        var fieldsSelect = document.getElementById(output_div);
        var el, checkBox;
        fieldsSelect.innerText = '';

        if(fieldsSelect.hasChildNodes()) {
            while(fieldsSelect.childNodes.length >= 1) {
                fieldsSelect.removeChild(fieldsSelect.firstChild);
            }
        }
        for(i =0; i < data.rows.length; i++) {
            if(data.rows[i].value !== null || !options.showOptions) {
                el = document.createElement("div");
                if(options.showOptions) {
                    checkBox = document.createElement("input");
                    checkBox.setAttribute("type", "checkbox");
                    el.appendChild(checkBox);
                }
                el.appendChild(document.createTextNode(data.rows[i].key));
                
                if(options.showOptions) {
                    el.appendChild(createOperatorElement(data.rows[i].value));
                    el.appendChild(createOptionElement(data.rows[i].value));
                }
                el.setAttribute("class", "selectable");

                if(options.selectedManager) {
                    if(options.selectedManager.contains(el.innerText)) {
                        el.setAttribute("class", "selectable selected ui-state-highlight");
                    }
                }
                fieldsSelect.appendChild(el);
            }
        }
    });
};

var SelectedManager = function(divname) {
    var that = this;
    var container = document.getElementById(divname);
    var description = {};
    return {
        add: function(el) {
            $(el).addClass("selected");
            $(el).addClass("ui-state-highlight");
            if(container.tagName == 'DIV') {
                display = document.createElement("div");
                display.innerText = el.innerText;

                display.setAttribute("id", container.id + "_" + el.innerText);
                display.setAttribute("class", "selected");
                container.appendChild(display);
                $(el).children("[type=checkbox]").attr("checked", "checked");
            } else if(container.tagName == 'TBODY') {
                var fieldSplit = el.innerText.split(",");
                $.getJSON("_view/datadictionary", {
                    key: '["' + fieldSplit[0] + '","' + fieldSplit[1] + '"]',
                    reduce: false
                }, (function(el) { return function(data, textStatus) {
                    var display;
                    var cell;
                    display = document.createElement("tr");
                    cell = document.createElement("td");
                    cell.textContent = el.innerText;
                    cell.setAttribute("id", container.id + "_" + el.innerText);
                    cell.setAttribute("class", "selected");
                    display.appendChild(cell);
                    cell = document.createElement("td");
                    if(data && data.rows && data.rows[0] && data.rows[0].value ) {
                        cell.textContent = data.rows[0].value.Description;
                    } else {
                        cell.textContent = "Unknown";
                    }

                    display.appendChild(cell);
                    /*
                    cell = document.createElement("td");
                    if(data && data.rows && data.rows[0]) {
                        cell.textContent = data.rows[0].value.Type;
                    } else {
                        cell.textContent = "Unknown";
                    }
                    */
                    display.appendChild(cell);
                    container.appendChild(display);
                } })(el));

            }
        },
        remove: function(el) {
            var id = container.id + "_" + el.innerText;
            var selecto = document.getElementById(id);
            $(el).removeClass("selected");
            $(el).removeClass("ui-state-highlight");
            if(container.tagName == 'DIV') {
                selecto.parentNode.removeChild(selecto);
                $(el).children("[type=checkbox]").removeAttr("checked");
            } else if(container.tagName == 'TBODY') {
                var parent = $(selecto).parent("tr");
                if(parent.length > 0) {
                    parent[0].parentNode.removeChild(parent[0]);
                }
            }
        },
        toggle: function(el) {
            var jel = $(el);
            if(jel.hasClass("selectable")) {
                if(jel.hasClass("selected")) {
                    this.remove(el);
                } else {
                    this.add(el);
                }
            }
        },
        contains: function(el) {
            var selecto = document.getElementById(container.id + "_" + el);
            if(selecto) { 
                return true;
            } else {
                return false;
            }
        },
        getSelected: function() {
            var selectedEl = $(container).find(".selected");
            var selected = [];
            var i = 0;
            var val;

            for(i = 0; i < selectedEl.length; i++) {
                if(selectedEl[i].childNodes[1]) {
                    val = selectedEl[i].childNodes[1].textContent;
                } else {
                    val = selectedEl[i].textContent;
                }
                if(val && val != '') {
                    selected.push(val);
                }
            }
            return selected;
        },
        getValue: function(id) {
            var allEls = $(container).children();
            var i = 0;

            for(i = 0; i < allEls.length; i++) {
                if(allEls[i].childNodes[1].textContent == id) {
                    return $(allEls[i]).children(".queryParam").val();
                };
            }
        },
        getOperator: function(id) {
            var allEls = $(container).children();
            var i = 0;

            for(i = 0; i < allEls.length; i++) {
                if(allEls[i].childNodes[1].textContent == id) {
                    return $(allEls[i]).children("select.queryOp").val();
                };
            }
        }

    };
};

$(document).ready(function() {
    defineManager = new SelectedManager("selectedfields");
    popManager = new SelectedManager("population_fields");
    Categories.list("categories");
    Categories.list("categories_pop");
    $("#DefinePopulation .selectable").live("click", function(e) {
        el = e.currentTarget;
        popManager.toggle(el);
    });
    $("#DefineFields .selectable").live("click", function(e) {
        el = e.currentTarget;
        defineManager.toggle(el);
        if(QueryRun == true) {
            $("#runquery").click();
        }
    });
});

