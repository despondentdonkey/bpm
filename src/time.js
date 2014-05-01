define(function() {
    /*
        ### time.js ###
        Useful methods for time.
    */

    this.fps = 0; // Dynamic value containing the frame rate.
    this.delta = 0; // Dynamic value containing the time that passes each frame.

    var lastFPS = (new Date()).getTime();
    var fpsCounter = 0;
    var lastFrame = 0;

    function get() {
        return (new Date()).getTime();
    }

    // Updates the fps and delta values.
    function update() {
        if (get() - lastFPS > 1000) {
            this.fps = fpsCounter;
            fpsCounter = 0; // Reset the FPS counter
            lastFPS += 1000; // Add one second
        }
        fpsCounter++;

        time = get();
        deltaTime = (time - lastFrame);
        lastFrame = time;
        if (!(deltaTime >= time)) {
            this.delta = deltaTime;
        }
    }

    return {
        get: get,
        update: update,
        fps: this.fps,
        delta: this.delta,
    };
});
