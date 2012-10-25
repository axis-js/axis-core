module("test.A")
.require("test.B")
.execute(function(){
    A = {};
    A.dep = B.dep;
    console.log("Done A!")
})