define(['objects', 'res', 'gfx', 'input'], function(objects, res, gfx, input) {

    var GameObject = objects.GameObject;

    var UiObject = function() {
        GameObject.call(this);
        this._relativeX = 0;
        this._relativeY = 0;
        this.relativeToParent = true;
        this.enableUiExclusionAreas = false;
    };
        UiObject.prototype = Object.create(GameObject.prototype);
        UiObject.prototype.constructor = UiObject;

        UiObject.prototype.init = function(state) {
            GameObject.prototype.init.call(this, state);
            this.updateUiExclusionArea();
        };

        UiObject.prototype.destroy = function(state) {
            GameObject.prototype.destroy.call(this, state);
            input.mouse.removeUiExclusionArea(this.excludeRect);
        };

        UiObject.prototype.update = function(delta) {
            GameObject.prototype.update.call(this, delta);

            if (this.disabled) return;

            // Disable exclusion areas while ui uses input methods. Enable at the end of update.
            if (this.enableUiExclusionAreas) {
                input.mouse.disableUi = false;
            }

            this.inputUpdate(delta);

            input.mouse.disableUi = true;
        };

        // Called during update when exclusion areas are disabled. This is where input handling should go.
        UiObject.prototype.inputUpdate = function(delta) {};

        // Sets positions relative to parent
        UiObject.prototype.setUiPos = function(x, y) {
            var parentX = 0, parentY = 0;
            if (this.relativeToParent && this.parent) {
                var parentPos = this.parent.getScreenPos();
                parentX = parentPos.x;
                parentY = parentPos.y;
            }

            this.x = parentX + x;
            this.y = parentY + y;
            this._relativeX = x;
            this._relativeY = y;

            for (var i=0; i<this.children.length; ++i) {
                this.children[i].updateUiPos();
            }

            this.updateUiExclusionArea();

            this.triggerEvent('onUiPosChanged');
        };

        // Gets position relative to parent.
        UiObject.prototype.getRelativePos = function() {
            return {
                x: this._relativeX,
                y: this._relativeY,
            };
        };

        // Gets the position this object should appear on screen. (parent pos + relative pos)
        UiObject.prototype.getScreenPos = function() {
            var parentX = 0, parentY = 0;
            if (this.relativeToParent && this.parent) {
                var parentPos = this.parent.getScreenPos();
                parentX = parentPos.x;
                parentY = parentPos.y;
            }

            return new Point(parentX + this._relativeX, parentY + this._relativeY);
        };

        // Updates screen position (x, y). Used when a parent's position has changed.
        UiObject.prototype.updateUiPos = function() {
            this.setUiPos(this._relativeX, this._relativeY);
        };

        UiObject.prototype.addChild = function(object) {
            objects.BasicObject.prototype.addChild.call(this, object);
            object.updateUiPos();
        };

        // Removes current exclusion rectangle then adds a new one with the current x,y and width, height.
        UiObject.prototype.updateUiExclusionArea = function(object) {
            if (this.enableUiExclusionAreas) {
                if (this.excludeRect) {
                    input.mouse.removeUiExclusionArea(this.excludeRect);
                }
                this.excludeRect = input.mouse.addUiExclusionArea(this.x, this.y, this.width, this.height);
            }
        };

    var BasicButton = function(x, y, w, h) {
        UiObject.call(this);
        this.setUiPos(x, y);
        this.width = w;
        this.height = h;
        this.status = 'up';
        this.enableUiExclusionAreas = true;
    };
        BasicButton.prototype = Object.create(UiObject.prototype);
        BasicButton.prototype.constructor = BasicButton;

        BasicButton.prototype.inputUpdate = function(delta) {
            var isHovering = input.mouse.isColliding(this.x, this.y, this.x+this.width, this.y+this.height);

            if (isHovering) {
                if (input.mouse.isPressed(input.MOUSE_LEFT)) {
                    this.status = 'down';
                    if (this.onInitialClick) {
                        this.onInitialClick();
                    }
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
        };

        BasicButton.prototype.enable = function() {
            this.disabled = false;
        };

        BasicButton.prototype.disable = function() {
            this.disabled = true;
        };

    var Button = function(text, style, onRelease, context) {
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

        this.disabledSlice = new gfx.NineSlice(res.slices.buttonDisabled);
        this.disabledSlice.width = this.width;
        this.disabledSlice.height = this.height;
        this.disabledSlice.update();
        this.disabledSlice.depth = this.up.depth;
        this.disabledSlice.visible = false;

        this.addListener('onUiPosChanged', function() {
            this.displayText.x = this.x + this.padding/2;
            this.displayText.y = this.y + this.padding/2;
            this.up.x = this.x;
            this.up.y = this.y;
            this.down.x = this.x;
            this.down.y = this.y;
            this.disabledSlice.x = this.x;
            this.disabledSlice.y = this.y;
        });
    };
        Button.prototype = Object.create(BasicButton.prototype);
        Button.prototype.constructor = Button;

        Button.prototype.init = function(state) {
            BasicButton.prototype.init.call(this, state);

            this.addDisplay(this.displayText);
            this.addDisplay(this.up);
            this.addDisplay(this.down);
            this.addDisplay(this.disabledSlice);

            this.current = this.up;

            this.updateDisplayProperties([this.up, this.down, this.disabledSlice]);
            this.syncDisplayProperties = false;
        };

        Button.prototype.update = function(delta) {
            BasicButton.prototype.update.call(this, delta);

            // depth is sometimes undefined for some reason!?
            // seems to be a problem when adding this to a scroll field.
            if (!this.displayText.depth) {
                this.displayText.depth = gfx.layers.gui;
            }

            if (this.disabled) {
                if (this.current !== this.disabledSlice) {
                    this.setCurrent(this.disabledSlice);
                }
                return;
            }

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
        };

        Button.prototype.setCurrent = function(obj) {
            this.current.visible = false;
            obj.visible = true;
            this.current = obj;
        };

    // w, h optional. If w is specified then word wrap will be enabled to that length.
    var TextField = function(text, x, y, w, h) {
        UiObject.call(this);
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
            wordWrapWidth: wordWrapWidth - this.padding,
        };

        this.displayText = new gfx.pixi.Text(text, this.textStyle);

        Object.defineProperty(this, 'text', {
            get: function() { return this._text; },
            set: function(val) {
                this._text = val;
                this.displayText.setText(val);
            },
        });
    };
        TextField.prototype = Object.create(UiObject.prototype);
        TextField.prototype.constructor = TextField;

        TextField.prototype.init = function(state) {
            UiObject.prototype.init.call(this, state);

            this.displayText.depth = -10;
            this.displayText.x = this.x + this.padding;
            this.displayText.y = this.y + this.padding;

            this.back = new gfx.NineSlice(res.slices.textBox);
            this.back.width = this.width - this.back.sprites.right.width;
            this.back.height = this.height - this.back.sprites.bottom.height;
            this.back.update();
            this.back.depth = -9;

            this.addDisplay(this.back);
            this.addDisplay(this.displayText);

            this.updateDisplayProperties([this.back]);
            this.syncDisplayProperties = false;
        };

    var FloatText = function(text, textOptions) {
        UiObject.call(this);
        this.displayText = new gfx.pixi.Text(text, _.defaults(textOptions || {}, {
            stroke: 'black',
            strokeThickness: 3,
            fill: 'white',
            align: 'left',
            font: 'bold 18px arial',
        }));
        this.displayText.depth = gfx.layers.gui;
    };
        FloatText.prototype = Object.create(UiObject.prototype);
        FloatText.prototype.constructor = FloatText;

        FloatText.prototype.init = function(state) {
            UiObject.prototype.init.call(this, state);

            this.addDisplay(this.displayText);

            var timer = new objects.Timer(1000, 'oneshot', _.bind(function() {
                this.state.remove(this);
            }, this));
            timer.onTick = _.bind(function(ratio) {
                this.y -= 0.1;
                this.displayText.alpha = Math.sqrt(1-ratio) * 1.5;
            }, this);
            this.state.add(timer);
        };

    var StatusBar = function StatusBar(back, front, width, height) {
        UiObject.call(this);
        this.backSliceTextures = back;
        this.frontSliceTextures = front;
        this.width = width;
        this.height = height;

        Object.defineProperty(this, 'depth', {
            get: function() { return this._depth },
            set: function(val) {
                this._depth = val;
                this.updateDepth = true;
            },
        });
    };
        StatusBar.prototype = Object.create(UiObject.prototype);
        StatusBar.prototype.constructor = StatusBar;

        StatusBar.prototype.init = function(state) {
            UiObject.prototype.init.call(this, state);
            this.backSlice = new gfx.NineSlice(this.backSliceTextures);
            this.frontSlice = new gfx.NineSlice(this.frontSliceTextures);

            this.backSlice.depth = this.depth+1;
            this.frontSlice.depth = this.depth;

            this.backSlice.width = this.width;
            this.backSlice.height = this.height;

            this.frontSlice.width = this.width;
            this.frontSlice.height = this.height;

            this.addDisplay(this.backSlice);
            this.addDisplay(this.frontSlice);

            this.frontSlice.update();
            this.backSlice.update();
        };

        StatusBar.prototype.setRatio = function(ratio) {
            this.ratio = ratio;
            this.updateRatio = true;
        };

        StatusBar.prototype.update = function(delta) {
            UiObject.prototype.update.call(this, delta);

            if (this.updateDepth) {
                this.backSlice.depth = this.depth+1;
                this.frontSlice.depth = this.depth;
                this.updateDepth = false;
            }

            if (this.updateRatio) {
                this.frontSlice.width = this.ratio * this.width;

                this.frontSlice.update();
                this.backSlice.update();

                if (this.ratio <= 0.05) { // A slight offset, when the ratio is too small it gets ugly.
                    this.frontSlice.visible = false;
                } else if (!this.frontSlice.visible) {
                    this.frontSlice.visible = true;
                }
                this.updateRatio = false;
            }
        };

    var ScrollField = function ScrollField(x, y, width, height) {
        UiObject.call(this);
        this.setUiPos(x, y);
        this.width = width;
        this.height = height;

        this.initialX = x;
        this.initialY = y;

        this.initialClickY = 0; // Where the y position was since last click.
        this.scrollPos = 0; // Current position of the scroll.
        this.prevScrollPos = 0; // Position of the scroll since last click.

        this.clipRect = new Rect(this.initialX, this.initialY, this.width, this.height); // Dimensions of the clipping rectangle.
    };
        ScrollField.prototype = Object.create(UiObject.prototype);
        ScrollField.prototype.constructor = ScrollField;

        ScrollField.prototype.init = function(state) {
            UiObject.prototype.init.call(this, state);

            // Create clipping mask.
            var mask = new gfx.pixi.Graphics();
            mask.beginFill();
            mask.drawRect(this.clipRect.x, this.clipRect.y, this.clipRect.w, this.clipRect.h);
            mask.endFill();

            // A button for the main scroll area.
            this.clipButton = new BasicButton(this.clipRect.x, this.clipRect.y, this.clipRect.w, this.clipRect.h);
            this.clipButton.relativeToParent = false;
            this.clipButton.onInitialClick = _.bind(function() {
                this.initialClickY = input.mouse.y;
                this.prevScrollPos = this.scrollPos;
            }, this);
            this.addChild(this.clipButton);

            // Set mask, depth for all displays including displays from children.
            var allDisplays = this.getNestedDisplayObjects();
            for (var i=0; i<allDisplays.length; ++i) {
                var display = allDisplays[i];
                display.mask = mask;
                display.depth = this.depth;
            }

            this.calcScrollHeight();

            if (this.scrollHeight > 0) {
                var pos = this.getScreenPos();

                // Dimensions of the scroll bar.
                this.scrollBarRect = new Rect(
                    pos.x + this.width + 8,
                    pos.y + 16,
                    16,
                    this.height - 16
                );

                // The scroll bar background.
                var scrollHeightGraphic = new gfx.pixi.Graphics();
                scrollHeightGraphic.beginFill(0xa0a0a0);
                scrollHeightGraphic.drawRect(this.scrollBarRect.x, this.scrollBarRect.y, this.scrollBarRect.w, this.scrollBarRect.h);
                scrollHeightGraphic.endFill();
                scrollHeightGraphic.syncGameObjectProperties = {position: false};
                scrollHeightGraphic.depth = this.depth;
                this.addDisplay(scrollHeightGraphic);

                // The scroller graphic.
                this.scrollGraphic = new gfx.pixi.Graphics();
                this.scrollGraphic.syncGameObjectProperties = {position: false};
                this.scrollGraphic.depth = this.depth;
                this.drawScrollGraphic(0);
                this.addDisplay(this.scrollGraphic);

                // A button for the scroll bar.
                this.scrollButton = new BasicButton(this.scrollBarRect.x, this.scrollBarRect.y, this.scrollBarRect.w, this.scrollBarRect.h);
                this.scrollButton.relativeToParent = false;
                this.addChild(this.scrollButton);
            }

        };

        ScrollField.prototype.inputUpdate = function(delta) {
            if (this.scrollButton) {
                if (this.scrollButton.status === 'down' || this.scrollButton.status === 'upactive') {
                    // ratio of the y mouse position between the top of the scroll field and the bottom.
                    var ratio = (input.mouse.y - this.initialY) / this.height;
                    this.setScrollPos(16 - ratio * this.scrollHeight); // temp - 16 is half of the height of the scrolling graphic
                    return;
                }
            }

            if (this.clipButton.status === 'down' || this.clipButton.status === 'upactive') {
                var preScrollPos = input.mouse.y - this.initialClickY + this.prevScrollPos;
                this.setScrollPos(preScrollPos);
            }
        };

        // Finds the largest vertical object and calculates the scroll height.
        ScrollField.prototype.calcScrollHeight = function() {
            var largestObject = null;

            // Find the largest object (vertically) from the children of the object specified.
            function getLargest(object) {
                for (var i=0; i<object.children.length; ++i) {
                    var child = object.children[i];

                    var y = child.getScreenPos().y;
                    var height = child.height || 0;
                    var sum = y + height;

                    if (largestObject === null || sum > largestObject.getScreenPos().y + largestObject.height) {
                        largestObject = child;
                    }

                    getLargest(child);
                }
            }

            getLargest(this);

            this.scrollHeight = largestObject.getScreenPos().y + largestObject.height - this.height - this.initialY;
        };

        // Draw the scroller graphic to the specified scroll position.
        ScrollField.prototype.drawScrollGraphic = function(scrollPos) {
            this.scrollGraphic.clear();
            this.scrollGraphic.beginFill(0x303030);

            var ratio = -scrollPos / this.scrollHeight;
            var yPos = (ratio * this.height) + 16;
            if (ratio * this.height >= this.height - 48) {
                yPos = this.height - 32;
            }
            this.scrollGraphic.drawRect(this.initialX + this.width + 8, this.initialY + yPos, 16, 32);

            this.scrollGraphic.endFill();
        };

        // Sets the scroll position and updates positions.
        ScrollField.prototype.setScrollPos = function(preScrollPos) {
            if (this.scrollHeight <= 0) return;

            if (-preScrollPos < this.scrollHeight && -preScrollPos > 0) {
                this.scrollPos = preScrollPos;
            } else if (-preScrollPos > this.scrollHeight) {
                this.scrollPos = -this.scrollHeight;
            } else if (-preScrollPos < 0) {
                this.scrollPos = 0;
            }

            var pos = this.getRelativePos();
            this.setUiPos(pos.x, this.scrollPos + this.initialY);

            this.scrollGraphic.clear();
            this.scrollGraphic.beginFill(0x303030);

            this.drawScrollGraphic(this.scrollPos);
        };

    return {
        UiObject: UiObject,
        Button: Button,
        TextField: TextField,
        FloatText: FloatText,
        StatusBar: StatusBar,
        ScrollField: ScrollField
    };
});
