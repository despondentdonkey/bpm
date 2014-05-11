define(['objects', 'gfx'], function(objects, gfx) {

    this.currentState;
    this.currentStateInit = false;

    // Static Methods
    function setState(state) {
        if (this.currentState) {
            this.currentState.destroy();
        }
        this.currentState = state;
        this.currentStateInit = false;
    }

    // Classes

    var State = createClass(null, function(_super) {
        this.displayObjects = [];
        this.objects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
    }, {
        init: function() {},

        // When this state has been switched
        destroy: function() {
            // Remove all objects
            for (var i=0; i<this.objects.length; ++i) {
                this.objects[i].destroy(this);
            }

            // Remove any additional displays
            for (var i=0; i<this.displayObjects.length; ++i) {
                this.removeDisplay(this.displayObjects[i]);
            }
        },

        update: function(delta) {
            // Add queued objects
            if (this.objectsToAdd.length > 0) {
                for (var i=0; i<this.objectsToAdd.length; ++i) {
                    var obj = this.objectsToAdd[i];

                    this.objects.push(obj);
                    obj.init(this);
                }
                gfx.sortDisplays();
                this.objectsToAdd = [];
            }

            // Remove queued objects
            for (var i=0; i<this.objectsToRemove.length; ++i) {
                var obj = this.objectsToRemove[i];
                var index = this.objects.indexOf(obj);

                if (index !== -1) {
                    this.objects.splice(index, 1);
                    obj.destroy(this);
                }
            }
            this.objectsToRemove = [];

            for (var i=0; i<this.objects.length; ++i) {
                this.objects[i].update(delta);
            }
        },

        add: function(obj) {
            this.objectsToAdd.push(obj);
            return obj;
        },

        remove: function(obj) {
            this.objectsToRemove.push(obj);
            return obj;
        },

        addDisplay: function(display, container) {
            this.displayObjects.push(display);
            if (container) {
                container.addChild(display);
            } else {
                gfx.stage.addChild(display);
            }
            return display;
        },

        removeDisplay: function(display) {
            this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
            display.parent.removeChild(display);
            return display;
        }
    });


    var Testing = createClass(State, function() {

    }, {

    });


    var Field = createClass(State, function() {

    },{
        init: function() {
            this._super.init.call(this);

            this.pinBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();
            this.glareBatch = new gfx.pixi.SpriteBatch();
            this.armorBatch = new gfx.pixi.SpriteBatch();

            this.shooter = this.add(new objects.PinShooter());

            var randBub = function(armor) {
                return new objects.Bubble(armor, randomRange(32, gfx.width-32), randomRange(32, gfx.height-32), Math.random() * 360);
            };

            var i;
            for (i=0; i<100; ++i) {
                this.add(randBub(8));
            }

            for (i=0; i<2000; i++) {
                this.add(randBub(0));
            }

            this.addDisplay(this.pinBatch);
            this.addDisplay(this.bubbleBatch);
            this.addDisplay(this.glareBatch);
        },

    });

    return {
        currentState: this.currentState,
        currentStateInit: this.currentStateInit,
        setState: setState,
        Field: Field,
        Testing: Testing,
        State: State
    };
});
