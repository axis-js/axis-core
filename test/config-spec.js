describe("Config Api", function () {
    var initialConfig;

    beforeEach(function () {
        initialConfig = xs.config();
    });

    afterEach(function () {
        xs.config.load(initialConfig, true);
    });

    it("Loads a config object", function() {
        xs.config.load({
            string:"string",
            number:123456789,
            array: [{},1,"",true],
            boolean:true,
            object: {
                "key1":"value1",
                "key2":"value2"
            }
        });

        expect(xs.config("string")).toBe("string");
        expect(xs.config("number")).toBe(123456789);
        expect(xs.config("array")).toEqual([{},1,"",true]);
        expect(xs.config("boolean")).toBe(true);
        expect(xs.config("object.key1")).toBe("value1");
        expect(xs.config("object.key2")).toBe("value2");
    });

    it("Loads a config object incrementaly", function() {
        xs.config.load({
            string:"string",
            number:123456789,
            array: [{},1,"",true],
            boolean:true,
            object: {
                "key1":"value1",
                "key2":"value2"
            }
        });

        xs.config.load({
            addedProperty: "value",
            addedProperty2: {
                key1:"value1",
                key2:"value2"
            }
        });

        //Previously added properties
        expect(xs.config("string")).toBe("string");
        expect(xs.config("number")).toBe(123456789);
        expect(xs.config("array")).toEqual([{},1,"",true]);
        expect(xs.config("boolean")).toBe(true);
        expect(xs.config("object.key1")).toBe("value1");
        expect(xs.config("object.key2")).toBe("value2");

        //New properties added
        expect(xs.config("addedProperty")).toBe("value");
        expect(xs.config("addedProperty2.key1")).toBe("value1");
        expect(xs.config("addedProperty2.key2")).toBe("value2");
    });

    it("Overrides the current configuration", function () {
        xs.config.load(lol = {
            string:"string",
            number:123456789,
            array: [{},1,"",true],
            boolean:true,
            object: {
                "key1":"value1",
                "key2":"value2"
            }
        });

        xs.config.load({
            "overridden":true
        }, true);

        // first loaded props must be gone
        expect(xs.config("string")).toBeUndefined();
        expect(xs.config("number")).toBeUndefined();
        expect(xs.config("array")).toBeUndefined();
        expect(xs.config("boolean")).toBeUndefined();
        expect(xs.config("object.key1")).toBeUndefined();
        expect(xs.config("object.key2")).toBeUndefined();

        // added prop must be present
        expect(xs.config("overridden")).toBe(true);
    });

    it("Loads a config file", function() {
        var configLoaded = false;
        runs(function () {
            xs.bind("config:ready", function () {
                configLoaded = true;                
            });
            xs.config.load("test/config-test.json");
        });
        waitsFor(function () {
            return configLoaded;
        });
        runs(function () {
            expect(xs.config("string")).toBe("string");
            expect(xs.config("number")).toBe(123456789);
            expect(xs.config("array")).toEqual([{},1,"",true]);
            expect(xs.config("boolean")).toBe(true);
            expect(xs.config("object.key1")).toBe("value1");
            expect(xs.config("object.key2")).toBe("value2");
        });      
    });

    it("Loads multiple sources", function () {
        var configLoaded = false;
        xs.bind("config:ready", function () {
            configLoaded = true;
        });
        runs(function () {
            xs.config.load(["test/config-test.json", {"extra1":true}, {"extra2":true}]);
        });
        waitsFor(function() {
            return configLoaded;
        });
        runs(function () {
            expect(xs.config("extra1")).toBe(true);
            expect(xs.config("extra2")).toBe(true);

            expect(xs.config("string")).toBe("string");
            expect(xs.config("number")).toBe(123456789);
            expect(xs.config("array")).toEqual([{},1,"",true]);
            expect(xs.config("boolean")).toBe(true);
            expect(xs.config("object.key1")).toBe("value1");
            expect(xs.config("object.key2")).toBe("value2");
        });
    });
});