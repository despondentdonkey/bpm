/*
    Upgrades
        Each upgrade has a series of levels which contain values for abilities. Each ability value will be overriden by
        the next level, they will not stack. This will be changed later on to support different types of upgrade styles.

            "upgradeId": {
                "name": "MyUpgrade",
                "levels": [{
                        // Level 1 costs $200 and fireStrength is 25
                        "fireStrength": 25,
                        "cost": 200
                    }, {
                        // Level 2 costs $400 and fireStrength is 50 so not 50+25
                        "fireStrength": 50,
                        "cost": 400
                    }, {
                        "fireStrength": 200,
                        "cost": 1000
                    }
                ]
            },

            "upgradeId2": {
                "name": "MySecondUpgrade",
                "levels": [{
                        "fireStrength": 25,
                        "cost": 200
                    }
                ]
            }

        Lets say you bought level 2 of MyUpgrade (fireStrength: 50) and level 1 of MySecondUpgrade (fireStrength: 25)
        Since these are seperate upgrades those values will stack. So calling upgrades.getVal('fireStrength') would
        return 75 (50+25)

    Abilities
            addAbility('fireStrength', [20], function(val) {
                return 'Increases fire strength by' + val + '%.';
            });
        This creates an ability called fireStrength which has a default value of 20. The function is called genDescription as it
        will generate the description for the current upgrade. So a description for level 3 of MyUpgrade would read as:
            Increases fire strength by 200%.

        To implement an ability into the game you just need to get the abilities value. Let's say we want to implement an ability
        which does something every frame:
            addAbility('myAbility', false, function(val) {
                return 'Enables myAbility.';
            });

            // In update function of an object
            if (upgrades.getVal('myAbility') === true) {
                dealDamageToSomething(upgrades.getVal('fireStrength'));
            }
*/

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

    var addAbility = function(name, defaultVal, genDescription) {
        upgrades.abilities[name] = {
            name: name,
            hasDescription: _.isNull(genDescription) ? false : true,
            genDescription: genDescription,
            values: _.isArray(defaultVal) ? defaultVal : undefined,
            on: !_.isArray(defaultVal) ? defaultVal : undefined,
        };
    };

    // Temporary debug ability. Should be removed once weapons and perks no longer use it.
    addAbility('fireStrength', [0], function(val) { return 'This no longer does anything. Here is the value though: ' + val; });

    // Parses abilities.json and adds the abilities it finds. Should be called before addJsonUpgrades.
    upgrades.addJsonAbilities = function(json) {
        var abilityTrees = JSON.parse(json);

        for (var tree in abilityTrees) {
            for (var abilityName in abilityTrees[tree]) {
                var ability = abilityTrees[tree][abilityName];
                var defaults = [0];

                if (!_.isUndefined(ability.default)) {
                    if (_.isNumber(ability.default)) {
                        defaults = [ability.default];
                    } else {
                        defaults = ability.default;
                    }
                }

                (function(name, description) {
                    var genDescription = null;
                    if (description) {
                        genDescription = function(val) {
                            return description.replace('#{value}', val);
                        }
                    }
                    addAbility(name, defaults, genDescription);
                })(abilityName, ability.description || null);
            }
        }
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

                    var newUpgrade = new BasicUpgrade(options, treeKey, treeId); // treeKey used as type
                    object[treeId].push(newUpgrade);
                    upgrades.all.push(newUpgrade);
                }
            }
        }

        function parseUpgrades(json, array, type) {
            var upgrade = JSON.parse(json);
            for (var id in upgrade) {
                var newUpgrade = new BasicUpgrade( _.extend({ id: id }, upgrade[id]), type );
                array.push(newUpgrade);
                upgrades.all.push(newUpgrade);
            }
        }

        parseTreeUpgrades('weapon', json.weapons, upgrades.weapons);
        parseTreeUpgrades('element', json.elements, upgrades.elements);

        parseUpgrades(json.general, upgrades.general, 'general');
        parseUpgrades(json.perks, upgrades.perks, 'perk');
    };


    // Base class for any upgrade.
    var BasicUpgrade = createClass(null, function BasicUpgrade(o, type, treeName) {
        this.options = o;

        this.levelNum = 0; // The current level of the upgrade 3/5 = level 3 / length 5
        this.levels = [];

        this.currentAbilities = {}; // The current level abilities for this upgrade.
        this.previousAbilities = {}; // The level abilities which have just been switched.
        this.enabled = false; // If true then this upgrade is affecting the global abilities. (true == purchased)

        this.name = o.name;
        this.description = o.description;

        this.id = o.id;
        this.type = type;
        this.treeName = treeName; // Used by weapons and elements to identify specifc name e.g. pinshooter, fire

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

                        if (_.isNumber(newLevel[key])) {
                            newLevel[key] += o.sequence[key];
                        }
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

        // Increases level, removes due currency, and updates player upgrade data.
        purchase: function(player) {
            this.increaseLevel();

            var levelCost = this.getCurrentLevel().cost;
            if (this.type === "element" || this.type === "perk") {
                player.levelPoints -= levelCost;
            } else {
                player.money -= levelCost;
            }

            // Add the new level to the player storage.
            if (this.type === 'weapon') {
                if (_.isEmpty(player.upgrades.weapons[this.treeName]))
                    player.upgrades.weapons[this.treeName] = {};
                // e.g. player.upgrades.weapons.pinshooter['0'] = 2
                player.upgrades.weapons[this.treeName][this.id] = this.levelNum;
            } else if (this.type === 'element') {
                if (_.isEmpty(player.upgrades.elements[this.treeName]))
                    player.upgrades.elements[this.treeName] = {};
                player.upgrades.elements[this.treeName][this.id] = this.levelNum;
            } else if (this.type === 'general') {
                player.upgrades.general[this.id] = this.levelNum;
            } else if (this.type === 'perk') {
                player.upgrades.perks[this.id] = this.levelNum;
            }
        },

        /* Returns a list of required items needed before a purchase.
               Returns null if no requirements are needed, allowing a purchase.
               notMaxed - true if upgrade should not be maxed
               currency - true if player does not have enough money or level points
               upgrades - an array of upgrades needed
               points   - the number of invested points needed */
        getRequirements: function(player) {
            var requires = {};

            var nextLevel = this.getNextLevel();
            var currency = this.type === "element" || this.type === "perk" ? player.levelPoints : player.money;

            if (this.isMaxed()) {
                requires['notMaxed'] = true;
            }

            if (nextLevel && currency < nextLevel.cost) {
                requires['currency'] = true;
            }

            if (this.type === "weapon" || this.type === "element") {
                var playerUpgrades;

                if (this.type === "weapon") {
                    playerUpgrades = player.upgrades.weapons[this.treeName] || {};
                } else if (this.type === "element") {
                    playerUpgrades = player.upgrades.elements[this.treeName] || {};
                }

                if (this.requiredUpgrades) {
                    var requiredUpgrades = [];
                    for (var i=0; i<this.requiredUpgrades.length; ++i) {
                        var requiredUpgrade = this.requiredUpgrades[i];

                        if (!_(playerUpgrades).has(requiredUpgrade)) {
                            requiredUpgrades.push(requiredUpgrade);
                        }
                    }

                    if (!_.isEmpty(requiredUpgrades)) {
                        requires['upgrades'] = requiredUpgrades;
                    }
                }

                if (this.requiredPoints) {
                    var points = 0;

                    for (var id in playerUpgrades) {
                        points += playerUpgrades[id];
                    }

                    if (points < this.requiredPoints) {
                        requires['points'] = this.requiredPoints;
                    }
                }
            }

            return _.isEmpty(requires) ? null : requires;
        },

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

    return upgrades;
});
