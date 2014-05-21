define(['objects', 'res', 'gfx', 'input'], function(objects, res, gfx, input) {

    var GameObject = objects.GameObject;

    var BasicButton = createClass(GameObject, function(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.status = 'up';
    }, {
        init: function(state) {
            GameObject.prototype.init.call(this, state);
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

    var Button = createClass(BasicButton, function(x, y, w, h) {
    }, {
        init: function(state) {
            BasicButton.prototype.init.call(this, state);

            this.up = new gfx.NineSlice(res.slices.buttonUp);
            this.up.width = this.width;
            this.up.height = this.height;
            this.up.update();
            this.up.depth = -9;

            this.down = new gfx.NineSlice(res.slices.buttonDown);
            this.down.width = this.width;
            this.down.height = this.height;
            this.down.update();
            this.down.depth = -9;

            this.current = this.up;
            this.addDisplay(this.current);
        },

        update: function(delta) {
            BasicButton.prototype.update.call(this, delta);

            switch (this.status) {
                case 'up':
                case 'upactive':
                case 'hover': {
                    if (this.current !== this.up) {
                        this.setCurrent(this.up);
                    }
                    break;
                }
                case 'down': {
                    if (this.current !== this.down) {
                        this.setCurrent(this.down);
                    }
                    break;
                }
            }
        },

        setCurrent: function(obj) {
            this.removeDisplay(this.current);
            this.updateDisplayProperties([obj]);
            this.current = this.addDisplay(obj);
        },
    });

    return {
        Button: Button,
    };
});
