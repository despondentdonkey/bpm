function inherit(Sub, Base) {
    Sub.prototype = Object.create(Base.prototype);
    Sub.prototype.constructor = Sub;
}

function createClass(Base, Sub, props) {
    if (_.isNull(Base))
        Base = function() {};

    Sub.prototype = _.extend(Object.create(Base.prototype), props);
    Sub.prototype.constructor = Sub;

    return Sub;
}

function randomRange(min, max) {
    return min + (Math.random() * ((max - min) + 1));
}
