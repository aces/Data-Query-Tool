var QueryManager = function(div_name) {
    var that=this;
    var sessions = [];
    var sessions_per_query = [];
    var queries = [];
    var fields = [];
    var field_refs = {};
    var div = document.getElementById(div_name);
    var that = this;

    return {
        getAllSessions: function() {
            if(sessions) {
                return sessions;
            }
            return undefined;
        },
        getSessions: function() {
            if(sessions) {
                if(sessions_per_query.equals([])) {
                    return sessions;
                }
                return sessions.intersect(sessions_per_query);
            }
            return undefined;
        },
        add: function(field, value, operator) {
            if(fields.indexOf(field) >= 0) {
                return;
            }
            var q = document.createElement("dl");
            var el = document.createElement("dt");
            var button= document.createElement("button");
            button.textContent = "Close";
            button.setAttribute("style", "width: 20px; height: 20px;margin-right: 15px"); 

            $(button).button({ 
                text: false,
                icons: { secondary:  'ui-icon-close' }
            });
            var create_callback = function(that, field, value, operator) {
                return function() {
                    var i = queries.xlastIndexOf([field, value, operator]);
                    queries.splice(i, 1);
                    var i = fields.indexOf(field);
                    if(i != -1) {
                        fields.splice(i, 1);
                        $("#runquery").click();
                    }
                    $(this).parents("dl").remove();
                };
            }
            $(button).click(create_callback(that, field, value, operator));
            el.appendChild(button);
            el.appendChild(document.createTextNode(field + ' ' + operator));
            q.appendChild(el);
            el = document.createElement("dd");
            el.textContent = value;
            q.appendChild(el);
            div.appendChild(q);

            queries.push([field, value, operator]);
            fields.push(field);
            field_refs[field] = q;

        },
        run: function(callback) {
            var i = 0;
            sessions_per_query = [];
            var create_callback = function(i, fieldname, length) {
                return function(data, textStatus) {
                    var j = 0;
                    var field = field_refs[fieldname];
                    sessions_per_query[i] = [];
                    for(j = 0; j < data.rows.length; j++) {
                        sessions_per_query[i].push(data.rows[j].value);
                    }
                    
                    popManager.setSessions(fieldname, sessions_per_query[i]);
                    if(callback && i == length-1) {
                        callback();
                    }
                }
            }
            
            var results = $.ajax({
                url: "_view/sessions", 
                dataType: 'json',
                data: {
                    reduce: true,
                    group: true
                },
                beforeSend: function(jqXHR, settings) {
                    var xhr = this.xhr();
                    xhr.onprogress = function(e) {
                        document.getElementById("progress").textContent = 'Downloaded ' + e.loaded + ' bytes';
                    }
                    this._xhr = xhr;
                    this.xhr = function() { return this._xhr; }
                },
                success: function(data, textStatus) {
                var i;
                var identifier_length;
                sessions = [];
                for(i = 0;i < data.rows.length; i++) {
                    sessions.push(data.rows[i].key);
                }
                if(sessions[0]) {
                    var selectBox = document.getElementById("group_level");
                    var el;
                    if($(selectBox).children().length == 0) {
                        identifier_length = sessions[0].length;
                        $(selectBox).children().remove();
                        for(var i =0; i < identifier_length; i++) {
                            el = document.createElement("option");
                            el.textContent = i;
                            selectBox.appendChild(el);
                        }
                        $(selectBox).change(function() {
                            $("#runquery").click();
                        });
                    }

                }
                filters = popManager.getSelected();
                for(i = 0; i < filters.length; i++) {
                    sessions_per_query.push([]);
                    var field = $(filters[i]).children()[0].textContent;
                    var operator = $(filters[i]).find(".queryOp")[0].value;
                    var val = $(filters[i]).find(".queryParam")[0].value;

                    var split = field.split(",");
                    if(operator == 'startsWith') {
                        val = $(filters[i]).find(".queryParam").value;
                    } else {
                        if(val == parseFloat(val, 10)) {
                            val = parseFloat(val, 10);
                        } else {
                            val = '"' + val + '"';
                        }
                    }


                    if(operator == '=') {
                        $.getJSON("_view/search", {
                            key: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            reduce: false
                        }, create_callback(i, field, filters.length));
                    } else if(operator == '>=') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            endkey: '["' + split[0] + '","' + split[1] + '", {}]',
                            reduce: false
                        }, create_callback(i, field, filters.length));
                    } else if(operator == '<=') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '"]',
                            endkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            reduce: false
                        }, create_callback(i, field, filters.length));
                    } else if(queries[i][2] == 'startsWith') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '","' + val + '"]',
                            endkey: '["' + split[0] + '","' + split[1] + '","' + val + "\u9999\"]",
                            reduce: false
                        }, create_callback(i, field, filters.length));
                    }
                }
                if(filters.length == 0 && callback) {
                    callback();
                    document.getElementById("progress").textContent = '';
                }
            },
            });
        }
    }
}
