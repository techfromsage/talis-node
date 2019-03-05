'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    grep:grunt.option('filter') ? grunt.option('filter') : false,
                    reporter: "spec",
                    timeout: 10000
                },
                src: ["test/**/*.js"]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib: {
                src: ['index.js']
            }
        },
        jsbeautifier: {
            modify: {
                src: ['Gruntfile.js', 'index.js'],
                options: {
                    config: '.jsbeautifyrc'
                }
            },
            verify: {
                src: ['Gruntfile.js', 'index.js'],
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '.jsbeautifyrc'
                }
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib: {
                files: ['<%= jshint.lib.src %>', 'test/**/*_test.js'],
                tasks: ['jshint:lib', 'mochaTest']
            }
        }
    });

    // Default task
    grunt.registerTask('default', ['jshint', 'mochaTest:test']);
    grunt.registerTask('beautify', ['jsbeautifier:modify']);
    grunt.registerTask('clean', ['jshint', 'jsbeautifier:modify']);
    grunt.registerTask('verify', ['jshint', 'jsbeautifier:verify']);
    grunt.registerTask('test', ['mochaTest']);
};