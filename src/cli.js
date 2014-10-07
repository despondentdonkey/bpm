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
            var amt = Number(amtStr);
            objStr = capitalize(objStr.toLowerCase());
            var obj = objects[capitalize(objStr)];
            var st = states.global.current;

            // Setup arguments
            var opt = optStr.split(' ');
            var def = _.isArray(defaults(objStr)) ? defaults(objStr) : [[],[]];
            var args = [];

            var iter = Math.max(opt.length, def.length);
            _(iter).times(function(i) {

            });

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

    /* Default Object configuration
        * if passed arguments do not satisfy an object's arity,
        * fill in the blanks with the defaults provided here */
    var defaults = function(objStr) {
        // (this is a function so we can use random values and other fns)
        return {
            // Use arrays instead of objects so we can maintain order
            'Bubble': [
                ['armor', 'x', 'y', 'angle'],
                [0, randomRange(32, gfx.width-32), randomRange(-128, gfx.height / 4), Math.random() * 360]
            ]
        }[objStr];
    };

    /* Named Argument Parsing
        * takes an array of strings, matches against a regex */
    var parseArgs = function(optArr) {
        var parsed = [[], []];
        var operator = /[:|=]/;
        var word = /(\w+)/;
        var validCommand = new RegExp("(?:"+ word + operator +")?"+ word);
        var kwStart = false;

        _(optArr).each(function(opt, i) {
            var matches = opt.match(validCommand);
            if (matches) {
                var kw = matches[1];
                var arg = matches[2];

                if (kw) kwStart = true;
                if (!kw && kwStart)
                    throw '\tCLI:InvalidArgument: Positional arguments passed named arguments.';

                parsed[0].push[kw];
                parsed[1].push[arg];
            }
        });

        return parsed;
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
