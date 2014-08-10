define(function() {
    function createKeyboard() { //tabindex="1" is required in the canvas tag for keyboard use.
        var down = [],
        downCount = 0,

        pressed = [],
        pressedCount = 0,

        released = [],
        releasedCount = 0;

        var onKeyDown = function(e) {
            if (!down[e.which]) {
                down[e.which] = true;
                downCount++;
                pressed[pressedCount] = e.which;
                pressedCount++;
            }
        };

        var onKeyUp = function(e) {
            if (down[e.which]) {
                down[e.which] = false;
                downCount--;
                released[releasedCount] = e.which;
                releasedCount++;
            }
        };

        return {
            attach: function(element) { //Attach an element to this instance to check for key presses.
                element.addEventListener('keydown', onKeyDown);
                element.addEventListener('keyup', onKeyUp);
            },

            update: function() { //This should be called last in your loop.
                while (pressedCount > 0) {
                    pressedCount--;
                    pressed[pressedCount] = -1;
                }

                while (releasedCount > 0) {
                    releasedCount--;
                    released[releasedCount] = -1;
                }
            },

            isDown: function(keys) {
                if (!_.isArray(keys))
                    keys = [keys]

                for (var k = 0; k < keys.length; k++) {
                    var key = keys[k];
                    for (var i = 0; i < down.length; i++) {
                        if (down[(typeof key === "number" ? key : key.charCodeAt(0))]) {
                            return true;
                        }
                    }
                    return false;
                }
            },

            isPressed: function(keys) {
                if (!_.isArray(keys))
                    keys = [keys]

                for (var k = 0; k < keys.length; k++) {
                    var key = keys[k];
                    for (var i = 0; i < pressed.length; i++) {
                        if (pressed[i] === (typeof key === "number" ? key : key.charCodeAt(0))) {
                            return true;
                        }
                    }
                    return false;
                }
            },

            isReleased: function(keys) {
                if (!_.isArray(keys))
                    keys = [keys]

                for (var k = 0; k < keys.length; k++) {
                    var key = keys[k];
                    for (var i = 0; i < released.length; i++) {
                        if (released[i] === (typeof key === "number" ? key : key.charCodeAt(0))) {
                            return true;
                        }
                    }
                }
                return false;
            },
        }
    }

    function createMouse() {
        var down = [],
        downCount = 0,

        pressed = [],
        pressedCount = 0,

        released = [],
        releasedCount = 0,

        layerX = 0,
        layerY = 0;

        var mouseMoving = false;

        var onMouseMove = function(e) {
            layerX = e.layerX;
            layerY = e.layerY;
            mouseMoving = true;
        };

        var onMouseDown = function(e) {
            if (!down[e.which]) {
                down[e.which] = true;
                downCount++;
                pressed[pressedCount] = e.which;
                pressedCount++;
            }
        };

        var onMouseUp = function(e) {
            if (down[e.which]) {
                down[e.which] = false;
                downCount--;
                released[releasedCount] = e.which;
                releasedCount++;
            }
        };

        // Stores a list of rectangles (x,y,w,h) to exclude from input if disableUi is true.
        var uiExclusionAreas = [];

        return {
            x: 0, y: 0,

            // If true then uiExclusions will be active. This should be false when working with ui objects and then true afterwards.
            disableUi: true,

            attach: function(element) { //Attach an element to this instance to check for mouse events.
                element.addEventListener('mousemove', onMouseMove);
                element.addEventListener('mousedown', onMouseDown);
                element.addEventListener('mouseup', onMouseUp);
            },

            update: function() { //This should be called last in your loop.
                while (pressedCount > 0) {
                    pressedCount--;
                    pressed[pressedCount] = -1;
                }

                while (releasedCount > 0) {
                    releasedCount--;
                    released[releasedCount] = -1;
                }

                this.x = layerX;
                this.y = layerY;

                mouseMoving = false;
            },

            getX: function(client) {
                var cl = typeof client !== "undefined" ? client : false;
                if (cl)
                    return pX;
                else
                    return this.x;
            },

            getY: function(client) {
                var cl = typeof client !== "undefined" ? client : false;
                if (cl)
                    return pY;
                else
                    return this.y;
            },

            isDown: function(button) {
                if (this.isInsideUi()) return false;

                for (var i = 0; i < down.length; i++) {
                    if (down[button]) {
                        return true;
                    }
                }
                return false;
            },

            isPressed: function(button) {
                if (this.isInsideUi()) return false;

                for (var i = 0; i < pressed.length; i++) {
                    if (pressed[i] === button) {
                        return true;
                    }
                }
                return false;
            },

            isReleased: function(button) {
                if (this.isInsideUi()) return false;

                for (var i = 0; i < released.length; i++) {
                    if (released[i] === button) {
                        return true;
                    }
                }
                return false;
            },

            isColliding: function(x1, y1, x2, y2) {
                if (this.x >= x1 && this.x <= x2) {
                    if (this.y >= y1 && this.y <= y2) {
                        return true;
                    }
                }
                return false;
            },

            isMoving: function() {
                return mouseMoving;
            },

            // Adds a rectangle to exclude from getting input. Returns rectangle, use to remove from exclusions.
            addUiExclusionArea: function(x, y, w, h) {
                var rect = { x:x, y:y, w:w, h:h };
                uiExclusionAreas.push(rect);
                return rect;
            },

            // Removes a rectangle from the exclusion list, get from addUiExclusionArea.
            removeUiExclusionArea: function(rect) {
                uiExclusionAreas.splice(uiExclusionAreas.indexOf(rect), 1);
            },

            // Returns true if exclusions are enabled and the mouse is inside of an exclusion area.
            isInsideUi: function() {
                if (this.disableUi) {
                    for (var i=0; i<uiExclusionAreas.length; ++i) {
                        var rect = uiExclusionAreas[i];
                        if (this.isColliding(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h)) {
                            return true;
                        }
                    }
                }
                return false;
            },

            print: function() {
                console.log("Mouse Object: x"+this.x+", y"+this.y);
            },
        }
    }

    var key = createKeyboard(), mouse = createMouse();
    function init(element) {
        key.attach(element);
        mouse.attach(element);
    }

    function update() {
        key.update();
        mouse.update();
    }

    return {
        createKeyboard: createKeyboard,
        createMouse: createMouse,

        init: init,
        update: update,
        key: key,
        mouse: mouse,

        //Keyboard codes. For letters and numbers on the keyboard use a string of the capital character.
        BACKSPACE: 8,
        TAB: 9,

        ENTER: 13,

        SHIFT: 16,
        CTRL: 17,
        ALT: 18,

        CAPSLOCK: 20,

        ESCAPE: 27,

        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,

        INSERT: 45,
        DELETE: 46,

        ZERO: 96,
        ONE: 97,
        TWO: 98,
        THREE: 99,
        FOUR: 100,
        FIVE: 101,
        SIX: 102,
        SEVEN: 103,
        EIGHT: 104,
        NINE: 105,

        SEMICOLON: 186,
        EQUAL: 187,
        COMMA: 188,
        DASH: 189,
        PERIOD: 190,
        SLASH: 191,
        GRAVE: 192,

        OPENBRACKET: 219,
        BACKSLASH: 220,
        CLOSEBRACKET: 221,
        QUOTE: 222,

        MOUSE_LEFT: 1,
        MOUSE_MIDDLE: 2,
        MOUSE_RIGHT: 3,
    };
});


