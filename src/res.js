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
            pin: 'pin.png'
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
