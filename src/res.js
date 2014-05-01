define(function() {
    function load(onComplete) {
        this.loader = LODE.createLoader();

        this.bubble = this.loader.loadImage('res/bubble.png');

        this.loader.load(onComplete);
    }

    return {
        load: load,
    };
});
