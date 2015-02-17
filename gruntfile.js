module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ["css/styles.scss"],
      tasks: ["sass:dist"]
    },
    exec: {
      webserver: {
        cmd: "node simple_static_webserver.js 2000"
      }
    },
    sass: {
      dist: {
        files: {
          'css/styles.css': 'css/styles.scss'
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: true
      },
      my_target: {
        dest: 'dist/jsconnect4.min.js',
        src: ['js/mathUtils.js', "js/gameboard.js"]
      }
    },
    copy: {
      my_target: {
        src: ['css/*', 'sounds/*', 'bower_components/buzz/dist/buzz.min.js', 'bower_components/jquery/dist/jquery.min.js', "bower_components/jquery-ui/jquery-ui.min.js", 'index.html'],
        dest: 'dist/'
      }
    },
    removeDir: {
      my_target: {
        src: "dist"
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask("s", ["sass:dist", "exec:webserver"]);

  grunt.registerMultiTask("removeDir", "Removes a directory", function() {
    var rimraf = require('rimraf');
    rimraf.sync(this.data.src);
  });

  grunt.registerTask('build', ['removeDir', 'uglify', 'copy']);
};
