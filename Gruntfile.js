module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-shell');

    grunt.initConfig({
        shell: {
            runKarma: {
                command: 'node node_modules/karma/bin/karma start'
            }
        },
    });

    grunt.registerTask('test', ['shell:runKarma']);
};
