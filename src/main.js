requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/lode', 'debug', 'utils']);

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
