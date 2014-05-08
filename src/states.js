define(['objects', 'gfx'], function(objects, gfx) {
    function State() {
        this._init = function() {
            this.displayObjects = [];
            this.objects = [];
            this.objectsToAdd = [];
            this.objectsToRemove = [];
            this.init();
        };

        // When this state has been switched
        this._destroy = function() {
            // Remove all objects
            for (var i=0; i<this.objects.length; ++i) {
                this.objects[i]._destroy(this);
            }

            // Remove any additional displays
            for (var i=0; i<this.displayObjects.length; ++i) {
                this.removeDisplay(this.displayObjects[i]);
            }

            this.destroy();
        };

        this._update = function(delta) {
            // Add queued objects
            for (var i=0; i<this.objectsToAdd.length; ++i) {
                var obj = this.objectsToAdd[i];

                this.objects.push(obj);
                obj._init(this);
            }
            this.objectsToAdd = [];

            // Remove queued objects
            for (var i=0; i<this.objectsToRemove.length; ++i) {
                var obj = this.objectsToRemove[i];
                var index = this.objects.indexOf(obj);

                if (index !== -1) {
                    this.objects.splice(index, 1);
                    obj._destroy(this);
                }
            }
            this.objectsToRemove = [];

            for (var i=0; i<this.objects.length; ++i) {
                this.objects[i]._update(delta);
            }

            this.update(delta);
        };

        this.add = function(obj) {
            this.objectsToAdd.push(obj);
            return obj;
        };

        this.remove = function(obj) {
            this.objectsToRemove.push(obj);
            return obj;
        };

        this.addDisplay = function(display, container) {
            this.displayObjects.push(display);
            if (container) {
                container.addChild(display);
            } else {
                gfx.stage.addChild(display);
            }
            return display;
        };

        this.removeDisplay = function(display) {
            this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
            display.parent.removeChild(display);
            return display;
        };

        this.destroy = function() {};
        this.init = function() {};
        this.update = function(delta) {};
    }


    inherit(BubbleRenderTest, State);
    function BubbleRenderTest() {
        this.init = function() {
            BubbleRenderTest.prototype.init.call(this);

            this.batch = new gfx.pixi.SpriteBatch();

            this.addDisplay(this.batch);
            var a = new objects.BubbleTest(128, 128);
            this.add(a);

            var b = new objects.BubbleTest(300, 100);
            this.add(b);

            var tint = Math.random() * 0xFFFFFF;
            for (var i=0; i<1000; ++i) {
                this.add(new objects.BubbleTest(Math.random() * gfx.width, Math.random() * gfx.height, tint));
            }
        };
    }


    inherit(PinRenderTest, State);
    function PinRenderTest() {
        this.init = function() {
            this.batch = new gfx.pixi.SpriteBatch();
            this.pinBatch = new gfx.pixi.SpriteBatch();

            this.addDisplay(this.batch);
            this.addDisplay(this.pinBatch);
            var a = new objects.BubbleTest(gfx.width/2, gfx.height/2);
            this.add(a);

            for (var i=0; i<10000; ++i) {
                var x = gfx.width/2 + Math.cos(i) * gfx.width/4;
                var y = gfx.height/2 + Math.sin(i) * gfx.width/4;
                var pin = new objects.PinTest(x, y, 0);
                this.add(pin);
            }
        };
    }


    inherit(CollisionTest, State);
    function CollisionTest() {
        this.init = function() {
            this.pinBatch = new gfx.pixi.SpriteBatch();

            this.addDisplay(this.pinBatch);
            var pin = new objects.PinTest(64, 64, 0);
            pin.collisionTest = true;
            this.add(pin);

            var pin2 = new objects.PinTest(64, 77, 0);
            this.add(pin2);
        };
    }


    inherit(Field, State);
    function Field() {
        this.init = function() {
            this.pinBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();

            this.shooter = this.add(new objects.PinShooter());
            this.pin = this.add(new objects.PinTest(64,64,0));

            for (var i=0; i<1000; ++i) {
                // Bubbles will spawn slightly outside of view causing weirdness. Use a random range for position gen.
                this.add(new objects.Bubble((Math.random() * gfx.width) - 32, (Math.random() * gfx.height) - 32, Math.random() * 360));
            }

            this.addDisplay(this.pinBatch);
            this.addDisplay(this.bubbleBatch);

            this.prim = this.addDisplay(new gfx.pixi.Graphics());
            this.prim.lineStyle(1, 0x00FF00);
            this.prim.drawRect(0,0,this.pin.width,this.pin.height);
            this.prim.depth = 1;
            gfx.sortDisplays();
        };

        this.update = function() {
            this.prim.position.x = this.pin.x - this.pin.width*this.pin.anchor.x;
            this.prim.position.y = this.pin.y - this.pin.height*this.pin.anchor.y;
        };
    }

    return {
        BubbleRenderTest: BubbleRenderTest,
        PinRenderTest: PinRenderTest,
        CollisionTest: CollisionTest,
        Field: Field,
    };
});
