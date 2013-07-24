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
        _cookieLogin : function(uname) {
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
        }
    };
};
