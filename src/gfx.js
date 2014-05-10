define(['lib/pixi'], function(pixi) {
    function init(width, height, parent) {
        this.width = width;
        this.height = height;
        this.stage = new pixi.Stage(0x505050);
        this.renderer = pixi.autoDetectRenderer(this.width, this.height);

        // Custom depth property for pixi display objects.
        var gfx = this;
        Object.defineProperty(pixi.DisplayObject.prototype, 'depth', {
            get: function() { return this._bpmDepth; },
            set: function(val) {
                this._bpmDepth = val;
                gfx.sortDisplays();
            },
        });

        this.renderer.view.tabIndex = 0;
        if (parent) {
            parent.appendChild(this.renderer.view);
        } else {
            document.body.appendChild(this.renderer.view);
        }
        this.renderer.view.focus();
    }

    var depthComparator = function(a, b) {
        var aDepth = a.depth ? a.depth : 0;
        var bDepth = b.depth ? b.depth : 0;
        return bDepth - aDepth;
    };

    function sortDisplays(container) {
        if (container) {
            container.children.sort(depthComparator);
        } else {
            this.stage.children.sort(depthComparator);
        }
    }

    function render() {
        this.renderer.render(this.stage);
    }

    return {
        init: init,
        sortDisplays: sortDisplays,
        render: render,
        pixi: pixi
    };
});
