define(function() {
    var result = {
        load: load,
    };

    var texturesToCreate = {};

    function loadImages(loader, rootDir, addToTexQueue, urls) {
        for (key in urls) {
            var img = loader.loadImage(rootDir + urls[key]);
            result[key + 'Img'] = img;
            if (addToTexQueue) {
                texturesToCreate[key + 'Tex'] = img;
            }
        }
    }

    function createQueuedTextures() {
        for (key in texturesToCreate) {
            result[key] = new PIXI.Texture(new PIXI.BaseTexture(texturesToCreate[key]));
        }
        texturesToCreate = {};
    }

    function load(onComplete) {
        this.loader = LODE.createLoader();

        loadImages(this.loader, 'res/', true, {
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
