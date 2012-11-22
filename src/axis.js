// ----------------------------------------------------------------------------
// ########### AXIS CLIENT FRAMEWORK - AXIS.JS MICROFRAMEWORK ###############
// ----------------------------------------------------------------------------

// make a closure to keep local variables private
;(function(global){

'use strict';

// INIT 
// ---------------------------------------
var $ = global["jQuery"] || global["Zepto"] || global["$"];
if(!$) {
    throw new Error("No jQuery/Zepto library found.");
}

// Add polyfills to baseline browser javascript environment.
//@@polyfill.js

var xs = global["xs"] = {};

xs.global = global;

//private global
var _ = {};

//@@base.js
//@@trigger.js
//@@config.js
//@@util.js
//@@ajax.js
//@@module.js
//@@data.js
//@@bindable.js

// framework events
xs.x(xs, Trigger);
        
// ---------------------------------------

})(this);