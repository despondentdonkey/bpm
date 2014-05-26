define(function() {
    return {
        player: {
            money: 0,
            pins: 10000,
            pinMax: 10000,
            xp: 0,
            currentWeapon: 'pinshooter',
            currentElement: 'fire',
            quests: ['m00', 's00'], // Quests available
            currentQuest: null,
        },
    };
});
