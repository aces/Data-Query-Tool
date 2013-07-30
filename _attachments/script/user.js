"use strict";
var User = function () {
    var username, that;

    return {
        getUsername: function () {
            return username;
        },
        login: function (user, pass) {
            that = this;
            that._attemptedUsername = user;
            $.post(
                    "/_session",
                    { "name" : user, "password" : pass },
                    that._onLoginSuccess
                    );
        },
        _cookieLogin : function (uname) {
            that = this;
            that._attemptedUsername = uname;
            that._onLoginSuccess();
        },
        _onLoginSuccess : function () {
            var div = document.getElementById("username");
            username = that._attemptedUsername;
            div.textContent = username;
            $(".section").hide();
            $("#logged_in").show();
            that.getSavedQueries();
        },
        _onLoginFailure : function () {
        },

        logout: function () {
            username = undefined;
            $(".section").hide();
            $("#logged_out").show();
            $.ajax({
                type: "DELETE",
                url:  "/_session",
                dataType: "json",
                username : "_",
                password : "_"


            });
        },

        getSavedQueries: function () {
            var options = {
                type: "GET",
                url: "_view/savedqueries",
                dataType: "json",
                success: function (data) {
                    var arr = data.rows.map(function (el) {
                        return el.doc;
                    });
                    that._loadSavedQueries(arr);
                },
                data: {
                    key: JSON.stringify(that.getUsername()),
                    reduce: false,
                    include_docs: true
                }
            };
            $.ajax(options);
        },
        _loadSavedQueries: function(queries_json) {
            // This is overwritten by ui.js. It should
            // maybe be a callback parameter to getSavedQueries
            // instead of an object method.
        }
    };
};
