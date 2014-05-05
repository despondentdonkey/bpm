define(['res', 'gfx'], function(res, gfx) {

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

    GameObject.prototype._onAdd = function(state) {
        this.state = state;
        this.onAdd(state);
    };

    GameObject.prototype._onRemove = function(state) {
        while (this.displayObjects.length > 0) {
            this.removeDisplay(this.displayObjects[0]);
        }
        this.state = null;
        this.onRemove(state);
    };

    GameObject.prototype._update = function(delta) {
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
    };

    GameObject.prototype.addDisplay = function(display, container) {
        this.displayObjects.push(display);
        return this.state.addDisplay(display, container);
    };

    GameObject.prototype.removeDisplay = function(display) {
        this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
        return this.state.removeDisplay(display);
    };

    GameObject.prototype.addId = function(id) {
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

    GameObject.prototype.hasId = function(id) {
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

    GameObject.prototype.removeId = function(id) {
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

    GameObject.prototype.getCollisions = function(id) {
        var result = [];
        for (var i=0; i<this.state.objects.length; ++i) {
            var obj = this.state.objects[i];
            if (obj !== this && obj.hasId(id)) {
                var thisx2 = this.x + this.width;
                var thisy2 = this.y + this.height;
                var objx2 = obj.x + obj.width;
                var objy2 = obj.y + obj.height;
                if (thisx2 > obj.x && this.x < objx2 && thisy2 > obj.y && this.y < objy2) {
                    result.push(obj);
                }
            }
        }
        return result;
    };

    GameObject.prototype.onAdd = function(state) {}
    GameObject.prototype.onRemove = function(state) {}
    GameObject.prototype.update = function(delta) {};


    inherit(BubbleTest, GameObject);
    function BubbleTest(x, y, tint) {
        GameObject.call(this);
        this.initialX = x; this.initialY = y;
        this.xmod=0; this.ymod=0;
        this.offsetX = 0; this.offsetY = 0;
        this.tint = tint;
    }

    BubbleTest.prototype.onAdd = function(state) {
        // BubbleTest render test
        var bub = new gfx.pixi.Sprite(res.tex.bubble);
        this.addDisplay(bub, state.batch);
    };

    BubbleTest.prototype.update = function(delta) {
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


    inherit(PinTest, GameObject);
    function PinTest(x, y, angle) {
        GameObject.call(this);
        this.x = x; this.y = y;
        this.width = 13; this.height = 12;
        this.angle = angle;
        this.collisionTest = false;

        this.onAdd = function(state) {
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
                    console.log(obj);
                }
            }
        };
    }


    return {
        BubbleTest: BubbleTest,
        PinTest: PinTest,
    };
});
