define(function() {

    var currentWeapon;
    return {
        player: {
            money: 0,
            ammo: 10000,
            ammoMax: 10000,
            xp: 0,
            day: 1,

            currentWeapon: null,
            currentElement: 'fire',

            quests: ['ma00', 's00'], // Quests available
            currentQuest: null,
        },

        weaponCache: {
            pinshooter: null,
            rifle: null,
            shotgun: null
        },

        state: {
            current: null,
        }
    };
});
