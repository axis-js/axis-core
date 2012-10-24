"use strict";
module.exports = function(grunt) {
  var fs = require("fs");

  // Load local tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jasmine-runner');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-replace');
  
  function getIncludes(){
    var includes = {};
    fs.readdirSync("src/includes/").filter(function (file) {
      return file.indexOf(".js") === (file.length - 3);
    }).forEach(function (include) {
      includes[include] = fs.readFileSync("src/includes/"+include).toString();
    });

    return includes;
  }

  // Project configuration.
  grunt.initConfig({
    clean: ["target/", "testTarget/", "_SpecRunner.html"],
    lint: {
      files: ['grunt.js', 'target/**/*.js']
    }, 
    watch: {
      files: ['<config:jasmine.specs>','grunt.js', "src/**/*.js"],
      tasks: 'clean copy replace lint jasmine'
    },
    replace: {
      target: {
        options: {
          variables: getIncludes(),
          prefix: '//@@'
        },
        files: {
          'target/axis.js': ['src/axis.js']
        }
      }
    },
    copy: {
      target: {
        files: {
          "target/xs/": "src/xs/**"
        }
      }
    },
    jasmine : {
      src : [
          "test/jquery-1.8.2.js",
          'target/**/*.js'
      ],
      specs : 'test/**/*-spec.js',
      timeout : 10000,
      junit : {
        output : 'testTarget/'
      },
      phantomjs : {
        'ignore-ssl-errors' : true
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        es5: true,
        lastsemic:true,
        passfail:true
      },
      globals: {
        window:false,
        jQuery:false,
        $:false,
        module:false,
        xs:false,
        jasmine : false,
        describe : false,
        beforeEach : false,
        expect : false,
        it : false,
        spyOn : false
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'copy replace lint jasmine');
  grunt.registerTask('install', 'copy replace lint jasmine');

};