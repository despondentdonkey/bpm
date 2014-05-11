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

dbg.fpsMonitorInit = false;
dbg.fpsMonitor = function(gfx, time, state) {
    if (!dbg.fpsMonitorInit) {
        dbg.fpsMonitorText = new gfx.pixi.Text('0', {
            stroke: 'black',
            strokeThickness: 4,
            fill: 'white',
        });

        var text = dbg.fpsMonitorText;

        text.y = gfx.height - text.height;
        text.depth = -10;

        state.addDisplay(text);
        dbg.fpsMonitorInit = true;
    }
    dbg.fpsMonitorText.setText(time.fps);
};
