define(['res', 'gfx'], function(res, gfx) {

    function GameObject() {
        this.displayObjects = [];
        this.state = null;
        this.idList = [];

        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
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
            for (var i in id) {
                this.addId(id[i]);
            }
        }
    };

    GameObject.prototype.hasId = function(id) {
        if (typeof id === 'string') {
            for (var i in this.idList) {
                if (this.idList[i] === id) {
                    return true;
                }
            }
        } else if (id instanceof Array) {
            for (var i in id) {
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
            for (var i in id) {
                this.removeId(id[i]);
            }
        }
    };

    GameObject.prototype.getCollisions = function(id) {
        var result = [];
        for (var i in this.state.objects) {
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
        this.x = x; this.y = y; this.xmod=0; this.ymod=0;
        this.tint = tint;
    }

    BubbleTest.prototype.onAdd = function(state) {
        // BubbleTest render test
        var bub = new gfx.pixi.Sprite(res.tex.bubble);
        var glare = new gfx.pixi.Sprite(res.tex.glare);

        bub.tint = this.tint;
        bub.anchor.x = 0.5;
        bub.anchor.y = 0.5;

        this.addDisplay(bub, state.batch);
        //this.addDisplay(glare);
    };

    BubbleTest.prototype.update = function(delta) {
        this.xmod += 0.02;
        this.ymod += 0.01;
        for (var i in this.displayObjects) {
            var obj = this.displayObjects[i];
            obj.position.x = this.x + Math.cos(this.xmod) * 20;
            obj.position.y = this.y + Math.sin(this.ymod) * 20;
            obj.rotation = Math.tan(this.xmod/3);
            obj.scale.x = Math.cos(this.xmod) * 1.5;
            obj.scale.y = Math.sin(this.ymod) * 1.5;
        }
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
            pin.anchor.x = 0.5;
            pin.anchor.y = 0.5;
            this.addDisplay(pin, state.pinBatch);
            this.addId('pin');
        };

        this.update = function(delta) {
            this.angle += 0.1;
            this.x += Math.cos(this.angle);
            this.y += -Math.sin(this.angle);
            for (var i in this.displayObjects) {
                var obj = this.displayObjects[i];
                obj.position.x = this.x;
                obj.position.y = this.y;
                obj.rotation = -this.angle;
            }

            if (this.collisionTest) {
                var col = this.getCollisions('pin');
                for (var i in col) {
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
