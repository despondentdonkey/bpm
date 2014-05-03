requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/lode', 'debug']);

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
