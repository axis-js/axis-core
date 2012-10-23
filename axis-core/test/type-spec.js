describe("Type Utilities", function () {
    it("checks if a value is an array", function () {
        expect(xs.isArray([])).toBe(true);
        expect(xs.isArray(Array())).toBe(true);
        expect(xs.isArray({})).toBe(false);
        expect(xs.isArray("")).toBe(false);
        expect(xs.isArray(1)).toBe(false);
    });

    it("converts a value into an array", function () {
        var value = xs.array([1,2,3]);
        expect(xs.isArray(value)).toBe(true);

        value = xs.array(1);
        expect(xs.isArray(value)).toBe(true);

        value = xs.array("lalal");
        expect(xs.isArray(value)).toBe(true);

        function argsToArray () {
            return xs.array(arguments);
        }
        value = argsToArray("afda",1,[],{});      
        expect(xs.isArray(value)).toBe(true);

        value = xs.array(document.querySelectorAll("div"));
        expect(xs.isArray(value)).toBe(true);

        value = xs.array(undefined);
        expect(xs.isArray(value)).toBe(true);

        value = xs.array(null);
        expect(xs.isArray(value)).toBe(true);
    })
})