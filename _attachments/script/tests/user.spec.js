describe("User class", function() {
    //var this=this;
    beforeEach(function () {
        var userspan = document.createElement("span")
        userspan.id = "username";
        this.userspan = userspan;
        spyOn(document, "getElementById").andReturn(userspan);
        spyOn(jQuery, 'post'); // make sure this the request doesn't get posted
        spyOn(jQuery, 'ajax');
        this.user = new User();
    });
    it("should be a constructor", function () {
        expect(User instanceof Function).toBe(true);
    });
    it("should default to logged out", function () {
        expect(this.user.getUsername()).toBe(undefined);
    });
    describe("user login", function () {
        it("should try to login", function () {
            this.user.login("abc", "def");
            expect(this.user._attemptedUsername).toBe("abc");
        });
        it("should try to login to CouchDB", function () {
            this.user.login("abc", "def");
            expect(jQuery.post).toHaveBeenCalledWith(
                "/_session", 
                { 
                    "name" : "abc", 
                    "password" : "def"
                },
                this.user._onLoginSuccess
                );
        });
    });
    describe("user.onLoginSuccess", function () {
        it("should update the logged in user", function () {
            saved = spyOn(this.user, "getSavedQueries");
            this.user.login("abc", "def");
            this.user._onLoginSuccess();
            expect(this.user.getUsername()).toBe("abc");
            expect(saved).toHaveBeenCalled();
        });
    });

    describe("user logout", function () {
        it("should make an AJAX delete call to /_session", function () {
            this.user.logout();
            expect(jQuery.ajax).toHaveBeenCalledWith({
                type: "DELETE",
                url:  "/_session",
                dataType: "json",
                username : "_",
                password : "_"
            });
        });
    });
    it("should let you logout", function () {
        this.user.login("abc", "def");
        this.user._onLoginSuccess();
        expect(this.user.getUsername()).toBe("abc");
        this.user.logout();
        expect(this.user.getUsername()).toBe(undefined);
    });
    it("should modify a span named username", function () {

        spyOn(this.userspan, "textContent");
        this.user.login("abc", "def");
        this.user._onLoginSuccess();
        expect(document.getElementById).toHaveBeenCalledWith("username");
        expect(this.userspan.textContent).toBe("abc");
    });
    describe("getSavedQueries", function () {
        it("should make an AJAX call", function () {
            this.user.login("abc", "def");
            this.user._onLoginSuccess();
            // getSavedQueries is called from _onLoginSuccess
            //this.user.getSavedQueries();
            expect(jQuery.ajax).toHaveBeenCalledWith({
                type: "GET",
                url: "_view/savedqueries",
                dataType: "json",
                /* 
                 * Success callback is a little fickle for testing,
                 * so accept any function
                 */
                success: jasmine.any(Function),
                data: {
                    key: JSON.stringify('abc'),
                    reduce: false,
                    include_docs: true
                }
            });
        });
    });
});
