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


dbg.FPS = createClass(null, function(state) {
    this.state = state;
    this.last = 0;
    this.text = new this.gfx.pixi.Text('', {
        stroke: 'black',
        strokeThickness: 4,
        fill: 'white',
    });
    this.display = state.addDisplay(this.text);
    this.text.y = this.gfx.height - this.text.height;
}, {
    update: function() {
        if (this.last !== time.fps) {
            this.text.setText(time.fps);
            last = time.fps;
        }
    }
});
