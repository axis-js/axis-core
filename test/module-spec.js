describe("Module library", function () {
    xs.config.load({
        paths:{
            "test":"test/module-test/"
        }
    });

    it("Loads a module tree asynchronously", function () {
        var result;
        runs(function(){
            module.require("test.A").execute(function(){
                result = A.dep;
                console.log("Done!");
            });
        });
        waitsFor(function () {
          return result;   
        });
        runs(function(){
            expect(A).toBeDefined();
            expect(B).toBeDefined();
            expect(C).toBeDefined();
            expect(C_1).toBeDefined();
            expect(C_2).toBeDefined();
        });
    });
});