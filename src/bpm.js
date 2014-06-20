define(['lib/simpleStorage', 'upgrades'], function(simpleStorage, upgrades) {
    var input = requirejs('input');
    return {
        playerDefault: {
            money: 105000,
            ammo: 10000,
            ammoMax: 10000,
            xp: 0,
            day: 1,

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
            }
        }

    };
});
