define(['lib/pixi'], function(pixi) {
    function init(width, height, parent) {
        this.width = width;
        this.height = height;
        this.stage = new pixi.Stage(0x505050);
        this.renderer = pixi.autoDetectRenderer(this.width, this.height);

        // Custom depth property for pixi display objects.
        var gfx = this;
        Object.defineProperty(pixi.DisplayObject.prototype, 'depth', {
            get: function() { return this._bpmDepth; },
            set: function(val) {
                this._bpmDepth = val;
                gfx.sortDisplays();
            },
        });

        this.renderer.view.tabIndex = 0;
        if (parent) {
            parent.appendChild(this.renderer.view);
        } else {
            document.body.appendChild(this.renderer.view);
        }
        this.renderer.view.focus();
    }

    var depthComparator = function(a, b) {
        var aDepth = a.depth ? a.depth : 0;
        var bDepth = b.depth ? b.depth : 0;
        return bDepth - aDepth;
    };

    function sortDisplays(container) {
        if (container) {
            container.children.sort(depthComparator);
        } else {
            this.stage.children.sort(depthComparator);
        }
    }

    function render() {
        this.renderer.render(this.stage);
    }


    var NineSlice = createClass(pixi.DisplayObjectContainer, function(slices) {
        this.slices = slices;
        this.sprites = {};

        for (var key in this.slices) {
            this.sprites[key] = new pixi.Sprite(this.slices[key]);
            this.sprites[key].depth = this.depth;
            this.addChild(this.sprites[key]);
        }

    }, {
        setPos: function(sprite, x, y, w, h) {
            sprite.position.x = x;
            sprite.position.y = y;
            sprite.scale.x = w/sprite.texture.width;
            sprite.scale.y = h/sprite.texture.height;
        },

        updatePositions: function(sprites, x, y, w, h) {
            this.setPos(sprites.left, 0, sprites.topLeft.height, sprites.left.width, h-sprites.topLeft.height);
            this.setPos(sprites.top, sprites.topLeft.width, 0, w-sprites.topLeft.width, sprites.top.height);
            this.setPos(sprites.right, w, sprites.topRight.height, sprites.right.width, h-sprites.topRight.height);
            this.setPos(sprites.bottom, sprites.bottomLeft.width, h, w-sprites.bottomLeft.width, sprites.bottom.height);
            this.setPos(sprites.topLeft, 0, 0, sprites.topLeft.width, sprites.topLeft.height);
            this.setPos(sprites.topRight, w, 0, sprites.topRight.width, sprites.topRight.height);
            this.setPos(sprites.bottomRight, w, h, sprites.bottomRight.width, sprites.bottomRight.height);
            this.setPos(sprites.bottomLeft, 0, h, sprites.bottomRight.width, sprites.bottomRight.height);
            this.setPos(sprites.center, sprites.left.width, sprites.top.height, w-sprites.left.width, h-sprites.top.height);
        },

        update: function() {
            this.updatePositions(this.sprites, this.x, this.y, this.width, this.height);
        },
    });


    return {
        init: init,
        sortDisplays: sortDisplays,
        render: render,
        NineSlice: NineSlice,
        pixi: pixi
    };
});
