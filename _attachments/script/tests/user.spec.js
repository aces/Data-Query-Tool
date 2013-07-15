describe("User class", function() {
    beforeEach(function () {
        var userspan = document.createElement("span")
        userspan.id = "username";
        this.userspan = userspan;
        spyOn(document, "getElementById").andReturn(userspan);
        spyOn(jQuery, 'post'); // make sure that the request doesn't get posted
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
        this.user.login("abc", "def");
        this.user._onLoginSuccess();
        it("should update the logged in user", function () {
            expect(this.user.getUsername()).toBe("abc");
        }
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
});
