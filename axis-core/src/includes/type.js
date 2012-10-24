/*
* Type and Type enforcers utilities
* ------------------------------------------------
*/

xs.isArray = function (value) {
    return value != null && Object.prototype.toString.call(value) === "[object Array]";
};

/**
* Array type enforcer. Performs operation on a given value to convert it into an array.
* array -> array
* value -> [value]
* NodeList -> [element0,...,elementN]
* jQuery collection -> [element0,...,elementN]
* arguments -> [argument0,..,arguemntN]
*/
xs.array = $.makeArray;

xs.callback = function (source) {
    
};

xs.single = function (source) {
    
};

xs.number = function (source) {
    
};

xs.string = function (source) {
    
};