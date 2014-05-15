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

    var paused = false;

    function run() {
        states.setState(new states.Field());

        res.load(function() {
            gfx.init(800, 600, document.getElementById('canvas'));

            // Pause game when window loses focus. Might wanna move this somewhere else, at least the rendering part.
            window.addEventListener('blur', function() {
                paused = true;

                var back = new gfx.pixi.Graphics();
                back.beginFill('0', 0.5);
                back.drawRect(0, 0, gfx.width, gfx.height);
                back.endFill();

                var text = new gfx.pixi.Text('Paused', {
                    stroke: 'black',
                    strokeThickness: 8,
                    align: 'center',
                    fill: 'white',
                    font: 'bold 64px arial',
                });
                text.anchor.x = text.anchor.y = 0.5;
                text.x = gfx.width/2;
                text.y = gfx.height/2;

                gfx.stage.addChild(back);
                gfx.stage.addChild(text);

                function onMouseDown() {
                    paused = false;
                    gfx.renderer.view.removeEventListener('mousedown', onMouseDown);
                    gfx.stage.removeChild(back);
                    gfx.stage.removeChild(text);
                }
                gfx.renderer.view.addEventListener('mousedown', onMouseDown);
            });

            input.init(gfx.renderer.view);
            dbg.addStateButtons(states);
            update();
        });

    }

    function update() {
        if (!paused) {
            if (states.currentState) {
                if (!states.currentStateInit) {
                    states.currentState.init();
                    states.currentStateInit = true;
                }
                states.currentState.update(time.delta);
            }
            input.update();
        }

        gfx.render();

        time.update();
        dbg.fpsMonitor(gfx, time);

        requestAnimationFrame(update);
    }

    run();
});
