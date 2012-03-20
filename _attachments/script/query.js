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
        getSessions: function() {
            if(sessions_per_query[0]) {
                return sessions_per_query[0].intersect(sessions_per_query);
            } else {
                return undefined;
            }
        },
        add: function(field, value, operator) {
            if(fields.indexOf(field) >= 0) {
                return;
            }
            var q = document.createElement("dl");
            var el = document.createElement("dt");
            el.textContent = field;
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

                }
            }
            
            for(i = 0; i < queries.length; i++) {
                sessions_per_query.push([]);
                var field = queries[i][0];
                var split = field.split(",");
                var val = queries[i][1];
                if(val == parseFloat(queries[i][1], 10)) {
                    val = parseFloat(queries[i][1], 10);
                } else {
                    val = '"' + queries[i][1] + '"';
                }

                $.getJSON("_view/search", { 
                    key: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                    reduce: false 
                    }, create_callback(i, queries[i][0], queries.length));
                }
            }
        };
}
