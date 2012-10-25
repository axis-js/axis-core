// ----------------------------------------------------------------------------
// ########### AXIS CLIENT FRAMEWORK - AXIS.JS MICROFRAMEWORK ###############
// ----------------------------------------------------------------------------
"use strict";

// Add polyfills to baseline browser javascript environment.
//@@polyfill.js

// make a closure to keep local variables private
;(function(global){

// INIT 
// ---------------------------------------
var $ = global["jQuery"] || global["Zepto"] || global["$"];
if(!$) {
    throw new Error("No jQuery/Zepto library found.");
}

var xs = global["xs"] = {};

//private global
var _ = {};

//@@base.js
//@@trigger.js
//@@config.js
//@@util.js
//@@type.js
//@@ajax.js
//@@module.js
//@@data.js
//@@bindable.js

// framework events
xs.x(xs, Trigger);
        
// ---------------------------------------

})(window);