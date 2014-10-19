In the quiet city of Pinville a dark evil approaches.

0 -- Characters and Locations
    The Mayor
        Has a moustache. Fancy, Seemingly Crazy, Scatterbrained, Hates Bubbles with an odd passion

    The Blacksmith
        Mr. Krabs-level cheap, loves money and steel

    The Wizard
        Mysterious, communicates via telepathy, controls the main forcefield protecting the town.

    King Bubble, aka "K. Bubbs"
        ???

    Bubbles of Doom
        Seemingly peaceful bubbles, later find out their malicious intent

    The Town
        A peaceful village plagued by a mysterious past that attracts the bubbles of doom

    The Armory
        Where the blacksmith lives. Yes he lives here.
        Visit to use gold to buy weapon upgrades.

    The Tower
        Where the wizard lives.
        Visit to use exp to buy perks and power up the force field

    The Forcefield
        Can be upgraded to withstand more bubbles.
        If Forcefield is depleted, the bubbles will enter the city, aka doom.

    The Mayor's Office
        Where the Mayor lives
        Go here to accept quests

    BubbleLand
        The home of the bubbles of doom
        Visit BubbleLand in phase 6 to meet K. Bubbs

0 -- Quest Conventions
    QUEST m[a-z][0-9]{2,} = Main Questline
    QUEST s[a-z][0-9]{2,} = Sidequests; have descriptor before number

    Text guide:

        QUEST 1: [description of quest]
                 Gold: [highest score]
                 Silver: [medium score]
                 Bronze: [passing score]

                 Reward: [list reward]

            Any dialog here will show up on quest acceptance

            ** Quest Start - [how many/what type bubbles spawn] **
                Any dialog here will show after quest starts
            * Checkpoint * <- start from here if you die
            ** Quest End **
                Any dialog here will show after quest is turned in

a -- Introduction
    Mayor: "Thank the heavens you've arrived!"
            "Without you, our peaceful city of Pinville would be ruined!"
            "Take this. It will aid you in your valiant quest against the unspeakable evil that is approaching us."
            * Receive Pin Shooter *

    # Quest Main: Kill all of the bubbles before they reach the village!
        Mayor: "Prepare yourself! The battle begins now!!"

ma00
    ** Quest Start - a few normal bubbles **
        Mayor: "Look at those hideous monstrosities!"
                "SHOOT THEM! KILL THEM ALL!"
                * Mayor lets out a battle cry *
                * Play intense battle music - orchestral awesomeness and such *

        * Show basic gameplay tutorial *
        * checkpoint (if you die, start here; skip dialog) *

    ** Quest End **

         Mayor: "Good work, soldier. Our citizens thank you for your heroic effort."
                * Receive 1 gold *
                "Why don't you head down to the armory and meet our famouse blacksmith?"

    * Instructions on how to navigate the UI *
    * Make user go to blacksmith *

    Blacksmith: "Well howdy partner! The mayor told me you were-a comin'!"
                "Well don't be shy, what would you like to buy?"

    * Display shop window and tutorial on how to navigate the shop *

                "Oh... You only have one gold... Go see the mayor for more cash."

ma01
    # Quest Main: Kill all of the bubbles before they reach the village! And find the mayor's moustache!

        Mayor (now missing moustache): "These scounderels broke into my house and stole my moustache!! KILL. THEM."

    ** Quest Start - All normal bubbles **
        * Combo tutorial *
        * Checkpoint *
    ** Quest End **

        Find Mayor's moustache in bubble's guts
            * play Zelda-like acquiring music, spin moustache on screen with shiny effects emanating from the epic 'stache *

        Mayor: "You retrieved my 'stache?! Thank the Gods!"
               "Our citizens have seen your acts of heroism and also require your help! You can find additional quests in my office."

ma02
    # Quest Main:
sa00
    # Quest Side - citizen quest 
sa01
    # Quest Side - citizen quest

    * Bubbles begin to increase in frequency *

    Wizard: "Hello, traveler. My name is The Wizard. I will help you become incredibly strong."
            "But first, you must not be a whiney little baby. Come see me when you are more experienced."

    # Quest Main
    # Quest Main
        * wooden bubbles appear *

    - Mayor, Blacksmith, and Wizard are holding a meeting to discuss the recent events

    M: "Is that... armor?!"
           "Bubblasphemy! What shall we do about this?"
    BS: "Aye, indeed it be."
    W: "Interesting..."
    M: "Well, it's a good thing we hired that intern."
       "Ahem - hero! It is your job to protect our beautiful city from this new threat!"
       "Or else."
        * Dark shadow covers the mayor's face while fading to black around mayor, hiding W and BS - make mayor look evil *

    # Quest Main
    # Quest Side

    * city square (main area) *
    W: "It is time. Come to my tower when you are ready."

    * In wizard tower *
    * display UI help along with wizard's speach*
    W: "I shall teach you the art of elements. Elements give you an increased advantage over the bubbles."
            "Each element has a unique power to maximize bubbley carnage."
            "For every bubble you pop, I shall grant you Knowledge."
            "Use Knowledge to unlock new elemental abilities."
            "Use the abilities to destroy your foes."

    * On first purchase of element *
    W: "Now you are become death; destroyer of worlds."

    -- Misc. One-Liners (can be used when needed)
        -- Quest finishers
            Mayor: "Your gear is so last season. Take this money and go buy yourself something decent."
                * Gain coins *

            Mayor: "YAYAYAYAY DEATH!"

            Mayor: "See? Killing is not so bad."

            Mayor: "Money money money money money money."

            Mayor: "I almost forgot! Here is your pay, good sir. Cheerio."

        -- Armory entry
            Blacksmith: "Ahoy! Welcome, money!"

            Blacksmith: "Howdy pardner. What can I do ya for?"

            Blacksmith: "Yarr, matey. Buy some gear while the iron is hot!"

        -- Tower entry
            Wizard: "Greetings, traveller. Welcome to my tower."

b -- Bubble Brains Become Apparent
    Mayor: "Are those... Brains??"
    Wizard: "Traveller, collect as many brains as possible so we can learn more about these bubbles"

c -- Bubbles' intelligence becomes apparent
    * Town Meeting - Blacksmith, Wizard, and Mayor are gathered *
    Mayor: begins to show concern over the bubbles armor
    Wizard: "We believe the bubbles have adapted to wearing armor to protect their brains"
    Smith: "Psh armor like that can't be broken with a measly pin shooter. I'll hook you up with a real weapon" <- something along those lines
    Wizard: "If the bubbles are evolving then they will eventually overcome your mortal weapons. You will also need my help" <- something along those lines
    * introduce elemental classes. *

    -- Ethical Questions, bubbles appear harmless and nice

    - Why do we pop?

d -- Mayor/town is seemingly evil

    - give mayor evil laugh/mannerisms

e -- Meet Bubble King in BubbleLand
    - Receive invite to bubble land in the form of a wave of bubbles
        (need to write out "Come to BubbleLand
                                <3 K. Bubbs"
    - on wave finish, a bubble comes down and engulfs the current weapon, bubble carries weapon upwards off screen
    - in bubbleland, show help for going back to Pinville (cannot upgrade or anything while in bubbleland)
    - BubbleLand has a constant stream of very difficult bubbles - no rounds or quests
    - Bubbles give exp AND gold in BL.
    - Introduce Noble Bubbles and Royal Bubbles; Bubble bosses.

    -- Discover Bubbles' true intentions
    - Meet bubble royalty and learn bubbly things

f -- Destroying BubbleLand and K. Bubbs

    -
