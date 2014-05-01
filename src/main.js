requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/pixi.dev', 'lib/lode']);

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
