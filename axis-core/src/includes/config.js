// CONFIG
// ---------------------------------------

// infer framework basepath as the location of xs.js
var PATH_RX = /\/[^\/]*$/

function inferBasePath(){
  var last = $("script").last()[0];
  if(last && last.src){
    return last.src.split(PATH_RX,1).join()
  }
  else return global.location.href.split(PATH_RX,1).join()
}

function hasVariable(value) {
    return value && value.trim().indexOf("<") == 0 && value.trim().indexOf(">") == (value.trim().length-1);
}

function resolveVariable (value) {
    var expr = value.trim().substring(1, value.trim().length-1),
        resolved = xs.get(expr, config) || xs.get(expr, global),
        result = typeof resolved == "function"? 
                    resolved.call(global)
                    :resolved;

    return processConfig(result);
}

function processConfig (configObject) {
    for(var key in configObject){
        var value = configObject[key];
        if(typeof value == "object") {
            processConfig(value);
        }
        else if(typeof value == "string"){
            if(hasVariable(value)){
                configObject[key] = resolveVariable(value);
            }
        }
        else if($.isArray(value)) {
            value.forEach(processConfig);
        }
    }
}

var config = {
        basePath: inferBasePath(),
        paths:{}
    },
    configReady = true;

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
        xs.x(true, proxy, config);
        return proxy;
    }
    else{
        // Setter
        if(value != null){
            processConfig(value);
            xs.set(key, value, config, true);
        }
        
        // Getter
        return xs.get(key, config);
    }
}

/**
 * Loads the configuration paramenters from a specified file or from an object.
 * If this function is called, further operations in any module will be delayed
 * until the configuration variables are succesfully loaded.
 * @memberOf module
 * @param {string|object} source String indicating the location of
 * the configuration json file or a javascript object containing the
 * configuration parameters.
 * @example
 * xs.config.load("path/to/config.json");
 *
 * module("SomeModule").execute(function(){
 *  // this will not be executed until the config file is succesfully retrieved.
 * })
 */
xs.config.load = function(source) {
    configReady = false;
    if(source){
        if(typeof config == "string"){
            xs.request({
                url: source,
                dataType:"json",
                success:function(data){
                    xs.config.load(data);
                    xs.trigger("config:ready")
                }
            })
        }
        else if(typeof config == "object"){
            xs.x(config, source);
            processConfig(config);
            configReady = true
            xs.trigger("config:ready")
        }
        else{
            throw new Error("Unsupported Config source type.");
        }
    }
    else{
        configReady = true
        xs.trigger("config:ready")
    }
}