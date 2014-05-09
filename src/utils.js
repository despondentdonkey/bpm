function inherit(Sub, Base) {
    Sub.prototype = Object.create(Base.prototype);
    Sub.prototype.constructor = Sub;
}

function randomRange(min, max) {
    return min + (Math.random() * ((max - min) + 1));
}
