define(['bpm', 'res', 'gfx', 'input', 'events', 'upgrades'], function(bpm, res, gfx, input, events, upgrades) {

    var getID;
    (function() {
        var counter = 0;
        getID = function() {
            return 'o' + counter++;
        };
    })();

    function BasicObject() {
        this.state = null;
        this.id = getID();

        this.initialized = false;
        this.parent = null;
        this.children = [];
    }
        BasicObject.prototype = Object.create(events.EventHandler.prototype);
        BasicObject.prototype.constructor = BasicObject;

        BasicObject.prototype.init = function(state) {
            this.state = state;
            for (var i=0; i<this.children.length; ++i) {
                this.children[i].init(state);
            }
            this.initialized = true;
        };

        BasicObject.prototype.destroy = function() {
            this.state = null;

            if (this.parent) {
                this.parent.removeChild(this);
            }

            for (var i=0; i<this.children.length; ++i) {
                var child = this.children[i];
                child.parent = null;
                child.destroy();
            }

            this.initialized = false;
        };

        BasicObject.prototype.update = function(delta) {
            for (var i=0; i<this.children.length; ++i) {
                this.children[i].update(delta);
            }
        };

        BasicObject.prototype.addChild = function(object) {
            object.parent = this;
            this.children.push(object);
        };

        BasicObject.prototype.removeChild = function(object) {
            object.parent = null;
            this.children.splice(this.children.indexOf(object), 1);
        };


    function GameObject() {
        BasicObject.call(this);
        this.idList = [];
        this.displayObjects = [];

        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.angle = 0;
        this.scale = {
            x: 1,
            y: 1
        };
        this.anchor = {
            x: 0.5,
            y: 0.5
        };
        this.syncDisplayProperties = true; // If true this will update all display object's position properties (x,y,scale,rotation) to this object's properties.
    }
        GameObject.prototype = Object.create(BasicObject.prototype);
        GameObject.prototype.constructor = GameObject;

        GameObject.prototype.init = function(state) {
            BasicObject.prototype.init.call(this, state);
        };

        GameObject.prototype.destroy = function() {
            while (this.displayObjects.length > 0) {
                this.removeDisplay(this.displayObjects[0]);
            }
            BasicObject.prototype.destroy.call(this);
        };

        GameObject.prototype.update =  function(delta) {
            BasicObject.prototype.update.call(this, delta);
            if (this.syncDisplayProperties) {
                this.updateDisplayProperties(this.displayObjects);
            }
        };

        GameObject.prototype.updateDisplayProperties = function(objects, props) {
            var propsDefined = (props !== undefined);
            var defaults = {
                position: true,
                rotation: true,
                anchor: true,
                scale: true,
            };

            // If properties are defined then merge the defaults with them. Otherwise just make them the defaults.
            if (propsDefined) {
                _.defaults(props, defaults);
            } else {
                props = defaults;
            }

            for (var i=0; i<objects.length; ++i) {
                var obj = objects[i];

                var sync; // A display object can specify to sync certain properties. If props were specified then it will override syncGameObjectProperties.
                if (propsDefined || obj.syncGameObjectProperties === undefined) {
                    sync = props;
                } else {
                    sync = _.defaults(obj.syncGameObjectProperties, defaults);
                }

                if (sync.position) {
                    obj.position.x = this.x;
                    obj.position.y = this.y;
                }

                if (sync.rotation) {
                    obj.rotation = -this.angle;
                }

                if (sync.anchor && obj.anchor) {
                    obj.anchor.x = this.anchor.x;
                    obj.anchor.y = this.anchor.y;
                }

                if (sync.scale) {
                    obj.scale.x = this.scale.x;
                    obj.scale.y = this.scale.y;
                }
            }
        };

        GameObject.prototype.addDisplay = function(display, container) {
            this.displayObjects.push(display);
            return this.state.addDisplay(display, container);
        };

        GameObject.prototype.removeDisplay = function(display) {
            this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
            return this.state.removeDisplay(display);
        };

        GameObject.prototype.addId =  function(id) {
            if (typeof id === 'string') {
                if (!this.hasId(id)) {
                    this.idList.push(id);
                }
            } else if (id instanceof Array) {
                for (var i=0; i<id.length; ++i) {
                    this.addId(id[i]);
                }
            }
        };

        GameObject.prototype.hasId =  function(id) {
            if (typeof id === 'string') {
                for (var i=0; i<this.idList.length; ++i) {
                    if (this.idList[i] === id) {
                        return true;
                    }
                }
            } else if (id instanceof Array) {
                for (var i=0; i<id.length; ++i) {
                    if (!this.hasId(id[i])) {
                        return false;
                    }
                }

                if (id.length >= 1) {
                    return true;
                }
            }
            return false;
        };

        GameObject.prototype.removeId =  function(id) {
            if (typeof id === 'string') {
                if (this.hasId(id)) {
                    this.idList.splice(this.idList.indexOf(id), 1);
                }
            } else if (id instanceof Array) {
                for (var i=0; i<id.length; ++i) {
                    this.removeId(id[i]);
                }
            }
        };

        GameObject.prototype.getBounds =  function() {
            var width = this.width * this.anchor.x;
            var height = this.height * this.anchor.y;
            return {
                x1: this.x - width,
                y1: this.y - height,
                x2: this.x + width,
                y2: this.y + height,
            };
        };

        /* Returns the first object which collides with this object.
         * If 'opt' is an object array then it will loop through it rather than the state object list.
         * If 'opt' is undefined or an id then it will loop through the state object list.
         * If 'opt' is an object literal then you can specify id, objects, and grouped.
         * If 'grouped' is true then it will return a list of objects which collide with this object. */
        GameObject.prototype.getCollisions =  function(opt) {
            var id;
            var objects = this.state.objects;
            var grouped = false;

            // Decide what id, objects, and grouped should be based on parameter.
            if (_.isArray(opt)) {
                objects = opt;
            } else {
                if (_.isString(opt)) {
                    id = opt;
                } else {
                    _.defaults(opt, {
                        id: null,
                        objects: objects,
                        grouped: grouped,
                    });

                    id = opt.id;
                    objects = opt.objects;
                    grouped = opt.grouped;
                }
            }

            var result = [];
            for (var i=0; i<objects.length; ++i) {
                var obj = objects[i];
                if (obj instanceof GameObject && obj !== this) {
                    var checkingObj;

                    if (id) {
                        if (obj.hasId(id)) {
                            checkingObj = obj;
                        } else {
                            continue;
                        }
                    } else {
                        checkingObj = obj;
                    }

                    if (this.isNearby(checkingObj, 0)) {
                        result.push(checkingObj);
                        if (!grouped) break;
                    }
                }
            }
            return result.length > 1 ? result : result[0];
        };

        /* Pass bounds obj (x1, x2, y1, y2) or GameObject and optional radius
            returns bool; true if testBounds are within this' bounds + radius */
        GameObject.prototype.isNearby = function(testBounds, radius) {
                var myBounds = this.getBounds();
                testBounds = testBounds instanceof GameObject
                             ? testBounds.getBounds()
                             : testBounds;

                if (radius) {
                    myBounds.x1 -= radius;
                    myBounds.x2 += radius;
                    myBounds.y1 -= radius;
                    myBounds.y2 += radius;
                }

                return (myBounds.x1 < testBounds.x2
                    && myBounds.x2 > testBounds.x1
                    && myBounds.y1 < testBounds.y2
                    && myBounds.y2 > testBounds.y1);
        };

        /* Returns an array of objects in the provided radius.
            optionally provide an array of objects to search through (uses this.state.objects by default) */
        GameObject.prototype.getNearby = function(radius, objects) {
                var results = [];
                objects = objects || this.state.objects;
                for (var i = 0; i < objects.length; i++) {
                    if (objects[i] instanceof GameObject && objects[i] !== this && this.isNearby(objects[i], radius))
                        results.push(objects[i]);
                }

                return results;
        };

        // use distance formula to get distance from an object
        // also can pass 4 args to use custom values (x1,y1, x2,y2)
        GameObject.prototype.getDistance = function(obj) {
                var x1,x2,y1,y2;
                if (arguments.length >= 4) {
                    x1 = arguments[0];
                    y1 = arguments[1];
                    x2 = arguments[2];
                    y2 = arguments[3];
                } else if (obj instanceof GameObject) {
                    x1 = this.x;
                    y1 = this.y;
                    x2 = obj.x;
                    y2 = obj.y;
                } else {
                    throw new TypeError('GameObject.getDistance: expecting GameObject or (x1,y1, x2,y2) args');
                }

                return Math.abs(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
        };

        /* returns closest object within radius; defaults to this.state.objects; opt argument obj list
            works like getNearby, but only returns the closest object
            if returnDist == true, returns an array [GameObject object, Number distance]
        */
        GameObject.prototype.getClosest = function(objects, radius, returnDist) {
                objects = objects || this.state.objects;
                objects = _.isNumber(radius) ? this.getNearby(radius, objects) : _(objects).without(this);
                if (objects.length < 1)
                    return null;

                var closest;
                var distMin;
                for (var i = 0; i < objects.length; i++) {
                    var dist = this.getDistance(objects[i]);
                    if (!_.isNumber(distMin) || dist < distMin) {
                        closest = objects[i];
                        distMin = dist;
                    }
                }

                if (returnDist)
                    return [closest, distMin];
                else
                    return closest;
        };


    // Any performance problems with these are mostly likely due to the collisions rather than rendering.
    function Bullet(tex, x, y, angle) {
        GameObject.call(this);
        this.x = x;
        this.y = y;
        this.speedX = Math.cos(angle);
        this.speedY = -Math.sin(angle);
        this.tex = tex;

        this.currentElement;
    }
        Bullet.prototype = new GameObject();
        Bullet.prototype.constructor = Bullet;

        Bullet.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);

                this.graphic = this.addDisplay(new gfx.pixi.Sprite(this.tex), this.state.bulletBatch);
                this.width = this.graphic.width;
                this.height = this.graphic.width;

                this.speed = 0;
                this.lifeTime = 0;
                this.lifeTimer = 0;
        };

        Bullet.prototype.destroy = function(state) {
                GameObject.prototype.destroy.call(this, state);
        };

        Bullet.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);

                var speed = this.speed * delta;
                if (this.currentElement === 'lightning') {
                    speed *= (1+upgrades.getValPercent('lightningBulletSpeed'))
                }

                this.x += this.speedX * speed;
                this.y += this.speedY * speed;

                this.angle = -Math.atan2(this.speedY, this.speedX);

                this.lifeTimer -= delta;

                // y = sqrt(1 -x) + x/4
                var lifeRatio = this.lifeTimer / this.lifeTime;
                this.graphic.alpha = Math.sqrt(lifeRatio) + (1-lifeRatio)/4;

                if (this.lifeTimer <= 0) {
                    this.state.remove(this);
                }

                var bounds = this.getBounds();
                if (bounds.x1 <= 0 || bounds.x2 >= gfx.width) {
                    this.speedX = -this.speedX;
                }

                if (bounds.y1 <= 0 || bounds.y2 >= gfx.height) {
                    this.speedY = -this.speedY;
                }

                var collidedBubble = this.getCollisions(this.state.bubbles);
                if (collidedBubble) {
                    collidedBubble.onBulletCollision(this);
                }
        };


    // Weapon applies the element and upgrades onto the bullets it generates
    // Also controls ammo reloading system + graphics
    function Weapon() {
        GameObject.call(this);
        this.availableElements = ['fire', 'ice', 'lightning'];
    }
        Weapon.prototype = new GameObject();
        Weapon.prototype.constructor = Weapon;

        Weapon.prototype.init = function(state, element) {
                GameObject.prototype.init.call(this, state);
                this.x = gfx.width/2;
                this.y = gfx.height/1.2;
                this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.arrow));
                this.graphic.depth = gfx.layers.gui;

                this.currentElement = element || bpm.player.currentElement;
                this.ammoMax = bpm.player.ammoMax;

                this.ammoText = this.state.addDisplay(new gfx.pixi.Text('', {
                    stroke: 'black',
                    strokeThickness: 4,
                    fill: 'white',
                    align: 'left',
                }));
                this.ammoText.anchor.x = 0.5;
                this.ammoText.x = this.x;
                this.ammoText.y = this.y + 10;
                this.ammoText.depth = gfx.layers.gui;

                this.ammoLoader = this.state.addDisplay(new gfx.pixi.Graphics());
                this.ammoLoader.depth = gfx.layers.gui;
                this.ammoLoaderColors = [0, 0x67575e];
        };

        Weapon.prototype.destroy = function(state) {
                // Remove things from the state's display
                _.each([this.ammoText, this.ammoLoader],
                       _.bind(this.state.removeDisplay, this.state));
                GameObject.prototype.destroy.call(this, state);
        };

        Weapon.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);
                this.angle = -Math.atan2(input.mouse.getY() - this.y, input.mouse.getX() - this.x);

                this.ammoText.setText(this.ammo);

                if (this.ammo > 0) {
                    if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                        // bullets can be an array of bullets or just a single bullet
                        var bullets = this.shoot();
                        this.ammo--;
                    }
                }

                this.drawAmmoTimer(this.ammoLoaderColors[0], this.ammoLoaderColors[1]);

                bpm.player.ammo = this.ammo;
        };

        Weapon.prototype.drawAmmoLoaderCircle = function(color, ratio) {
                this.ammoLoader.lineStyle(8, color, 1);
                var y = this.ammoText.y + this.ammoText.height/2;
                for (var i=0; i<ratio*180; ++i) {
                    var rad = i * DEG2RAD;
                    this.ammoLoader.lineTo(this.x + (-Math.cos(rad) * 48),  y + (Math.sin(rad) * 32));
                }
        };

        // sets ammo timer
        // pass time in ms; loops by default
        Weapon.prototype.setAmmoTimer = function(time) {
                if (this.ammoTimer)
                    return this.ammoTimer;

                this.ammoTimer = new Timer(time, 'loop', _.bind(function() {
                    if (this.ammo < this.ammoMax)
                        this.ammo++;
                }, this));

                return this.state.add(this.ammoTimer);
        };

        Weapon.prototype.drawAmmoTimer = function(backColor, frontColor, ammoTimer) {
                ammoTimer = ammoTimer || this.ammoTimer;
                if (ammoTimer instanceof Timer) {
                    if (this.ammo < this.ammoMax) {
                        ammoTimer.paused = false;

                        this.ammoLoader.visible = true;
                        this.ammoLoader.clear();
                        this.drawAmmoLoaderCircle(backColor, 1);
                        this.drawAmmoLoaderCircle(frontColor, 1 - (ammoTimer.currentTime / ammoTimer.duration));
                    } else {
                        ammoTimer.paused = true;
                        this.ammoLoader.visible = false;
                    }
                }
        };

        // Called immediately after shoot
        Weapon.prototype.setElement = function(element) {
                element = element.toLowerCase();
                if (!_.contains(this.availableElements, element))
                    throw new Error('Weapon.setElement: Invalid element passed: ' + element);

                this.currentElement = element;
                bpm.player.currentElement = element;
        };

        // calls spawnBullet with additional functionality
        Weapon.prototype.shoot = function() {};
        // creates and returns a customized instance of Bullet
        // make sure the returned bullet of this function is used in children's invocations
        Weapon.prototype.spawnBullet = function(tex, x, y, angle) {
            var b = new Bullet(tex, x, y, angle);
            console.log(b, b.id);
            if (this.currentElement)
                b.currentElement = this.currentElement;
            return b;
        };


    function PinShooter() {
        Weapon.call(this);
    }
        PinShooter.prototype = new Weapon();
        PinShooter.prototype.constructor = PinShooter;

        PinShooter.prototype.init = function(state) {
                Weapon.prototype.init.call(this, state);
                this.ammo = bpm.player.pinShooter.ammo;
                this.ammoMax = bpm.player.pinShooter.ammoMax;
                this.setAmmoTimer(3000);
        };

        PinShooter.prototype.spawnBullet = function(x, y, angle) {
            var b = Weapon.prototype.spawnBullet.call(this, res.tex.pin, x, y, angle);
            b.init = function(state) {
                Bullet.prototype.init.call(b, state);
                b.speed = 0.2;
                b.lifeTime = 6000;
                b.lifeTimer = b.lifeTime;
            };

            b.destroy = function(state) {
                state.pinEmitter.emit(b.x, b.y, 3);
                Bullet.prototype.destroy.call(b, state);
            };

            return b;
        };

        PinShooter.prototype.shoot = function() {
            return this.state.add(this.spawnBullet(this.x, this.y, this.angle));
        };

    function Shotgun() {
        Weapon.call(this);
    }
        Shotgun.prototype = new Weapon();
        Shotgun.prototype.constructor = Shotgun;

        Shotgun.prototype.init = function(state) {
                Weapon.prototype.init.call(this, state);
                this.ammo = bpm.player.shotgun.ammo;
                this.ammoMax = bpm.player.shotgun.ammoMax;
                this.setAmmoTimer(3000);
        };

        Shotgun.prototype.spawnBullet = function(x, y, angle) {
                var b = Weapon.prototype.spawnBullet.call(this, res.tex.shotgunBullet, x, y, angle);
                b.init = function(state) {
                    Bullet.prototype.init.call(b, state);
                    b.speed = 0.25;

                    b.lifeTime = 6000;
                    b.lifeTimer = b.lifeTime;
                };

                return b;
        };

        Shotgun.prototype.shoot = function() {
                var bulletOffset = 15 * DEG2RAD;
                return this.state.add([this.spawnBullet(this.x, this.y, this.angle),
                                       this.spawnBullet(this.x, this.y, this.angle+bulletOffset),
                                       this.spawnBullet(this.x, this.y, this.angle-bulletOffset)]);
        };

    function Rifle() {
        Weapon.call(this);
    }
        Rifle.prototype = new Weapon();
        Rifle.prototype.constructor = Rifle;

        Rifle.prototype.init = function(state) {
            Weapon.prototype.init.call(this, state);
            this.ammo = bpm.player.rifle.ammo;
            this.ammoMax = bpm.player.rifle.ammoMax;
            this.setAmmoTimer(3000);
            console.log(this);
        };

        Rifle.prototype.spawnBullet = function(x, y, angle) {
            var b = Weapon.prototype.spawnBullet.call(this, res.tex.rifleBullet, x, y, angle);
            b.init = function(state) {
                Bullet.prototype.init.call(b, state);
                b.speed = 0.6;

                b.lifeTime = 6000;
                b.lifeTimer = b.lifeTime;
            };

            console.log(this, b);

            return b;
        };

        Rifle.prototype.shoot = function() {
            return this.state.add(this.spawnBullet(this.x, this.y, this.angle));
        };


    function Bubble(armor, x, y, angle) {
        GameObject.call(this);
        this.x = x;
        this.y = y;

        this.speedX = Math.cos(angle * DEG2RAD);
        this.speedY = 1;

        this.worth = 10;

        // Element Settings
        this.currentElement;
        this.fireConfig = {
            damage: 0.01 * (1+upgrades.getValPercent('fireDamage')),
            upgrades: [],
            duration: 750 * (1+upgrades.getValPercent('fireDuration')),
            applyChance: upgrades.getVal('fireChance'), // in percent (10 === 10%)
            range: 0,

            hasEmber: upgrades.getVal('fireEmber'),
            emberChance: 1.5
        };

        this.iceConfig = {
            duration: 1000 * (1 + upgrades.getValPercent('iceFreezeLength')),
            speedReduce: upgrades.getValPercent('iceSpeedReduce'),

            fadeDuration: 500, //ms
        };

        this.lightningConfig = {
            duration: 1500, // The length of lightning being active. ms
            range: 400,
            chainLength: upgrades.getVal('lightningChainLength'),
            damage: 1 * (1+upgrades.getValPercent('lightningDamage')),
            // ms between each bolt
            speed: 50,
            // ms before each bolt is removed
            // final value will be multiplied by chain amount
            cooldown: 100
        };

        // Armor settings
        // armor protects bubbles from hits while > 0
        this._maxArmor = 9;
        if (_.isNumber(armor)) {
            if (armor < 0)
                armor = 0;
            if (armor > this._maxArmor)
                armor = this._maxArmor;
            this.armor = armor;
        } else {
            warn('Bubble armor is not a number');
        }
        this._prevArmor = this.armor;
    }
        Bubble.prototype = new GameObject();
        Bubble.prototype.constructor = Bubble;

        Bubble.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);

                this.state.bubbles.push(this);

                // Graphics / 2D Specs
                this.addId('bubble');
                this.bubble = new gfx.pixi.Sprite(res.tex.bubble);
                this.glare = new gfx.pixi.Sprite(res.tex.glare);

                this.width = this.bubble.width;
                this.height = this.bubble.width;

                // Stats affected by upgrades/etc
                this.hpMax = this.armor*2;
                this.hp = this.hpMax;
                this.setSpeed(0.03);


                // Armor
                if (this.armor > 0) {
                    this.armorGraphic = this.addDisplay(new gfx.pixi.Sprite(res.sheets.armor[this.armor-1]), this.armorBatch);
                    this.armorStatus = 'normal';

                    this.crack = new gfx.pixi.MovieClip(res.sheets.cracks);
                    this.crack.anchor.x = this.crack.anchor.y = 0.5;
                    this.crack.animationSpeed = 0;
                    this.crack.play();
                } else {
                    // If not armored initially, set armorGraphic to null
                    this.armorGraphic = null;
                    this.armorStatus = null;
                    this.addBubbleDisplays();
                }
        };

        Bubble.prototype.destroy = function() {
                this.state.bubbleEmitter.emit(this.x, this.y, 10);
                this.state.bubbles.splice(this.state.bubbles.indexOf(this), 1);

                // remove current element if it exists (fixes element flickering on destroy)
                this.removeElement();
                GameObject.prototype.destroy.call(this);
        };

        Bubble.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);

                var speed = this.speed * delta;
                this.x += this.speedX * speed;
                this.y += this.speedY * speed;

                var bounds = this.getBounds();
                if (bounds.x1 <= 0 || bounds.x2 >= gfx.width) {
                    this.speedX = -this.speedX;
                }

                if (bounds.y1 >= gfx.height) {
                    this.state.remove(this);
                }

                // Death/Armor Management
                if (this.armor > 0) {
                    if (this.hp < this.hpMax) {
                        // Add crack effect on first bullet collision.
                        if (this.armorStatus === 'normal') {
                            this.armorGraphic.addChild(this.crack);
                            this.armorStatus = 'damaged';
                        }
                    }

                    // Remove armor and crack effect. Add bubble displays.
                    if (this.hp <= 0) {
                        if (this.armorStatus === 'damaged') {
                            this.removeDisplay(this.armorGraphic);
                            this.addBubbleDisplays();
                            this.armorStatus = null;
                        }
                    }
                }

                if (this.hp <= -1) {
                    this.state.xp += this.worth * this.state.multiplier;
                    this.state.combo++;
                    this.state.comboTimer = this.state.comboTime;
                    this.state.triggerEvent('bubblePopped');
                    this.state.remove(this);
                } else {
                    if (this.crack) {
                        this.crack.currentFrame = Math.round((1 - (this.hp / this.hpMax)) * (this.crack.totalFrames-1));
                    }
                }

                if (upgrades.getVal('lightningConduction') && this.lightningActive) {
                    var collidedBubble = this.getCollisions(this.state.bubbles);
                    if (collidedBubble) {
                        if (collidedBubble.armor <= 0) {
                            this.state.add(new LightningShockwave(this));
                        }
                    }
                }

                this.updateElement();
        };

        Bubble.prototype.setSpeed = function(newSpeed) {
                this._originalSpeed = newSpeed;
                this.speed = newSpeed;
        };

        // Toggles speed to and from originalSpeed (last speed set by setSpeed)
        // Pass a tempSpeed param to specify a temporary speed change
        // toggle back by calling this.speedToggle without args.
        // Useful for lightning and ice elements
        Bubble.prototype.speedToggle = function(tempSpeed) {
                if (!_.isNumber(this._originalSpeed)) {
                    this._originalSpeed = this.speed;
                    warn('Bubble.speedToggle: this._original speed was not set before attempting to toggle speed.\r'+
                         'Defaulting to current speed of '+this.speed);
                }

                if (!_.isNumber(tempSpeed)) {
                    if (this.speed !== this._originalSpeed)
                        this.speed = this._originalSpeed
                } else {
                    this.speed = tempSpeed;
                }
        };

        Bubble.prototype.onBulletCollision = function(bullet) {
                var damage = 1;
                if (this.currentElement === 'ice' && upgrades.getVal('iceBrittle')) {
                    damage *= 1+upgrades.getValPercent('iceBrittleDamage');
                }
                this.hp -= damage;

                this.applyElement.call(this, bullet.currentElement);

                if (this.hp > -1) {
                    this.state.remove(bullet);
                }
        };

        // Adds the displays for the raw bubble.
        Bubble.prototype.addBubbleDisplays = function() {
                this.addDisplay(this.bubble, this.state.bubbleBatch);
                this.addDisplay(this.glare, this.state.glareBatch);
                this.updateDisplayProperties([this.bubble, this.glare]);
        };

        // Elements
        // Applied by bullets, anything defined here should be either passed from the pin
        // or should be related to the graphics/dimensions of the bubble
        Bubble.prototype.updateElement = function() {
                this._getElementMethod('update', this.currentElement).apply(this);
        };

        Bubble.prototype.applyElement = function(element) {
                if (!this.currentElement) {
                    var method = this._getElementMethod('apply', element);
                    return method.apply(this, _(arguments).tail());
                }
        };

        Bubble.prototype.removeElement = function(element) {
                // Make sure reference to state exists; this is necessary unless you like crashes
                // might not actually be necessary after all. Leaving as-is just in case
                // TODO: test if necessary, remove if not
                if (this.state) {
                    element = element || this[this.currentElement];
                    if (element && element.parent) {
                        this.removeDisplay(element);
                        this[this.currentElement] = null;
                    }

                    this.currentElement = null;
                }
        };

        // Used to get a type of private method from Bubble with a given element
        // relies heavily on convention!
        Bubble.prototype._getElementMethod = function(type, element) {
                if (element) {
                    var eleMethod = this['_' + type + capitalize(element)];
                    if (_.isFunction(eleMethod)) {
                        return eleMethod;
                    }
                }
                return _.identity;
        };

        // Configures the setup of all elements
        Bubble.prototype._setupElement = function(elemStr, elemObj) {
                this.currentElement = elemStr;
                return this;
        };

        // Used by all elements to set up display-related stuff
        Bubble.prototype._displayElement = function(elemObj) {
                elemObj = elemObj;
                // Update display properties so it will have correct positions without having to wait another frame.
                this.updateDisplayProperties([elemObj]);
                this.addDisplay(elemObj);
                return this;
        };

        Bubble.prototype._applyFire = function() {
                if (this.hp > 0) {
                    if (!this.fire) {
                        this.fire = new gfx.pixi.MovieClip(res.sheets.fire);
                        this.fire.play();
                        this.fire.animationSpeed = 0.3;

                        this.fire.width = this.width;
                        this.fire.height = this.height;

                        this.fire.syncGameObjectProperties = { scale: false };
                        this.fire.alpha = 0.7;
                        this.fire.depth = -4;
                    }

                    this._setupElement('fire', this.fire)._displayElement(this.fire);

                    // Add fire timer - destroys timer when duration is up
                    var onFireComplete = _.bind(this.removeElement, this, this.fire);
                    var fireTimer = new Timer(this.fireConfig.duration, 'oneshot', onFireComplete);
                    this.state.add(fireTimer);
                }
        };

        Bubble.prototype._updateFire = function() {
                if (this.fireConfig) {
                    this.hp -= this.fireConfig.damage;

                    // Percentage chance to apply fire to collided bubbles
                    // This helps with perf too, as collisions are only gathered when chance is in range
                    var chance = randomRange(0, 100);
                    if (chance <= this.fireConfig.applyChance && chance > 0) {
                        var collidedBubble =  this.getCollisions(this.state.bubbles);
                        if (collidedBubble) {
                            collidedBubble.applyElement('fire');
                        }
                    }

                    if (this.fireConfig.hasEmber) {
                        if (chance <= this.fireConfig.emberChance && chance > 0) {
                            this.state.add(new FireEmber(this));
                        }
                    }
                }
        };

        // TODO: Add to sprite batch
        // TODO: Currently, you have to wait until the timers are finished before re-applying ice
        //          I'd like to be able to re-apply ice on every hit
        // TODO: Smoother fading (use a quadratic or logarithmic equation instead of a linear equation)
        // TODO: Smoother speed transition on fading
        Bubble.prototype._applyIce = function() {
                if (!this.ice) {
                    this.ice = new gfx.pixi.Sprite(res.tex.ice);
                    this.ice.width = this.width;
                    this.ice.height = this.height;

                    this.ice.syncGameObjectProperties = { scale: false };
                    this.ice.alpha = 0.85;
                    this.ice.depth = -4;
                }

                this._setupElement('ice', this.ice)._displayElement(this.ice);

                // speedReduce of 100% == 1. when multiplying speed by 1, nothing happens :)
                var speedReduce = this.iceConfig.speedReduce;

                this.iceConfig.oldSpeed = this.speed;
                this.speed = this.speed * (1 - speedReduce);
                var m = this.speed; // slope for fadeTick

                var startFader = _.bind(function() {
                    if (this.state)
                        this.state.add(fadeTimer);
                    else
                        onIceComplete();
                }, this);

                var onFadeTick = _.bind(function(ratio, cur, dur) {
                    if (this.ice)
                        this.ice.alpha = this.ice.alpha * (1 - ratio);
                    // TODO: insert speed change function here
                }, this);

                var onIceComplete = _.bind(function() {
                    this.speed = this.iceConfig.oldSpeed;
                    this.removeElement(this.ice);
                }, this);

                var fadeDuration = this.iceConfig.fadeDuration;
                var duration = this.iceConfig.duration;

                var iceTimer = new Timer(duration, 'oneshot', startFader);
                var fadeTimer = new Timer(fadeDuration, 'oneshot', onIceComplete, onFadeTick);
                this.state.add(iceTimer);
        };

        Bubble.prototype._updateIce = function() {
                //_(this.getNearby(10, this.state.bubbles)).invoke('applyElement', 'ice');
        };

        // TODO: speed and cooldown based on chain length
        Bubble.prototype._applyLightning = function() {
                if (upgrades.getVal('lightningConduction') && this.armor <= 0) {
                    this.state.add(new LightningShockwave(this));
                }

                if (!this.lightningActive) {
                    this.lightningActive = true;
                    this.lightningActiveAnim = new gfx.pixi.MovieClip(res.sheets.lightningActive);
                    this.lightningActiveAnim.play();
                    this.lightningActiveAnim.animationSpeed = 0.3;

                    this.lightningActiveAnim.width = this.width;
                    this.lightningActiveAnim.height = this.height;

                    this.lightningActiveAnim.syncGameObjectProperties = { scale: false };
                    this.lightningActiveAnim.alpha = 0.7;
                    this.lightningActiveAnim.depth = -4;
                    this.addDisplay(this.lightningActiveAnim);

                    this.state.add(new Timer(this.lightningConfig.duration, 'oneshot', _.bind(function() {
                        if (!this.state) { return; }
                        if (this.lightningActiveAnim) {
                            this.removeDisplay(this.lightningActiveAnim);
                            this.lightningActiveAnim = null;
                        }
                        this.lightningActive = false;
                    }, this)));
                }

                // Don't apply if chain has been reached
                if (this.lightningConfig.chain && this.lightningConfig.chain.length >= this.lightningConfig.chainLength)
                    return;

                // Don't apply lightning on this bubble if it already has lightning
                if (!this.lightning) {
                    function getClosest(c) {
                        return this.getClosest(_(this.state.bubbles)
                                               .chain()
                                               .difference(c)
                                               .reject(function(obj) {
                                                   // Prevent lightning from striking bubbles in a different chain
                                                   return obj.currentElement === 'lightning';
                                               })
                                               .value(), this.lightningConfig.range);
                    }

                    function generateLightning(closest) {
                        this.lightning = new gfx.pixi.Sprite(res.tex.lightning);
                        this.lightning.syncGameObjectProperties = { scale: false, position: false, rotation: false, anchor: false };
                        this._setupElement('lightning', this.lightning);
                        this._positionLightning(closest);
                        this._displayElement(this.lightning);
                    }

                    if (!this.lightningConfig.chain) {
                        this.lightningConfig.chain = [this];
                    }

                    var closest = getClosest.call(this, this.lightningConfig.chain);

                    if (closest) {
                        this.lightningConfig.chain.push(closest);

                        generateLightning.call(this, closest);
                        this.hp -= this.lightningConfig.damage;

                        // Remove lightning display timer
                        this.state.add(new Timer(this.lightningConfig.cooldown, 'oneshot', _.bind(function() {
                            if (this.lightning) {
                                this.removeElement(this.lightning);
                            }

                            this.lightningConfig.chain = null;
                        }, this)));

                        // A small delay before applying lightning to the next bubble.
                        this.state.add(new Timer(this.lightningConfig.speed, 'oneshot', _.bind(function() {
                            // Remove lightning if closest is dead or if closest has lightning
                            // Otherwise, apply lightning on closest
                            if (!closest || !closest.state || !!closest.lightning) {
                                this.removeElement(this.lightning);
                            } else {
                                closest.lightningConfig.chain = this.lightningConfig.chain;
                                closest._applyLightning();
                            }
                        }, this)));
                    }
                }
        };

        Bubble.prototype._updateLightning = function() {
                var closest, chain = this.lightningConfig.chain;
                if (chain)
                    closest = chain[chain.indexOf(this) + 1];

                if (closest) {
                    this._positionLightning(closest);
                } else if (this.lightning) {
                    this.removeElement(this.lightning);
                }
        };

        // setup lightning to scale + angle towards closest bubble
        // this.lightning must be defined beforehand
        Bubble.prototype._positionLightning = function(closest) {
                if (this.lightning) {
                    // measurements n such
                    var radiusX = this.width / 2;
                    var radiusY = this.height / 2;
                    var centerX = this.x + radiusX;
                    var centerY = this.y + radiusY;
                    // closest object's center values
                    var centerX2 = closest.x + (closest.width / 2);
                    var centerY2 = closest.y + (closest.height / 2);

                    // get angle and distance from the center of the closest object
                    var distance = this.getDistance(centerX, centerY, centerX2, centerY2);
                    var angle = Math.atan2(centerY2 - centerY, centerX2 - centerX);

                    var polarX = radiusX * Math.cos(angle);
                    var polarY = radiusY * Math.sin(angle);

                    var positionOffset = {
                        'x': centerX + polarX - radiusX,
                        'y': centerY + polarY - radiusY
                    };

                    this.lightning.anchor.x = 0;
                    this.lightning.anchor.y = 0.5;

                    this.lightning.scale = {x: (distance - this.width) / this.lightning.texture.width, y: 1};
                    this.lightning.position = positionOffset;
                    this.lightning.rotation = angle;
                    this.lightning.depth = -4;

                    // don't display lightning if it is colliding
                    if (this.isNearby(closest)) {
                        this.lightning.visible = false;
                    } else {
                        this.lightning.visible = true;
                    }
                }
        };


    function Particle(emitter, tex, opt) {
        this.x = opt.x;
        this.y = opt.y;

        this.speed = opt.speed;
        this.speedX = Math.cos(opt.angle * DEG2RAD);
        this.speedY = -Math.sin(opt.angle * DEG2RAD);

        this.rotationRate = opt.rotationRate;

        this.emitter = emitter;

        this.lifeTime = opt.lifeTime;
        this.lifeTimer = this.lifeTime;

        this.sprite = new gfx.pixi.Sprite(tex);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
    }

        Particle.prototype = new GameObject();
        Particle.prototype.constructor = Particle;

        Particle.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);
                this.emitter.batch.addChild(this.sprite);
        };

        Particle.prototype.destroy = function() {
                GameObject.prototype.destroy.call(this);
                this.emitter.batch.removeChild(this.sprite);
        };

        Particle.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);

                var speed = this.speed * delta;

                this.x += this.speedX * speed;
                this.y += this.speedY * speed;

                this.sprite.alpha = this.lifeTimer / this.lifeTime;
                this.lifeTimer--;
                if (this.state && this.lifeTimer < 0) {
                    this.state.remove(this);
                }

                this.sprite.rotation += this.rotationRate;
                this.sprite.position.x = this.x;
                this.sprite.position.y = this.y;
        };

    function Emitter(tex, opt) {
        this.setOptions(opt);
        this.texture = tex;
        this.batch = new gfx.pixi.SpriteBatch();
        this.syncDisplayProperties = false;
    }
        Emitter.prototype = new GameObject();
        Emitter.prototype.constructor = Emitter;

        Emitter.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);
                this.addDisplay(this.batch);
        };

        Emitter.prototype.setOptions = function(opt) {
                this.angleMin = opt.angleMin;
                this.angleMax = opt.angleMax;

                this.speedMin = opt.speedMin;
                this.speedMax = opt.speedMax;

                this.lifeMin = opt.lifeMin;
                this.lifeMax = opt.lifeMax;

                this.range = opt.range;
                this.minRotationRate = opt.minRotationRate;
                this.maxRotationRate = opt.maxRotationRate;
        };

        Emitter.prototype.emit = function(x, y, amount) {
                if (this.state) {
                    for (var i=0; i<amount; ++i) {
                        var particle = new Particle(this, this.texture, {
                            x:        randomRange(x - this.range, x + this.range),
                            y:        randomRange(y - this.range, y + this.range),
                            speed:    randomRange(this.speedMin, this.speedMax),
                            angle:    randomRange(this.angleMin, this.angleMax),
                            lifeTime: randomRange(this.lifeMin, this.lifeMax),
                            rotationRate: randomRange(this.minRotationRate, this.maxRotationRate),
                        });
                        this.state.add(particle);
                    }
                }
        };

    // types = oneshot, loop
    function Timer(duration, type, onComplete, onTick) {
        this.duration = duration;
        this.currentTime = duration;
        this.type = type;
        this.onComplete = onComplete;
        this.onTick = onTick;
    }
        Timer.prototype = new BasicObject();
        Timer.prototype.constructor = Timer;

        Timer.prototype.update = function(delta) {
                if (this.paused) return;

                BasicObject.prototype.update.call(this, delta);
                this.currentTime -= delta;

                if (this.onTick) {
                    this.onTick(1-(this.currentTime/this.duration), this.currentTime, this.duration);
                }

                if (this.currentTime <= 0) {
                    if (this.type === 'oneshot') {
                        this.state.remove(this);
                    } else if (this.type === 'loop') {
                        this.currentTime = this.duration;
                    }

                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
        };


    function FireEmber(bubble) {
        this.bubble = bubble;
        this.x = bubble.x;
        this.y = bubble.y;

        this.speed = 0.05 * (1+upgrades.getValPercent('fireEmberSpeed'));

        var angle = Math.random() * 360;
        this.speedX = Math.cos(angle * DEG2RAD);
        this.speedY = -Math.sin(angle * DEG2RAD);

        this.rotationRate = 0.4;

        this.sprite = new gfx.pixi.Sprite(res.tex.ember);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;

        this.hp = upgrades.getVal('fireEmberDurability');
        this.lifeTime = 5000; //ms
        this.lifeTimer = this.lifeTime;

        this.affectedBubbles = [bubble];

        this.damage = 1 * (1+upgrades.getValPercent('fireEmberDamage'));
    }
        FireEmber.prototype = new GameObject();
        FireEmber.prototype.constructor = FireEmber;

        FireEmber.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);
                this.addDisplay(this.sprite);
        };

        FireEmber.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);
                this.lifeTimer -= delta;
                this.sprite.alpha = this.lifeTimer / this.lifeTime;
                if (this.lifeTimer <= 0) {
                    this.state.remove(this);
                }
                var speed = this.speed * delta;
                this.x += this.speedX * speed;
                this.y += this.speedY * speed;
                this.angle += this.rotationRate;
                var collidedBubble = this.getCollisions(this.state.bubbles);
                if (collidedBubble) {
                    if (!_(this.affectedBubbles).contains(collidedBubble)) {
                        collidedBubble.applyElement.call(collidedBubble, 'fire');
                        collidedBubble.hp -= this.damage;
                        this.affectedBubbles.push(collidedBubble);
                        this.hp--;
                        if (this.hp <= 0) {
                            this.state.remove(this);
                        }
                    }
                }
        };


    function LightningShockwave(bubble) {
        this.bubble = bubble;
        this.x = bubble.x;
        this.y = bubble.y;

        this.damage = 0.5 * (1+upgrades.getValPercent('lightningConductionDamage'));
        this.affectedBubbles = [bubble];
        this.sprite = new gfx.pixi.Sprite(res.tex.shockwave);

        var scaleMod = 1+upgrades.getValPercent('lightningConductionRange');
        this.scale.x = 0.5 * scaleMod;
        this.scale.y = 0.5 * scaleMod;
        this.width = this.sprite.width * this.scale.x;
        this.height = this.sprite.height * this.scale.y;

        this.lifeTime = 1000;
        this.lifeTimer = this.lifeTime;
    }
        LightningShockwave.prototype = new GameObject();
        LightningShockwave.prototype.constructor = LightningShockwave;

        LightningShockwave.prototype.init = function(state) {
                GameObject.prototype.init.call(this, state);
                this.addDisplay(this.sprite);
        };

        LightningShockwave.prototype.update = function(delta) {
                GameObject.prototype.update.call(this, delta);

                this.lifeTimer -= delta;
                this.sprite.alpha = this.lifeTimer / this.lifeTime;
                if (this.lifeTimer <= 0) {
                    this.state.remove(this);
                }

                var collidedBubble = this.getCollisions(this.state.bubbles);
                if (collidedBubble) {
                    if (!_(this.affectedBubbles).contains(collidedBubble)) {
                        collidedBubble.applyElement.call(collidedBubble, 'lightning');
                        collidedBubble.hp -= this.damage;
                        this.affectedBubbles.push(collidedBubble);
                    }
                }
        };


    return {
        BasicObject: BasicObject,
        GameObject: GameObject,
        Timer: Timer,
        Weapon: Weapon, // should only be used for instanceof checks
        Bubble: Bubble,
        Emitter: Emitter,
        PinShooter: PinShooter,
        Rifle: Rifle,
        Shotgun: Shotgun
    };
});
