define(['res', 'gfx', 'input'], function(res, gfx, input) {

    function GameObject() {
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
        }
        this.anchor = {
            x: 0.5,
            y: 0.5
        };
        this.syncDisplayProperties = true; // If true this will update all display object's position properties (x,y,scale,rotation) to this object's properties.
    }

    GameObject.prototype = {
        _init:  function(state) {
            this.state = state;
            this.init(state);
        },

        _destroy: function(state) {
            while (this.displayObjects.length > 0) {
                this.removeDisplay(this.displayObjects[0]);
            }
            this.state = null;
            this.destroy(state);
        },

        _update:  function(delta) {
            this.update(delta);
            if (this.syncDisplayProperties) {
                for (var i=0; i<this.displayObjects.length; ++i) {
                    var obj = this.displayObjects[i];
                    obj.position.x = this.x;
                    obj.position.y = this.y;
                    obj.rotation = -this.angle;
                    obj.anchor.x = this.anchor.x;
                    obj.anchor.y = this.anchor.y;
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

        init:  function(state) {},
        destroy:  function(state) {},
        update:  function(delta) {},
    };


    inherit(BubbleTest, GameObject);
    function BubbleTest(x, y, tint) {
        GameObject.call(this);
        this.initialX = x; this.initialY = y;
        this.xmod=0; this.ymod=0;
        this.offsetX = 0; this.offsetY = 0;
        this.tint = tint;

        this.init = function(state) {
            // BubbleTest render test
            var bub = new gfx.pixi.Sprite(res.tex.bubble);
            this.addDisplay(bub, state.batch);
        };

        this.update = function(delta) {
            this.xmod += 0.02;
            this.ymod += 0.01;

            this.offsetX = Math.cos(this.xmod) * 20;
            this.offsetY = Math.sin(this.ymod) * 20;

            this.x = this.initialX + this.offsetX;
            this.y = this.initialY + this.offsetY;

            this.angle = Math.tan(this.xmod/3);
            this.scale.x = Math.cos(this.xmod) * 1.5;
            this.scale.y = Math.sin(this.ymod) * 1.5;
        };
    }


    inherit(PinTest, GameObject);
    function PinTest(x, y, angle) {
        GameObject.call(this);

        this.x = x; this.y = y;
        this.width = 13; this.height = 12;
        this.angle = angle;
        this.collisionTest = false;

        this.init = function(state) {
            var pin = new gfx.pixi.Sprite(res.tex.pin);
            pin.anchor.x = this.anchor.x;
            pin.anchor.y = this.anchor.y;
            this.addDisplay(pin, state.pinBatch);
            this.addId('pin');
        };

        this.update = function(delta) {
            this.angle += 0.1;
            this.x += Math.cos(this.angle);
            this.y += -Math.sin(this.angle);

            if (this.collisionTest) {
                var col = this.getCollisions('pin');
                for (var i=0; i<col.length; ++i) {
                    var obj = col[i];
                    //console.log(obj);
                }
            }
        };
    }

    inherit(PinShooter, GameObject);
    function PinShooter() {
        GameObject.call(this);
        this.init = function() {
            this.x = gfx.width/2;
            this.y = gfx.height/2;
            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.arrow));
        };

        this.update = function(delta) {
            this.angle = -Math.atan2(input.mouse.getY() - this.y, input.mouse.getX() - this.x);
            if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                this.state.add(new Pin(this.x, this.y, this.angle));
            }
        };
    }

    inherit(Pin, GameObject);
    function Pin(x, y, angle) {
        GameObject.call(this);
        this.init = function(state) {
            this.x = x;
            this.y = y;
            this.speed = 0.2;
            this.speedX = Math.cos(angle);
            this.speedY = -Math.sin(angle);
            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.pin), state.pinBatch);
            this.width = this.graphic.width;
            this.height = this.graphic.width;
        };

        this.update = function(delta) {
            var speed = this.speed * delta;
            this.x += this.speedX * speed;
            this.y += this.speedY * speed;

            this.angle = -Math.atan2(this.speedY, this.speedX);

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
                this.state.remove(obj);
            }
        };
    }


    inherit(Bubble, GameObject);
    function Bubble(x, y, angle) {
        GameObject.call(this);
        this.init = function(state) {
            this.x = x;
            this.y = y;
            this.addId('bubble');
            this.speed = 0.03;
            this.speedX = Math.cos(angle  || 0);
            this.speedY = -Math.sin(angle || 0);

            this.graphic = this.addDisplay(new gfx.pixi.Sprite(res.tex.bubble), state.bubbleBatch);
            this.glare = this.addDisplay(new gfx.pixi.Sprite(res.tex.glare));

            this.width = this.graphic.width;
            this.height = this.graphic.width;
        };

        this.update = function(delta) {
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
        };
    }

    return {
        BubbleTest: BubbleTest,
        PinTest: PinTest,
        PinShooter: PinShooter,
        Bubble: Bubble,
    };
});
