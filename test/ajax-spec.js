describe("Ajax APIs", function () {
    it("Requests resources", function () {
        var promise, result;
        runs(function () {
            promise = xs.resource("test/config-test.json");
            promise.then(function (data) {
                result = data;
            });
        });
        waitsFor(function () {
            return promise && (promise.state() === "resolved");
        });
        runs(function () {
            expect(promise.type).toBe("resource");
            expect(promise.resourceType).toBe("json");
            expect(typeof result).toBe("object");
        });
    });
});