import _ from 'underscore'
import * as pixi from 'pixi.js';

export function init(width, height, parent) {
    this.width = width;
    this.height = height;
    this.stage = new pixi.Stage(0x505050);
    this.renderer = pixi.autoDetectRenderer(this.width, this.height);

    if (this.renderer instanceof pixi.WebGLRenderer) {
        console.log('Using WebGLRenderer');
    } else if (this.renderer instanceof pixi.CanvasRenderer) {
        console.log('Using CanvasRenderer');
    }

    this.sortStageDisplays = false;

    // Custom depth property for pixi display objects.
    var gfx = this;
    Object.defineProperty(pixi.DisplayObject.prototype, 'depth', {
        get: function() { return this._bpmDepth; },
        set: function(val) {
            this._bpmDepth = val;
            gfx.sortStageDisplays = true;
        },
    });

    // Custom property to sync with game object properties.
    Object.defineProperty(pixi.DisplayObject.prototype, 'syncGameObjectProperties', {
        get: function() { return this._bpmSyncGameObjectProperties; },
        set: function(val) { this._bpmSyncGameObjectProperties = val; },
    });

    this.renderer.view.tabIndex = 0;
    if (parent) {
        parent.appendChild(this.renderer.view);
    } else {
        document.body.appendChild(this.renderer.view);
    }
    this.renderer.view.focus();

    // Give focus to the canvas element when you mouse over it.
    this.renderer.view.addEventListener('mouseover', _.bind(function() {
        this.renderer.view.focus();
    }, this));
}

// Insertion sort. Better than Array.prototype.sort() since it works better by leaving objects alone when depth values are the same.
export function sortDisplays(container) {
    var list = container ? container.children : this.stage.children;

    for (var i=1; i<list.length; ++i) {
        var key = list[i];
        var j = i-1;

        while (j >= 0 && (list[j].depth || 0) < (key.depth || 0)) {
            list[j+1] = list[j];
            j--;
        }

        list[j+1] = key;
    }
}

export function render() {
    this.renderer.render(this.stage);
}

// Returns an array of textures of each frame. Only works on a sprite sheet which has each cell full.
export function createSpriteSheet(tex, cellWidth, cellHeight) {
    var textures = [];
    for (var w=0; w<tex.width/cellWidth; ++w) {
        for (var h=0; h<tex.height/cellHeight; ++h) {
            textures.push(new pixi.Texture(tex, new pixi.Rectangle(w * cellWidth, h * cellHeight, cellWidth, cellHeight)));
        }
    }
    return textures;
}

export var NineSlice = function(slices) {
    pixi.DisplayObjectContainer.call(this);
    this.slices = slices;
    this.sprites = {};

    for (var key in this.slices) {
        this.sprites[key] = new pixi.Sprite(this.slices[key]);
        this.sprites[key].depth = this.depth;
        this.addChild(this.sprites[key]);
    }

    // NineSlice Width/Height
    // Using seperate width/height to not conflict with Pixi.
    // With 1.6 Pixi children positions affect the parents width/height and we do not want this here.
    this._nsWidth = 0;
    this._nsHeight = 0;
};
    NineSlice.prototype = Object.create(pixi.DisplayObjectContainer.prototype);
    NineSlice.prototype.constructor = NineSlice;

    NineSlice.prototype.setPos = function(sprite, x, y, w, h) {
        sprite.position.x = x;
        sprite.position.y = y;
        sprite.scale.x = w/sprite.texture.width;
        sprite.scale.y = h/sprite.texture.height;
    };

    NineSlice.prototype.updatePositions = function(sprites, x, y, w, h) {
        this.setPos(sprites.left, 0, sprites.topLeft.height, sprites.left.width, h-sprites.topLeft.height);
        this.setPos(sprites.top, sprites.topLeft.width, 0, w-sprites.topLeft.width, sprites.top.height);
        this.setPos(sprites.right, w, sprites.topRight.height, sprites.right.width, h-sprites.topRight.height);
        this.setPos(sprites.bottom, sprites.bottomLeft.width, h, w-sprites.bottomLeft.width, sprites.bottom.height);
        this.setPos(sprites.topLeft, 0, 0, sprites.topLeft.width, sprites.topLeft.height);
        this.setPos(sprites.topRight, w, 0, sprites.topRight.width, sprites.topRight.height);
        this.setPos(sprites.bottomRight, w, h, sprites.bottomRight.width, sprites.bottomRight.height);
        this.setPos(sprites.bottomLeft, 0, h, sprites.bottomRight.width, sprites.bottomRight.height);
        this.setPos(sprites.center, sprites.left.width, sprites.top.height, w-sprites.left.width, h-sprites.top.height);
    };

    NineSlice.prototype.update = function() {
        this.updatePositions(this.sprites, this.x, this.y, this._nsWidth, this._nsHeight);
    };

    NineSlice.prototype.setSize = function(width, height, noUpdate) {
        this._nsWidth = width;
        this._nsHeight = height;
        if (_.isUndefined(noUpdate) || noUpdate === false) {
            this.update();
        }
    };

let gfx = {
    init: init,
    sortDisplays: sortDisplays,
    render: render,
    createSpriteSheet: createSpriteSheet,
    NineSlice: NineSlice,
    pixi: pixi,
    layers: {
        background: 100,
        bubble: 5,
        default: 0,
        gui: -10,
    },
};
export default gfx;
