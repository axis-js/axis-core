var doesDefinePropertyWork = !!Object.defineProperty && (function () {
    try {
        var object = {};
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        return false;
    }
})();

var UUID_ALPHABET= "0123456789abcdef";

function returnEmpty(){return ""}

function createExpando(obj) {
    var expandoObj = {
            toJSON:returnEmpty,
            toString:returnEmpty
        };
    if(doesDefinePropertyWork){
        obj!=undefined && Object.defineProperty(obj,xs.expando,{
            value:expandoObj,
            writable:false,
            enumerable:false,
            configurable:false
        })
    }
    else{
        obj!=undefined && (obj[xs.expando] = expandoObj);
    }   
}
    
xs.x(xs,{
    uuid: function() {
        var uuid = new Date().getTime().toString(16);
        for (var i = 0; i < 16; i++) {
            uuid += UUID_ALPHABET.charAt(Math.floor(Math.random()*UUID_ALPHABET.length));
        }
        return uuid;
    },
    
    data:function(obj, label, value){
        if(typeof label == "object" || arguments.length > 2){
            if(obj && !obj.hasOwnProperty(xs.expando)){                    
                createExpando(obj);
            }

            if(typeof label == "string") {
                obj[xs.expando][label] = value;
            }
            else {
                xs.x(obj[xs.expando],label);
            }
        }
        return obj && obj[xs.expando] && obj[xs.expando][label];
    },
    
    dataOwn:function(obj,label){        
        return obj && obj.hasOwnProperty(xs.expando) && obj[xs.expando][label];
    }
});

xs.expando = "_xs" + xs.uuid()