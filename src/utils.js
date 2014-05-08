function inherit(Sub, Base) {
    Sub.prototype = new Base();
    Sub.prototype.constructor = Sub;
}

function randomRange(min, max) {
    return min + (Math.random() * ((max - min) + 1));
}
