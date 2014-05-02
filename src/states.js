define(['objects', 'gfx'], function(objects, gfx) {
    function State() {}

    State.prototype.objects = [];
    State.prototype.objectsToAdd = [];
    State.prototype.objectsToRemove = [];

    State.prototype.displayObjects = [];

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
            this.objects[i].update(delta);
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
    function Test() {}

    Test.prototype.init = function() {
        var a = new objects.Bubble();
        this.add(a);

        var thisState = this;
        setTimeout(function() {
            console.log("TEST REMOVAL");
            thisState.remove(a);
        }, 1000);
    };

    return {
        Test: Test,
    };
});
