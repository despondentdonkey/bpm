define(function() {
    upgrades = {};
    upgrades.abilities = {};
    upgrades.all = [];
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

    upgrades.reset = function() {
        for (var i=0; i<upgrades.all.length; ++i) {
            upgrades.all[i].setLevel(0);
        }
    };

    // Updates all upgrade levels to the key map provided.
    upgrades.load = function(map) {
        upgrades.reset();

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

        // Loads an upgrade tree e.g. {ice->0,1}, {fire->0,1} rather than a list of upgrades e.g. {0,1}.
        function loadTree(map, trees) {
            for (var treeId in map) {
                // NOTE: Make sure to never change the weapon/element name in the JSON, these are used as ids. If you were to change it then the name could be different from the save file.
                if (!_.has(trees, treeId)) {
                    console.error("Loading conflict: Saved data contains the key '" + treeId + "' but that does not match any upgrade available.", trees);
                }
                loadBasic(map[treeId], trees[treeId]);
            }
        }

        loadBasic(map.general, upgrades.general);
        loadBasic(map.perks, upgrades.perks);

        loadTree(map.weapons, upgrades.weapons);
        loadTree(map.elements, upgrades.elements);
    };

    upgrades.addJsonUpgrades = function(json) {
        function parseTreeUpgrades(treeKey, json, object) {
            // Contains the objects that hold the ids. e.g. {pinshooter:{0,1}, shotgun:{0,1,2}, rifle:{0}}
            var trees = JSON.parse(json);

            for (var treeId in trees) {
                object[treeId] = []; // e.g. upgrades.weapons.pinshooter = []; treeId = pinshooter
                for (var upgradeId in trees[treeId]) {
                    // e.g. extend({}, jsonUpgrades.pinshooter["myWeapon0"])
                    var options = _.extend({ id: upgradeId }, trees[treeId][upgradeId]);
                    options[treeKey] = treeId; // e.g. upgrade.weapon = pinshooter; treeKey = weapon

                    var newUpgrade = new BasicUpgrade(options);
                    object[treeId].push(newUpgrade);
                    upgrades.all.push(newUpgrade);
                }
            }
        }

        function parseUpgrades(json, array) {
            var upgrade = JSON.parse(json);
            for (var id in upgrade) {
                var newUpgrade = new BasicUpgrade( _.extend({ id: id }, upgrade[id]) );
                array.push(newUpgrade);
                upgrades.all.push(newUpgrade);
            }
        }

        parseTreeUpgrades('weapon', json.weapons, upgrades.weapons);
        parseTreeUpgrades('element', json.elements, upgrades.elements);

        parseUpgrades(json.general, upgrades.general);
        parseUpgrades(json.perks, upgrades.perks);
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

        this.requiredPoints = o.requiredPoints
        this.requiredUpgrades = o.requires;

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

        // If cost was never specified in a level then give it a cost of 1 as default.
        for (var i=0; i<this.levels.length; ++i) {
            var level = this.levels[i];
            if (!_(level).has('cost')) {
                level.cost = 1;
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
