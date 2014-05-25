define(['bpm', 'objects', 'gfx', 'res', 'input', 'ui', 'events'], function(bpm, objects, gfx, res, input, ui, events) {

    var current = {
        initNew: true, // Initialize the new state?
        destroyOld: true, // Destroy the old state?
        state: null,
        newState: null, // The new state to switch to
        prevState: null,
    };

    // Static Methods
    function setState(state, options) {
        options = options || {};
        _.defaults(options, {
            initNew: true,
            destroyOld: true,
        });

        current.initNew = options.initNew;
        current.destroyOld = options.destroyOld;

        current.newState = state;
    }

    // Classes
    var State = createClass(events.EventHandler, function State(_super) {
        this.displayObjects = [];
        this.objects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
        this.paused = false;

        this.initialized = false;
    }, {
        init: function() {
            if (this.initialized) {
                console.error("State has been reinitialized. Only call 'init' if object has been destroyed.");
            }
            this.initialized = true;
        },

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

            this.initialized = false;
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
                    setState(new pauseState(this), { destroyOld: false });
                } else if (typeof pauseState === 'object') {
                    setState(pauseState, { destroyOld: false });
                }
                this.pauseState = current.state;
            }

            this.paused = true;
            this.onPause();
        },

        restore: function() {
            if (this.paused) {
                if (this.pauseState) {
                    setState(this, { initNew: false });
                    this.pauseState = null;
                }

                this.paused = false;
                this.onRestore();
            }
        },

        onPause: function() {},
        onRestore: function() {}
    });


    var Field = createClass(State, function Field() {
        this.comboTime = 1000;
        this.comboTimer = this.comboTime;
        this.multiplier = 1;
        this.combo = 0;
        this.comboGoal = 4;

        this.xp = 0;

        this.menus = [
            [UpgradeMenu, 'U'],
            [FieldPauseMenu, input.ESCAPE]
        ];

    },{
        init: function() {
            State.prototype.init.call(this);

            this.addListener('test', function(e) {
                console.log('event stuff: ', 'HI');
                console.log('this', this);
            }, false);

            this.addListener('test', function(e) {
                console.log('event stuff: ', e);
                console.log('this', this);
            }, true);

            this.triggerEvent('test', {
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


            this.roundTimer = new objects.Timer(60 * 1000, 'oneshot', _.bind(function() {
                this.pause(RoundEndPauseMenu);
            }, this));

            var roundCirc = new gfx.pixi.Graphics();
            var roundCircRadius = 48;
            roundCirc.x = gfx.width-roundCircRadius;
            roundCirc.y = roundCircRadius;
            roundCirc.depth = gfx.layers.gui;
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
            this.comboTimeBar.depth = gfx.layers.gui;
            this.comboTimeBar.setRatio(0);
            this.add(this.comboTimeBar);

            this.background = this.addDisplay(new gfx.pixi.TilingSprite(res.tex.background, 800, 600));
            this.background.depth = gfx.layers.background;

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

            this.statusText.depth = gfx.layers.gui;
            this.comboText.depth = gfx.layers.gui;

            this.bulletBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();
            this.glareBatch = new gfx.pixi.SpriteBatch();
            this.armorBatch = new gfx.pixi.SpriteBatch();

            this.bubbleBatch.depth = gfx.layers.bubbles;
            this.glareBatch.depth = gfx.layers.bubble-1;

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

            this.statusText.setText('XP: ' + this.xp);

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
                        var m = new M(this);
                        this.pause(m);
                        // set the close button to the button used for opening
                        m.closeButton = keys[j];
                    }
                }
            }
        },

        destroy: function() {
            State.prototype.destroy.call(this);
            this._removeEventListeners();
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


    var Menu = createClass(State, function(prevState) {
        this.prevState = prevState;
        this.buttonStyle = {
            font: 'bold 24px arial'
        };
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
            if (this.prevState instanceof Menu) {
                setState(this.prevState);
            } else if (this.prevState instanceof State) {
                setState(this.prevState, { initNew: false });
                this.prevState.paused = false;
                this.prevState.onRestore();
            }
        },
    });


    // TODO: Put options in here vv
    var FieldPauseMenu = createClass(Menu, function(prevState) {
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

    var AnotherPauseMenu = createClass(Menu, function(prevState) {
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


    var RoundEndPauseMenu = createClass(Menu, function(prevState) {
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            var back = new gfx.pixi.Graphics();
            back.beginFill('0', 0.5);
            back.drawRect(0, 0, gfx.width, gfx.height);
            back.endFill();
            back.depth = gfx.layers.gui-10;
            this.addDisplay(back);

            var text = new gfx.pixi.Text('Round Complete!', {
                stroke: 'black',
                strokeThickness: 8,
                align: 'center',
                fill: 'white',
                font: 'bold 64px arial'
            });
            text.depth = back.depth - 1;
            text.anchor.x = text.anchor.y = 0.5;
            text.x = gfx.width/2;
            text.y = gfx.height/2;
            this.addDisplay(text);

            var button = new ui.Button('Continue', this.buttonStyle, function() {
                this.prevState.destroy();
                setState(new RoundCompleteMenu(null, this.prevState.xp));
            }, this);
            button.x = gfx.width/2 - button.width/2;
            button.y = text.y + text.height;
            button.up.depth = back.depth - 1;
            button.down.depth = button.up.depth;
            button.displayText.depth = button.up.depth-1;
            this.add(button);
        },
    });


    var MainMenu = createClass(Menu, function MainMenu(prevState) {

    }, {
        init: function() {
            Menu.prototype.init.call(this);

            this.buttons = {
                start: new ui.Button('Start', this.buttonStyle, function() { setState(new UpgradeMenu()); }, this),
            }

            this.buttons.start.setPos(gfx.width / 2 - 5, gfx.height / 2);

            this.add(_.values(this.buttons));
        }
    });


    var UpgradeMenu = createClass(Menu, function(prevState) {
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            this.tabNames = [];
            this.tabs = [];

            this.ui = [];
            this.uiBuilders = [];

            this.addTab('Town', this.buildTownUi);
            this.addTab('Blacksmith', this.buildSmithUi);
            this.addTab('Wizard', this.buildWizardUi);

            this.setUi(this.tabNames[0]);
        },

        addTab: function(name, builder) {
            this.tabNames.push(name);
            this.uiBuilders[name] = builder;

            // Add the tab objects.
            var index = this.tabNames.indexOf(name);
            var prevTab = index > 0 ? this.tabs[index-1] : null;
            var newTab = new ui.Button(name, this.buttonStyle, function() {
                if (this.uiName !== name) {
                    this.setUi(name);
                }
            }, this);

            if (prevTab) {
                newTab.x = prevTab.x + prevTab.width + 32;
            }

            this.tabs.push(newTab);
            this.add(newTab);
        },

        setUi: function(name) {
            if (this.uiName) {
                this.remove(this.ui);
            }

            this.uiName = name;
            this.ui = this.uiBuilders[name].call(this);
            this.add(this.ui);
        },

        buildTownUi: function() {
            var quest = new ui.Button("The Quest", this.buttonStyle);
            quest.x = 32;
            quest.y = 100;

            var startRound = new ui.Button("Start Round", this.buttonStyle, function() {
                setState(new Field());
            });

            startRound.x = gfx.width - startRound.width - 10;
            startRound.y = gfx.height - startRound.height - 10;

            return [quest, startRound];
        },

        buildSmithUi: function() {
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

            this.buttons.buy.setPos(gfx.width - this.buttons.buy.width - 5, gfx.height - 50);
            _.each(_.tail(bvals), function(b, i) { b.setPos(50, 100 + 50 * i); });

            return bvals;
        },

        buildWizardUi: function() {
            var perk = new ui.Button("Perk", this.buttonStyle);
            perk.x = 32;
            perk.y = 100;
            return [perk];
        },
    });


    var RoundCompleteMenu = createClass(Menu, function(prevState, xp) {
        this.xp = xp;
    }, {
        init: function() {
            Menu.prototype.init.call(this);
            this.addDisplay(new gfx.pixi.Text('Round Complete!', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            }));

            bpm.player.xp += this.xp;

            var xpText = new gfx.pixi.Text('Experience earned: ' + this.xp +
            '\nTotal experience: ' + bpm.player.xp, {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            });

            xpText.x = 200;
            xpText.y = 200;
            this.addDisplay(xpText);


            var button = new ui.Button('Continue', this.buttonStyle, function() {
                setState(new UpgradeMenu());
            });
            button.x = gfx.width - button.width - 10;
            button.y = gfx.height - button.height - 10;
            this.add(button);
        },
    });

    return {
        current: current,
        setState: setState,
        Field: Field,
        State: State,
        MainMenu: MainMenu,
        UpgradeMenu: UpgradeMenu,
    };
});
