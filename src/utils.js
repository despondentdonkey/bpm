var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function applyDecimal(number, n, func) {
    var inflate = Math.pow(10, n);
    var deflate = Math.pow(10, -n);
    return func(number * inflate) * deflate;
}

function roundN(number, n) {
    return applyDecimal(number, n, Math.round);
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
