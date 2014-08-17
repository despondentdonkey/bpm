define(['events', 'objects', 'bpm', 'states'], function(events, objects, bpm, states) {


    // default configurations for constructors
        // describe what the default command should do if no args are provided
        // for example, if 'spawn 10 Bubble' is called, Bubble's armor, x, y, and angle properties need to be defined here

    var commandList = {
        // need to specify all contructor args in opt OR in defaults[objects[obj]] (ie, defaults['Bubble'])
        'spawn': function(amtStr, objStr, optStr) {
            var st = states.global.current;
            var amt = Number(amtStr);
            var opt = optStr !== undefined ? parseObject(optStr);
            var obj = objects[capitalize(objStr.toLowerCase())];

            _(opt).defaults(typeof defaults[objStr] === 'object' ? defaults[objStr] : {});

            var warnMessages = [];
            if (!st)
                warnMessages.push('states.global.current is not defined');
            if (typeof opt !== 'object')
                warnMessages.push('options object is not an object. Error in CLI.js::parseObject or in CLI call')
            if (!obj instanceof objects.GameObject)
                warnMessages.push('"'+obj+'" is not defined as a GameObject in objects');
            if (typeof amt !== 'number')
                warnMessages.push(amt+' is not a number.');
            if (opt.length !== obj.length)
                warnMessages.push(JSON.stringify(opt)+' does not match the argument requirements for the constructor ' + obj.name);

            if (warnMessages.length > 0) {
                getWarning('spawn', arguments, warnMessages)();
                return -1;
            }



            _(amt).times(function() { st.add(new obj.apply(null, opt)); });
        },
    };

    var defaults
    var parseObject = function(str) {

    };


    // Generates a warning message
    // String command, Array args, Array messages
    var getWarning = function(command, args, messages) {
        args = args.join(' ');
        var warning = ["CLI('"+command+" "+args+"') > "];

        _(messages).each(function(m) {
            warning.push('\t' + m);
        });

        return _.partial(console.warn, warning.join('\n'));
    };

    // Calls a space delimited command from a command defined in the commandList; format: CLI('<command> <arguments>', this);
    // CLI.apply or CLI.call to assign a context to commands (enables the use of 'this' in commands)
    function CLI(commandWithArgs) {
        var parsed = commandWithArgs.split(' ');
        var command = parsed[0];
        var args = _(parsed).tail();


        if (typeof commandList[command] === 'function')
            return commandList[command].apply(this, args);
    }

    return CLI;
});
