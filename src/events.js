define(function() {
    /*
        ### events.js ###
        event system.
    */

    function EventHandler() {
        this.events = {};
    }

    EventHandler.prototype.addListener = function(name, func, oneShot) {
        if (this.events[name] === undefined || this.events[name].listeners === undefined)
            this.events[name] = { listeners: [] };

        var listeners = this.events[name].listeners;
        var listener = {
            func: func,
            oneShot: oneShot
        };

        listeners.push(listener);
        return listener;
    };

    // Pass listener to remove specific event listener, only pass name to remove all event listeners
    EventHandler.prototype.removeListener = function(name, listener) {
        if (!this.events[name])
            throw new Error('Event ' + name + ' not registered');
        if (!this.events[name].listeners)
            throw new Error('EventHandler.removeListener called before EventHandler.addListener');

        if (!listener) {
            this.events[name].listeners = [];
        } else {
            var listeners = this.events[name].listeners;
            listeners.splice(listeners.indexOf(listener), 1);
        }

        return listener;
    };

    // Triggers event 'name'. Any additional arguments are passed to listener callback
    EventHandler.prototype.triggerEvent = function(name) {
        if (!this.events[name])
            return null;

        var listeners = this.events[name].listeners;
        for (var i=0; i<listeners.length; ++i) {
            var listener = listeners[i];
            listener.func.apply(this, _.tail(arguments));
            if (listener.oneShot) {
                this.removeListener(name, listener);
                i--; // We removed something from listeners so adjust the iterator.
            }
        }
    };

    return {
        EventHandler: EventHandler,
        global: new EventHandler()
    };
});
