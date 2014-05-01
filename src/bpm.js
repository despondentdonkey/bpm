define(['time'], function(time) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    function run() {
        // initialize stuff here
        update();
    }

    function update() {
        // state stuff here

        time.update();

        // rendering should take place here

        requestAnimationFrame(update);
    }

    return {
        requestAnimationFrame: requestAnimationFrame,
        run: run,
    };
});
