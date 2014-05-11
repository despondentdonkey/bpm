var dbg = {};

dbg.addStateButtons = function(bpm, states, parent) {
    var div = document.createElement('div');
    div.style.width   = '220px';
    div.style.padding = '5px';

    for (var key in states) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = key;
        button.style.width = div.style.width;

        (function(state) {
            button.onclick = function() {
                bpm.setState(new state());
            };
        })(states[key]);

        div.appendChild(button);
    }

    document.getElementById('stateButtons').appendChild(div);
};
