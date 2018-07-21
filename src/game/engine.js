import time from './time.js'
import gfx from './gfx.js'
import res from './res.js'
import states from './states.js'
import input from './input.js'
import quests from './quests.js'
import bpm from './bpm.js'
import upgrades from './upgrades.js'
import dbg from './debug.js'
import CLI from './cli.js'

export default class Engine {
  // Override default requestAnimationFrame for maximum compatibility.
  static requestAnimationFrame = window.requestAnimationFrame
                         || window.mozRequestAnimationFrame
                         || window.webkitRequestAnimationFrame
                         || window.msRequestAnimationFrame
                         || function(func) { setTimeout(func, 1000/60) };

  run() {
      states.setState(new states.TownMenu());

      res.load(() => {
          gfx.init(800, 600, document.getElementById('canvas'));

          input.init(gfx.renderer.view);
          dbg.addStateButtons(states);
          dbg.addCheats(bpm, states);
          dbg.addCLI(CLI);

          bpm.player = bpm.createNewPlayer();
          bpm.difficulty = bpm.genDifficultyStats(bpm.player.difficultyLevel);

          quests.addJsonQuests(res.json.quests.data);
          upgrades.addJsonAbilities(res.json.abilities.data);
          upgrades.addJsonUpgrades({
              general: res.json.general.data,
              weapons: res.json.weapons.data,
              perks: res.json.perks.data,
              elements: res.json.elements.data,
          });
          states.CutsceneState.parseCutscenes(res.json.cutscenes.data);

          // Switches to the Field with the training quest as default
          //bpm.player.currentQuest = quests.all["s00"];
          //states.setState(new states.Field());

          this.update();
      });
  }

  update() {
      // If a switchState function is defined then we should call it.
      if (states.global.switchState) {
          states.global.switchState();
          states.global.switchState = null;
      }

      if (states.global.current) {
          states.global.current.update(time.delta);
      }

      input.update();

      // If a current state exists and we should sort then sort its DisplayObjectContainer.
      // Then we should also sort the stage just in case there are any global display objects e.g. fps monitor.
      if (states.global.current && gfx.sortStageDisplays) {
          gfx.sortDisplays(states.global.current.displayObjectContainer);
          gfx.sortDisplays();
          gfx.sortStageDisplays = false;
      }

      gfx.render();

      time.update();
      dbg.fpsMonitor(gfx, time, states.global.current);

      requestAnimationFrame(this.update.bind(this));
  }
}
