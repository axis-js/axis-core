var dependencyDetection = {
    enabled:false,
    captured:[],
    start:function(){
        this.enabled = true;
    },
    registerObserbableCall: function (observable){
        if(this.enabled && this.captured.indexOf(observable)===-1){
            this.captured.push(observable);
        }
    },
    stop: function(){
        this.enabled = false;
        var captured = this.captured.slice();
        this.captured = [];
        
        return captured;
    }
};

function createDispatcher() {
    var target = jQuery({});
    var proxy = {
        bind:$.proxy(target,"bind"),
        unbind:$.proxy(target,"unbind"),
        trigger:$.proxy(target,"trigger")
    };
    return proxy;
}

function _dataChanged(oldValue, newValue, target) {
    target.trigger({
        type:"dataChanged",
        newValue:newValue,
        oldValue:oldValue
    });
}

var mutatingArrayMethods = ["pop", "push", "reverse", "shift", 
                            "sort", "splice", "unshift"];
var nonMutatingArrayMethods = ["concat", "map", "filter", "slice"];
var arrayMethods = mutatingArrayMethods.concat(nonMutatingArrayMethods).concat(
                               ["join", "indexOf", "toString", "reduceRight", 
                                "forEach", "toLocaleString","lastIndexOf",
                                "reduce", "every", "some"]);

function prepareBindableArray(target, dataChanged, dispatcher){
    mutatingArrayMethods.forEach(function(fn) {
        var op = Array.prototype[fn];

        if(op){
            target[fn] = function(){
                var args = jQuery.makeArray(arguments);
                var old = Array.prototype.slice.call(target);
                var ret = op.apply(target, args);

                dataChanged(old,target,dispatcher);
                return ret;
            };
        }
    });
}

xs.x(xs, /**@lends xs*/{
    /**
     * Creates a bindable getter/setter function. A bindable is a property value
     * that you can use when you want to track value changes in a particular property.
     * @param {*} [init]
     * The inital value for the property.
     * @example
     * var object = {
     *     myProperty:module.bindable("hello!")
     * }
     *
     * //Get the current value
     * object.myProperty() //"hello!"
     *
     * //Track changes
     * module.bindChanges(object.myProperty, function(e){
     *   console.log("myProperty is now"+e.newValue);
     * })
     *
     * //Set a new value
     * object.myProperty("goodbye!") // Logs "myProperty is now goobye!"
     * object.myProperty() //"goodbye!"
     *
     * //Stop tracking changes
     * module.unbindChanges(object.myProperty);
     * 
     * @see module.bindChanges
     * @see module.unbindChanges
     */
    bindable:function(init){
        var dispatcher = createDispatcher(),
            _value = init,
            dataChanged = xs.desync(xs.fn(_dataChanged,this)),
            obserbable =  function (value){
                if(arguments.length){
                   if(_value !== value){
                      var old = _value;
                      _value = value;
                      dataChanged(old,_value,dispatcher);
                  }
                }

                dependencyDetection.registerObserbableCall(dispatcher);

                return _value;
            };

        xs.data(obserbable,"bindable",dispatcher);

        obserbable.clone = function(){
            return xs.bindable(_value);
        };
        
        return obserbable;
    },

    /**
     * Creates a bindable getter function that gets recalculated every time any
     * bindable factors used in its calculation changes.
     * @param {function} init
     * The function that computes the value for the property. All bindables used
     * in the calculation are tracked as dependencies of this property and
     * when any of them change, the property gets recalculated and the property
     * notifies all observers that it has changed.
     * @param {object} context
     * The context to be used when executing the init() function.
     * @example
     * function Person() {
     *      this.name = module.bindable("John");
     *      this.surname = module.bindable("Doe");
     *      this.fullName = module.bindableComputed(function(){
     *          return this.name() + " " + this.surname();
     *      },this)
     * }
     *
     * var john = new Person();
     * john.fullName() //"John Doe"
     *
     * module.bindChanges(john.fullName, function(){
     *      console.log("fullName changed!")
     * })
     *
     * // if I change one of the bindables used in the calculation, the computed
     * property gets updated and fires a changed event...
     * john.surname("Smith"); //Logs "fullName changed!"
     * john.fullName() "John Smith"
     *
     * @see module.bindChanges
     * @see module.computed
     */
    bindableComputed:function(init, context, mandatory){
        var dispatcher = createDispatcher(),
            dataChanged = xs.desync(jQuery.proxy(_dataChanged,this)),
            _value;
        dependencyDetection.start();
        try {
            _value = init.call(context);
        }
        catch(e){
            console.log("WARNING: errors when evaluating dependencies for"+init.toString()+"please check is a propper getter with no side effects code.");
        }
        var dependencies = dependencyDetection.stop();

        if(xs.isBindable(_value)){
            dependencies = [xs.data(_value,"bindable")];
            var bound = _value;
            init = function(){
                return bound.call(context);
            };
        }

        if(mandatory && dependencies.length === 0){
            return null;
        }
        
        dependencies.forEach(function(obserbable){
            obserbable.bind("dataChanged", function(){
                var newValue = init.call(context);
                if(_value !== newValue){
                   var old = _value;
                   _value = newValue;
                   dataChanged(old, newValue, dispatcher);
                }
            });
        });
        
        var obserbable = function(){
            dependencyDetection.registerObserbableCall(dispatcher);                   
            return _value;
        };
        
        xs.data(obserbable, "bindable", dispatcher);
        xs.data(init, "bindable", dispatcher);

        obserbable.clone = function(newContext){
            return xs.bindableComputed(init, newContext||context);
        };
        
        return obserbable;
    },

    /**
     * Creates a bindable array property and adds some useful methods to it so
     * it can be used as a regular array. Regular array position access is not
     * supported, use the .at() method instead (See Example).
     * @param {Array} [init]
     * The inital values for the array property.
     * @example
     * var obj = {
     *     myArray:module.bindableArray(["a","b","c","d"])
     * }
     *
     * obj.myArray[0] // undefined, regular array position access not supported
     * //on the other hard, accessing the array value works
     * obj.myArray()[0] //"a"
     * // or we can use the .at() method
     * obj.myArray.at(0) //"a"
     * // even for setting values
     * obj.myArray.at(0, "b") // now is ["b","b","c","d"]
     *
     * //most array methods are proxied thougth the bindable...
     * obj.myArray.push("e") // now is ["b","b","c","d","e"]
     * obj.myArray.shift()  // now is ["b","c","d","e"]
     *
     */
    bindableArray: function(init){
        var _value = init || [],dispatcher = createDispatcher(),
            dataChanged = xs.desync($.proxy(_dataChanged,this)),
            obserbable =  function (value){
            if(arguments.length){
               if(_value !== value){
                  var old = _value;
                  _value = value;

                  prepareBindableArray(_value, dataChanged, dispatcher);

                  dataChanged(old, value, dispatcher);
               }
            }

            dependencyDetection.registerObserbableCall(dispatcher);
            
            return _value;
        };

        prepareBindableArray(_value, dataChanged, dispatcher);
        
        arrayMethods.forEach(function(fn){
            if(_value[fn]){
                obserbable[fn] = function(){
                    dependencyDetection.registerObserbableCall(dispatcher);
                    return _value[fn].apply(_value, arguments);
                };
            }
        });

        nonMutatingArrayMethods.forEach(function(fn){
            if(_value[fn]){
                obserbable["r"+fn] = function(){
                    obserbable(_value[fn].apply(_value, arguments));
                    return obserbable;
                };
            }
        });
        
        obserbable["at"] = function(i, value){
            if(arguments.length === 2){
               if(_value[i] !== value){
                  var old = Array.prototype.slice.call(_value);
                  _value[i] = value;
                  
                  dataChanged(old, _value, dispatcher);
               }
            }

            dependencyDetection.registerObserbableCall(dispatcher);
            
            return _value[i];
        };
        
        obserbable["size"] = function(){
            dependencyDetection.registerObserbableCall(dispatcher);
            return _value.length;
        };

        obserbable["isEmpty"] = function(){
            dependencyDetection.registerObserbableCall(dispatcher);
            return _value.length === 0;
        };

        xs.data(obserbable, "bindable", dispatcher);

        obserbable.clone = function(){
            return xs.bindableArray(_value);
        };
        
        return obserbable;
    },
    
    bindableObject: function(obj, recursive){
       $.each(obj, function(prop, value){
            if(jQuery.isArray(obj[prop])){
                obj[prop] = xs.bindableArray(value);
            }
            else if (jQuery.isFunction(obj[prop])){
                obj[prop] = xs.bindableComputed(value, obj);
            }
            else{
                obj[prop] = xs.bindable(value);
            }

            if(recursive && typeof value === "object"){
                xs.bindableObject(value, recursive);
            }
        });
        
        return obj;
    },

    isBindable:function(target){
        return !!(xs.data(target,"bindable"));
    },

    bindChanges: function(target, callback){
        if(xs.isBindable(target)){
            xs.data(target,"bindable").bind("dataChanged", callback);
        }
    },

    unbindChanges: function(target, callback){
        if(xs.isBindable(target)){
            xs.data(target,"bindable").unbind("dataChanged", callback);
        }
    }
});

//module.bindableComputed shorter alias
xs.computed = xs.bindableComputed;

function scopePrototypeBindables(instance) {
    for (var prop in instance) {
        if(xs.isBindable(instance[prop]) && !instance.hasOwnProperty(prop)){
            instance[prop] = instance[prop].clone(instance);
        }
    }
}

xs.module.on("object:created", function(e){
    scopePrototypeBindables(e.object);
});