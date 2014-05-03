var dbg = {};

dbg.addStateButtons = function(bpm, states) {
    var a = document.createElement('div');
    a.style.display = "inline-block";
    a.style.width = "10px";
    for (var key in states) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = key;
        (function(state) {
            button.onclick = function() {
                bpm.setState(new state());
            };
        })(states[key]);
        a.appendChild(button);
    }
    document.body.appendChild(a);
};
