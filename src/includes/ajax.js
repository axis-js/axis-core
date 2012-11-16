/**
 * Ajax apis borrowed from JQuery
 * @see http://api.jquery.com/ajax
 */
xs.request = xs.ajax = xs.fn($,"ajax");

//UTIL: helper to create a specific ajax request
function ajaxRequest(url, options, method) {
    if(typeof url === "object") {
        options = url;
        url = options.url;
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
xs.request.POST = function(url, options) {
    return ajaxRequest(url, options, 'POST');
};
xs.request.PUT = function(url, options) {
    return ajaxRequest(url, options, 'PUT');
};
xs.request.DELETE = function(url, options) {
    return ajaxRequest(url, options, 'DELETE');
};


var promiseCache = {},
    fileCache = {};

function resolveOptions(descriptor){
  if(typeof descriptor === "string"){
    return {url:descriptor};
  }
  else if(typeof descriptor === "object"){
    return descriptor;
  }
  else {
    throw new TypeError("Unexpected resource descriptor type.");
  }
} 

function getResourceType (url) {
    if(url){
        var resourceExt = url.split(".").pop();
        if(resourceExt && (resourceExt = resourceExt.split("?").shift())) {
            return resourceExt;
        }
    }
}   
/**
* Requests a file via ajax. It returns a promise object.
* @param {string} options.url
* The url from where to retrieve the file. This url gets config parsed.
* @param {string} options.resourceType
* The type of resource being retrieved. (If ommited, we'll try guess based on the extension on the url.)
* @param {function} options.adapter
* A function that gets called when the data is received. This function must
* be of the form:
* <code>
* <pre>
* function(data, options, promise){
*      ...
*      return transformedData;
* }
* </pre>
* </code>
* The result of this function will be passed to the deferred's handlers.
* @returns {xs.deferred.promise} a promise object.
* @see http://api.jquery.com/category/deferred-object/
*/
xs.resource = xs.getResource = function(options) {
    options = resolveOptions(options);
    //options.url = xs.template(options.url);
    options.resourceType = options.resourceType || getResourceType(options.url);

    if(promiseCache[options.url]){
        return promiseCache[options.url];
    }
    else {
        var promise =  xs.promise(function(promise){
            var successFn = function(content){
                    var adapter = options.adapter;
                        adapter = adapter || (options.resourceType && xs.resource.adapters[options.resourceType]);

                    if(adapter != null){
                        try {
                            content = adapter.call(null, content, options, promise);
                        }
                        catch(e){
                            promise.reject(e.toString());
                        }
                    }
                    promise.resolve(content);
                };

            if(fileCache[options.url]){
                successFn(fileCache[options.url]);
            }
            else{
                xs.request(
                    xs.x({}, options, {
                        type:"get",
                        dataType: "text",
                        success: function(data){
                            fileCache[options.url] = data;
                            successFn(data);
                        },
                        error:function(){
                            promise.reject("Could not retrieve file:" + options.url);
                        }
                    })
                );
            }
        });

        promise.type = "resource";
        promise.resourceType = options.resourceType;
        promiseCache[options.url] = promise;

        return promise;
    }
};

xs.resource.adapters = {
    "json": JSON? JSON.parse: $.parseJSON,
    "xml": $.parseXML
};
