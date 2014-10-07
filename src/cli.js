/*  CLI Guide
    *
    *  Syntax:
    *    command <args>
    *    command <pos_args> <named_args>
    *
    *  Commands
    *    spawn <amount> <object> <arguments>
    *      - spawns an object from objects.js
    *
    *
    *
    *
    *
    */


define(['events', 'objects', 'bpm', 'states'], function(events, objects, bpm, states) {
    'use-strict';
    /* default configurations for constructors
        * describe what the default command should do if no additional args are provided
            * for example, if 'spawn 10 Bubble' is called, Bubble's
            * armor, x, y, and angle properties need to be defined here
        */
    var commandList = {
        // need to specify all contructor args in optStr OR in defaults[objects[obj]] (ie, defaults['Bubble'])
        'spawn': function(amtStr, objStr, optStr) {
            objStr = capitalize(objStr.toLowerCase());
            var st = states.global.current;
            var amt = Number(amtStr);
            var opt = optStr ? parseObject(optStr) : {};
            var obj = objects[capitalize(objStr)];

            _(opt).defaults(typeof defaults[objStr] === 'object' ? defaults[objStr] : {});

            var warnMessages = [];
            if (!st)
                warnMessages.push('states.global.current is not defined');
            if (typeof opt !== 'object')
                warnMessages.push('options is not an object. Error in CLI.js::parseObject or in CLI call')
            if (!obj instanceof objects.GameObject)
                warnMessages.push('"'+obj+'" is not defined as a GameObject in objects');
            if (typeof amt !== 'number')
                warnMessages.push(amt+' is not a number.');
            if (opt.length !== obj.length)
                warnMessages.push(JSON.stringify(opt)+' does not match the argument requirements for the constructor ' + obj.name);

            if (warnMessages.length > 0) {
                warning('spawn', _.toArray(arguments), warnMessages);
                return -1;
            }

            _(amt).times(function() { st.add(new obj.apply(null, opt)); });
        },
    };

    var defaults = {
        'Bubble': {

        }
    };

    var parseObject = function(str) {

    };


    /* Generates a warning message
        * String command, Array args, Array messages */
    var warning = function(command, args, messages) {
        args = args.join(' ');
        var warning = ["CLI('"+command+" "+args+"') > "];

        _(messages).each(function(m) {
            warning.push('\t' + m);
        });

        console.warn(warning.join('\n'));
    };

    /* Calls a space delimited command from a command defined in the commandList
        * format: CLI('<command> <arguments>', this) */
    function CLI(commandWithArgs, context) {
        var parsed = commandWithArgs.split(' ');
        var command = parsed[0];
        var args = _(parsed).tail();


        if (typeof commandList[command] === 'function')
            return commandList[command].apply(context, args);
    }

    return CLI;
});
