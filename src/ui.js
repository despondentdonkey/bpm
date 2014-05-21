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
                if (this.status === 'down') {
                    if (this.onRelease) {
                        this.onRelease();
                    }
                }
                this.status = isHovering ? 'hover' : 'up';
            }
        },
    });

    var Button = createClass(BasicButton, function(text, x, y, onRelease) {
        BasicButton.call(this, x, y, 0, 0);

        this.text = text;
        this.textIndent = 5; // How much the text should indent when clicked.

        this.padding = 5;
        this.onRelease = onRelease;

        this.textStyle = {
            stroke: 'black',
            strokeThickness: 3,
            fill: 'white',
            align: 'center',
        };
    }, {
        init: function(state) {
            BasicButton.prototype.init.call(this, state);

            this.displayText = new gfx.pixi.Text(this.text, this.textStyle);
            this.displayText.depth = -10;
            this.displayText.x = this.x + this.padding/2;
            this.displayText.y = this.y + this.padding/2;
            this.addDisplay(this.displayText);

            this.width = this.displayText.width + this.padding;
            this.height = this.displayText.height + this.padding;

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
            this.down.visible = false;

            this.addDisplay(this.up);
            this.addDisplay(this.down);

            this.current = this.up;

            this.updateDisplayProperties([this.up, this.down]);
            this.syncDisplayProperties = false;
        },

        update: function(delta) {
            BasicButton.prototype.update.call(this, delta);

            switch (this.status) {
                case 'up':
                case 'upactive':
                case 'hover': {
                    if (this.current !== this.up) {
                        this.setCurrent(this.up);
                        this.displayText.x -= this.textIndent;
                        this.displayText.y -= this.textIndent;
                    }
                    break;
                }
                case 'down': {
                    if (this.current !== this.down) {
                        this.setCurrent(this.down);
                        this.displayText.x += this.textIndent;
                        this.displayText.y += this.textIndent;
                    }
                    break;
                }
            }
        },

        setCurrent: function(obj) {
            this.current.visible = false;
            obj.visible = true;
            this.current = obj;
        },
    });

    return {
        Button: Button,
    };
});
