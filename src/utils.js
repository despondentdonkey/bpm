function inherit(sub, base) {
    sub.prototype = Object.create(base.prototype);
    sub.prototype.constructor = sub;
}
