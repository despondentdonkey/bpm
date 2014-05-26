define(function() {
    return {
        player: {
            money: 0,
            ammo: 10000,
            ammoMax: 10000,
            xp: 0,
            day: 1,

            currentWeapon: 'pinshooter',
            currentElement: 'fire',

            quests: ['m00', 's00'], // Quests available
            currentQuest: null,
        },
    };
});
