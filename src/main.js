requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/lode']);

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
