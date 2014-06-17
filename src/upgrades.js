define(function() {
    upgrades = {};
    upgrades.abilities = {};
    upgrades.general = [];
    upgrades.weapons = {};
    upgrades.perks = [];

    // Returns the final value of the ability specified.
    upgrades.getVal = function(name) {
        var ab = upgrades.abilities[name];
        var value = ab.values || ab.on;
        if (_.isArray(value)) {
            // Add the values of the array together.
            value = _.reduce(value, function(memo, num) {
                return memo + num;
            }, 0);
        }
        return value;
    };

    upgrades.getValPercent = function(name) {
        return this.getVal(name) * 0.01;
    };

    // Abilities
    var addAbility = function(name, defaultVal, genDescription) {
        upgrades.abilities[name] = {
            name: name,
            genDescription: genDescription,
            values: _.isArray(defaultVal) ? defaultVal : undefined,
            on: !_.isArray(defaultVal) ? defaultVal : undefined,
        };
    };

    addAbility('fireStrength', [0], function(val) {
        return 'Increases draining strength of fire by ' + val + '%';
    });

    // Upgrades

    var addGeneral = function(options) {
        var newUpgrade = new BasicUpgrade(options);
        upgrades.general.push(newUpgrade);
    };

    var addWeapon = function(options) {
        if (!_.has(upgrades.weapons, options.weapon)) {
            upgrades.weapons[options.weapon] = [];
        }
        var newUpgrade = new BasicUpgrade(options);
        upgrades.weapons[options.weapon].push(newUpgrade);
    };

    var addPerk = function(options) {
        var newUpgrade = new BasicUpgrade(options);
        upgrades.perks.push(newUpgrade);
    };

    // Base class for any upgrade.
    var BasicUpgrade = createClass(null, function BasicUpgrade(o) {
        this.options = o;

        this.levelNum = 0; // The current level of the upgrade 3/5 = level 3 / length 5
        this.levels = [];

        this.currentAbilities = {}; // The current level abilities for this upgrade.
        this.previousAbilities = {}; // The level abilities which have just been switched.
        this.enabled = false; // If true then this upgrade is affecting the global abilities. (true == purchased)

        this.name = o.name;
        this.description = o.description;

        this.id = this.genId(o.idPrefix || 0);

        if (o.initial) {
            this.levels[0] = o.initial;
            if (o.sequence) {
                this.length = o.sequence.length; // How many upgrades are there? 0/5 = length of 5

                // Generate the levels based on the sequence pattern.
                for (var i=1; i<o.sequence.length; ++i) {
                    var prevLevel = this.levels[i-1];
                    var newLevel = {};
                    for (var key in prevLevel) {
                        if (_.isUndefined(newLevel[key])) {
                            newLevel[key] = prevLevel[key];
                        }
                        newLevel[key] += o.sequence[key];
                    }
                    this.levels[i] = newLevel;
                }

                // Override levels
                if (o.levels) {
                    for (var key in o.levels) {
                        var index = parseInt(key, 10);
                        if (index > this.length) {
                            console.error('Level should not be overridden because it exceeds the length specified in the sequence.');
                        }
                        this.levels[index-1] = o.levels[key];
                    }
                }
            } else {
                // No sequence specified so it is just a one time upgrade.
                this.length = 1;
            }
        } else if (o.levels) {
            if (_.isArray(o.levels)) {
                this.length = o.levels.length;
                this.levels = o.levels;
            } else {
                this.length = _.size(o.levels);
                for (var key in o.levels) {
                    var index = parseInt(key, 10);
                    if (index > this.length) {
                        console.error('Level index exceeds total number of levels. Index: ' + index + ', Length: ' + this.length);
                    }
                    this.levels[index-1] = o.levels[key];
                }
            }
        }

        this.addAbilities();
    }, {
        idCounter: 0,
        genId: function(prefix) {
            return prefix + BasicUpgrade.prototype.idCounter++;
        },

        // Increases the level by 1 and enables this upgrade.
        increaseLevel: function() {
            this.enabled = true;
            this.setLevel(this.levelNum + 1);
        },

        setLevel: function(levelNum) {
            this.removeAbilities();
            this.levelNum = levelNum;
            this.addAbilities();

            // If this upgrade is enabled then we should update the global abilities to the new level.
            if (this.enabled) {
                if (levelNum <= 0) {
                    this.disable();
                } else {
                    this.update();
                }
            }
        },

        // Starts at 1. To get the level for 2/5 call getLevel(2)
        getLevel: function(index) {
            return this.levels[index-1];
        },

        getCurrentLevel: function() {
            return this.getLevel(this.levelNum);
        },

        getNextLevel: function() {
            return this.getLevel(this.levelNum+1);
        },

        isMaxed: function() {
            return (this.levelNum >= this.length);
        },

        // Sends the current abilities for this upgrade to the global abilities.
        enable: function() {
            if (this.enabled) return;
            this.enabled = true;

            if (this.levelNum <= 0) {
                console.error('Enabling upgrade with level 0. Level should be greater than 0.');
            }

            for (var key in this.currentAbilities) {
                var ability = this.currentAbilities[key];
                var globalAbility = upgrades.abilities[key];

                if (!globalAbility) continue; // Might wanna give an error.

                if (globalAbility.values) {
                    globalAbility.values.push(ability);
                } else {
                    globalAbility.on = ability;
                }

                console.log('ENABLE: global ability updated', globalAbility);
                console.log('total', key, upgrades.getVal(key));
            }
        },

        // Disables and then enables the upgrade effectively updating the global abilities.
        update: function() {
            this.disable();
            this.enable();
        },

        // Removes the previous abilities for this upgrade from the global abilities.
        disable: function() {
            if (!this.enabled) return;
            this.enabled = false;

            this.removeGlobalAbilities(this.previousAbilities);
        },

        // Adds the abilities for the current level (levelNum) to this.currentAbilities.
        addAbilities: function() {
            if (this.levelNum <= 0) return;

            if (!_.isEmpty(this.currentAbilities)) {
                console.error('Abilities have already been added. You must first remove them before adding again.');
            }

            var level = this.getCurrentLevel();
            for (var key in level) {
                var ability = level[key];
                if (key !== 'cost') {
                    this.currentAbilities[key] = ability;
                }
            }
        },

        // Removes the abilities from this.currentAbilities and puts them in this.previousAbilities.
        removeAbilities: function() {
            if (this.levelNum <= 0) {
                this.previousAbilities = {};
                return;
            }

            if (_.isEmpty(this.currentAbilities)) {
                console.error('Abilities have not been added; nothing to remove.');
            }

            this.previousAbilities = this.currentAbilities;
            this.currentAbilities = {};
        },

        // Removes an object literal of abilities from the global abilities.
        removeGlobalAbilities: function(toRemove) {
            for (var key in toRemove) {
                var ability = toRemove[key];
                var globalAbility = upgrades.abilities[key];

                if (!globalAbility) continue;

                if (globalAbility.values) {
                    var index = globalAbility.values.indexOf(ability);
                    if (index >= 0) {
                        globalAbility.values.splice(index, 1);
                    }
                } else if (!_.isUndefined(globalAbility.on)) {
                    globalAbility.on = false;
                }
                console.log('removed', globalAbility);
            }

        },
    });

    // TODO: Replace 'add' functions with JSON once upgrade functionality is finished.

    addGeneral({
        name: 'Fire Power',
        description: 'Something something',

        initial: {
            fireStrength: 25,
            cost: 200,
        },

        sequence: {
            length: 5, // Upgrade level count including initial.
            cost: 100,
            fireStrength: 10,
        },

        levels: {
            5: {
                fireStrength: 200,
                cost: 100000,
            },
        },
    });

    addGeneral({
        name: 'Fire Power II',
        description: 'Something something',

        levels: {
               1: {
                fireStrength: 25,
                cost: 200,
            }, 4: {
                fireStrength: 50,
                cost: 1000,
            }, 3: {
                fireStrength: 40,
                cost: 400,
            }, 2: {
                fireStrength: 35,
                cost: 300,
            },
        },
    });

    addGeneral({
        name: 'Fire Power III',
        description: 'Something something',

        levels: [{
                fireStrength: 25,
                cost: 200,
            }, {
                fireStrength: 35,
                cost: 300,
            }, {
                fireStrength: 50,
                cost: 500,
            },
        ],
    });

    /*
       JSON Format for weapons and elements:
       weapon/element: {
           id: {
               name, levels, etc
           }
       }
    */

    addWeapon({
        weapon: 'pinshooter',
        name: 'Pin Shooter Fire Power',
        description: "This isn't related to the pin shooter, I didn't want to make another ability.",
        levels: [{
                fireStrength: 25,
            }, {
                fireStrength: 50,
            }, {
                fireStrength: 200,
            },
        ],
    });

    addWeapon({
        id: '00',
        weapon: 'shotgun',
        name: 'Shotgun Fire Power',
        description: "This isn't related to the shotgun, I didn't want to make another ability.",
        levels: [{
                fireStrength: 25,
            }, {
                fireStrength: 50,
            }, {
                fireStrength: 200,
            },
        ],
    });

    addWeapon({
        id: '01',
        weapon: 'shotgun',
        name: 'Shotgun Fire Power II',
        description: "This isn't related to the shotgun, I didn't want to make another ability.",
        requires: [2, '00'], // TODO: Specifying a number means that it requires that many points, specifying a string means it needs that upgrade with the id purchased.
        levels: [{
                fireStrength: 200,
            }, {
                fireStrength: 400,
            }, {
                fireStrength: 800,
            },
        ],
    });

    addPerk({
        name: 'Fire Power Perk',
        description: 'Something something',

        initial: {
            fireStrength: 100,
        },
    });

    return upgrades;
});
