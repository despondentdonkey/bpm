define(['bpm', 'objects', 'gfx', 'res', 'input', 'ui', 'events', 'quests'], function(bpm, objects, gfx, res, input, ui, events, quests) {

    var global = {
        current: null,
        previous: null,
        switchState: null,
    };

    // Static Methods
    function setState(newState, options) {
        options = options || {};
        _.defaults(options, {
            initNew: true,
            destroyOld: true,
        });

        global.switchState = _.bind(function() {
            // If there's currently a state, set it to the previous state and destroy it.
            if (global.current) {
                global.previous = global.current;
                if (options.destroyOld) {
                    global.previous.destroy();
                }
            }

            // Set the current state to the new state, initialize and clear the new state.
            global.current = newState;
            bpm.state.current = newState;
            if (options.initNew) {
                global.current.init();
            }
        }, this);
    }

    // Classes
    var State = createClass(events.EventHandler, function State(_super) {
        this.displayObjectContainer = new gfx.pixi.DisplayObjectContainer();
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
            gfx.stage.addChild(this.displayObjectContainer);
        },

        // When this state has been switched
        destroy: function() {
            // Remove all objects
            for (var i=0; i<this.objects.length; ++i) {
                this.objects[i].destroy(this);
            }

            // Remove all children from display objects.
            while (this.displayObjectContainer.children.length > 0) {
                this.displayObjectContainer.removeChildAt(0);
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
            if (container) {
                container.addChild(display);
            } else {
                this.displayObjectContainer.addChild(display);
            }
            return display;
        },

        removeDisplay: function(display) {
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
                this.pauseState = global.current;
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

        this.bubbles = [];

        this.xp = 0;

        if (bpm.player.currentQuest) {
            this.currentQuest = bpm.player.currentQuest;
        } else {
            console.error('No current quest!');
        }

        this.roundTimerComplete = false;
        this.skipDay = false;
        this.timeBonus = 0; // Ratio of round timer when quest is completed.

        this.addListener('bubblePopped', function() {
            quests.updateObjective('popBubbles');
        });

        this.menus = [
            [TownMenu, 'U'],
            [FieldPauseMenu, input.ESCAPE]
        ];
    },{
        init: function() {
            State.prototype.init.call(this);

            var commonTextStyle = {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            };

            var randBub = function(armor) {
                return new objects.Bubble(armor, randomRange(32, gfx.width-32), randomRange(-128, -32), Math.random() * 360);
            };


            this.background = this.addDisplay(new gfx.pixi.TilingSprite(res.tex.background, 800, 600));
            this.background.depth = gfx.layers.background;


            var pauseButton = new ui.Button('Pause Game', {font: 'bold 12px arial'}, _.bind(function() {
                this.onBlur();
            }, this));
            pauseButton.x = gfx.width - pauseButton.width - 5;
            pauseButton.y = gfx.height - pauseButton.height - 5;
            this.add(pauseButton);


            this.setWeapon(new objects.Rifle());

            // Basic spawner
            this.bubbleSpawner = new objects.Timer(1000, 'loop', _.bind(function() {
                if (!this) // Make sure this state still exists, probably not necessary.
                    return;
                this.add(randBub(0));
            }, this));
            this.add(this.bubbleSpawner);


            // Circle round timer
            this.roundTimer = new objects.Timer((this.currentQuest.time || 60) * 1000, 'oneshot', _.bind(function() {
                this.remove(this.bubbleSpawner);
                this.addDisplay(this.roundTimerEndText);
                this.roundTimerComplete = true;
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


            // Combo time meter
            this.comboTimeBar = new objects.StatusBar(res.slices.barBack, res.slices.barFront, 200, 13);
            this.comboTimeBar.x = gfx.width/2 - this.comboTimeBar.width/2;
            this.comboTimeBar.depth = gfx.layers.gui;
            this.comboTimeBar.setRatio(0);
            this.add(this.comboTimeBar);


            // Combo and status text (currently xp).
            this.statusText = this.addDisplay(new gfx.pixi.Text('', commonTextStyle));
            this.comboText = this.addDisplay(new gfx.pixi.Text('', commonTextStyle));
            this.comboText.anchor.x = 0.5;
            this.comboText.position.x = gfx.width/2;
            this.comboText.position.y = this.comboTimeBar.height;
            this.statusText.depth = gfx.layers.gui;
            this.comboText.depth = gfx.layers.gui;


            this.roundTimerEndText = new gfx.pixi.Text('Pop the remaining bubbles!', {
                fill: 'white',
                font: 'bold 16px arial',
            });
            this.roundTimerEndText.depth = gfx.layers.gui;
            this.roundTimerEndText.x = gfx.width/2 - this.roundTimerEndText.width/2;
            this.roundTimerEndText.y = gfx.height - this.roundTimerEndText.height-5;

            // Sprite Batches

            this.bulletBatch = new gfx.pixi.SpriteBatch();
            this.bubbleBatch = new gfx.pixi.SpriteBatch();
            this.glareBatch = new gfx.pixi.SpriteBatch();
            this.armorBatch = new gfx.pixi.SpriteBatch();

            this.bubbleBatch.depth = gfx.layers.bubbles;
            this.glareBatch.depth = gfx.layers.bubble-1;

            this.addDisplay(this.bulletBatch);
            this.addDisplay(this.bubbleBatch);
            this.addDisplay(this.glareBatch);
            this.addDisplay(this.armorBatch);

            // Particle Emitters

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

            var i;
            for (i=0; i<0; ++i) {
                this.add(randBub(8));
            }

            for (i=0; i<40; i++) {
                this.add(randBub(3));
            }

            // Need to bind event callbacks, otherwise `this === window` on call
            _.bindAll(this, 'onBlur', 'onFocus');
            this._addEventListeners();
        },

        update: function(delta) {
            State.prototype.update.call(this, delta);

            this.statusText.setText('XP: ' + this.xp);

            this.comboText.setText(this.combo + ' / ' + this.comboGoal
            + '\nx' + this.multiplier);

            // Once the combo counter has reached the combo goal we want to increment the multiplier and increase the combo goal. The multiplier should only be increased here.
            if (this.combo >= this.comboGoal) {
                this.multiplier++;

                quests.updateObjective('multiplier', {multiplier: this.multiplier});

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

            if (this.currentQuest.completed) {
                if (!this.skipDay) {
                    this.timeBonus = this.roundTimer.currentTime / this.roundTimer.duration;

                    var skipDayButton = new ui.Button('End Day', {}, function() {
                        setState(new RoundCompleteMenu(null, this));
                    }, this);
                    skipDayButton.x = gfx.width - skipDayButton.width - 16;
                    skipDayButton.y = 100;
                    skipDayButton.depth = gfx.layers.gui;
                    this.add(skipDayButton);
                    this.skipDay = true;
                }
            }

            if (this.roundTimerComplete) {
                if (this.bubbles.length <= 0) {
                    this.pause(RoundEndPauseMenu);
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

        /*
           Sets weapon; updates all global and instance references and adds to state (self)
            input: weapon - instanceof Weapon
            output: instanceof Weapon
        */
        setWeapon: function(weapon) {
            if (!(weapon instanceof objects.Weapon) && !_.isFunction(objects[weapon]))
                throw new TypeError('Field.setWeapon: Incorrect weapon type passed');

            if (_.isString(weapon))
                weapon = new objects[weapon]();

            if (this.currentWeapon) {
                this.remove(this.currentWeapon);
                //bpm.weaponCache
                log(this.currentWeapon.class);
                this.currentWeapon = null;
                bpm.player.currentWeapon = null;
            }

            bpm.player.currentWeapon = weapon;
            this.currentWeapon = weapon;
            return this.add(weapon);
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
        if (this.prevState instanceof Menu) {
            this.prevMenu = this.prevState;
        } else if (this.prevState instanceof State) {
            this.cachedState = this.prevState;
        }
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
            if (this.prevMenu) {
                setState(this.prevMenu);
            } else if (this.cachedState) {
                setState(this.cachedState, { initNew: false });
                this.cachedState.paused = false;
                this.cachedState.onRestore();
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

            var text = new gfx.pixi.Text('Day completed!', {
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
                setState(new RoundCompleteMenu(null, this.prevState));
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
                start: new ui.Button('Start', this.buttonStyle, function() { setState(new TownMenu()); }, this),
            }

            this.buttons.start.setPos(gfx.width / 2 - 5, gfx.height / 2);

            this.add(_.values(this.buttons));
        }
    });

    var TabMenu = createClass(Menu, function(prevState) {
    }, {
        currentTab: null,

        init: function() {
            Menu.prototype.init.call(this);

            this.tabs = [];

            this.addTab('Town', TownMenu);
            this.addTab('Blacksmith', SmithMenu);
            this.addTab('Wizard', WizardMenu);
        },

        close: function() {
            Menu.prototype.close.call(this);
        },

        addTab: function(name, State) {
            var newTab = new ui.Button(name, this.buttonStyle, function() {
                if (name !== TabMenu.prototype.currentTab) {
                    TabMenu.prototype.currentTab = name;
                    setState(new State());
                }
            }, this);

            this.tabs.push(newTab);

            var index = this.tabs.indexOf(newTab);
            var prevTab = index > 0 ? this.tabs[index-1] : null;

            if (prevTab) {
                newTab.x = prevTab.x + prevTab.width + 32;
            }

            this.add(newTab);
        },
    });

    var TownMenu = createClass(TabMenu, function(prevState) {
    }, {
        init: function() {
            TabMenu.prototype.init.call(this);

            if (this.cachedState) {
                this.cachedState.displayObjectContainer.visible = false;
            }

            var questDescription = new ui.TextField('', gfx.width/2, 64, gfx.width/2-32, gfx.height - 160);
            this.add(questDescription);

            var dayText = new gfx.pixi.Text('Day ' + bpm.player.day, {fill: 'white'});
            dayText.x = gfx.width - dayText.width - 10;
            dayText.y = 10;
            this.addDisplay(dayText);

            for (var i=0; i<bpm.player.quests.length; ++i) {
                var quest = quests.all[bpm.player.quests[i]];

                // Pretty ugly. Binds 'this' to an anonymous function.
                (_.bind(function(quest) {
                    var qButton = new ui.Button(quest.name, this.buttonStyle, function() {
                        bpm.player.currentQuest = quest;

                        var description = quest.description;

                        for (var key in quest.objectives) {
                            description += '\n' + quest.objectives[key].description;
                        }

                        questDescription.displayText.setText(description);

                        console.log('CURRENT QUEST', bpm.player.currentQuest);
                    }, this);

                    qButton.x = 32;
                    qButton.y = 100 + ((qButton.height+10) * i);
                    this.add(qButton);
                }, this))(quest);
            }

            var startRound = new ui.Button("Start Round", this.buttonStyle, function() {
                if (bpm.player.currentQuest) {
                    setState(new Field());
                } else {
                    console.log('Please select a quest');
                }
            });

            startRound.x = gfx.width - startRound.width - 10;
            startRound.y = gfx.height - startRound.height - 10;

            this.add(startRound);
        },

        update: function() {
            TabMenu.prototype.update.call(this);
            // TODO TESTING - Remove Me
            if (input.key.isDown(input.ENTER)) {
                bpm.player.currentQuest = quests.all["s00"];
                setState(new Field());
            }
        },

        close: function() {
            TabMenu.prototype.close.call(this);
            if (this.cachedState) {
                this.cachedState.displayObjectContainer.visible = true;
            }
        },
    });

    var SmithMenu = createClass(TabMenu, function(prevState) {
    }, {
        init: function() {
            TabMenu.prototype.init.call(this);

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

            this.add(bvals);
        },
    });

    var WizardMenu = createClass(TabMenu, function(prevState) {
    }, {
        init: function() {
            TabMenu.prototype.init.call(this);

            var perk = new ui.Button("Perk", this.buttonStyle);
            perk.x = 32;
            perk.y = 100;
            this.add(perk);
        },
    });

    var RoundCompleteMenu = createClass(Menu, function(prevState, field) {
        this.field = field;
        this.xp = this.field.xp;
        this.timeBonus = this.field.timeBonus;
        this.quest = this.field.currentQuest;
    }, {
        init: function() {
            Menu.prototype.init.call(this);

            this.addDisplay(new gfx.pixi.Text('Day complete!', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            }));

            bpm.player.day++;
            bpm.player.xp += this.xp;

            var xpBonus = 0;
            if (this.quest.bonus) {
                xpBonus = Math.round(this.quest.bonus * this.timeBonus);
                if (xpBonus > 0) {
                    bpm.player.xp += xpBonus;
                }
            }

            var xpText = new gfx.pixi.Text('Experience earned: ' + this.xp +
            (xpBonus > 0 ? '\nTime bonus: ' + xpBonus : '') +
            '\nTotal experience: ' + bpm.player.xp, {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'left',
            });

            xpText.x = 50;
            xpText.y = 400;
            this.addDisplay(xpText);

            var button = new ui.Button('Continue', this.buttonStyle, function() {
                setState(new TownMenu());
            });
            button.x = gfx.width - button.width - 10;
            button.y = gfx.height - button.height - 10;
            this.add(button);

            // Quest status

            var quest = this.field.currentQuest;

            var completeText = new gfx.pixi.Text('Failed', {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'center',
            });

            var questText = new gfx.pixi.Text(quest.name, {
                stroke: 'black',
                strokeThickness: 4,
                fill: 'white',
                align: 'center',
                font: 'bold 64px arial',
            });

            if (quest.completed) {
                bpm.player.money += quest.reward;
                completeText.setText('Completed\n$' + quest.reward + ' reward\n$' + bpm.player.money + ' total');

                // Remove the current quest from available quests.
                bpm.player.quests.splice(bpm.player.quests.indexOf(quest.id), 1);

                // Unlock new quests adding them to available quests.
                if (quest.unlocks) {
                    for (var i=0; i<quest.unlocks.length; ++i) {
                        bpm.player.quests.push(quest.unlocks[i]);
                    }
                }

                bpm.player.quests.sort(quests.idComparator);
                bpm.player.currentQuest = null;
            } else {
                var text = 'Failed';
                for (var key in quest.objectives) {
                    var objective = quest.objectives[key];

                    text += '\n' +
                        (objective.completed ? 'Completed - ' : 'Failed - ') +
                        (quest.objectives[key].description);
                }
                completeText.setText(text);
            }

            completeText.anchor.x = 0.5;

            questText.x = gfx.width/2 - questText.width/2;
            questText.y = 100;

            completeText.x = gfx.width/2;
            completeText.y = questText.y + questText.height + 5;

            this.addDisplay(questText);
            this.addDisplay(completeText);
        },
    });

    return {
        global: global,
        setState: setState,
        Field: Field,
        State: State,
        MainMenu: MainMenu,
        TownMenu: TownMenu,
    };
});
