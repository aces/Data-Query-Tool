"use strict";
var User = function () {
    var username;

    return {
        getUsername: function () {
            return username;
        },
        login: function (user, pass) {
            this._attemptedUsername = user;
            $.post(
                    "/_session",
                    { "name" : user, "password" : pass },
                    this._onLoginSuccess
                    );
        },
        _onLoginSuccess : function () {
            var div = document.getElementById("username");
            username = this._attemptedUsername;
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
