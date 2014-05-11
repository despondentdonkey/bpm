define(['gfx'], function(gfx) {
    var result = {
        load: load,
        tex: {},
    };

    var texturesToCreate = {};

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

    function load(onComplete) {
        this.loader = LODE.createLoader();

        loadImages(this.loader, 'res/gfx/', {
            bubble: 'bubbles/bubble.png',
            glare: 'bubbles/bubble-glare.png',
            armor1: 'bubbles/bubble-armor1.png',
            armor2: 'bubbles/bubble-armor2.png',
            armor3: 'bubbles/bubble-armor3.png',
            armor4: 'bubbles/bubble-armor4.png',

            pin: 'pin.png',
            arrow: 'arrow.png',
            background: 'background.jpg',
        });

        this.loader.load(function() {
            createQueuedTextures();
            if (onComplete) {
                onComplete();
            }
        });
    }

    return result;
});
