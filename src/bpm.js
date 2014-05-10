define(['time', 'gfx', 'res', 'states', 'input'], function(time, gfx, res, states, input) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    var currentState;
    var currentStateInit = false;

    function run() {
        setState(new states.Field());

        var bpm = this;
        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));
            input.init(gfx.renderer.view);
            dbg.addStateButtons(bpm, states);
            update();
        });
    }

    function update() {
        if (currentState) {
            if (!currentStateInit) {
                currentState.init();
                currentStateInit = true;
            }
            currentState.update(time.delta);
        }

        input.update();
        time.update();

        gfx.render();

        requestAnimationFrame(update);
    }

    function setState(state) {
        if (currentState) {
            currentState.destroy();
        }
        currentState = state;
        currentStateInit = false;
    }

    return {
        requestAnimationFrame: requestAnimationFrame,
        run: run,
        setState: setState,
    };
});
