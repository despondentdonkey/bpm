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


define(['events', 'objects', 'bpm'], function(events, objects, bpm) {

    /* Allows us to make useful aliases for commands */
    function aliasCommand(cmd, alias) {
        if (commands[cmd])
            commands[alias] = commands[cmd];
        else
            console.warn('CLI command ' + cmd + ' doesn\'t exist to create alias ' + alias + '.');
    }

    /* Commands are defined here! */
    var commands = {
        // need to specify all contructor args in argStr OR in defaults[objects[obj]] (ie, defaults['Bubble'])
        'spawn': function(amtStr, objStr) {
            var amt = Number(amtStr);
            var st = bpm.currentState;

            objStr = capitalize(objStr.toLowerCase());
            var obj = objects[objStr];

            var args, argStr = _(arguments).tail(2).join(' ');

            if (!(st && st.commandEnabled['spawn']))
                throw new CLIError('You cannot spawn here or the current state is undefined.');
            if (typeof amt !== 'number')
                throw new CLIError(amt+' is not a number.');
            // parseArgs requires obj to be a valid constructor in order to get named params
            if (!(obj && (obj.prototype instanceof objects.GameObject)))
                throw new CLIError('"'+objStr+'" is not defined as a GameObject in objects.js');

            args = parseArgs(objStr, argStr);
            if (args.length !== obj.length)
                throw new CLIError('the arguments "'+args.toString()+'" do not match the requirements for the constructor ' + obj.name);

            _(amt).times(function() {
                // re-parse args to retrigger defaults()
                args = parseArgs(objStr, argStr);
                // Create a temporary constructor in order to apply array of args to new obj
                var newObj = Object.create(obj.prototype);
                var ctor = obj.apply(newObj, args);
                st.add(ctor || newObj);
            });
        },
        't': function(time) {
            bpm.player.currentQuest.eventHandler.triggerEvent('cliEvent', Number(time));
        }
    };

    /* Default constructor parameters
        * ** Rely on parseArgs to call this.
        * describe what the command should do if no additional args are provided
            * for example, if 'spawn 10 Bubble' is called, Bubble's
            * armor, x, y, and angle properties need to be defined here */
    var defaults = function(objStr) {
        // (this is a function so we can use random values and other fns)
        var gfx = require('gfx');
        return {
            // Use arrays instead of objects so we can maintain order
            'Bubble': [
                ['armor', 'x', 'y', 'angle'],
                [0, randomRange(32, gfx.width-32), randomRange(-320, -32), Math.random() * 360]
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
            throw new CLIError('InvalidArgument: default not defined; '+
                'named arguments are only supported with defined defaults in cli.js');

        // get the names of the constructor's parameters to compare with args and def
        // >>>>>>>>> these regexes are beastly - check here first if any argument parsing bugs appear in the CLI <<<<<<<<<
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
        var validCommand = /(?:(\w+)[:|=])?([+|-]?\w+)/;
        var kwStart = false;

        _(argArr).each(function(opt, i) {
            var matches = opt.match(validCommand);
            if (matches) {
                var kw = matches[1];
                var arg = matches[2];

                if (kw) kwStart = true;
                if (!kw && kwStart)
                    throw new CLIError('InvalidArguments: Positional arguments found after named arguments.');
                if (!kw) kw = i;

                parsed[0].push(kw);
                parsed[1].push(arg);
            }
        });

        return parsed;
    };

    /* Custom CLI error handling
        * message: String or Array (default: CLIError: Unknown Error); 
        * arguments: command, args */
    function CLIError(message) {
        this.message = message || 'Unknown Error';
        this.command = _(arguments).tail(1).join(' ');
    }
    CLIError.prototype = Object.create(Error);
    CLIError.prototype.constructor = CLIError;
    CLIError.prototype.toString = function() {
        var label = 'CLIError: ';
        if (this.command)
            label += 'CLI('+this.command+') > ';

        return label + this.message;
    };

    /* Calls a space delimited command from a command defined in commands
        * format: CLI('<command> <arguments>', this) */
    function CLI(commandWithArgs, context) {
        var parsed = commandWithArgs.split(' ');
        var command = parsed[0];
        var args = _(parsed).tail();

        if (typeof commands[command] === 'function')
            return commands[command].apply(context, args);
        else
            throw new CLIError('Command "' + command + '" not found.');
    }

    return CLI;
});
