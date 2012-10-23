/**
 * Ajax apis borrowed from JQuery
 * @see http://api.jquery.com/ajax
 */
xs.request = xs.ajax = xs.fn($,"ajax");

//UTIL: helper to create a specific ajax request
function ajaxRequest(url, options, method) {
    if(typeof url == "object") {
        options = url;
        url = options.url
    }

    var o = xs.x({
        url: url,
        method: method
    }, options);

    return xs.request(o);
}

xs.request.GET = function(url, options) {
    return ajaxRequest(url, options, 'GET');
};
xs.request.POST = function(url, data, callback, type) {
    return ajaxRequest(url, options, 'POST');
};
xs.request.PUT = function(url, data, callback, type) {
    return ajaxRequest(url, options, 'PUT');
};
xs.request.DELETE = function(url, data, callback, type) {
    return ajaxRequest(url, options, 'DELETE');
};