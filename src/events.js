define(function() {
    /*
        ### events.js ###
        event system.
    */


    var EventHandler = createClass(null, function() {
        this.events = {};
    }, {
        addListener: function(name, func, oneShot) {
            if (this.events[name] === undefined || this.events[name].listeners === undefined)
                this.events[name] = { listeners: [] };

            var listeners = this.events[name].listeners;
            var listener = {
                func: func,
                oneShot: oneShot
            };

            listeners.push(listener);
            return listener;
        },

        // Pass listener to remove specific event listener, only pass name to remove all event listeners
        removeListener: function(name, listener) {
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
        },

        triggerEvent: function(name) {
            var listeners = this.events[name].listeners;
            for (var i=0; i<listeners.length; ++i) {
                var listener = listeners[i];
                listener.func.call(this, _.tail(arguments));
                if (listener.oneShot) {
                    this.removeListener(name, listener);
                    i--; // We removed something from listeners so adjust the iterator.
                }
            }
        }
    });

    return {
        EventHandler: EventHandler,
        global: new EventHandler()
    };
});
