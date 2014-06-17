define(['lib/simpleStorage', 'upgrades'], function(simpleStorage, upgrades) {
    var input = requirejs('input');
    return {
        player: {
            money: 0,
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
            },
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
                _.extend(this.player, storedPlayer);
                upgrades.load(this.player.upgrades);
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
