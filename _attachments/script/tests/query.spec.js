//var array_tools = require("../query.js");
describe("query runner", function() {
    describe("QueryManager", function() {
        beforeEach(function() {
            this.QM = QueryManager("population_selected");
        });
        afterEach(function() {
            this.QM = undefined;
            document.getElementById("population_selected").innerHTML = '';
        });
        it("should exist", function() {
            expect(QueryManager).toBeDefined();
        });
        it("should be a constructor", function() {
            expect(this.QM).toBeDefined();
        });
        describe("add function", function() {
            it("should exist", function() {
                expect(this.QM.add).toBeDefined();
            });
            it("should modify div", function() {
                this.QM.add("Instrument,Field", "3", "=");
                var div = document.getElementById("population_selected");
                // div should be of the form
                // <div>
                //  <dl>
                //    <dt>
                //    <button><span>Close</span><span class="ui-icon"></span></button>
                //    Instrument,Field =
                //    </dt>
                //    <dd>3</dd>
                //  </dl>
                // </div>
                expect(div.children.length).toBe(1);
                expect(div.children[0].children.length).toBe(2);
                expect(div.children[0].firstChild.innerText).toBe("CloseInstrument,Field =");
                expect(div.children[0].children[1].innerText).toBe("3");

            });
        });
        describe("saveQuery function", function() {
            it("should exist", function() {
                expect(this.QM.saveQuery).toBeDefined();
            });
            it("should make an AJAX call", function() {
                var FakeOp = $('<tr><td>Instrument,Field</td><td><select class="queryOp"><option>=</option></select></td><td><input type="text" class="queryParam" value="3"></td>');
                var el = FakeOp[0];
                FakeOp
                spyOn(jQuery, "ajax");
                spyOn(popManager, "getSelected").andReturn([el]);

                //this.QM.add("Instrument,Field", "3", "=");
                this.QM.saveQuery();
                expect(popManager.getSelected).toHaveBeenCalled();
                expect(jQuery.ajax).toHaveBeenCalledWith(
                    "SavedQuery",
                    {
                        type: "POST",
                        dataType: 'json',
                        data: {
                            Meta : {
                                DocType : "SavedQuery",
                                User : "driusan",
                            },
                            Conditions: [
                                { 
                                    Field : "Instrument,Field",
                                    Operator : "=",
                                    Value : "3"
                                }
                            ]
                        }
                    });
            });
        });
    });
});
