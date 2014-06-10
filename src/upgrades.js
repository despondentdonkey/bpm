define(function() {
    this.abilities = {};

    // Returns the final value of the ability specified.
    this.getVal = function(name) {
        var ab = this.abilities[name];
        var value = ab.values || ab.value;
        if (_.isArray(value)) {
            // Add the values of the array together.
            value = _.reduce(value, function(memo, num) {
                return memo + num;
            }, 0);
        }
        return value;
    };

    this.getValPercent = function(name, increase) {
        return this.getVal(name) * 0.01;
    };

    var addAbility = function(name, defaultVal, genDescription) {
        this.abilities[name] = {
            name: name,
            genDescription: genDescription,
            values: _.isArray(defaultVal) ? defaultVal : undefined,
            value: !_.isArray(defaultVal) ? defaultVal : undefined,
        };
    };

    addAbility('fireStrength', [0], function(val) {
        return 'Increases draining strength of fire by ' + val + '%';
    });

    return {
        abilities: this.abilities,
        getVal: this.getVal,
        getValPercent: this.getValPercent,
    };
});
