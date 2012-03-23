var QueryManager = function(div_name) {
    var that=this;
    var sessions = [];
    var sessions_per_query = [];
    var queries = [];
    var fields = [];
    var field_refs = {};
    var div = document.getElementById(div_name);
    var that = this;
    var FormatSessions = function(array) {
        return "[" + array.join("], [") + "]"
    }

    return {
        getAllSessions: function() {
            if(sessions) {
                return sessions;
            }
            return undefined;
        },
        getSessions: function() {
            if(sessions) {
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
                    
                    var sessions = $(field).children("dd.sessions");
                    for(var j = 0; j < sessions.length; j++) {
                        if(sessions[j]) {
                            sessions[j].textContent = FormatSessions(sessions_per_query[i]);
                            if(callback && i == length-1) {
                                callback();
                            }
                            return;
                        }
                    }
                    var el = document.createElement("dt");
                    el.textContent = 'Sessions';
                    field.appendChild(el);
                    var el = document.createElement("dd");
                    el.setAttribute("class", "sessions");
                    el.textContent = FormatSessions(sessions_per_query[i]);
                    field.appendChild(el);
                    if(callback && i == length-1) {

                        callback();
                    }
                    // Uncomment for debugging
                    //$("dd.sessions, dt:contains(Sessions)").hide()

                }
            }
            
            $.getJSON("_view/sessions", {
                reduce: true,
                group: true
            }, function(data, textStatus) {
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
                for(i = 0; i < queries.length; i++) {
                    sessions_per_query.push([]);
                    var field = queries[i][0];
                    var split = field.split(",");
                    var val = queries[i][1];
                    if(queries[i][2]== 'startsWith') {
                        val = queries[i][1];
                    } else {
                        if(val == parseFloat(queries[i][1], 10)) {
                            val = parseFloat(queries[i][1], 10);
                        } else {
                            val = '"' + queries[i][1] + '"';
                        }
                    }


                    if(queries[i][2] == '=') {
                        $.getJSON("_view/search", {
                            key: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            reduce: false
                        }, create_callback(i, queries[i][0], queries.length));
                    } else if(queries[i][2] == '>=') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            endkey: '["' + split[0] + '","' + split[1] + '", {}]',
                            reduce: false
                        }, create_callback(i, queries[i][0], queries.length));
                    } else if(queries[i][2] == '<=') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '"]',
                            endkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                            reduce: false
                        }, create_callback(i, queries[i][0], queries.length));
                    } else if(queries[i][2] == 'startsWith') {
                        $.getJSON("_view/search", {
                            startkey: '["' + split[0] + '","' + split[1] + '","' + val + '"]',
                            endkey: '["' + split[0] + '","' + split[1] + '","' + val + "\u9999\"]",
                            reduce: false
                        }, create_callback(i, queries[i][0], queries.length));
                    }
                }
            });
        }
    }
}
