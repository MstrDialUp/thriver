import { STATS } from './catalog.js';
import { levelMult } from './power.js';

// The run's build: weapons, skills, and stat bonuses picked up during a run,
// layered over the base config. The debug panel edits the base; restart
// clears the build. Systems read `game.eff` (this.stats(config)) each frame.

export class Build {
  constructor() {
    this.eff = {};
    this.reset();
  }

  reset() {
    this.bonus = {};
    this.picks = [];
    this.items = { blaster: 1 };   // owned weapons/skills → item level (the starting weapon is level 1)
    this.levelPicks = [];          // one entry per resolved level-up offer (null = skipped), for level-down
  }

  apply(card) {
    for (const [stat, v] of Object.entries(card.effects)) this.bonus[stat] = (this.bonus[stat] ?? 0) + v;
    if (card.item) this.items[card.item] = (this.items[card.item] ?? 0) + 1;
    this.picks.push(card);
  }

  unapply(card) {
    for (const [stat, v] of Object.entries(card.effects)) this.bonus[stat] -= v;
    if (card.item && --this.items[card.item] <= 0) delete this.items[card.item];
    this.picks.splice(this.picks.lastIndexOf(card), 1);
  }

  // A bare stat bonus that isn't a pick (orbs).
  addBonus(stat, v) { this.bonus[stat] = (this.bonus[stat] ?? 0) + v; }

  // A weapon's or skill's own bonus, e.g. own('blaster', 'damage').
  own(item, stat) { return this.bonus[`${item}.${stat}`] ?? 0; }

  stats(cfg, level = 1) {
    const e = Object.assign(this.eff, cfg);
    // Character level bonus (offers mode), so halving the number of level-ups doesn't leave
    // the player weaker than playtest 1's auto-scaling. See power.js and tools/power-curve.mjs.
    e.levelMult = cfg.upgradeMode === 'offers' ? levelMult(level, cfg) : 1;
    for (const [stat, s] of Object.entries(STATS)) {
      if (s.owner) continue;
      const b = this.bonus[stat] ?? 0;
      if (s.mode === 'mult') e[stat] = 1 + b;
      else if (s.mode === 'add') e[stat] = cfg[stat] + b;
      else if (s.mode === 'hyper') e[stat] = 1 - 1 / (1 + b);
      else e[stat] = cfg[stat] * Math.max(s.min ?? 0, 1 + b);
    }
    return e;
  }
}
