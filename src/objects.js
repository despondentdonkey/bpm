define(['bpm', 'res', 'gfx', 'input'], function(bpm, res, gfx, input) {

    var GameObject = createClass(null, function() {
        this.displayObjects = [];
        this.state = null;
        this.idList = [];

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
    }, {
        init: function(state) {
            this.state = state;
        },

        destroy: function(state) {
            while (this.displayObjects.length > 0) {
                this.removeDisplay(this.displayObjects[0]);
            }
            this.state = null;
        },

        update:  function(delta) {
            if (this.syncDisplayProperties) {
                for (var i=0; i<this.displayObjects.length; ++i) {
                    var obj = this.displayObjects[i];
                    obj.position.x = this.x;
                    obj.position.y = this.y;
                    obj.rotation = -this.angle;
                    if (obj.anchor) {
                        obj.anchor.x = this.anchor.x;
                        obj.anchor.y = this.anchor.y;
                    }
                    obj.scale.x = this.scale.x;
                    obj.scale.y = this.scale.y;
                }
            }
        },

        addDisplay:  function(display, container) {
            this.displayObjects.push(display);
            return this.state.addDisplay(display, container);
        },

        removeDisplay:  function(display) {
            this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
            return this.state.removeDisplay(display);
        },

        addId:  function(id) {
            if (typeof id === 'string') {
                if (!this.hasId(id)) {
                    this.idList.push(id);
                }
            } else if (id instanceof Array) {
                for (var i=0; i<id.length; ++i) {
                    this.addId(id[i]);
                }
            }
        },

        hasId:  function(id) {
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
        },

        removeId:  function(id) {
            if (typeof id === 'string') {
                if (this.hasId(id)) {
                    this.idList.splice(this.idList.indexOf(id), 1);
                }
            } else if (id instanceof Array) {
                for (var i=0; i<id.length; ++i) {
                    this.removeId(id[i]);
                }
            }
        },

        getBounds:  function() {
            var width = this.width * this.anchor.x;
            var height = this.height * this.anchor.y;
            return {
                x1: this.x - width,
                y1: this.y - height,
                x2: this.x + width,
                y2: this.y + height,
            };
        },

        getCollisions:  function(id) {
            var result = [];
            for (var i=0; i<this.state.objects.length; ++i) {
                var obj = this.state.objects[i];
                if (obj !== this && obj.hasId(id)) {
                    var bounds = this.getBounds();
                    var objBounds = obj.getBounds();

                     if (bounds.x1 < objBounds.x2
                      && bounds.x2 > objBounds.x1
                      && bounds.y1 < objBounds.y2
                      && bounds.y2 > objBounds.y1) {
                        result.push(obj);
                    }
                }
            }
            return result;
        },
    });


    var PinShooter = createClass(GameObject, function() {

    }, {
        init: function(state) {
            this._super.init.call(this, state);
            this.x = gfx.width/2;
            this.y = gfx.height/2;
            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.arrow));
            this.graphic.depth = -10;
        },

        update: function(delta) {
            this._super.update.call(this);
            this.angle = -Math.atan2(input.mouse.getY() - this.y, input.mouse.getX() - this.x);

            if (bpm.player.pins > 0) {
                if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                    this.state.add(new Pin(this.x, this.y, this.angle));
                    bpm.player.pins--;
                }
            }
        },
    });

    var Pin = createClass(GameObject, function(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speedX = Math.cos(angle);
        this.speedY = -Math.sin(angle);
    }, {
        init: function(state) {
            this._super.init.call(this, state);

            this.speed = 0.2;
            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.pin), state.pinBatch);
            this.width = this.graphic.width;
            this.height = this.graphic.width;

            this.lifeTime = 6000;
            this.lifeTimer = this.lifeTime;
        },

        destroy: function() {
            this.state.pinEmitter.emit(this.x, this.y, 3);
            this._super.destroy.call(this);
        },

        update: function(delta) {
            this._super.update.call(this);
            var speed = this.speed * delta;
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

            var collisions = this.getCollisions('bubble');
            for (var i=0; i<collisions.length; ++i) {
                var obj = collisions[i];
                if (obj.armor > 0) {
                    obj.armor--;
                    this.state.remove(this);
                } else {
                    this.state.remove(obj);
                }
            }
        },
    });


    var Bubble = createClass(GameObject, function(armor, x, y, angle) {
        this.x = x;
        this.y = y;

        var v = angularSpeed(angle || 0);
        this.speedX = v.x;
        this.speedY = v.y;

        this.worth = 10;

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
    }, {
        init: function(state) {
            this._super.init.call(this, state);

            this.addId('bubble');
            this.speed = 0.03;

            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.bubble), state.bubbleBatch);
            this.glare = this.addDisplay(new gfx.pixi.Sprite(res.tex.glare), state.glareBatch);

            this.width = this.graphic.width;
            this.height = this.graphic.width;

            // Armor
            this.armorSprites = [null];
            for (var i = 1; i < this.armor + 1; i++) {
                var atex = res.tex['armor'+i];
                this.armorSprites[i] = new gfx.pixi.Sprite(atex);
                this.armorSprites[i].depth = -1;
            }
            // If not armored initially, set armorGraphic to null
            this.armorGraphic = this.armor > 0 ? this.addDisplay(this.armorSprites[this.armor]) : null;
        },

        destroy: function() {
            bpm.player.xp += this.worth;
            this.state.combo++;
            this.state.bubbleEmitter.emit(this.x, this.y, 10);
            this._super.destroy.call(this);
        },

        update: function(delta) {
            this._super.update.call(this);

            // Armor
            if (!_.isNull(this.armorGraphic) && (this.armor !== this._prevArmor)) {
                this.removeDisplay(this.armorGraphic);
                if (this.armor > 0)
                    this.armorGraphic = this.addDisplay(this.armorSprites[this.armor]);
                this._prevArmor = this.armor;
            }

            var speed = this.speed * delta;
            this.x += this.speedX * speed;
            this.y += this.speedY * speed;

            var bounds = this.getBounds();
            if (bounds.x1 <= 0 || bounds.x2 >= gfx.width) {
                this.speedX = -this.speedX;
            }

            if (bounds.y1 <= 0 || bounds.y2 >= gfx.height) {
                this.speedY = -this.speedY;
            }
        },
    });

    var Particle = createClass(GameObject, function(emitter, tex, opt) {
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
    }, {
        init: function(state) {
            this._super.init.call(this, state);
            this.emitter.batch.addChild(this.sprite);
        },

        destroy: function() {
            this._super.destroy.call(this);
            this.emitter.batch.removeChild(this.sprite);
        },

        update: function(delta) {
            this._super.update.call(this, delta);

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
        },
    });

    var Emitter = createClass(GameObject, function(tex, opt) {
        this.setOptions(opt);
        this.texture = tex;
        this.batch = new gfx.pixi.SpriteBatch();
        this.syncDisplayProperties = false;
    }, {
        init: function(state) {
            this._super.init.call(this, state);
            this.addDisplay(this.batch);
        },

        setOptions: function(opt) {
            this.angleMin = opt.angleMin;
            this.angleMax = opt.angleMax;

            this.speedMin = opt.speedMin;
            this.speedMax = opt.speedMax;

            this.lifeMin = opt.lifeMin;
            this.lifeMax = opt.lifeMax;

            this.range = opt.range;
            this.minRotationRate = opt.minRotationRate;
            this.maxRotationRate = opt.maxRotationRate;
        },

        emit: function(x, y, amount) {
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
        },
    });

    return {
        PinShooter: PinShooter,
        Bubble: Bubble,
        Emitter: Emitter,
    };
});
