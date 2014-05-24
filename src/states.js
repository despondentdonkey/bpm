define(['bpm', 'objects', 'gfx', 'res', 'input', 'ui', 'events'], function(bpm, objects, gfx, res, input, ui, events) {

    var current = {
        init: false,
        state: null,
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
            var ret = obj;
            if (!_.isArray(obj))
                obj = [obj];

            for (var i = 0; i < obj.length; i++)
                this.objectsToAdd.push(obj[i]);

            return ret;
        },

        remove: function(obj) {
            var ret = obj;
            if (!_.isArray(obj))
                obj = [obj];

            for (var i = 0; i < obj.length; i++)
                this.objectsToRemove.push(obj[i]);


            return ret;
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
            if (display.parent === undefined) {
                console.error('DisplayObject parent is undefined. Adding the display multiple times may have caused this.');
            }
            display.parent.removeChild(display);
            return display;
        },

        pause: function(pauseState) {
            if (pauseState) {
                if (typeof pauseState === 'function') {
                    current.state = new pauseState(null, this);
                } else if (typeof pauseState === 'object') {
                    current.state = pauseState;
                }
                this.pauseState = current.state;
                current.init = false;
            }

            this.paused = true;
            this.onPause();
        },

        restore: function() {
            if (this.paused) {
                if (this.pauseState) {
                    setState(this);
                    current.init = true;
                    this.pauseState = null;
                }

                this.paused = false;
                this.onRestore();
            }
        },

        onPause: function() {},
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

        this.menus = [
            [PerkMenu, 'P'],
            [UpgradeMenu, 'U'],
            [QuestMenu, 'Q', 'I'],
            [FieldPauseMenu, input.ESCAPE]
        ];

    },{
        init: function() {
            State.prototype.init.call(this);

            events.create('test');

            events.listen('test', function(e) {
                console.log('event stuff: ', 'HI');
                console.log('this', this);
            }, false, events);

            events.listen('test', function(e) {
                console.log('event stuff: ', e);
                console.log('this', this);
            }, true);

            events.emit('test', this, {
                cow: 'hi',
            });

            var buttonTest = new ui.Button('Pause Game', {font: 'bold 12px arial'}, _.bind(function() {
                this.onBlur();
            }, this));

            buttonTest.x = gfx.width - buttonTest.width - 5;
            buttonTest.y = gfx.height - buttonTest.height - 5;

            this.add(buttonTest);

            var textField = new ui.TextField("Hello, this is gonna be some long text to demonstrate word wrap. Hopefully it will look good. Let's add a bit more text. And some more, and maybe a little more here.", 0, 200, gfx.width-10);
            //this.add(textField);

            // Basic spawner
            this.add(new objects.Timer(1000, 'loop', _.bind(function() {
                if (!this) // Make sure this state still exists, probably not necessary.
                    return;
                this.add(randBub(0));
            }, this)));


            this.roundTimer = new objects.Timer(60 * 1000, 'oneshot', function() {
                console.log('Round Complete!');
            });

            var roundCirc = new gfx.pixi.Graphics();
            var roundCircRadius = 48;
            roundCirc.x = gfx.width-roundCircRadius;
            roundCirc.y = roundCircRadius;
            roundCirc.depth = -10;
            this.addDisplay(roundCirc);

            var drawRoundCirc = function(ratio, color, alpha) {
                roundCirc.beginFill(color, alpha);
                    roundCirc.moveTo(0,0);
                    for (var i=0; i<ratio*360; ++i) {
                        var rad = i * DEG2RAD;
                        roundCirc.lineTo(Math.sin(rad) * roundCircRadius,  -Math.cos(rad) * roundCircRadius);
                    }
                roundCirc.endFill();
            };

            this.roundTimer.onTick = function(ratio) {
                roundCirc.clear();
                drawRoundCirc(1, 0x000000, 0.8);
                drawRoundCirc(ratio, 0xffff00, 0.6);
            };

            this.add(this.roundTimer);


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

            // Listen for menu hotkeys and set closeButton on instantiated menu
            for (var i = 0, menus = this.menus; i < menus.length; i++) {
                var M = menus[i][0];
                for (var j = 1, keys = menus[i]; j < keys.length; j++) {
                    if (input.key.isReleased(keys[j])) {
                        var m = new M(null, this);
                        this.pause(m);
                        // set the close button to the button used for opening
                        m.closeButton = keys[j];
                    }
                }
            }
        },

        onPause: function() {
            this._removeEventListeners();
        },

        onRestore: function() {
            this._addEventListeners();
        },

        onBlur: function() {
            // Pause game when window loses focus
            this.pause(FieldPauseMenu);
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


    var Menu = createClass(State, function(prevMenu, cachedState) {
        this.prevMenu = prevMenu;
        this.buttonStyle = {
            font: 'bold 24px arial'
        };
        this.cachedState = cachedState;
    }, {
        init: function() {
            State.prototype.init.call(this);
        },

        update: function(delta) {
            State.prototype.update.call(this, delta);
            if (this.closeButton) {
                if (input.key.isReleased(this.closeButton))
                    this.close();
            }
        },

        close: function() {
            if (this.prevMenu || this.prevMenu !== null) {
                setState(this.prevMenu);
            } else if (this.cachedState) {
                this.destroy();
                current.state = this.cachedState;
                current.init = true;
                this.cachedState.paused = false;
                this.cachedState.onRestore();
            }
        },
    });

    // TODO: Put options in here vv
    var FieldPauseMenu = createClass(Menu, function(prevState, cachedState) {
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            var back = new gfx.pixi.Graphics();
            back.beginFill('0', 0.5);
            back.drawRect(0, 0, gfx.width, gfx.height);
            back.endFill();

            var text = new gfx.pixi.Text('Paused\nMIDDLE CLICK', {
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

        update: function(delta) {
            Menu.prototype.update.call(this, delta);

            if (input.mouse.isReleased(input.MOUSE_MIDDLE)) {
                setState(new AnotherPauseMenu(this));
            }

            if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                this.close();
            }
        },
    });

    var AnotherPauseMenu = createClass(Menu, function(prevState, cachedState) {
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            var back = new gfx.pixi.Graphics();
            back.beginFill('0', 0.5);
            back.drawRect(0, 0, gfx.width, gfx.height);
            back.endFill();

            var text = new gfx.pixi.Text('Another Menu!!!\nMIDDLE CLICK', {
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

        update: function(delta) {
            Menu.prototype.update.call(this, delta);
            if (input.mouse.isReleased(input.MOUSE_MIDDLE)) {
                this.close();
            }
        },
    });


    var MainMenu = createClass(Menu, function MainMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

            this.buttons = {
                start: new ui.Button('Start', this.buttonStyle, function() { setState(new Field()); }, this),
            }

            this.buttons.start.setPos(gfx.width / 2 - 5, gfx.height / 2);

            this.add(_.values(this.buttons));
        }
    });

    var UpgradeMenu = createClass(Menu, function UpgradeMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);
            console.log('Entering Upgrade Menu');

            this.buttons = {
                buy: new ui.Button('Buy', this.buttonStyle, function() { log('kaching!'); }, this),
                upgrade0: new ui.Button('Upgrade 0', this.buttonStyle, function() { log('selected'); }, this),
                upgrade1: new ui.Button('Upgrade 1', this.buttonStyle, function() { log('selected'); }, this),
                upgrade2: new ui.Button('Upgrade 2', this.buttonStyle, function() { log('selected'); }, this),
                upgrade3: new ui.Button('Upgrade 3', this.buttonStyle, function() { log('selected'); }, this),
                upgrade4: new ui.Button('Upgrade 4', this.buttonStyle, function() { log('selected'); }, this),
                upgrade5: new ui.Button('Upgrade 5', this.buttonStyle, function() { log('selected'); }, this),
            };

            var bvals = _.values(this.buttons);

            this.buttons.buy.setPos(gfx.width - 50, gfx.height - 50);
            _.each(_.tail(bvals), function(b, i) { b.setPos(50, 50 * i); });
            this.add(bvals);
        }
    });

    var PerkMenu = createClass(Menu, function PerkMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);
            console.log('Entering Perk Menu');

        }
    });

    var QuestMenu = createClass(Menu, function QuestMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);
            console.log('Entering Quest Menu');

        }
    });

    return {
        current: current,
        setState: setState,
        Field: Field,
        Testing: Testing,
        State: State,
        MainMenu: MainMenu,
        UpgradeMenu: UpgradeMenu,
        PerkMenu: PerkMenu,
        QuestMenu: QuestMenu,
    };
});
