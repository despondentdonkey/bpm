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
        // need to specify all contructor args in argStr OR in defaults[objects[obj]] (ie, defaults['Bubble'])
        'spawn': function(amtStr, objStr) {
            var warnMessages = [];
            var amt = Number(amtStr);
            objStr = capitalize(objStr.toLowerCase());
            var obj = objects[objStr];
            var st = states.global.current;
            var argStr = _(arguments).tail(2).join(' ');
            var args = parseArgs(objStr, argStr);

            if (!st)
                warnMessages.push('states.global.current is not defined');
            if (!obj instanceof objects.GameObject)
                warnMessages.push('"'+obj+'" is not defined as a GameObject in objects');
            if (typeof amt !== 'number')
                warnMessages.push(amt+' is not a number.');
            if (args.length !== obj.length)
                warnMessages.push(args.toString()+' does not match the argument requirements for the constructor ' + obj.name);

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
        var gfx = require('gfx');
        return {
            // Use arrays instead of objects so we can maintain order
            'Bubble': [
                ['armor', 'x', 'y', 'angle'],
                [0, randomRange(32, gfx.width-32), randomRange(-128, gfx.height / 4), Math.random() * 360]
            ]
        }[objStr];
    };

    /* Argument Parser
        * Takes an object string and a space delimited string of positional and/or named arguments
        * Parses string and creates arguments array for application to object */
    var parseArgs = function(objStr, argStr) {
        var args = _.isString(argStr) ? parseArgStr(argStr.split(' ')) : [[], []];
        var def = _.isArray(defaults(objStr)) ? defaults(objStr) : [[],[]];

        if (def[0].length < 1 && args[0].length > 0)
            warnMessages.push('InvalidArgument: default not defined; '+
                'named arguments are only supported with defined defaults in cli.js');

        // get the names of the constructor's parameters to compare with args and def
        // >>>>>>>>> these regexes are beastly - check here first if any bugs appear in the CLI <<<<<<<<<
        var ctorParams = objects[objStr].toString()
                                        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
                                        .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
                                        .split(/,/);

        var objArgs = _(args[0]).chain().zip(args[1]).object().value();
        return _(ctorParams).map(function(named, i) {
            // named argument, positional, or default
            return objArgs[named] || args[1][i] || def[1][i];
        });
    };

    /* Named Argument String Parsing
        * takes an array of strings, matches against a regex,
        * returns 2d array of [name, value] argument pairs
        * for positionals name is the numerical position */
    var parseArgStr = function(argArr) {
        var parsed = [[], []];
        var validCommand = /(?:(\w+)[:|=])?(\w+)/;
        var kwStart = false;

        _(argArr).each(function(opt, i) {
            var matches = opt.match(validCommand);
            if (matches) {
                var kw = matches[1];
                var arg = matches[2];

                if (kw) kwStart = true;
                if (!kw && kwStart)
                    throw '\tCLI:InvalidArgument: Positional arguments passed named arguments.';
                if (!kw) kw = i;

                parsed[0].push(kw);
                parsed[1].push(arg);
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
