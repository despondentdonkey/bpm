requirejs.config({
    paths: {
        lib: '../lib/'
    }
});

requirejs(['lib/pixi', 'lib/sfx', 'lib/lode', 'lib/underscore', 'debug', 'utils']);

requirejs(['time', 'gfx', 'res', 'states', 'input', 'bpm'], function(time, gfx, res, states, input, bpm) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    var focused = true;

    function run() {
        states.setState(new states.Field());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));

            // Pause game when window loses focus
            var prevState;
            window.addEventListener('blur', function() {
                var curState = states.current.state;
                if (focused && !curState.paused) {
                    prevState = curState;
                    states.cacheState(curState, new states.PauseMenu(curState));
                    focused = false;
                }
            });

            window.addEventListener('focus', function() {
                if (!focused) {
                    states.restoreState(prevState);
                    focused = true;
                    prevState = null;
                }
            });

            input.init(gfx.renderer.view);
            dbg.addStateButtons(states);
            dbg.addCheats(bpm);
            update();
        });

    }

    function update() {
        if (states.current.state) {
            if (!states.current.init) {
                states.current.state.init();
                states.current.init = true;
            }
            states.current.state.update(time.delta);
        }

        input.update();

        gfx.render();

        time.update();
        dbg.fpsMonitor(gfx, time);

        requestAnimationFrame(update);
    }

    run();
});
