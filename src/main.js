requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/pixi', 'lib/sfx', 'lib/lode', 'lib/underscore', 'debug', 'utils'], function() {
requirejs(['time', 'gfx', 'res', 'states', 'input', 'bpm'], function(time, gfx, res, states, input, bpm) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    function run() {
        states.setState(new states.Field());
        //states.setState(new states.MainMenu());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));

            input.init(gfx.renderer.view);
            dbg.addStateButtons(states);
            dbg.addCheats(bpm);
            update();
        });

    }

    function update() {
        // If a new state exists then we must begin a state switch.
        if (states.current.newState) {
            // If there's currently a state, set it to the previous state and destroy it.
            if (states.current.state) {
                states.current.prevState = states.current.state;
                if (states.current.destroyOld) {
                    states.current.prevState.destroy();
                }
            }

            // Set the current state to the new state, initialize and clear the new state.
            states.current.state = states.current.newState;
            if (states.current.initNew) {
                states.current.state.init();
            }
            states.current.newState = null;
        }

        if (states.current.state) {
            states.current.state.update(time.delta);
        }

        input.update();

        if (gfx.sortStageDisplays) {
            gfx.sortDisplays();
            gfx.sortStageDisplays = false;
        }

        gfx.render();

        time.update();
        dbg.fpsMonitor(gfx, time);

        requestAnimationFrame(update);
    }

    run();
});
});
