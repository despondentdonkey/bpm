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

    // Abilities
    var addAbility = function(name, defaultVal, genDescription) {
        upgrades.abilities[name] = {
            name: name,
            genDescription: genDescription,
            values: _.isArray(defaultVal) ? defaultVal : undefined,
            on: !_.isArray(defaultVal) ? defaultVal : undefined,
        };
    };

    // WIP means the ability has not actually been implemented into the gameplay.

    addAbility('fireStrength', [0], function(val) {
        return 'This no longer does anything. Here is the value though: ' + val;
    });

    (function fireAbilities() {
        addAbility('fireDamage', [0], function(val) {
            return 'Increases draining strength of fire by ' + val + '%';
        });

        addAbility('fireDuration', [0], function(val) {
            return 'Increases the duration of fire by ' + val + '%';
        });

        addAbility('fireChance', [0], function(val) {
            return 'Increments the chance to spread fire by ' + val + '%';
        });

        addAbility('fireEmber', false, function(val) {
            return 'WIP Enables ember (this should be invisible)';
        });

        addAbility('fireEmberDamage', [0], function(val) {
            return 'WIP Increase the damage of the embers by ' + val + '%';
        });

        addAbility('fireEmberRange', [0], function(val) {
            return 'WIP Increase ember range by ' + val + '%';
        });

        addAbility('fireEmberDurability', [1], function(val) {
            return 'WIP Increase the amount of bubbles an ember can effect by ' + val + '.';
        });

        addAbility('fireDragon', false, function(val) {
            return 'WIP Enables fireDragon ability (this should be invisible)';
        });

        addAbility('fireDragonBubbleGoal', [0], function(val) {
            return 'WIP Amount of bubbles needed is decreased by ' + val + '%';
        });

        addAbility('fireDragonTimeFrame', [0], function(val) {
            return 'WIP Increases the amount of time to get collisions by ' + val + '%';
        });

        addAbility('fireDragonChance', [0], function(val) {
            return 'WIP Increases the chance to summon the dragon by ' + val + '%';
        });

        addAbility('fireDragonDamage', [0], function(val) {
            return 'WIP Increase the strength of the dragon by ' + val + '%';
        });
    })();

    (function lightningAbilities() {
        addAbility('lightningChainLength', [0], function(val) {
            return 'Increases the amount of chains generated by lightning to ' + val + '.';
        });

        addAbility('lightningDamage', [0], function(val) {
            return 'Increase the damage of lightning by ' + val + '%';
        });

        addAbility('lightningBulletSpeed', [0], function(val) {
            return 'WIP Increase the speed of bullets while lightning is on by ' + val + '%';
        });

        addAbility('lightningConduction', false, function(val) {
            return 'WIP Enables conduction (this should be invisible)';
        });

        addAbility('lightningConductionRange', [0], function(val) {
            return 'WIP Increases the area of effect by ' + val + '%';
        });

        addAbility('lightningConductionDamage', [0], function(val) {
            return 'WIP Increases the damage of the AoE by ' + val + '%';
        });

        addAbility('lightningOverload', false, function(val) {
            return 'WIP Enables overload (this should be invisible)';
        });

        addAbility('lightningOverloadStack', [2], function(val) {
            return 'WIP Overload can stack ' + val + ' times.';
        });
    })();

    (function iceAbilities() {
        addAbility('iceSpeedReduce', [0], function(val) {
            return 'WIP Decreases bubble speed by ' + val + '%';
        });

        addAbility('iceFreezeLength', [0], function(val) {
            return 'WIP Increases length of freeze by ' + val + '%';
        });

        addAbility('iceBlackIce', false, function(val) {
            return 'WIP enables Black Ice (this should be invisible)';
        });

        addAbility('iceTrailLength', [25], function(val) {
            return 'WIP Increase the amount of time the ice trail lasts by ' + val + '%';
        });

        addAbility('iceTrailChance', [10], function(val) {
            return 'WIP Increases the chance that a bullet will start an ice trail by ' + val + '%';
        });

        addAbility('iceBrittle', false, function(val) {
            return 'WIP enables Brittle Bubbles (this should be invisible)';
        });

        addAbility('iceBrittleDamage', [0], function(val) {
            return 'WIP Increases the damage dealt by ' + val + '%';
        });

        addAbility('iceBomb', false, function(val) {
            return 'WIP enables Ice Bomb (this should be invisible)';
        });

        addAbility('iceBombDamage', [0], function(val) {
            return 'WIP Increases charged damage by ' + val + '%';
        });

        addAbility('iceBombCloudChance', [0], function(val) {
            return 'WIP Increases chance to summon an ice cloud by ' + val + '%';
        });

        addAbility('iceBombIcicleChance', [0], function(val) {
            return 'WIP Increases chance to summon the Deathcicle by ' + val + '%';
        });

        addAbility('iceBombDamageBuffChance', [0], function(val) {
            return 'WIP Increases chance to trigger a damage buff for a limited time by ' + val + '%';
        });
    })();

    return upgrades;
});
