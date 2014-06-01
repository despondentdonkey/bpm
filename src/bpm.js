define(function() {

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
        },

        state: {
            current: null,
        }
    };
});
