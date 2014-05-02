define(function() {
    var result = {
        load: load,
        tex: {},
    };

    var texturesToCreate = {};

    function loadImages(loader, rootDir, urls) {
        for (key in urls) {
            var img = loader.loadImage(rootDir + urls[key]);
            texturesToCreate[key] = img;
        }
    }

    function createQueuedTextures() {
        for (key in texturesToCreate) {
            result.tex[key] = new PIXI.Texture(new PIXI.BaseTexture(texturesToCreate[key]));
        }
        texturesToCreate = {};
    }

    function load(onComplete) {
        this.loader = LODE.createLoader();

        loadImages(this.loader, 'res/', {
            bubble: 'bubble.png',
            glare: 'bubble-glare.png',
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
