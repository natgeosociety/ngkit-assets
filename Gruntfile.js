module.exports = function(grunt) {

    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            banner: "/*! <%= pkg.title %> <%= pkg.version %> | <%= pkg.homepage %> | (c) 2015 National Geographic | Apache 2.0 License */",
            prefix: 'bower_components/ngkit/'
        },
        clean: ['ngkit/docs/*', 'ngkit/dist/*'],
        jshint: {
            src: {
                options: {
                    jshintrc: "ngkit/src/.jshintrc"
                },
                src: ["ngkit/src/js/*.js", "ngkit/src/customjs/*.js"]
            }
        },
        uglify: {
            distmin: {
                files: {
                    "ngkit/dist/js/ngkit.min.js": "ngkit/dist/js/ngkit.js"
                }
            }
        },
        sass: {
            options: {
                includePaths: ['ngkit/src', 'bower_components/ngkit/src'],
                sourceMap: true
            },
            dev: {
                files: {
                    'ngkit/dist/css/ngkit.css': 'ngkit/src/themes/dotorg/ngkit.scss',
                    'ngkit/dist/css/ngkit-gete.css': 'ngkit/src/themes/gete/ngkit.scss',
                    'ngkit/dist/css/ngkit-gest.css': 'ngkit/src/themes/gest/ngkit.scss',
                    'ngkit/dist/css/ngkit-lmte.css': 'ngkit/src/themes/lmte/ngkit.scss',
                    'ngkit/dist/css/ngkit-lmee.css': 'ngkit/src/themes/lmee/ngkit.scss'
                }
            },
            dist: {
                options: {
                    outputStyle: 'compressed'
                },
                files: {
                    'ngkit/dist/css/ngkit.min.css': 'ngkit/src/themes/dotorg/ngkit.scss',
                    'ngkit/dist/css/ngkit-gete.min.css': 'ngkit/src/themes/gete/ngkit.scss',
                    'ngkit/dist/css/ngkit-gest.min.css': 'ngkit/src/themes/gest/ngkit.scss',
                    'ngkit/dist/css/ngkit-lmte.min.css': 'ngkit/src/themes/lmte/ngkit.scss',
                    'ngkit/dist/css/ngkit-lmee.min.css': 'ngkit/src/themes/lmee/ngkit.scss'
                }
            }
        },
   
        concat: {
            dist: {
                options: {
                    separator: "\n\n"
                },
                src: [
                    '<%= meta.prefix %>src/js/core/core.js',
                    '<%= meta.prefix %>src/js/core/touch.js',
                    '<%= meta.prefix %>src/js/core/utility.js',
                    '<%= meta.prefix %>src/js/core/smooth-scroll.js',
                    '<%= meta.prefix %>src/js/core/scrollspy.js',
                    '<%= meta.prefix %>src/js/core/toggle.js',
                    '<%= meta.prefix %>src/js/core/alert.js',
                    '<%= meta.prefix %>src/js/core/button.js',
                    //'<%= meta.prefix %>src/js/core/dropdown.js',
                    'ngkit/src/customjs/dropdown.js',
                    // 'src/js/core/grid.js',
                    '<%= meta.prefix %>src/customjs/grid.js',
                    '<%= meta.prefix %>src/js/core/modal.js',
                    '<%= meta.prefix %>src/js/core/nav.js',
                    '<%= meta.prefix %>src/js/core/offcanvas.js',
                    '<%= meta.prefix %>src/js/core/switcher.js',
                    '<%= meta.prefix %>src/js/core/tab.js',
                    '<%= meta.prefix %>src/js/core/cover.js',
                    // 'src/js/components/accordion.js',
                    // '<%= meta.prefix %>src/customjs/accordion.js',
                    // 'src/js/components/autocomplete.js',
                    '<%= meta.prefix %>src/customjs/autocomplete.js',
                    '<%= meta.prefix %>src/js/components/datepicker.js',
                    '<%= meta.prefix %>src/js/components/form-password.js',
                    '<%= meta.prefix %>src/js/components/form-select.js',
                    '<%= meta.prefix %>src/js/components/grid.js',
                    '<%= meta.prefix %>src/js/components/htmleditor.js',
                    '<%= meta.prefix %>src/js/components/lightbox.js',
                    '<%= meta.prefix %>src/js/components/nestable.js',
                    '<%= meta.prefix %>src/js/components/notify.js',
                    '<%= meta.prefix %>src/js/components/pagination.js',
                    '<%= meta.prefix %>src/js/components/parallax.js',
                    '<%= meta.prefix %>src/js/components/search.js',
                    '<%= meta.prefix %>src/js/components/slider.js',
                    '<%= meta.prefix %>src/js/components/slideset.js',
                    'ngkit/src/customjs/slideshow.js',
                    '<%= meta.prefix %>src/js/components/slideshow-fx.js',
                    '<%= meta.prefix %>src/js/components/sortable.js',
                    '<%= meta.prefix %>src/js/components/sticky.js',
                    '<%= meta.prefix %>src/js/components/timepicker.js',
                    '<%= meta.prefix %>src/js/components/tooltip.js',
                    '<%= meta.prefix %>src/js/components/upload.js',
                    "<%= meta.prefix %>src/customjs/subnavaccordion.js",
                    "<%= meta.prefix %>src/customjs/drawer.js",
                    // "<%= meta.prefix %>src/customjs/accordion.js",
                    "ngkit/src/customjs/accordion.js",
                    "ngkit/src/customjs/accordionHash.js",
                    "<%= meta.prefix %>src/customjs/carousel.js",
                    "<%= meta.prefix %>src/customjs/filter.js",
                    "ngkit/src/customjs/facet-filter.js",
                    "<%= meta.prefix %>src/customjs/popover.js",
                    // "<%= meta.prefix %>src/customjs/definition.js",
                    "ngkit/src/customjs/definition.js",
                    "<%= meta.prefix %>src/customjs/slider-switch.js",
                    "<%= meta.prefix %>src/customjs/table-sort.js",
                    "<%= meta.prefix %>src/customjs/collapsiblelist.js",
                    "<%= meta.prefix %>src/customjs/toolbar.js",
                    "ngkit/src/customjs/slideshowcounter.js",
                    // "<%= meta.prefix %>src/customjs/rangeslider.js",
                    //"<%= meta.prefix %>src/customjs/slider.js",
                    "<%= meta.prefix %>src/customjs/popovermenu.js",
                    "<%= meta.prefix %>src/customjs/readmore.js",

                    "ngkit/src/customjs/updateJucier.js",
                    "bower_components/lazysizes/plugins/respimg/ls.respimg.js",
                    "bower_components/lazysizes/lazysizes.js",
                    "bower_components/newsfader/src/jquery.newsfader.js"

                ],
                dest: "ngkit/dist/js/ngkit.js"
            }
        },
        svgmin: {                       // Task
          options: {                  // Configuration that will be passed directly to SVGO
              plugins: [{
                  removeViewBox: false
              }, {
                  removeUselessStrokeAndFill: false
              }, {
                  convertPathData: {
                      straightCurves: false // advanced SVGO plugin option
                  }
              }]
          },
          default: {                     // Target
              files: [{               // Dictionary of files
                  expand: true,       // Enable dynamic expansion.
                  cwd: 'ngkit/src/images/src',     // Src matches are relative to this path.
                  src: ['**/*.svg'],  // Actual pattern(s) to match.
                  dest: 'ngkit/src/images/min',       // Destination path prefix.
                  ext: '.svg'     // Dest filepaths will have this extension.
              }]
          }
        },
        "dr-svg-sprites": {
          default: {
            options: {
                spriteElementPath: "ngkit/src/images/min",
                spritePath: "ngkit/src/images",
                previewPath: "",
                cssPath: "ngkit/src/_svgsprites.scss",
                template: "ngkit/src/svgsprites.scss.hbs",
                prefix: "ng-icon",
                refSize: "large",  // Size of the largest icon
                sizes: {
                  large: 59,       // Size of the largest icon. Allows us to make one box for any icon
                  small: 24
                }
            }
          }
        },
        "bower-install-simple": {
            default: {
                options: {
                    color: true
                }
            }
        },
        copy: {
            styleguide: {
                files: [
                    {src: ["ngkit/src/styleguide.md"], dest: "ngkit/dist/css/styleguide.md" },
                    {expand: true, flatten: true, src: ["ngkit/src/pages/*"], dest: "ngkit/docs/pages/"},
                    {expand: true, flatten: true, src: ["bower_components/ngkit/src/fonts/*"], dest: "ngkit/dist/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/ngkit/src/fonts/*"], dest: "ngkit/docs/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/icon-society/fonts/*"], dest: "ngkit/dist/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/icon-society/fonts/*"], dest: "ngkit/docs/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/icon-society/fonts/*"], dest: "static/fonts/"},
                    {expand: true, flatten: true, src: ["ngkit/src/images/*.+(svg|png|jpg)"], dest: "ngkit/docs/images/"},
                    {expand: true, flatten: true, src: ["ngkit/src/images/*.+(svg|png|jpg)"], dest: "ngkit/dist/images/"},
                    {src: ["bower_components/ngkit/docs/public/jquery-1.11.0.min.js"], dest: "ngkit/docs/public/jquery-1.11.0.min.js"},
                    {src: ["ngkit/dist/js/ngkit.js"], dest: "ngkit/docs/js/ngkit.js"},
                    {src: ["ngkit/dist/css/ngkit.css"], dest: "ngkit/docs/public/style.css"},
                    {src: ["bower_components/ngs-globaldata/dist/css/fonts.css"], dest: "ngkit/docs/public/fonts.css"},
                    {expand:true, flatten: true, src: ["ngkit/dist/css/themes/*.css"], dest: "ngkit/docs/themes/"},
                    {src: ["ngkit/src/js/sample-search-results.json"], dest: "ngkit/docs/js/sample-search-results.json"}
                ]
            },
            global: {
                files: [
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/img/logos/*"], dest: "static/images/logos/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/img/favicons/*"], dest: "static/images/favicons/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/css/footer.css"], dest: "static/css/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/css/header.css"], dest: "static/css/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/css/fonts.css"], dest: "static/css/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/fonts/*"], dest: "static/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/fonts/*"], dest: "ngkit/docs/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/fonts/*"], dest: "ngkit/dist/fonts/"},
                    {expand: true, flatten: true, src: ["bower_components/ngs-globaldata/dist/css/_hco_fonts.scss"], dest: "ngkit/src/"}
                ]
            },
            jslibs: {
                files: [
                    {expand: true, flatten: true, src: ["bower_components/jquery/dist/jquery.min.*"], dest: "static/js/jquery/"},
                ]
            }
        },
        watch: {
            sass: {
                files: ['ngkit/src/**/*.scss'],
                tasks: ['concurrent:sass']
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            sass: {
                tasks: ['sass:dev', 'sass:dist']
            }
        }
    });

    // Load grunt tasks from NPM packages
    grunt.loadNpmTasks("grunt-sass");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-svgmin');
    grunt.loadNpmTasks('grunt-dr-svg-sprites');
    grunt.loadNpmTasks("grunt-bower-install-simple");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-clearcache');
    grunt.loadNpmTasks('grunt-concurrent');

    // Register grunt tasks
    grunt.registerTask("build", ["clean", "jshint", "svgmin", "dr-svg-sprites", "copy:global", "sass:dev", "concat", "copy:jslibs", "bower-install-simple", "copy:styleguide" ]);
    grunt.registerTask("default", ["clean", "jshint", "svgmin", "dr-svg-sprites", "concat", "copy:jslibs", "bower-install-simple", "copy:global", "uglify:distmin", "sass:dev", "sass:dist",  "copy:styleguide"]);
    grunt.registerTask("rebuildstyleguide", ["clean", "jshint", "sass:dev", "concat", "uglify:distmin", "sass:dist", "copy:styleguide", ]);
    grunt.registerTask("watchsass", ["watch:sass"]);
    grunt.registerTask("fast", ["clean", "jshint", "concat", "copy:jslibs",  "copy:global",  "sass:dev", "sass:dist"]);
};
