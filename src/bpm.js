define(function(require) {
    var input = require('input');
    return {
        player: {
            money: 0,
            ammo: 10000,
            ammoMax: 10000,
            xp: 0,
            day: 1,

            currentWeapon: 'Rifle',
            currentElement: 'lightning',

            quests: ['ma00', 's00'], // Quests available
            currentQuest: null,
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
