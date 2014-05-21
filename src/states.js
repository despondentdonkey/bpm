define(['bpm', 'objects', 'gfx', 'res', 'input', 'ui'], function(bpm, objects, gfx, res, input, ui) {

    var current = {
        init: false,
        state: null,
        cached: {}
    };

    // Static Methods
    function setState(state, persist) {
        // Sets state; if persist === true, destroy is not called on current state
        if (current.state) {
            if (!persist) {
                current.state.destroy();
            }
            current.state = null; // I think this helps a bug with switching states. It stopped, so it's staying for now.
        }

        current.state = state;
        current.init = false;
    }

    function cacheState(state, newState) {
        // Caches passed state, switches to newState
        //      cached states are saved by constructor, so only one class is ever saved a time

        // Save current state
        var constructor = state.constructor;
        current.cached[constructor] = state;
        state.onCached();

        if (newState instanceof State) {
            setState(newState, true);
        }
    }

    function restoreState(state) {
        // Restores a cached state with matching constructor of passed state
        // May return unexpected results - make sure you know that the state you are restoring was cached
        var constructor = state.constructor;
        if (_.has(current.cached, constructor)) {
            log('restoring state ' + state.constructor.name);
            state = current.cached[constructor];
            delete current.cached[constructor];

            setState(state);
            current.init = true;
            state.onRestore();
        }
    }

    // Classes
    var State = createClass(null, function State(_super) {
        this.displayObjects = [];
        this.objects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
        this.paused = false;
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
            if (!this.paused) {
                // Add queued objects
                if (this.objectsToAdd.length > 0) {
                    for (var i=0; i<this.objectsToAdd.length; ++i) {
                        var obj = this.objectsToAdd[i];

                        this.objects.push(obj);
                        obj.init(this);
                    }
                    gfx.sortStageDisplays = true;
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
        },

        onCached: function() {},
        onRestore: function() {}
    });


    var Testing = createClass(State, function Testing() {

    }, {

    });


    var Field = createClass(State, function Field() {
        this.comboTime = 1000;
        this.comboTimer = this.comboTime;
        this.multiplier = 1;
        this.combo = 0;
        this.comboGoal = 4;

        this.pauseMenu = new PauseMenu(this);
    },{
        init: function() {
            State.prototype.init.call(this);

            var test = new ui.Button(100, 200, 100, 32);
            this.add(test);

            // Basic spawner
            this.add(new objects.Timer(1000, 'loop', _.bind(function() {
                if (!this) // Make sure this state still exists, probably not necessary.
                    return;
                this.add(randBub(0));
            }, this)));

            this.comboTimeBar = new objects.StatusBar(res.slices.barBack, res.slices.barFront, 200, 13);
            this.comboTimeBar.x = gfx.width/2 - this.comboTimeBar.width/2;
            this.comboTimeBar.depth = -100;
            this.comboTimeBar.setRatio(0);
            this.add(this.comboTimeBar);

            this.background = this.addDisplay(new gfx.pixi.TilingSprite(res.tex.background, 800, 600));
            this.background.depth = 100;

            this.statusText = this.addDisplay(new gfx.pixi.Text('', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            }));

            this.comboText = this.addDisplay(new gfx.pixi.Text('', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'center',
            }));

            this.comboText.anchor.x = 0.5;
            this.comboText.position.x = gfx.width/2;
            this.comboText.position.y = this.comboTimeBar.height;

            this.statusText.depth = -10;
            this.comboText.depth = -10;

            this.bulletBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();
            this.glareBatch = new gfx.pixi.SpriteBatch();
            this.armorBatch = new gfx.pixi.SpriteBatch();

            this.bubbleBatch.depth = 2;
            this.glareBatch.depth = 1;

            this.shooter = this.add(new objects.Shooter());

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
                return new objects.Bubble(armor, randomRange(32, gfx.width-32), randomRange(-128, -32), Math.random() * 360);
            };

            var i;
            for (i=0; i<0; ++i) {
                this.add(randBub(8));
            }

            for (i=0; i<40; i++) {
                this.add(randBub(3));
            }


            this.addDisplay(this.bulletBatch);
            this.addDisplay(this.bubbleBatch);
            this.addDisplay(this.glareBatch);
            this.addDisplay(this.armorBatch);

            // Need to bind event callbacks, otherwise `this === window` on call
            _.bindAll(this, 'onBlur', 'onFocus');
            this._addEventListeners();
        },

        update: function(delta) {
            State.prototype.update.call(this, delta);

            this.statusText.setText('XP: ' + bpm.player.xp);

            this.comboText.setText(this.combo + ' / ' + this.comboGoal
            + '\nx' + this.multiplier);

            if (this.combo >= this.comboGoal) {
                this.multiplier++;
                this.comboGoal = this.comboGoal + Math.round(Math.sqrt(this.comboGoal * 8));
            }

            if (this.combo > 0) {
                this.comboTimer -= delta;
                this.comboTimeBar.setRatio(this.comboTimer / this.comboTime);
                if (this.comboTimer < 0) {
                    this.combo = 0;
                    this.comboGoal = 4;
                    this.multiplier = 1;
                }
            }

            this.pauseMenu.monitor();
        },

        onCached: function() {
            this._removeEventListeners();
        },

        onRestore: function() {
            this._addEventListeners();
        },

        onBlur: function() {
            // Pause game when window loses focus
            cacheState(this, this.pauseMenu);
        },

        onFocus: function() {

        },

        _addEventListeners: function() {
            window.addEventListener('blur', this.onBlur);
            window.addEventListener('focus', this.onFocus);
        },

        _removeEventListeners: function() {
            window.removeEventListener('blur', this.onBlur);
            window.removeEventListener('focus', this.onFocus);
        }
    });

    var Menu = createClass(State, function Menu(prevState) {
        this.prevState = prevState;
    }, {
        init: function() {
            State.prototype.init.call(this);
            this.paused = true;
        },

        update: function(delta) {
            State.prototype.update.call(this, delta);
            if (this.isClosed()) {
                restoreState(this.prevState);
            }
        },

        monitor: function() {
            // Watch for condition to open, cache current state and switch to menu when opened
            // call this in prevState's update method; use to abstract all menu-related functionality
            // out of parent state and into menu state
            if (this.isOpened()) {
                if (this.prevState instanceof State) {
                    cacheState(this.prevState, this);
                } else {
                    setState(this);
                }
            }
        },

        isClosed: function() {
            // Predicate to specify how this menu will be closed
            // defaults to same method as open
            return this.isOpened();
        },

        isOpened: function() {
            // Predicate to specify how this menu will be opened
            return input.key.isReleased(input.ESCAPE);
        }
    });

    var PauseMenu = createClass(Menu, function PauseMenu(prevState) {
        this.pauseKey = 'P';
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            var back = new gfx.pixi.Graphics();
            back.beginFill('0', 0.5);
            back.drawRect(0, 0, gfx.width, gfx.height);
            back.endFill();

            var text = new gfx.pixi.Text('Paused', {
                stroke: 'black',
                strokeThickness: 8,
                align: 'center',
                fill: 'white',
                font: 'bold 64px arial',
            });

            text.anchor.x = text.anchor.y = 0.5;
            text.x = gfx.width/2;
            text.y = gfx.height/2;

            this.addDisplay(back);
            this.addDisplay(text);
        },

        isClosed: function() {
            return (input.mouse.isReleased(input.MOUSE_LEFT) || input.key.isReleased(this.pauseKey));
        },

        isOpened: function() {
            return input.key.isReleased(this.pauseKey);
        }
    });

    var MainMenu = createClass(Menu, function MainMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

        }
    });

    var UpgradeMenu = createClass(Menu, function UpgradeMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

        }
    });

    var PerkMenu = createClass(Menu, function PerkMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

        }
    });

    var QuestMenu = createClass(Menu, function QuestMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

        }
    });

    return {
        current: current,
        setState: setState,
        cacheState: cacheState,
        restoreState: restoreState,
        Field: Field,
        Testing: Testing,
        State: State,
        PauseMenu: PauseMenu
    };
});
