var Categories = {};
var defineManager;
var popManager;

Categories.list = function(selectBox) {
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
                return el;
            }
            select = document.createElement("select");
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
                    el.appendChild(createOptionElement(data.rows[i].value));
                }
                el.setAttribute("class", "selectable");

                if(options.selectedManager) {
                    if(options.selectedManager.contains(el.innerText)) {
                        el.setAttribute("class", "selectable selected");
                    }
                }
                fieldsSelect.appendChild(el);
            }
        }
    });
};

var SelectedManager = function(divname) {
    var that = this;
    var div = document.getElementById(divname);
    return {
        add: function(el) {
            $(el).addClass("selected");
            display = document.createElement("div");
            display.innerText = el.innerText;

            display.setAttribute("id", div.id + "_" + el.innerText);
            display.setAttribute("class", "selected");
            div.appendChild(display);
            $(el).children("[type=checkbox]").attr("checked", "checked");
        },
        remove: function(el) {
            $(el).removeClass("selected");
            var id = div.id + "_" + el.innerText;
            var selecto = document.getElementById(id);
            selecto.parentNode.removeChild(selecto);
            $(el).children("[type=checkbox]").removeAttr("checked");
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
            var selecto = document.getElementById(div.id + "_" + el);
            if(selecto) { 
                return true;
            } else {
                return false;
            }
        },
        getSelected: function() {
            var selectedEl = $(div).children(".selected");
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
            var allEls = $(div).children();
            var i = 0;

            for(i = 0; i < allEls.length; i++) {
                if(allEls[i].childNodes[1].textContent == id) {
                    return $(allEls[i]).children("select").val();
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

