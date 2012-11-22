// INTERNAL UTILITY HELPERS
// ------------------------------------------------

// UTIL: Similar to String.split(), but with a limit of how much to split
function string_split(string, separator, count){
    string = string||"";
    separator = separator||"";
    count = (count>=0)? count:0;
    
    var split = string.split(separator);
    var result = split.splice(0,count-1);
    if(split.length){
        result.push(split.join(separator));
    }

    return result;
}

// GENRAL UTILITIES
// ----------------------------------------

/**
 * Add properties to an object. Borrowed from jQuery.
 * @see http://api.jquery.com/extend
 * @alias xs.x
 */
xs.extend = xs.x = function() {
    var returnObject;

    if(typeof arguments[0] !== "boolean") {
        returnObject = arguments[0];
    }
    else {
        returnObject = arguments[1];
    }

    $.extend.apply(null, $.makeArray(arguments));
    
    return returnObject;
};

/**
 *  Select DOM element(s) matching a given selector.
 *  @see http://api.jquery.com/selector
 *  @alias xs.q
 */
xs.query = xs.q = function(){
    return $.apply($, $.makeArray(arguments));
};

/**
 * Borrowed from jQuery.proxy, scopes and/or curry a given function.
 * @see http://api.query.com/proxy
 * @alias xs.fn
 */
xs.proxied = xs.fn = $.proxy;

if(!xs.proxied) {
    throw new Error("No proxy api present, most functionality will be unstable.");
}

/**
 * Get a reference to an object in a context by providing its namespaced path.
 * @param {string} namespace the path to the property to get in the given context.
 * @param {object} [context] the context root object in whitch to look fot the property path.
 * If not provided, <code>window</code> is assumed to be the context to lookup.
 * @example
 * //to get previously loaded classes.
 * var s = xs.get("net.Service");
 * var i = new s();
 * //OR
 * var s = xs.get("net").Service;
 * var i = new s();
 *
 * //To get a nested property in an object:
 * var obj = {path: {to: {prop:"hello!"} } };
 *
 * var val = xs.get("path.to.prop",obj);
 * // val == "hello!"
 * 
 * @alias xs.getNamespace
 **/
xs.get = xs.getNamespace = function(namespace, context) {    
    if(!namespace) {
        return undefined;
    }

    var path = string_split(namespace,".",2);
    if(path.length === 1){
        return context[path[0]];
    }
    else{
        var nextContext = context[path[0]];
        if(nextContext){
            return xs.getNamespace(path[1], nextContext);
        }
        else{
            return undefined;
        }
    }
};

/**
 * Set a reference in a context by providing its namespaced path.
 * @param {string} namespace the path where to write the value.
 * @param {*} value the value to write.
 * @param {boolean} [override=false] flag to indicate if at any point of the
 * path a preexisting value exists, <code>true</code> if should be overriden,
 * <code>false</code> if an error should be thrown.
 * @param {object} [context=window] the context root object in whitch to look fot the property path.
 * If not provided, <code>window</code> is assumed to be the context to lookup.
 * @example
 * //Set in the global context
 * xs.set("namespace.myObject", {prop:"value"});
 * 
 * //Set in a specific object context
 * var obj = {namespace:{}};
 * xs.set("namespace.myObject", {prop:"value"}, true, obj);
 * 
 * @alias xs.setNamespace
 **/
xs.set = xs.setNamespace = function(namespace, value, override, context) {
    context = context || global;  
    var path = string_split(namespace,".",2);
    if(path.length === 1){
        if(context[path[0]] == null || override){
            context[path[0]] = value;
        }
        else{
            throw new Error(path[0] + 
                            " is already defined on " + 
                            context +
                            ", use override flag to write over it.");
        }
    }
        
    else{
        var nextContext;
        if(context[path[0]] == null){
            nextContext = context[path[0]] = {};
        }
        else{
            nextContext = context[path[0]];
        }
        xs.setNamespace(path[1], nextContext, value, override);
    }
};

/**
 * Desynchronize a function, meaning the function wont execute as long as 
 * it keeps getting invoked, or it reaches a timeout.
 */
xs.desync = function desync (fn, timeout){
    timeout = (typeof timeout === "number")?timeout:1;
    return function(){
        var args = arguments;
        var self = this;
        if(fn.__desynced){
            clearTimeout(fn.__desynced);
        }
        fn.__desynced = setTimeout(function(){
            delete fn.__desynced;
            fn.apply(self,args);
        },timeout);
    };
};

/**
 * Gets a reference to a ceratin namespace object, if it doesn't exist yet, it
 * creates an empty object in the given namespace.
 * @param {string} namespace the path to the property to get in the given context.
 * @param {object} [context] the context root object in whitch to look fot the property path.
 * If not provided, <code>window</code> is assumed to be the context to lookup.
 * @example
 * var myNamespace = xs.ns("my.lovely.namespace");
 * myNamespace.MyObject = {...};
 * 
 * // Useful for stuff like:
 * 
 * xs.ns("xs.net").Service = {...}   // Creates the ns at first
 * xs.ns("xs.net").URI = {...}       // Gets namespace
 * xs.ns("xs.net").Operation = {...} // Gets namespace
 * 
 * @alias xs.namespace
 */
xs.ns = xs.namespace = function(namespace, context){
    var target = xs.get(namespace, context);

    if(!target) {
        xs.set(namespace, target = {}, true, context);
    }
        
    return target;
};

/**
* Returns a string from a i18n string bundle if the I18N module has been loaded,
* if not the default string provided is returned. If the string is a template it
* will get parsed.
* @param key The key of the string to get from the bundle.
* @param [defaultValue] The default value to return if the key does not
* match with any string in the bundle or no I18N bundle is found.
* @param [env] the enviroment to use if the string is a template.
* 
* @alias xs.getString
*/
xs.str = xs.getString = function(key, defaultValue, env, namespace){
    var currentLocale = xs.get("i18n.currentLocale"),
        string = "";

    if(currentLocale){
        string = currentLocale.localize(key, defaultValue, namespace);
    }
    else {
        string = defaultValue || "";
    }

    return xs.template(string,env);
};

/**
* Get a registered path and append a relative url.
* @param url The relative url to append to the path.
* @param [path] The name of the path to append, if not passed
* the framework <code>basePath</code> is assumed.
* 
* @alias xs.appendPath
*/
xs.path = xs.resolvePath = function(url, path){
    path = path || "basePath";
    if(path === "basePath"){
        return (_.config["basePath"]||"") + url;
    }
    else {
        return (_.config.paths[path] || "") + url;
    }
};

/**
* Register a basepath for an specific namespace prefix.
* For all modules requested which namespace begins with the specified prefix,
* files will be looked up in the provided path.
* @param {string} prefix A string prefix to match module namespaces that
* should be looked up in the given path.
* @param {string} basepath the path in where to find the matching module files.
* @example
* xs.registerPath("myPath","./mylibs/myPath");
*
* module.require("myPath.MyClass") // Will look for ./mylibs/myPath/MyClass.js
* .execute(...)
*
* module.require("myPath.subPath.MyClass") // Will look for ./mylibs/myPath/subPath/MyClass.js
* .execute(...)
**/
xs.registerPath = function(prefix, basepath){
    _.config.paths[prefix] = basepath;
};

/**
* Set the framework basePath, the path where all module files will be
* looked up by default.
* @param {string} basepath the path in where to find the module files.
* @example
* xs.setBasePath("path/to/framework/")
*
* module.require("ui.Group") // will look for "path/to/framework/ui/Group"
* .execute(...)
* @see module#require
**/
xs.setBasePath = function(basepath){
    _.config.basepath = basepath;
};

/**
 * Similar to $.extend, except yor can specify which properties you want to borrow.
 * @see http://api.jquery.com/extend
 */
xs.borrow = function(target, source, recursive, includes, excludes) {
	if(target){
		if($.isArray(source)){
			source.forEach(function(nsource){
				xs.borrow(target,nsource,recursive,includes,excludes);
			});
		}
		else if(source){		
			var included, excluded;
			for (var prop in source) {
				if(!includes) {
                    included = true;
				}
				else {
                    included = $.isArray(includes)?
                            includes.indexOf(prop)>-1
                            :(includes === "*" || includes === prop);
				}
				excluded = excludes && $.isArray(excludes)?
							excludes.indexOf(prop)>-1
							:(excludes === "*" || excludes === prop);
				if (included && !excluded) {
					if($.isPlainObject(source[prop]) && recursive) {
						target[prop] = target[prop] || {};
						xs.borrow(target[prop],source[prop],true);
					} else {
						target[prop] = source[prop];
					}
				}
			}
		}
	}
};

/**
 * Make a function chained, meaning it always return a reference 
 * to its containing object.
 */
var chained = xs.chained = function (fn){
    return function() {        
        var args = $.makeArray(arguments),
            ret = fn.apply(this, args);
        if(ret != null){
            return ret;
        }
        else {
            return this;
        }
    };
};


function matchObjectMixin(obj, mixinName){
    var proto, mixins;
    if(typeof obj === "object"){
        if((mixins = xs.dataOwn(obj,"mixins"))){
            if(mixins.indexOf(mixinName) > -1){
                return true;
            }
        }
        proto = Object.getPrototypeOf(obj);
        if(proto && proto !== Object.prototype) {
            return matchObjectMixin(proto, mixinName);
        }
        else {
            return false;
        }
    }
    return false;
}

/**
* Check the type of a given object using internal type system. This checks
* inheritance ({@link module#extend}) and mixins ({@link module#implement}).
* @param {object} obj the object to evaluate.
* @param {string|function} target a namespaced type name to check.
* otherwise returns <code>true</code> or <code>false</code> if the type of
* the object mathces the type name provided.
* @example
* module("xs.MyClass")
* .declare("xs.MyClass").extend("xs.SuperClass")
* .implement("xs.Mixin1", "xs.Mixin2")
* .as({
*    ...
* });
*
* var obj = new xs.MyClass();
* xs.typeOf(obj, "xs.MyClass") // true
* xs.typeOf(obj, "xs.SuperClass") // true
* xs.typeOf(obj, "xs.Mixin1") // true
* xs.typeOf(obj, "xs.Mixin2") // true
* xs.typeOf(obj, "xs.NotMyClass") // false
*
**/
xs.typeOf = function(obj, target){
    if(target) {        
        if(typeof obj === "object") {
            if (typeof target !== "string") {
                throw new Error("Unsupported target class type.");
            }
            var targetClass = xs.get(target);                
            
            return (obj instanceof targetClass) ||  matchObjectMixin(obj, target);
        }
        else {
            return typeof obj === target;
        }
    } 
    else {
        return false;
    }
};


// DEFERRED UTILITIES
// ----------------------------------------
if(!$.Deferred) {
    throw new Error("No deferred api present, most functionality will be unstable.");
}

/**
 * Creates a deferred object, based on jQuery.Deferred() method.
 * 
 * @see api.jquery.com/deferred
 */
xs.deferred = function (fn, props) {
    var def =  $.Deferred(fn);
    return xs.x(def, props);
};

/**
 * Check the completion of multiple deferreds, based on jQuery.when() method.
 * xs.when() Supports passing an array of deferreds as first as unique argument.
 * If more than one argument is passed, it will fallback to default behavior 
 * regardless if the first argument is an array. 
 * @see api.jquery.com/jQuery.when
 */
xs.when = function () {
    var def, args, props;
    if(arguments.length <= 2 && $.isArray(arguments[0])) {
        args = arguments[0];
        props = arguments[1];        
    }
    else {
        args = $.makeArray(arguments);

        if($.isPlainObject(args[args.length-1])){
            props = args.pop();
        }
    }

    def = $.when.apply(null, args);

    return xs.x(def, props);
};

/**
 * Creates a deferred and automatically calls promise() on it to generate a promise object
 */
xs.promise = function (fn, props) {
    return xs.deferred(fn, props).promise();
};

/**
 * Helper method that provides a literate api to better work with deferreds.
 * @example
   xs.do(function(done, fail){
      //do something asynchornous...
      done()
      //error raised
      fail() 
   })
   .then(function(){
     //do somtehing after the deferred...
   })
 */
xs.do = function (fn, props) {
    return xs.promise(function(promise){
        return fn.call(this, 
                    xs.fn(promise, "resolve"), 
                    xs.fn(promise, "reject"));
    }, props);
};

/* Prototype Utils
  ------------------------------------------------------
*/

/**
* Traverses through the prototype chain of a given target object and aggregates 
* the values for a given 
*/
xs.aggregate = xs.prototypeAggregate = function(target, property, type) {
    type = type || "object";
    var typeAggregator = xs.prototypeAggregate.aggregators[type];
    return typeAggregator && typeAggregator(target,property);
};
    
xs.prototypeAggregate.aggregators = {
    "object": (function () {            
        function aggrgateObject(target, property){
            var object = {};
            var proto = Object.getPrototypeOf(target);
            if(proto && proto !== Object.prototype){
                object = aggrgateObject(proto, property);
            }
            if(xs.typeOf(target[property],"object")){
                xs.x(true,object,target[property]);
            }
            return object;
        }

        return aggrgateObject;
    })(),
    
    "array": (function () {
        function aggregateArray(target,property){
            var array = [];
            var proto = Object.getPrototypeOf(target);
            if(proto !== Object.prototype){
                array.push.apply(array, aggregateArray(proto, property));
            }
            if( target && target.hasOwnProperty(property)) {
                 array.push.apply(array, $.makeArray(target[property]));
            }
            return array;
        }

        return aggregateArray;
    })()
};