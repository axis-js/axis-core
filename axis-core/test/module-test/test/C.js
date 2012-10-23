setTimeout(function(){
    
module("test.C")
.require("test.C_1", "test.C_2")
.execute(function(){
    C = {};
    C.dep = C_1.dep;
    C.dep = C_2.dep;
    console.log("Done C!")
})

}, 2000)