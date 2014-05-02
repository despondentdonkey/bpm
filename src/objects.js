define(['res'], function(res) {

    function GameObject() {}

    GameObject.prototype.displayObjects = [];
    GameObject.prototype.state = null;

    GameObject.prototype._onAdd = function(state) {
        this.state = state;
        this.onAdd();
    };

    GameObject.prototype._onRemove = function(state) {
        while (this.displayObjects.length > 0) {
            this.removeDisplay(this.displayObjects[0]);
        }
        this.state = null;
        this.onRemove();
    };

    GameObject.prototype.addDisplay = function(display) {
        this.displayObjects.push(display);
        this.state.addDisplay(display);
    };

    GameObject.prototype.removeDisplay = function(display) {
        this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
        this.state.removeDisplay(display);
    };

    GameObject.prototype.onAdd = function(state) {}
    GameObject.prototype.onRemove = function(state) {}
    GameObject.prototype.update = function(delta) {};


    Bubble.prototype = new GameObject();
    function Bubble() {}

    Bubble.prototype.onAdd = function(state) {
        // Bubble render test
        var bub = new PIXI.Sprite(res.bubbleTex);
        var glare = new PIXI.Sprite(res.glareTex);

        this.addDisplay(bub);
        this.addDisplay(glare);
    };

    return {
        Bubble: Bubble,
    };
});
