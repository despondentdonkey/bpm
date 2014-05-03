define(['objects', 'gfx'], function(objects, gfx) {
    function State() {
        this.displayObjects = [];
        this.objects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
    }

    State.prototype._update = function(delta) {
        // Add queued objects
        for (var i=0; i<this.objectsToAdd.length; ++i) {
            var obj = this.objectsToAdd[i];

            this.objects.push(obj);
            this.objectsToAdd.splice(this.objectsToAdd.indexOf(obj), 1);
            obj._onAdd(this);
        }

        // Remove queued objects
        for (var i=0; i<this.objectsToRemove.length; ++i) {
            var obj = this.objectsToRemove[i];

            this.objects.splice(this.objects.indexOf(obj), 1);
            this.objectsToRemove.splice(this.objectsToRemove.indexOf(obj), 1);
            obj._onRemove(this);
        }

        for (var i=0; i<this.objects.length; ++i) {
            this.objects[i]._update(delta);
        }

        this.update(delta);
    };

    State.prototype.add = function(obj) {
        this.objectsToAdd.push(obj);
    };

    State.prototype.remove = function(obj) {
        this.objectsToRemove.push(obj);
    };

    State.prototype.addDisplay = function(display) {
        this.displayObjects.push(display);
        gfx.stage.addChild(display);
    };

    State.prototype.removeDisplay = function(display) {
        this.displayObjects.splice(this.displayObjects.indexOf(display), 1);
        gfx.stage.removeChild(display);
    };

    State.prototype.init = function() {};
    State.prototype.update = function(delta) {};


    Test.prototype = new State();
    function Test() {
        State.call(this);
    }

    Test.prototype.init = function() {
        var a = new objects.Bubble(128, 128);
        this.add(a);

        var tint = Math.random() * 0xFFFFFF;
        for (var i=0; i<1000; ++i) {
            this.add(new objects.Bubble(Math.random() * gfx.width, Math.random() * gfx.height, tint));
        }
    };

    return {
        Test: Test,
    };
});
