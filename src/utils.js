function inherit(Sub, Base) {
    Sub.prototype = new Base();
    Sub.prototype.constructor = Sub;
}
