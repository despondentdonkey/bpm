define(['objects', 'res', 'gfx', 'input'], function(objects, res, gfx, input) {

    var GameObject = objects.GameObject;

    var Test = createClass(GameObject, function(w, h) {
        this.width = w;
        this.height = h;
    }, {
        init: function(state) {
            GameObject.prototype.init.call(this, state);

            this.up = new gfx.NineSlice(res.slices.buttonUp);
            this.up.width = this.width;
            this.up.height = this.height;
            this.up.update();
            this.up.depth = -9;
            this.addDisplay(this.up);

            this.status = 'up';
        },

        update: function(delta) {
            GameObject.prototype.update.call(this, delta);

            var isHovering = input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);

            if (isHovering) {
                if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                    this.status = 'down';
                }

                if (this.status === 'upactive') {
                    this.status = 'down';
                }

                if (this.status !== 'down') {
                    this.status = 'hover';
                }
            } else {
                if (this.status === 'down' || this.status === 'upactive') {
                    this.status = 'upactive';
                } else {
                    this.status = 'up';
                }
            }

            if (input.mouse.isReleased(input.MOUSE_LEFT)) {
                this.status = isHovering ? 'hover' : 'up';
            }
        },
    });

    return {
        Test: Test,
    };
});
