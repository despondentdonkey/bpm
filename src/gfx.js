define(function() {
    function init(width, height) {
        this.width = width;
        this.height = height;
        this.stage = new PIXI.Stage(0x505050);
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height);

        this.renderer.view.tabIndex = 0;
        document.body.appendChild(this.renderer.view);
        this.renderer.view.focus();
    }

    function render() {
        this.renderer.render(this.stage);
    }

    return {
        init: init,
        render: render,
    };
});
