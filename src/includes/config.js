// CONFIG
// ---------------------------------------

// infer framework basepath as the location of xs.js
var PATH_RX = /\/[^\/]*$/;

function inferBasePath(){
  var last = $("script").last()[0];
  if(last && last.src){
    return last.src.split(PATH_RX,1).join();
  }
  else {
    return global.location.href.split(PATH_RX,1).join();
  }
}

function hasVariable(value) {
    return value && value.trim().indexOf("<") === 0 && value.trim().indexOf(">") === (value.trim().length-1);
}

function resolveVariable (value) {
    var expr = value.trim().substring(1, value.trim().length-1),
        resolved = xs.get(expr, _.config) || xs.get(expr, global),
        result = typeof resolved === "function"? 
                    resolved.call(global)
                    :resolved;

    return processConfig(result);
}

function processConfig (configObject) {
    for(var key in configObject){
        var value = configObject[key];
        if(typeof value === "object") {
            processConfig(value);
        }
        else if(typeof value === "string"){
            if(hasVariable(value)){
                configObject[key] = resolveVariable(value);
            }
        }
        else if($.isArray(value)) {
            value.forEach(processConfig);
        }
    }
}

//private config object
_.config = {
    basePath: inferBasePath(),
    paths:{}
};

/**
 * Get/Sets a config variable value by providing its namespaced name.
 * If no value found for the path, <code>undefined</code> is returned.
 * @param {string} key the namespaced name of the variable to get.
 * @param {*} value value to assign the config variable.
 * @example
 * // Get a config entry
 * var myVariable = xs.config("path.to.my.variable");
 * 
 * // Set a config entry
 * xs.config("path.to.my.variable", "this is the value");
**/
xs.config = function(key, value) {    
    // Global Getter
    if(key == null){
        // do not return reference config, only a copy
        var proxy = {};
        xs.x(true, proxy, _.config);
        return proxy;
    }
    else{
        // Setter
        if(value != null){
            processConfig(value);
            xs.set(key, value, _.config, true);
        }
        
        // Getter
        return xs.get(key, _.config);
    }
};

/**
 * Loads the configuration paramenters from a specified file or from an object.
 * If this function is called, further operations in any module will be delayed
 * until the configuration variables are succesfully loaded.
 * @memberOf module
 * @param {string|object|array} source(s) string indicating the location of
 * the configuration json file or a javascript object containing the
 * configuration parameters, or an array of multiple sources to load.
 * @example
 * xs.config.load("path/to/config.json");
 *
 * module("SomeModule").execute(function(){
 *  // this will not be executed until the config file is succesfully retrieved.
 * })
 */
xs.config.load = function(source, override, supressEvents) {
    return xs.do(function (done, fail) {
        if(source){
            if(typeof source === "string"){
                return xs.request({
                            url: source,
                            dataType:"json"                    
                        }).then(function (data) {
                            return xs.config.load(data, override);
                        });
            }
            else if(xs.isArray(source)){                
                return xs.when(source.map(function (sourceItem, i) {
                    //pass override only to the first item being loaded
                    //the rest will append to that first one.
                    return xs.config.load(sourceItem, i===0 && override, true);
                }));
            }
            else if(typeof source === "object"){
                if(override) {
                    _.config = source;
                }
                else {
                    xs.x(_.config, source);
                }            
                processConfig(_.config);
                done(xs.config());
            }
            else{
                fail("Unsupported config source type.");
            }
        }
        else{            
            fail("No config source provided.");
        }        
    }).then(function () {
        if(!supressEvents){
            xs.trigger("config:ready");
        }
    }).fail(function (error) {
        throw new Error(error);
    });
};