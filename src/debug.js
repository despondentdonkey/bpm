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

dbg.addCheats = function(bpm) {
    var div = document.createElement('div');
    var box = document.createElement('input');

    div.style.width   = '220px';
    div.style.padding = '5px';

    box.type = 'textbox';
    box.placeholder = 'e.g. pins=100';
    box.style.width = div.style.width;
    box.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) { // Enter key
            eval('bpm.player.' + box.value);
        }
    });
    div.appendChild(box);

    function cheat(evalString, displayString) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = displayString || evalString;
        button.style.width = div.style.width;
        button.addEventListener('click', function() {
            eval(evalString);
        });
        div.appendChild(button);
    }

    cheat('bpm.player.pins=10000');
    cheat('bpm.player.pins=10');
    cheat('bpm.player.pins=0');
    cheat('dbg.fpsMonitorShow=!dbg.fpsMonitorShow', 'Toggle FPS Monitor');
    cheat("bpm.player.currentWeapon='pinshooter'", 'pinshooter');
    cheat("bpm.player.currentWeapon='shotgun'", 'shotgun');
    cheat("bpm.player.currentWeapon='rifle'", 'rifle');

    document.getElementById('bpmCheats').appendChild(div);
};

dbg.fpsMonitorInit = false;
dbg.fpsMonitorShow = true;
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

        gfx.stage.addChild(text);
        dbg.fpsMonitorInit = true;
    }

    if (dbg.fpsMonitorShow) {
        dbg.fpsMonitorText.visible = true;
        dbg.fpsMonitorText.setText(time.fps + ' | ' + time.delta);
    } else {
        dbg.fpsMonitorText.visible = false;
    }
};
