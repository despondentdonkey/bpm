define(['objects', 'gfx'], function(objects, gfx) {
    function State() {
        this.displayObjects = [];
        this.objects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
    }

    // When this state has been switched
    State.prototype._onSwitch = function() {
        // Remove all objects
        for (var i=0; i<this.objects.length; ++i) {
            this.objects[i]._onRemove(this);
        }

        // Remove any additional displays
        for (var i=0; i<this.displayObjects.length; ++i) {
            this.removeDisplay(this.displayObjects[i]);
        }

        this.onSwitch();
    };

    State.prototype._update = function(delta) {
        // Add queued objects
        for (var i=0; i<this.objectsToAdd.length; ++i) {
            var obj = this.objectsToAdd[i];

            this.objects.push(obj);
            this.objectsToAdd.splice(this.objectsToAdd.indexOf(obj), 1);
            obj._onAdd(this);
        }

        // Remove queued objects
        for (var i=0; i<this.objectsToRemove.length; ++i) {
            var obj = this.objectsToRemove[i];

            this.objects.splice(this.objects.indexOf(obj), 1);
            this.objectsToRemove.splice(this.objectsToRemove.indexOf(obj), 1);
            obj._onRemove(this);
        }

        for (var i=0; i<this.objects.length; ++i) {
            this.objects[i]._update(delta);
        }

        this.update(delta);
    };

    State.prototype.add = function(obj) {
        this.objectsToAdd.push(obj);
        return obj;
    };

    State.prototype.remove = function(obj) {
        this.objectsToRemove.push(obj);
        return obj;
    };

    State.prototype.addDisplay = function(display, container) {
        this.displayObjects.push(display);
        if (container) {
            container.addChild(display);
        } else {
            gfx.stage.addChild(display);
        }
        return display;
    };

    State.prototype.removeDisplay = function(display) {
        this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
        display.parent.removeChild(display);
        return display;
    };

    State.prototype.init = function() {};
    State.prototype.onSwitch = function() {};
    State.prototype.update = function(delta) {};


    inherit(BubbleRenderTest, State);
    function BubbleRenderTest() {
        State.call(this);
        this.batch = new gfx.pixi.SpriteBatch();
    }

    BubbleRenderTest.prototype.init = function() {
        this.addDisplay(this.batch);
        var a = new objects.BubbleTest(128, 128);
        this.add(a);

        var b = new objects.BubbleTest(300, 100);
        this.add(b);

        var tint = Math.random() * 0xFFFFFF;
        for (var i=0; i<10000; ++i) {
            this.add(new objects.BubbleTest(Math.random() * gfx.width, Math.random() * gfx.height, tint));
        }
    };


    inherit(PinRenderTest, State);
    function PinRenderTest() {
        State.call(this);
        this.batch = new gfx.pixi.SpriteBatch();
        this.pinBatch = new gfx.pixi.SpriteBatch();
    }

    PinRenderTest.prototype.init = function() {
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

    inherit(CollisionTest, State);
    function CollisionTest() {
        State.call(this);
        this.pinBatch = new gfx.pixi.SpriteBatch();
    }

    CollisionTest.prototype.init = function() {
        this.addDisplay(this.pinBatch);
        var pin = new objects.PinTest(64, 64, 0);
        pin.collisionTest = true;
        this.add(pin);

        var pin2 = new objects.PinTest(64, 77, 0);
        this.add(pin2);
    };

    return {
        BubbleRenderTest: BubbleRenderTest,
        PinRenderTest: PinRenderTest,
        CollisionTest: CollisionTest,
    };
});
