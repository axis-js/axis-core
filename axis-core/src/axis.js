// ----------------------------------------------------------------------------
// ########### AXIS CLIENT FRAMEWORK - AXIS.JS MICROFRAMEWORK ###############
// ----------------------------------------------------------------------------

// Add polyfills to baseline browser javascript environment.
//@@polyfill.js

// make a closure to keep local variables private
;(function(global){

"use strict";

// INIT 
// ---------------------------------------
var $ = global["jQuery"] || global["Zepto"] || global["$"];
if(!$) {
    throw new Error("No jQuery/Zepto library found.")
}

var xs = global["xs"] = {};

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

})(this)