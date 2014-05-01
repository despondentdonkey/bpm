define(['time', 'gfx', 'res'], function(time, gfx, res) {
    // Override default requestAnimationFrame for maximum compatibility.
    var requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, 1000/60) };

    function run() {
        res.load(function() {
            gfx.init(800, 600);

            // Bubble render test
            var baseTex = new PIXI.BaseTexture(res.bubble);
            var tex = new PIXI.Texture(baseTex);
            var spr = new PIXI.Sprite(tex);
            gfx.stage.addChild(spr);

            update();
        });
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
