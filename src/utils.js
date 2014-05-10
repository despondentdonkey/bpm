function inherit(Sub, Base) {
    Sub.prototype = Object.create(Base.prototype);
    Sub.prototype.constructor = Sub;
}

function createClass(Base, def, props) {
    if (_.isNull(Base))
        Base = function() {};

    function Sub() {
        Base.call(this);
        def.call(this, Base.prototype);
    }

    Sub.prototype = _.extend(Object.create(Base.prototype), props);
    Sub.prototype.constructor = def;

    return Sub;
}

function randomRange(min, max) {
    return min + (Math.random() * ((max - min) + 1));
}
