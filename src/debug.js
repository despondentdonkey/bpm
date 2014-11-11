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

dbg.addCheats = function(bpm, states) {
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

    function section(displayString) {
        var button = document.createElement('span');
        button.innerHTML = displayString;
        div.appendChild(button);
    }

    cheat("bpm.saveData(); console.log('data', localStorage)", 'Save Game');
    cheat("bpm.loadData(); console.log('data', localStorage); console.log('player', bpm.player)", 'Load Game');
    cheat("bpm.clearData(); console.log('data', localStorage)", 'Clear Game Data');
    section('Weapons');
    cheat("states.global.current.setWeapon('PinShooter')", 'PinShooter');
    cheat("states.global.current.setWeapon('Shotgun')", 'Shotgun');
    cheat("states.global.current.setWeapon('Rifle')", 'Rifle');
    section('Elements');
    cheat("bpm.player.currentElement = 'fire'", 'Fire');
    cheat("bpm.player.currentElement = 'lightning'", 'Lightning');
    cheat("bpm.player.currentElement = 'ice'", 'Ice');
    section('Other');
    cheat('dbg.fpsMonitorShow=!dbg.fpsMonitorShow', 'Toggle FPS Monitor');
    cheat("bpm.player.money += 10000");
    section('Cutscenes');
    cheat("states.global.current.showCutscene('testCutscene')", 'Test');

    document.getElementById('bpmCheats').appendChild(div);
};

dbg.addCLI = function(CLI) {
    CLI = CLI || window.CLI;
    var cliInput = document.getElementById('cliElement');
    var commandHistory = [];
    var lastCommandIndex = 0;
    cliInput.addEventListener('keydown', function(e) {
        if (e.keyCode === 9) { // Tab
            document.getElementsByTagName('canvas')[0].focus();
        }
        if (e.keyCode === 38) { // Up arrow
            if (lastCommandIndex > 0) lastCommandIndex--;
            cliInput.value = commandHistory[lastCommandIndex];
        }
        if (e.keyCode === 40) { // Down arrow
            if (lastCommandIndex < commandHistory.length-1) lastCommandIndex++;
            cliInput.value = commandHistory[lastCommandIndex];
        }
        if (CLI && e.keyCode === 13) { // Enter key
            commandHistory.push(cliInput.value);
            lastCommandIndex = commandHistory.length;
            CLI(cliInput.value);
            cliInput.value = "";
        }
    });
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


// Runs a function with provided args, logs time it took to run to console
dbg.perfTest = function(context, name, func) {
    if (!window.performance)
        throw new Error('dbg.performance: window.performance not defined.');

    var t0 = window.performance.now();
    var ret = func.apply(context, _(arguments).tail(3));
    var t1 = window.performance.now();
    console.log('Performance Debug: ' + name + ' took ' + (t1 - t0) + 'ms to run');
    return ret;
}

// Purchases the first upgrade level for all upgrades.
dbg.buyFirstUpgrades = function(upgrades) {
    for (var i=0; i<upgrades.all.length; ++i) {
        var upgrade = upgrades.all[i];
        upgrade.increaseLevel();
    }
}

// Maxes out all upgrades.
dbg.buyAllUpgrades = function(upgrades) {
    for (var i=0; i<upgrades.all.length; ++i) {
        var upgrade = upgrades.all[i];
        upgrade.enable();
        upgrade.setLevel(upgrade.length);
    }
}
