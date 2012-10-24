module("test.B")
.require("test.C")
.execute(function(){
    B = {};
    B.dep = C.dep;
    console.log("Done B!")
})