module("test.C_1")
.require("test.B")
.execute(function(){
    C_1 = {};
    C_1.dep = "ok";
    console.log("Done C_1!")
})