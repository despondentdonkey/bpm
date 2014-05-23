define(function() {
    /*
        ### events.js ###
        Global event system.
    */

    this.events = {};

    // Creates a new event which you can add listeners to.
    function create(name) {
        this.events[name] = {
            listeners: [],
        };
    }

    // Adds a listener function to an event. Passing true to oneShot will automatically remove this listener.
    function listen(name, func, oneShot, context) {
        var listeners = this.events[name].listeners;
        var listener = {
            func: func,
            context: context,
            oneShot: oneShot,
        };

        listeners.push(listener);
        return listener;
    }

    // Removes a listener from an event. Must pass the listener object which is returned by the listen function.
    function remove(name, listener) {
        var listeners = this.events[name].listeners;
        listeners.splice(listeners.indexOf(listener), 1);
    }

    /* Emit an event which triggers all listeners.
        context: Changes 'this' in the listener function to the context unless the listener has its own context.
        obj: Passed to the listener function. */
    function emit(name, context, obj) {
        var listeners = this.events[name].listeners;
        for (var i=0; i<listeners.length; ++i) {
            var listener = listeners[i];
            listener.func.call(listener.context || context, obj);
            if (listener.oneShot) {
                remove(name, listener);
                i--; // We removed something from listeners so adjust the iterator.
            }
        }
    }

    return {
        events: this.events,
        create: create,
        listen: listen,
        remove: remove,
        emit: emit,
    };
});
