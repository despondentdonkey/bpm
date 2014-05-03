define(['res'], function(res) {

    function GameObject() {
        this.displayObjects = [];
        this.state = null;
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
        this.state.addDisplay(display, container);
    };

    GameObject.prototype.removeDisplay = function(display) {
        this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
        this.state.removeDisplay(display);
    };

    GameObject.prototype.onAdd = function(state) {}
    GameObject.prototype.onRemove = function(state) {}
    GameObject.prototype.update = function(delta) {};


    Bubble.prototype = new GameObject();
    function Bubble(x, y, tint) {
        GameObject.call(this);
        this.x = x; this.y = y; this.xmod=0; this.ymod=0;
        this.tint = tint;
    }

    Bubble.prototype.onAdd = function(state) {
        // Bubble render test
        var bub = new PIXI.Sprite(res.tex.bubble);
        var glare = new PIXI.Sprite(res.tex.glare);

        bub.tint = this.tint;
        bub.anchor.x = 0.5;
        bub.anchor.y = 0.5;

        this.addDisplay(bub, state.batch);
        //this.addDisplay(glare);
    };

    Bubble.prototype.update = function(delta) {
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

    return {
        Bubble: Bubble,
    };
});
