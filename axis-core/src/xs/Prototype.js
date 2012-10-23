module("xs.Prototype")
.declare("xs.Prototype")
.as({
    
    prototypeAggregate:function(property, type){
        return xs.Prototype.prototypeAggregate(this,property,type);
     }
    
},
{
    prototypeAggregate:function(target, property, type){
        type = type || "object";
        var typeAggregator = this.aggregators[type];
        
        if(typeAggregator){
            return typeAggregator(target,property);
        }
        else return undefined;
    },
    
    aggregators:{
        "object": function(target,property){
            var object = {};
            var proto = Object.getPrototypeOf(target);
            if(proto && proto !== Object.prototype){
                object = arguments.callee(proto, property);
            }
            if(xs.typeOf(target[property],"object")){
                xs.x(true,object,target[property]);
            }
            return object;
        },
        
        "array": function(target,property){
            var array = [];
            var proto = Object.getPrototypeOf(target);
            if(proto !== Object.prototype){
                array.push.apply(array, arguments.callee(proto, property));
            }
            if( target && target.hasOwnProperty(property)) {
                 array.push.apply(array, xs.array(target[property]));
            }
            return array;
        }
    }
})
