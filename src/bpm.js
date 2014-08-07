define(['lib/simpleStorage', 'upgrades'], function(simpleStorage, upgrades) {
    var input = requirejs('input');

    return {
        playerDefault: {
            money: 105000, // Currency for blacksmith
            levelPoints: 300, // Currency for wizard
            level: 1,
            xp: 0,
            difficultyLevel: 'normal',

            day: 1,

            ammo: 10000,
            ammoMax: 10000,

            currentWeapon: 'Rifle',
            currentElement: 'fire',

            quests: ['ma00', 's00'], // Quests available
            currentQuest: null,

            upgrades: {
                general: {},
                weapons: {},
                perks: {},
                elements: {},
            },
        },

        // Returns difficulty statistics based on difficulty level passed.
        genDifficultyStats: function(level) {
            var stats = { // These default as normal difficulty stats.
                upgradeCostMod: 1.0,
                bubbleHpMod: 1.0,
            };

            if (level === 'easy') {
                stats.upgradeCostMod = 0.8;
                stats.bubbleHpMod = 0.5;
            } else if (level === 'hard') {
                stats.upgradeCostMod = 1.25;
                stats.bubbleHpMod = 1.3;
            } else if (level !== 'normal') {
                console.error("Difficulty level '" + level + "' does not exist. Defaults will be returned.");
            }

            return stats;
        },

        // Generates and returns the xp needed to reach the next level.
        // If you're level 8 and you want to know how much xp is needed to get to next level you call getXpGoal(8).
        getXpGoal: function(level) {
            return 40*Math.pow(level, 2) + 360*level;
        },

        // Returns a clone of bpm.playerDefault.
        createNewPlayer: function() {
            return JSON.parse(JSON.stringify(this.playerDefault));
        },

        saveData: function() {
            if (!simpleStorage.canUse()) {
                console.error('Game cannot be saved. localStorage saving not supported on this browser.');
                return false;
            }
            return simpleStorage.set('player', this.player);
        },

        loadData: function() {
            var storedPlayer = simpleStorage.get('player');
            var exists = !_.isUndefined(storedPlayer);

            if (exists) {
                // Makes a clone of the returned object.
                var storedPlayerClone = JSON.parse(JSON.stringify(storedPlayer));

                // We have to clone the stored object because underscore extend does not do a deep copy and just uses references for nested objects.
                // This caused some problems where the stored object's nested objects (storedPlayer.upgrades) would be equal to this.player after the first extend call.
                this.player = this.createNewPlayer();
                _.extend(this.player, storedPlayerClone);
                this.difficulty = this.genDifficultyStats(this.player.difficultyLevel);
                upgrades.load(this.player.upgrades);
            } else {
                console.error("Loading error: Data does not exist.", localStorage);
            }

            return exists;
        },

        clearData: function() {
            return simpleStorage.flush();
        },

        // Keep track of all keyboard codes here
        // allows for easy customizability
        // entries should correspond to this pattern:
        //      {Class: Value}, where Value is: input.key.isReleased(Value)
        //      Value can be an array of possible values
        hotkeys: {
            weapons: {
                'PinShooter': '1',
                'Shotgun': '2',
                'Rifle': '3'
            },
            menus: {
                'TownMenu': 'U',
                'FieldPauseMenu': input.ESCAPE,
            },
            actions: {
                'SpawnBubbles': 'B',
                'Reset': 'R'
            }
        }

    };
});
