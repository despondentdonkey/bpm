var DEG2RAD = Math.PI / 180;
var RAD2DEG = 180 / Math.PI;

function inherit(Sub, Base) {
    Sub.prototype = Object.create(Base.prototype);
    Sub.prototype.constructor = Sub;
}

function createClass(Base, def, props) {
    if (_.isNull(Base))
        Base = function() {};

    function Subclass() {
        Base.apply(this, arguments);
        def.apply(this, arguments);
        this._super = Base.prototype;
    }

    Subclass.prototype = _.extend(Object.create(Base.prototype), props);
    Subclass.prototype.constructor = def;

    return Subclass;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}


function angularSpeed(angle) {
    if (!_.isNumber(angle))
        warn('Non-Number Passed to utils.angularSpeed(int angle)');

    return {x: Math.cos(angle), y: -Math.sin(angle)};
}


// Error Handling

function warn(message) {
    // wrapper for console.warn
    // can use to track bugs during alpha, beta, into prod
    console.warn(message);
}
