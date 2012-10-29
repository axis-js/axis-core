![Axis Logo](//raw.github.com/axis-js/axis-core/master/axis-logo.png)

Axis Framework - Core
=====================

[![Build Status](https://secure.travis-ci.org/axis-js/axis-core.png)](http://travis-ci.org/axis-js/axis-core)

The Axis Framework is a set of development artifacts that aim to facilitate the creation of rich web based 
applications and reusable libraries that are easy to deploy, maintain and share.
Its main objective is to enhance the experience of developing client-side applications for the web platform by:
* Allowing developers to create simple and easily maintainable javascript codebases.
* Providing means to enable componentization and extensibility of applications and libraries.
* Improving the overall development experience providing a base platform that covers most of the common uses cases.

Show me the code!
-----------------

### Dependency management: Module System.
```javascript
//scripts/my/super/Module.js

module("my.super.Module")
.require("some.Dependency")
.declare("my.super.Module")
.as({
    constructor: function(){
        console.log("Hi there!");
    }
});

//somewhere else:

xs.config.load({
  paths: {
     "my.super": "scripts/my/super/"
  }
});

module.require("my.super.Module")
.execute(function(){
     var instance = new my.super.Module();
})

```

Team:
-------
[@matix](/matix) (Twitter: [@matixfigueroa](//twitter.com/matixfigueroa))