

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= pkg.banner %>',
        stripBanners: true
      },
      dist: {
        src: ['ngkit/src/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
    },
    uglify: {
      options: {
        banner: '<%= pkg.banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
    },
    jshint: {
      options: {
        jshintrc: true,
        reporterOutput: "",
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['ngkit/src/customjs/*.js']
      }
    },
    sass: {
      options: {
          includePaths: ['ngkit/src/*.scss'],
          sourceMap: true
      },
      dev: {
          files: {
              'ngkit/dist/css/ngkit.assets.css': 'ngkit/src/ngkit.assets.scss',
           
          }
      },
      dist: {
          options: {
              outputStyle: 'compressed'
          },
          files: {
              'ngkit/dist/css/ngkit.min.css': 'ngkit/src/themes/dotorg/ngkit.scss',
    
          }
      }
  },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
      }

      },
    }
  );

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint', 'sass', 'clean', 'concat', 'uglify']);

};

