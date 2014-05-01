require.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['bpm'], function(bpm) {
    bpm.run();
});
