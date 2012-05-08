/*global document: false, QueryRun: false, $: false, popManager: false, defineManager: false */
"use strict";
var QueryManager = function (div_name) {
    var that = this,
        sessions = [],
        sessions_per_query = [],
        queries = [],
        fields = [],
        field_refs = {},
        div = document.getElementById(div_name);

    return {
        getAllSessions: function () {
            if (sessions) {
                return sessions;
            }
            return undefined;
        },
        getSessions: function () {
            if (sessions) {
                if (sessions_per_query.equals([])) {
                    return sessions;
                }
                return sessions.intersect(sessions_per_query);
            }
            return undefined;
        },
        add: function (field, value, operator) {
            if (fields.indexOf(field) >= 0) {
                return;
            }
            var q = document.createElement("dl"),
                el = document.createElement("dt"),
                button = document.createElement("button"),
                create_callback = function (that, field, value, operator) {
                    return function () {
                        var i = queries.xlastIndexOf([field, value, operator]);
                        queries.splice(i, 1);
                        i = fields.indexOf(field);
                        if (i !== -1) {
                            fields.splice(i, 1);
                            $("#runquery").click();
                        }
                        $(this).parents("dl").remove();
                    };
                };
            button.textContent = "Close";
            button.setAttribute("style", "width: 20px; height: 20px;margin-right: 15px");

            $(button).button({
                text: false,
                icons: { secondary:  'ui-icon-close' }
            });
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
        run: function (callback) {
            var i = 0,
                create_callback = function (i, fieldname, length) {
                    return function (data, textStatus) {
                        var j = 0,
                            field = field_refs[fieldname];
                        sessions_per_query[i] = [];
                        for (j = 0; j < data.rows.length; j += 1) {
                            sessions_per_query[i].push(data.rows[j].value);
                        }

                        popManager.setSessions(fieldname, sessions_per_query[i]);
                        if (callback && i === length - 1) {
                            callback();
                        }
                    }
                },
                create_callback_for_not = function (i, fieldname, length) {
                    return function (data, textStatus) {
                        var j = 0,
                            field = field_refs[fieldname],
                            s_values = data.rows.map(function (val) {
                                return val.value;
                            });
                        sessions_per_query[i] = [];
                        for (j = 0; j < sessions.length; j += 1) {
                            if ( !(s_values.contains(sessions[j]) ) ) {
                                sessions_per_query[i].push(sessions[j]);
                            }
                        }

                        popManager.setSessions(fieldname, sessions_per_query[i]);
                        if (callback && i === length - 1) {
                            callback();
                        }
                    }
                };

            sessions_per_query = [];

            $.ajax({
                url: "_view/sessions",
                dataType: 'json',
                data: {
                    reduce: true,
                    group: true
                },
                beforeSend: function (jqXHR, settings) {
                    var xhr = this.xhr();
                    xhr.onprogress = function (e) {
                        document.getElementById("progress").textContent = 'Downloaded ' + Math.round(e.loaded / 1024) + ' kilobytes';
                    };
                    this.OverloadedXHR = xhr;
                    this.xhr = function () { return this.OverloadedXHR; };
                },
                success: function (data, textStatus) {
                    var i,
                        identifier_length,
                        selectBox,
                        el,
                        filters,
                        field,
                        operator,
                        val,
                        split;
                    sessions = [];
                    for (i = 0; i < data.rows.length; i += 1) {
                        sessions.push(data.rows[i].key);
                    }
                    if (sessions[0]) {
                        selectBox = document.getElementById("group_level");
                        if ($(selectBox).children().length === 0) {
                            identifier_length = sessions[0].length;
                            $(selectBox).children().remove();
                            for (i = 0; i < identifier_length; i += 1) {
                                el = document.createElement("option");
                                el.textContent = i;
                                selectBox.appendChild(el);
                            }
                            $(selectBox).change(function () {
                                $("#runquery").click();
                            });
                        }
                    }

                    filters = popManager.getSelected();
                    for (i = 0; i < filters.length; i += 1) {
                        sessions_per_query.push([]);
                        field = $(filters[i]).children()[0].textContent;
                        operator = $(filters[i]).find(".queryOp")[0].value;
                        val = $(filters[i]).find(".queryParam")[0].value;
                        split = field.split(",");
                        if (operator === 'startsWith') {
                            val = $(filters[i]).find(".queryParam").value;
                        } else {
                            if (val == parseFloat(val, 10)) {
                                val = parseFloat(val, 10);
                            } else {
                                val = '"' + val + '"';
                            }
                        }

                        if (operator === '=') {
                            $.getJSON("_view/search", {
                                key: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                                reduce: false
                            }, create_callback(i, field, filters.length));
                        } else if (operator === '>=') {
                            $.getJSON("_view/search", {
                                startkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                                endkey: '["' + split[0] + '","' + split[1] + '", {}]',
                                reduce: false
                            }, create_callback(i, field, filters.length));
                        } else if (operator === '<=') {
                            $.getJSON("_view/search", {
                                startkey: '["' + split[0] + '","' + split[1] + '"]',
                                endkey: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                                reduce: false
                            }, create_callback(i, field, filters.length));
                        } else if (operator === 'startsWith') {
                            $.getJSON("_view/search", {
                                startkey: '["' + split[0] + '","' + split[1] + '","' + val + '"]',
                                endkey: '["' + split[0] + '","' + split[1] + '","' + val + "\u9999\"]",
                                reduce: false
                            }, create_callback(i, field, filters.length));
                        } else if (operator === '!=') {
                            $.getJSON("_view/search", {
                                key: '["' + split[0] + '","' + split[1] + '",' + val + ']',
                                reduce: false
                            }, create_callback_for_not(i, field, filters.length));
                        }
                    }
                    if (filters.length === 0 && callback) {
                        callback();
                        document.getElementById("progress").textContent = '';
                    }
                }
            });
        }
    };
};
