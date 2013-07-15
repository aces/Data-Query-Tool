//var array_tools = require("../array_tools.js");
describe("array extensions", function() {
    describe("contains function", function() {
        it("should exist", function() {
            expect([].contains).toBeDefined();
        });
        it("should handle element existing", function() {
            expect(['abc'].contains('abc')).toEqual(true);
        });
        it("should handle element not existing", function() {
            expect(['abc'].contains('abd')).toEqual(false);
        });
    });
    describe("intersection function", function() {
        it("should exist", function() {
            expect([].intersect).toBeDefined();
        });
        it("should handle simple intersection", function() {
            expect([].intersect([])).toEqual([]);
            expect(['abc'].intersect([['abc'], ['abc', 'def']])).toEqual(['abc']);
        });
    });
});
