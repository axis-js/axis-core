"use strict";
module("xs.Configurable")
.require("xs.Prototype")
.declare("xs.Configurable").mixin("xs.Prototype")
.as({
    option: function(name, value){
        if(arguments.length > 1){
            xs.set(name, value, true, this.options);
            if(typeof this.trigger === "function") {
                this.trigger("option:"+name);
            }
        }

        return xs.get(name, this.options);
    }
})
.execute(function(){
    module.addCreationListener("xs.Configurable", function(object) {
        object.options = object.prototypeAggregate("options","object");        
    });
});