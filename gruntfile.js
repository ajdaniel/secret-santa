module.exports = function (grunt) {

    // Load the grunt libraries
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-eslint');

    // configure the libraries
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    './public/min/js/auth.service.js': ['./public/auth.service.js'],
                    './public/min/js/santa-app.component.js': ['./public/santa-app.component.js']
                }
            }
        },

        concat: {
            prod: {
                src: ['./public/min/js/*.js'],
                dest: './public/min/app.js'
            }
        },

        uglify: {
            prod: {
                src: ['./public/min/app.js'],
                dest: './public/min/app.js'
            }
        },

        karma: {
            santa : {
                configFile: 'karma.santa.conf.js'
            }
        },

        eslint: {
            js : ['server/**/*.js', 'public/*.js']
        }
    });

    grunt.registerTask('default', ['eslint', 'ngAnnotate', 'concat:prod', 'uglify:prod']);

    grunt.registerTask('test', ['karma:santa']);
};