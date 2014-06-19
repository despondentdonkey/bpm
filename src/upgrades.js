define(function() {
    upgrades = {};
    upgrades.abilities = {};
    upgrades.general = [];
    upgrades.weapons = {};
    upgrades.perks = [];
    upgrades.elements = {};

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

    // Updates all upgrade levels to the key map provided.
    upgrades.load = function(map) {
        function loadBasic(map, upgrades) {
            for (var id in map) {
                for (var i=0; i<upgrades.length; ++i) {
                    var upgrade = upgrades[i];
                    if (upgrade.id.toString() === id) {
                        upgrade.enable();
                        upgrade.setLevel(map[id]);
                        break;
                    }
                }
            }
        }
        loadBasic(map.general, upgrades.general);
        loadBasic(map.perks, upgrades.perks);

        for (var weapon in map.weapons) {
            // NOTE: Make sure to never change the weapon name in the JSON, these are used as ids. If you were to change it then the name could be different from the save file.
            if (!_.has(upgrades.weapons, weapon)) {
                console.error("Loading conflict: Saved data contains the key '" + weapon + "' but that does not match any upgrade available.", upgrades.weapons);
            }
            loadBasic(map.weapons[weapon], upgrades.weapons[weapon]);
        }

        for (var element in map.elements) {
            if (!_.has(upgrades.elements, element)) {
                console.error("Loading conflict: Saved data contains the key '" + element + "' but that does not match any upgrade available.", upgrades.elements);
            }
            loadBasic(map.elements[element], upgrades.elements[element]);
        }
    };

    upgrades.addJsonUpgrades = function(json) {
        function parseTreeUpgrades(treeKey, json, addUpgrade) {
            var trees = JSON.parse(json);
            for (var treeId in trees) {
                for (var upgradeId in trees[treeId]) {
                    var options = { id: upgradeId };
                    options[treeKey] = treeId;
                    addUpgrade(_.extend(options, trees[treeId][upgradeId]));
                }
            }
        }

        function parseUpgrades(json, addUpgrade) {
            var upgrade = JSON.parse(json);
            for (var id in upgrade) {
                addUpgrade(_.extend({
                    id: id,
                }, upgrade[id]));
            }
        }

        parseTreeUpgrades('weapon', json.weapons, addWeapon);
        parseTreeUpgrades('element', json.elements, addElement);

        parseUpgrades(json.general, addGeneral);
        parseUpgrades(json.perks, addPerk);
    };


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

    var addElement = function(options) {
        if (!_.has(upgrades.elements, options.element)) {
            upgrades.elements[options.element] = [];
        }
        var newUpgrade = new BasicUpgrade(options);
        upgrades.elements[options.element].push(newUpgrade);
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

        this.id = o.id;

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
        // Increases the level by 1 and enables this upgrade.
        increaseLevel: function() {
            this.enable();
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

    return upgrades;
});
