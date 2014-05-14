define(['gfx'], function(gfx) {
    var result = {
        load: load,
        tex: {},
        slices: {},
    };

    var texturesToCreate = {};
    var slicesToCreate = {};

    function loadImages(loader, rootDir, urls) {
        for (var key in urls) {
            var img = loader.loadImage(rootDir + urls[key]);
            texturesToCreate[key] = img;
        }
    }

    function createQueuedTextures() {
        for (var key in texturesToCreate) {
            result.tex[key] = new gfx.pixi.Texture(new gfx.pixi.BaseTexture(texturesToCreate[key]));
        }
        texturesToCreate = {};
    }

    function createQueuedSlices() {
        for (var key in slicesToCreate) {
            var tex = result.tex[key];
            var center = slicesToCreate[key];
            var x=center.x, y=center.y, w=center.width, h=center.height;
            var x2=x+w, y2=y+h;

            result.slices[key] = {
                center: new gfx.pixi.Texture(tex, center),
                right: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(x2, y, tex.width - x2, h)),
                left: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(0, y, x, h)),

                topLeft: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(0, 0, x, y)),
                top: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(x, 0, w, y)),
                topRight: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(x2, 0, tex.width - x2, y)),

                bottomLeft: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(0, y2, x, tex.height - y2)),
                bottom: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(x, y2, w, tex.height - y2)),
                bottomRight: new gfx.pixi.Texture(tex, new gfx.pixi.Rectangle(x2, y2, tex.width - x2, tex.height - y2)),
            };
        }
    }

    function load(onComplete) {
        this.loader = LODE.createLoader();

        loadImages(this.loader, 'res/gfx/', {
            bubble: 'bubbles/bubble.png',
            bubbleParticle: 'bubbles/bubble-particle.png',
            glare: 'bubbles/bubble-glare.png',
            armor1: 'bubbles/bubble-armor1.png',
            armor2: 'bubbles/bubble-armor2.png',
            armor3: 'bubbles/bubble-armor3.png',
            armor4: 'bubbles/bubble-armor4.png',
            armor5: 'bubbles/bubble-armor5.png',
            armor6: 'bubbles/bubble-armor6.png',
            armor7: 'bubbles/bubble-armor7.png',
            armor8: 'bubbles/bubble-armor8.png',
            armor9: 'bubbles/bubble-armor9.png',

            pin: 'pin.png',
            arrow: 'arrow.png',
            background: 'background.jpg',
            pinParticle: 'pin-particle.png',

            barBack: 'bar-back.png',
            barFront: 'bar-front.png',
        });

        slicesToCreate = {
            barBack: new gfx.pixi.Rectangle(12, 12, 25, 4),
            barFront: new gfx.pixi.Rectangle(12, 12, 25, 4),
        };

        this.loader.load(function() {
            createQueuedTextures();
            createQueuedSlices();
            if (onComplete) {
                onComplete();
            }
        });
    }

    return result;
});
