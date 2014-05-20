define(['gfx'], function(gfx) {
    var result = {
        load: load,
        tex: {},
        sheets: {},
        slices: {},
    };

    var texturesToCreate = {};
    var spriteSheetsToCreate = {};
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

    function createQueuedSpriteSheets() {
        for (var key in spriteSheetsToCreate) {
            var obj = spriteSheetsToCreate[key]; // Should contain an array [cellWidth, cellHeight]
            result.sheets[key] = gfx.createSpriteSheet(result.tex[key], obj[0], obj[1]);
        }
        spriteSheetsToCreate = {};
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
        slicesToCreate = {};
    }

    function load(onComplete) {
        this.loader = LODE.createLoader();

        loadImages(this.loader, 'res/gfx/', {
            bubble: 'bubbles/bubble.png',
            bubbleParticle: 'bubbles/bubble-particle.png',
            glare: 'bubbles/bubble-glare.png',
            cracks: 'bubbles/cracks-32x32-strip5.png',
            armor: 'bubbles/armor-32x32-strip9.png',

            pin: 'pin.png',
            shotgunBullet: 'shotgun-bullet.png',
            rifleBullet: 'rifle-bullet.png',

            arrow: 'arrow.png',
            background: 'background.jpg',
            pinParticle: 'pin-particle.png',

            barBack: 'bar-back.png',
            barFront: 'bar-front.png',
        });

        // Creates a list of textures to be used with PIXI.MovieClip. [cellWidth, cellHeight]
        spriteSheetsToCreate = {
            cracks: [32, 32],
            armor: [32, 32],
        };

        slicesToCreate = {
            barBack: new gfx.pixi.Rectangle(12, 12, 25, 4),
            barFront: new gfx.pixi.Rectangle(12, 12, 25, 4),
        };

        this.loader.load(function() {
            createQueuedTextures();
            createQueuedSpriteSheets();
            createQueuedSlices();
            if (onComplete) {
                onComplete();
            }
        });
    }

    return result;
});
