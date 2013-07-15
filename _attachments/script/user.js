"use strict";
var User = function () {
    var username, that=this;

    return {
        getUsername: function () {
            return username;
        },
        login: function (user, pass) {
            that._attemptedUsername = user;
            $.post(
                    "/_session",
                    { "name" : user, "password" : pass },
                    this._onLoginSuccess
                    );
        },
        _onLoginSuccess : function () {
            var div = document.getElementById("username");
            username = that._attemptedUsername;
            div.textContent = username;
            $(".section").hide();
            $("#logged_in").show();
        },
        _onLoginFailure : function () {
        },

        logout: function () {
            username = undefined;
            $(".section").hide();
            $("#logged_out").show();
        }
    };
};
