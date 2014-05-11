requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/pixi', 'lib/sfx', 'lib/lode', 'lib/underscore', 'debug', 'utils']);

requirejs(['time', 'gfx', 'res', 'states', 'input'], function(time, gfx, res, states, input) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    function run() {
        states.setState(new states.Field());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));
            input.init(gfx.renderer.view);
            dbg.addStateButtons(states);
            update();
        });
    }

    function update() {
        if (states.currentState) {
            if (!states.currentStateInit) {
                states.currentState.init();
                states.currentStateInit = true;
            }
            states.currentState.update(time.delta);
        }

        input.update();
        time.update();

        gfx.render();

        requestAnimationFrame(update);
    }

    run();
});
