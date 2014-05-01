define(['time', 'gfx'], function(time, gfx) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    function run() {
        gfx.init(800, 600);
        update();
    }

    function update() {
        // state stuff here

        time.update();

        gfx.render();

        requestAnimationFrame(update);
    }

    return {
        requestAnimationFrame: requestAnimationFrame,
        run: run,
    };
});
