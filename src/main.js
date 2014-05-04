requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/pixi', 'lib/sfx', 'lib/lode', 'debug', 'utils']);

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
