define(['bpm', 'objects', 'gfx', 'res'], function(bpm, objects, gfx, res) {

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
            while (this.displayObjects.length > 0) {
                this.removeDisplay(this.displayObjects[0]);
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

            this.background = this.addDisplay(new gfx.pixi.Sprite(res.tex.background));
            this.background.depth = 100;

            this.statusText = this.addDisplay(new gfx.pixi.Text('hello', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
            }));

            this.statusText.depth = -10;

            this.pinBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();
            this.glareBatch = new gfx.pixi.SpriteBatch();
            this.armorBatch = new gfx.pixi.SpriteBatch();

            this.shooter = this.add(new objects.PinShooter());

            this.pinEmitter = new objects.Emitter(res.tex.pinParticle, {
                angleMin: 0,
                angleMax: 360,
                speedMin: 0.1,
                speedMax: 0.2,
                lifeMin: 50,
                lifeMax: 100,
                range: 3,
                minRotationRate: 0.2,
                maxRotationRate: 0.5,
            });
            this.add(this.pinEmitter);

            this.bubbleEmitter = new objects.Emitter(res.tex.bubbleParticle, {
                angleMin: 0,
                angleMax: 360,
                speedMin: 0.01,
                speedMax: 0.08,
                lifeMin: 20,
                lifeMax: 40,
                range: 4,
                minRotationRate: 0,
                maxRotationRate: 0,
            });
            this.add(this.bubbleEmitter);

            var randBub = function(armor) {
                return new objects.Bubble(armor, randomRange(32, gfx.width-32), randomRange(32, gfx.height-32), Math.random() * 360);
            };

            var i;
            for (i=0; i<5; ++i) {
                this.add(randBub(8));
            }

            for (i=0; i<20; i++) {
                this.add(randBub(0));
            }

            this.addDisplay(this.pinBatch);
            this.addDisplay(this.bubbleBatch);
            this.addDisplay(this.glareBatch);
        },

        update: function(delta) {
            this._super.update.call(this, delta);
            this.statusText.setText('Pins: ' + bpm.player.pins);
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
