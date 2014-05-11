var dbg = {};

dbg.addStateButtons = function(states) {
    var div = document.createElement('div');
    div.style.width   = '220px';
    div.style.padding = '5px';

    for (var key in states) {
        if (states[key] && states[key].name === 'Subclass') {
            var button = document.createElement('input');
            button.type = 'button';
            button.value = key;
            button.style.width = div.style.width;

            (function(state) {
                button.onclick = function() {
                    states.setState(new state());
                };
            })(states[key]);

            div.appendChild(button);
        }
    }

    document.getElementById('stateButtons').appendChild(div);
};

var display, last, text;
dbg.fpsMonitor = function(gfx, time, state) {
    if (!display || (_.isNumber(last) && last !== time.fps)) {
        text = new gfx.pixi.Text(time.fps, {
            stroke: 'black',
            strokeThickness: 4,
            fill: 'white',
        });

        last = time.fps;
        if (display)
            state.removeDisplay(display);
        display = state.addDisplay(text);
    }
};
