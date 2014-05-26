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
        states.setState(new states.UpgradeMenu());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));

            input.init(gfx.renderer.view);
            dbg.addStateButtons(states);
            dbg.addCheats(bpm);
            update();
        });

    }

    function update() {
        // If a switchState function is defined then we should call it.
        if (states.global.switchState) {
            states.global.switchState();
            states.global.switchState = null;
        }

        if (states.global.current) {
            states.global.current.update(time.delta);
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
