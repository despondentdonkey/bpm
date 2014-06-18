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
            this.excludeRect = input.mouse.addUiExclusionArea(this.x, this.y, this.width, this.height);
        },

        destroy: function(state) {
            GameObject.prototype.destroy.call(this, state);
            input.mouse.removeUiExclusionArea(this.excludeRect);
        },

        update: function(delta) {
            GameObject.prototype.update.call(this, delta);

            if (this.status === 'disabled') return;

            // Disable exclusion areas while ui uses input methods. Enable at the end of update.
            input.mouse.disableUi = false;

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

            input.mouse.disableUi = true;
        },
    });

    var Button = createClass(BasicButton, function(text, style, onRelease, context) {
        BasicButton.call(this, 0, 0, 0, 0);

        this.onRelease = context ? _.bind(onRelease, context) : onRelease;

        // Text
        this.text = text;
        this.textIndent = 5; // How much the text should indent when clicked.
        this.padding = 5;

        this.displayText = new gfx.pixi.Text(this.text, _.defaults(style, {
            stroke: 'black',
            strokeThickness: 3,
            fill: 'white',
            align: 'center',
            font: 'bold 16px arial',
        }));
        this.displayText.depth = gfx.layers.gui;

        // Dimensions
        this.width = this.displayText.width + this.padding;
        this.height = this.displayText.height + this.padding;

        // Nineslices
        this.up = new gfx.NineSlice(res.slices.buttonUp);
        this.up.width = this.width;
        this.up.height = this.height;
        this.up.update();
        this.up.depth = gfx.layers.gui + 1;

        this.down = new gfx.NineSlice(res.slices.buttonDown);
        this.down.width = this.width;
        this.down.height = this.height;
        this.down.update();
        this.down.depth = this.up.depth;
        this.down.visible = false;

        this.disabled = new gfx.NineSlice(res.slices.buttonDisabled);
        this.disabled.width = this.width;
        this.disabled.height = this.height;
        this.disabled.update();
        this.disabled.depth = this.up.depth;
        this.disabled.visible = false;

    }, {
        init: function(state) {
            BasicButton.prototype.init.call(this, state);

            this.addDisplay(this.displayText);
            this.addDisplay(this.up);
            this.addDisplay(this.down);
            this.addDisplay(this.disabled);

            this.current = this.up;

            this.updateDisplayProperties([this.up, this.down, this.disabled]);
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
                    }
                    break;
                }
                case 'down': {
                    if (this.current !== this.down) {
                        this.setCurrent(this.down);
                    }
                    break;
                }
                case 'disabled': {
                    if (this.current !== this.disabled) {
                        this.setCurrent(this.disabled);
                    }
                    break;
                }
            }

            this.displayText.x = this.x + this.padding/2;
            this.displayText.y = this.y + this.padding/2;
        },

        setCurrent: function(obj) {
            this.current.visible = false;
            obj.visible = true;
            this.current = obj;
        },

        setPos: function(x, y) {
            this.x = x;
            this.y = y;
        }
    });

    // w, h optional. If w is specified then word wrap will be enabled to that length.
    var TextField = createClass(GameObject, function(text, x, y, w, h) {
        this._text = text;
        this.x = x;
        this.y = y;

        this.width = w;
        this.height = h;

        this.padding = 5;

        var wordWrapWidth = w;
        this.textStyle = {
            stroke: 'black',
            strokeThickness: 3,
            fill: 'white',
            align: 'left',
            font: 'bold 18px arial',
            wordWrap: (wordWrapWidth !== undefined),
            wordWrapWidth: wordWrapWidth,
        };

        this.displayText = new gfx.pixi.Text(text, this.textStyle);

        Object.defineProperty(this, 'text', {
            get: function() { return this._text; },
            set: function(val) {
                this._text = val;
                this.displayText.setText(val);
            },
        });
    }, {
        init: function(state) {
            GameObject.prototype.init.call(this, state);

            this.displayText.depth = -10;
            this.displayText.x = this.x + this.padding/2;
            this.displayText.y = this.y + this.padding/2;

            this.width = (this.width || this.displayText.width) + this.padding;
            this.height = (this.height || this.displayText.height) + this.padding;

            this.back = new gfx.NineSlice(res.slices.textBox);
            this.back.width = this.width;
            this.back.height = this.height;
            this.back.update();
            this.back.depth = -9;

            this.addDisplay(this.back);
            this.addDisplay(this.displayText);

            this.updateDisplayProperties([this.back]);
            this.syncDisplayProperties = false;
        },
    });

    var FloatText = createClass(GameObject, function(text, textOptions) {
        this.displayText = new gfx.pixi.Text(text, _.defaults(textOptions || {}, {
            stroke: 'black',
            strokeThickness: 3,
            fill: 'white',
            align: 'left',
            font: 'bold 18px arial',
        }));
        this.displayText.depth = gfx.layers.gui;
    }, {
        init: function(state) {
            GameObject.prototype.init.call(this, state);

            this.addDisplay(this.displayText);

            var timer = new objects.Timer(1000, 'oneshot', _.bind(function() {
                this.state.remove(this);
            }, this));
            timer.onTick = _.bind(function(ratio) {
                this.y -= 0.1;
                this.displayText.alpha = Math.sqrt(1-ratio) * 1.5;
            }, this);
            this.state.add(timer);
        },
    });

    return {
        Button: Button,
        TextField: TextField,
        FloatText: FloatText,
    };
});
