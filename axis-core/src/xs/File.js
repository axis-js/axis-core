/**
 *@name xs.File
 *@class
 * Utility class that manages file loading via Ajax requests. It caches retrieved
 * files so further requests get resolved faster.
 */
module("xs.File")
.declare("xs.File").mixin("xs.Trigger")
.as(function(){
    
    var fileCache = {},
        promiseCache = {};
    
    return /**@lends xs.File*/ {
        constructor: function(path, options) {
            this.path = path;
            this.options = options;
        },
        
        /**
        * Requests a file via ajax. It returns a promise object.
        * @param {string} this.path
        * The url from where to retrieve the file. This url gets config parsed.
        * @param {function} this.options.adapter
        * A function that gets called when the data is received. This function must
        * be of the form:
        * <code>
        * <pre>
        * function(data){
        *      ...
        *      return transformedData;
        * }
        * </pre>
        * </code>
        * The result of this function will be passed to the deferred's handlers.
        * @returns {xs.deferred.promise} a promise object.
        * @see http://api.jquery.com/category/deferred-object/
        */
        load: function() {
            var self = this,
                fileUrl = xs.template(this.path);

            if(promiseCache[fileUrl]){
                return promiseCache[fileUrl];
            }
            else {
                var promise =  xs.promise(function(promise){
                    var successFn = function(content){
                            if(this.options.adapter){
                                try {
                                    content = this.options.adapter(content);
                                }
                                catch(e){
                                    self.trigger("error");
                                    promise.reject(e.toString());
                                }
                            }
                            self.content = content;
                            self.trigger("loaded");
                            promise.resolve(content);
                        };

                    if(fileCache[fileUrl]){
                        successFn(fileCache[fileUrl]);
                    }
                    else{
                        xs.request({
                            url: fileUrl,
                            type:"get",
                            success: function(data){
                                fileCache[fileUrl] = data;
                                successFn(data);
                            },
                            error:function(){
                                self.trigger("error");
                                promise.reject("Could not retrieve file:" + fileUrl);
                            }
                        })
                    }
                });

                promiseCache[fileUrl] = promise;

                return promise;
            }
        }
    }
})