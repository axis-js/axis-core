// SCRIPT INJECTION
// ---------------------------------------
var document = global["document"];
var scripts = {},
    documentHead = document != null && (document.head || document.getElementsByTagName('head')[0]);
    
function cleanScript(script) {
    script.onload = null;
    script.onreadystatechange = null;
    script.onerror = null;
}

// UTIL: Injects a script in the current document
xs.loadScript = function (url, attrs) {
    attrs = xs.x({
        src: url,
        async: true,
        type: "text/javascript",
        _:xs.expando
    },attrs);

    return xs.promise(function(promise){       
        if(scripts[url]){
            promise.resolve(url);
        }
        else {
            var script = document.createElement('script'),
                $script = $(script),
                onLoadFn = function() {
                    cleanScript(script);
                    promise.resolve(url);
                },
                onErrorFn = function() {
                    cleanScript(script);            
                    promise.reject(url);
                };

            $script.attr(attrs);

            // Check script status
            script.onload = onLoadFn;
            script.onerror = onErrorFn;
            script.onreadystatechange = function() {
                if (this.readyState === 'loaded' || this.readyState === 'complete') {
                    onLoadFn();
                }
            };

            documentHead.appendChild(script);

            scripts[url] = script;
        }
    });
};

// STACK Object
// ---------------------------------------
var Stack = function(){
    this.callbacks = [];
};

Stack.prototype =
{
    push: function(array){
        var args = $.makeArray(array);
        return this.callbacks.push.apply(this.callbacks, args);
    },

    hasQueue: function(){
        return Boolean(this.callbacks.length);
    },
    
    execute: function(scope){
        var args = $.makeArray(arguments);
        this.callbacks.forEach(function (callback) {        
            callback.apply(scope,args);
        });
    },
    
    dispatch: function(scope){
        this.execute(scope);
        this.callbacks.splice(0);
    }
};

// xs.module API;
// ---------------------------------------
var moduleMappings = {};

function resolveDependency(name) {    
    return xs.module(name);
}

function circularDependencyCheck(dependencies, carry){
    if(dependencies){
        carry = carry || [];
        for (var i = 0, l = dependencies.length; i<l; ++i) {
            var dependency = dependencies[i];
            
            if(carry.indexOf(dependency) >= 0){
                return dependency;
            }
            else {
                carry.push(dependency);
                return circularDependencyCheck(dependency.dependencies, carry);
            }
        }
        
        return false;
    }
    else {
        return false;
    }
}

/**
 * Creates a xs.module instance. A xs.module name can be provided in case the xs.module bieng declare is going
 * to referenced as a dependency for another xs.module.
 * This constructor does not require the use of the <code>new</code> operator:
 * <br/><code>xs.module("moduleName")</code><br/>
 * When declaring an anonymus xs.module, factory methods can be used:
 * <code>
 * <pre>
 * xs.module.require("Dependency") //this call creates an anonymous xs.module and executes a .require() statement on it.
 * .execute(function(){
 * 
 * })
 * </pre>
 * </code>
 *@class
 * The xs.module class is the base of the dependency management system of the framework. It allows to encapsulate
 * Components, functions, configurations,etc. into a single retrivable file.
 * xs.modules allow you to develop code in an organized, object-oriented fashion that handles altogheter:
 * <ul>
     * <li>Component Encapsulation</li>
     * <li>Dependency Management</li>
     * <li>Separation of Concerns</li>
 * </ul>
 * enabling good coding practices and enhacing readability and maintenability of codebases.
 * @param {string} [moduleName] A string identifiyng the xs.module, this name will
 * be used as a dependency reference by other xs.modules.
 * @constructs xs.module
 * @example
 * xs.module("myxs.module")
 * .requires("Dependencyxs.module1", "Dependencyxs.module2")
 * .declare("MyClass").extend("BaseClass")
 * .as({
 *      property:"Implementation"
 * })
 * .execute(function(){
 *      //This code and the declarations above will not be effective until
 *      //dependencies are retrieved.
 * })
 **/
var Module = function(name){
    this.moduleName = name;
    this.dependencies = [];
    
    this.executionStack = new Stack();
    this.errorStack = new Stack();
    
    this.statementStack = [];
};

function resolveModuleFile(moduleName){
    var file;
    if(typeof moduleName === "string"){
        var basePath, finalPackage;
        for (var m in _.config.paths){
            if(moduleName.indexOf(m) === 0){
                basePath = _.config.paths[m];
                finalPackage = moduleName.substr(m.length);
            }
        }

        basePath = basePath || _.config.basePath;
        finalPackage = finalPackage || moduleName;

        var path = finalPackage.split(".").join("/");
        file =  basePath + "/" + path + ".js";
    }
    
    return file;
}


Module.prototype = (function(){
    
    var startStatements = ["require", "execute", "set", "declare"],
        statementRules = {
            "require": ["require", "execute", "set", "declare"],
            "execute": ["execute", "set", "declare", "require"],
            "set": ["as"],
            "declare": ["as", "extend", "implement"],
            "extend": ["as", "implement"],
            "implement": ["as", "implement"],
            "as": ["execute", "set", "declare", "require"]
        };
    
    function statement(name, fn){
        return function(){
            var last = this.statementStack[this.statementStack.length-1],
                lastRule = (last? statementRules[last.statement]: startStatements);
            
            if(lastRule.indexOf(name) === -1) {
                throw new Error("Invalid statement: after " +
                                 (last? "." + last.statement + "()": "xs.module creation") +
                                 " only the following statements are allowed: " +
                                 (lastRule
                                    .map(function(s){return "."+s+"()"})
                                    .join())
                                );                
            }
            
            var args = $.makeArray(arguments),
                ret;
                
            if(fn){                
               ret = fn.apply(this, args);
            }
            
            this.statementStack.push({statement:name, args:args});

            return ret;
        };
    }
            
    function dequeueStatement(targetModule) {
        return targetModule.statementStack.pop();
    }
    
    function isReady(targetModule){                
        var ready = true;
        if(targetModule.moduleName) {
            ready = ready && targetModule.fileLoaded;
        }
        ready = ready && targetModule.dependencies.reduce(function(prev, next){
            return prev && isReady(next);
        }, true);

        return ready;
    }

    function retrieve(targetModule) {
        if(!targetModule.fileLoaded){            
            targetModule.file = resolveModuleFile(targetModule.moduleName);
            var self = targetModule;
            xs.loadScript(targetModule.file).then(function(){            
                self.fileLoaded = true;
                bootstrap(self);
            }).fail(function(){
                throw new Error("Could not load the file: " + self.file +
                                " for: " + self.moduleName);
            });
        }
    }

    function bootstrap(targetModule) {
        if(isReady(targetModule) && targetModule.executionStack.hasQueue()) {                
            targetModule.executionStack.dispatch();
            targetModule.trigger("module:ready");
        }
        else if(targetModule.moduleName && !targetModule.fileLoaded) {
            retrieve(targetModule);
        }
    }
    
    function queueExecution(targetModule, executionList) {        
        targetModule.executionStack.push(executionList);
        bootstrap(targetModule);
    }

    function resolveObject (source) {
        if(typeof source === "function") {
            return source.call(global);
        }
        else if (typeof source === "string"){
            return xs.getNamespace(source);
        }
        else {
            return source;
        }
    }
    
    function doSet(targetModule, namespace, implementation){
        queueExecution(targetModule, function(){
            xs.setNamespace(namespace, resolveObject(implementation), false);
        });
    }
    
    function baseWrapClass(clss){
        var imp = xs.x({},clss.prototype);
        xs.x(imp, {
            constructor:clss
        });
        return Base.extend(imp);
    }
    
    function doDeclare(targetModule, clss){
        queueExecution(targetModule, function(){
            var definedClass, baseClass; 
                
            if(clss["extend"]){
                if(typeof baseClass === "function"){
                    baseClass = xs.getNamespace(xs["extend"][0]);
                    
                    if(!baseClass.extend){
                        baseClass = baseWrapClass(baseClass);
                    }
                }
                else{
                    throw new Error("Class "+ clss["extend"] +" is not defined.");
                }
            }
            else {
                baseClass = Base;
            }

            definedClass = baseClass.extend(
                                resolveObject(clss["instance"]), 
                                resolveObject(clss["static"])
                            );
            
            //function name hint for debuggers
            definedClass.displayName = clss["name"];

            if(definedClass.implement && clss["implement"]){
                clss["implement"].map(xs.getNamespace).forEach(function(mixin){
                    definedClass.implement(mixin);                    
                });
            }

            xs.data(definedClass.prototype,"mixins", $.makeArray(clss["implement"]));

            xs.setNamespace(clss["name"],definedClass);
            //console.log("implemented:", moduleName);
            
            if(definedClass){
                xs.module.trigger({
                    type:"module:class-defined",
                    module:targetModule,
                    metadata: clss,
                    artifact:definedClass
                });
            }
        });
    }
    
    return {
       /**
        * Indicates that the current xs.module depends on the prevoius retrieval of other xs.modules
        * in order to its components to work properly. Establishes a dependency relation between
        * the xs.module and the xs.modules listed.
        * xs.modules required more than once will be retrieved only once and then cached.
        * The xs.module system performs circular dependency checks and when it detects
        * them, it breaks the dependency chain so all depednecies get succesfully
        * furfilled.
        *
        * @param {Arguments<string>} [dep1,dep2,...depN] An argument list of dependencies.
        * @example
        * //With an anonymous xs.module. Generally used for application entry points.
        * xs.module.require("dependency")
        * .execute(function(){
        *  //do something when dependency is ready.
        * })
        * 
        * //With a neamed xs.module. Generally used for component declaration.
        * xs.module("myxs.module").require("dependency")
        * .execute(function(){
        *  //do something when dependency is ready.
        * })
        */
        require: chained(statement("require", function() { 
            var self = this,
                required = $.makeArray(arguments);

            this.dependencies.push.apply(this.dependencies, required.map(resolveDependency));

            var circular;
            do {
                circular = circularDependencyCheck(this.dependencies);
                if(circular) {
                    console.warn("Circular dependency:", circular);
                    this.dependencies.splice(this.dependencies.indexOf(circular),1);
                }
            } while(circular);

            this.dependencies.forEach(function(dependency){
                if(!isReady(dependency)){
                    dependency.once("module:ready", function(){
                        bootstrap(self);
                    });
                    bootstrap(dependency);
                }
            });
        })),
        
        /**
        * Stores in the xs.module's execution stack a given function or list of functions
        * that will be executed when the xs.module dependencies have been succesfully
        * retrieved. If the xs.module Had no specified dependencies, the stack executes
        * right away.
        * @param {Arguments<function>} [fn1,fn2,...fnN] An argument list of functions
        * to be executed when all depedencies of the xs.module have been retrieved.
        * @example
        * xs.module("Myxs.module")
        * .require("Dependencyxs.module")
        * .execute(function(){
        *      // do something with Dependencyxs.module.
        * });
        *
        * //On an anonymous xs.module
        * xs.module.require("Dependencyxs.module")
        * .execute(function(){
        *      // do something with Dependencyxs.module.
        * });
        */
        execute: chained(statement("execute", function(){
            var executionList = $.makeArray(arguments);
            queueExecution(this, executionList);
        })),
        
       /**
        * Declares an object in the given path. The object must be provided in a
        * following <code>.as()</code> statement.
        *
        * @param {string} objectPath the path where to set the object.
        * @example
        * xs.module("MyObject")
        * .set("MyObject")
        * .as({
        *     property:"a property",
        *     method:function(){
        *        return this.property;
        *     }
        * })
        * 
        * MyObject.method() //"a property"
        */
        set: chained(statement("set")),
        
       /**
        * Initiates a class declaration in the xs.module. This statement denotes that
        * the current xs.module declares a class. It is usually followed by <code>.as()</code>
        * , <code>.extend()</code> or <code>.implement()</code>.
        * If no <code>.as()</code> statement is called providing a class description,
        * this staement has no effect.
        *
        * @param {string} className Fully qualified name of the class (with namespaces).
        * Ex: "ui.layout.FlexLayout"
        * @example
        * xs.module("MyClass")
        * .declare("MyClass")
        * .as({
        *      property:"value",
        *      method:function(){
        *          //...
        *      }
        * })
        *
        * xs.module.require("MyClass")
        * .execute(function(){
        *      var instance = new MyClass();
        * })
        */
        declare: chained(statement("declare")),
        
       /**
        * Defines the class inheritance to be applied to the preceding <code>.declare()</code> statement.
        * If no <code>.declare()</code> statement was called and no .as() statement is called later
        * providing an implemetation, this satement has no effect.
        *
        * @param {string} className Fully qualified name of the base class (with namespaces).
        * Ex: "ui.layout.FlexLayout"
        * @example
        * xs.module("SuperClass")
        * .declare("SuperClass")
        * .as({
        *      methodA:function(){
        *          return "A";
        *      }
        * })
        *
        * xs.module("MyClass").require("SuperClass")
        * .declare("MyClass").extend("SuperClass")
        * .as({
        *      methodB:function(){
        *          return "B"
        *      }
        * })
        *
        * xs.module.require("MyClass")
        * .execute(function(){
        *      var i = new MyClass();
        *
        *      i.methodA() // "A" --> inherited from SuperClass
        *      i.methodB() // "B"
        * })
        */
        extend: chained(statement("extend")),
        
       /**
        * Indicates that the current declared class borrows methods from other classes.
        * <warning>Properties on the present class that have the same name as properties
        * in any of the classes being borrowed will be overriden in the order they were
        * specified in the statement.</warning>
        * @param {Arguments<string>} mixin1,mixin2,...mixinN Arguments list of fully qualified
        * name of the class to inject into the declared class (with namespaces).
        * Ex: "ui.layout.FlexLayout"
        * @example
        * xs.module("Mixins")
        * .declare("MixinC")
        * .as({
        *      methodC:function(){
        *          return "C";
        *      }
        * })
        * .declare("MixinD")
        * .as({
        *      methodA:function(){
        *          return "D";
        *      }
        * })
        *
        * xs.module.require("Mixins")
        * .declare("Implementor").implement("MixinC","MixinD")
        * .as({
        *      methodA: function(){
        *          return "A";
        *      }
        *      methodB: function(){
        *          return "B";
        *      }
        * })
        *
        * var i = new Implementor();
        * i.methodA() // "D" --> borrowed from MixinD
        * i.methodB() // "B" --> present on Implementor
        * i.methodC() // "C" --> borrowed from MixinC
        */
        implement: chained(statement("implement")),
       
       /**
        * Provides an implementation for the declared class.
        * @param {object} implementation
        * The members of the Classes instances. This properties will be appended to the
        * Class's prototype.
        * @param {object} static
        * The members of the Class object. This properties will be appended to the
        * Class itself.
        * @example
        * xs.module("MyClass")
        * .declare("MyClass")
        * .as({
        *      property:"value",
        *      method: function(){
        *          return this.property;
        *      }
        * },
        * {
        *      staticMethod: function(){
        *          return "static";
        *      }
        * });
        *
        * xs.module.require("MyClass")
        * .execute(function(){
        *      var instance = new MyClass();
        *      instance.property // "value"
        *      instance.method() // "value"
        *
        *      MyClass.staticMethod() // "static"
        * })
        */
        as: chained(statement("as", function(){
            var prev, done = false;
            while ( (prev = dequeueStatement(this)) && !done){                                
                var prevst = prev.statement,
                    clss = {};

                if(prevst === "set") {
                    doSet(this, prev.args[0], arguments[0]);
                    done = true;
                }
                else if (["extend", "implement"].indexOf(prevst) > -1) {
                    clss[prevst] = clss[prevst]? 
                                        clss[prevst].concat(prev.args)
                                        : prev.args;
                } 
                else if (prevst === "declare") {
                    clss["name"] = prev.args[0];
                    clss["instance"] = arguments[0];
                    clss["static"] = arguments[1];
                    doDeclare(this, clss);
                    done = true;
                }
                else {
                    throw new Error("Invalid xs.module declaration.");
                }
            }
        }))
    };
    
})();

// mixin alias
Module.prototype.mixin = Module.prototype.implement;
// xs.module events
xs.x(Module.prototype, Trigger);

/**
 * public module api
 */
 var module = xs.module = global["module"] = function(name, fn){
    var instance;
    if(!(instance=moduleMappings[name])){
        instance = new Module(name);
        if(name) {
            moduleMappings[name] = instance;
        }        
    }
    
    /** 
     Coffescript fancy syntax support
        Example:
        xs.module "my.coffescript.xs.module", ->
          @require "xs.module1", "xs.module2"
          @declare "xs.module3"
          @extend  "xs.module4"
          @mixin   "xs.module5", "xs.module6"
          @as
            constructor: (@field1, @field2)->
            myMethod: -> "Hello!"
          @set "xs.module7"
          @as -> 1+1
          @execute -> doSomething()
    */
    if(typeof fn === "function") {
        fn.apply(instance);
    }
    
    return instance;
};

// xs.module global events
xs.x(xs.module, Trigger);

// Register factory methods.
(["require", "set", "declare", "execute"]).forEach(function(smt){
    xs.module[smt] = function() {
        var m = new xs.module();
        return m[smt].apply(m, arguments);
    };
});
