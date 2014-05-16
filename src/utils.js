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

    return Subclass;
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Error Handling

function warn(message) {
    // wrapper for console.warn
    // can use to track bugs during alpha, beta, into prod
    console.warn(message);
}
