var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;

function createClass(Base, def, props) {
    if (_.isNull(Base))
        Base = function() {};

    function Subclass() {
        Base.apply(this, arguments);
        def.apply(this, arguments);
    }

    Subclass.prototype = _.extend(Object.create(Base.prototype), props);
    Subclass.prototype.constructor = def;
    if (def.name !== "")
        Subclass.prototype.className = def.name;

    return Subclass;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Error Handling

function error(message, trace) {
    if (trace)
        console.trace();
    throw new Error('BPM2 -- Error > ' + message);
}

//function typeError

function warn(trace, message) {
    // wrapper for console.warn
    // can use to track bugs during alpha, beta, into prod
    console.warn.apply(console, _BPMSetupLogMessage('Warning', trace, message, arguments));
    if (trace === true)
        console.trace();
}

function log(trace, message) {
    console.log.apply(console, _BPMSetupLogMessage('Message', trace, message, arguments));
    if (trace === true)
        console.trace();
}

function _BPMSetupLogMessage(type, trace, message, args) {
    var finalMessage = message;
    var i = (trace === true) ? 1 : 0;

    var arr = ['BPM '+type+' >>', _.tail(args, i)];

    return _.flatten(arr, true);
}
