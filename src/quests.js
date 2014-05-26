define(['bpm'], function(bpm) {
    // Contains all quests
    this.all = {};

    // Contains all possible objectives a quest can have.
    this.objectives = {};

    // Returns the objective from the current quest. If no current quest or objective exists then returns null.
    this.getObjective = function(objectiveName) {
        if (bpm.player.currentQuest) {
            var objective = bpm.player.currentQuest.objectives[objectiveName];
            if (objective) {
                return objective;
            }
        }
        return null;
    };

    // Creates a new objective for quests and puts it in quests.objectives.
    var addObjective = function(name, genDescription) {
        this.objectives[name] = {
            name: name,
            genDescription: genDescription,
        }
    };

    // Creates a new quest instance and puts it in quests.all.
    var addQuest = function(quest) {
        quest.completed = false;
        quest.completedObjectives = [];

        quest.onObjectiveComplete = function(objective) {
            quest.completedObjectives.push(objective);

            // Check if all objectives are completed.
            for (var key in quest.objectives) {
                if (quest.objectives[key].completed) {
                    quest.completed = true;
                } else {
                    quest.completed = false;
                    break;
                }
            }

            console.log("Objective '" + objective.description + "' completed for quest '" + quest.name + " (" + quest.id + ")'!");

            if (quest.completed) {
                console.log("'" + quest.name + " (" + quest.id + ")' completed!");
            }
        };

        // Objectives currently are in the format of 'name: value'. We need to convert that into a new object to give more info.
        for (var key in quest.objectives) {
            var goal = quest.objectives[key];

            // Generate this objectives unique description.
            var genDescription = this.objectives[key].genDescription;
            var hidden = true;
            var description = '';

            // If there's a description generator then we can assume that this objective should be visible.
            if (genDescription) {
                hidden = false;
                description = genDescription(goal);
            }

            var objective = {
                description: description,
                goal: goal,
                status: null,
                completed: false,
                hidden: hidden,
            };

            // The training objective/quest is a free-for-all so it should automatically be completed.
            if (key === 'training') {
                objective.completed = true;
                quest.completed = true;
            }

            objective.complete = function() {
                if (!objective.completed) {
                    objective.completed = true;
                    if (quest.onObjectiveComplete) {
                        quest.onObjectiveComplete(objective);
                    }
                }
            };

            quest.objectives[key] = objective;
        }

        this.all[quest.id] = quest;
    };

    // Add objectives

    addObjective('multiplier', function(goal) {
        return 'Reach a multiplier of ' + goal + '.';
    });

    addObjective('training');

    // Add quests

    addQuest({ id: 'm00',
        name: 'My Quest',
        description: 'Hello, are you willing to take on this quest?',
        reward: 100,
        unlocks: ['m01'],
        objectives: {
            multiplier: 3,
        },
    });

    addQuest({ id: 'm01',
        name: 'Another Quest',
        description: 'This is pretty much the same thing.',
        reward: 200,
        objectives: {
            multiplier: 4,
        },
    });

    addQuest({ id: 's00',
        name: 'Training',
        description: 'Gather some experience by shooting bubbles for the day.',
        reward: 0,
        unlocks: ['s00'],
        objectives: {
            training: true,
        },
    });

    return {
        all: this.all,
        getObjective: this.getObjective,
    };
});
