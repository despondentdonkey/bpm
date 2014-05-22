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
        //states.setState(new states.Field());
        states.setState(new states.MainMenu());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));

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
