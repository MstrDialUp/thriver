// Power-curve check for PLAN-progression.md step 5.
//
// Question: with offers mode (4× XP per level, pick-1-of-3, a level bonus), is
// the player's blaster DPS at a given point in the run at
// least as high as playtest 1's auto-scaling blaster was at the same point?
//
// "The same point" = the same total XP collected. That assumes XP income over
// time is unchanged, which holds only while power tracks the old curve (more
// power → more kills → more XP), so a ratio near 1 is self-consistent.
//
// Towers: playtest 1 run 2 held 24 zones while collecting ~7,600 XP, so a tower
// offer is simulated every ~316 XP.
//
// Prints new ÷ old DPS for each level-bonus setting and suggests levelPowerShare:
// the share at which a random-pick build's median, averaged (geometric mean) over
// old levels 15–64, matches playtest 1. Re-run whenever weapons, skills, ladders
// or the XP curve change.
//
// Usage: node tools/power-curve.mjs [runs=400]

import { defaults } from '../src/config.js';
import { TOWER_TARGETS, levelTargets } from '../src/catalog.js';
import { makeOffer } from '../src/loot.js';
import { Build } from '../src/build.js';
import { powerIndex, autoCurve, xpToReach } from '../src/power.js';

const RUNS = Number(process.argv[2] ?? 400);
const XP_PER_TOWER = 7595 / 24;
const CHECK_LEVELS = [5, 10, 15, 20, 30, 38, 50, 64];   // old (auto) levels; 38 and 50 = playtest 1 runs 1 and 2
const SETTINGS = [
  ...[0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.7, 1.0].map(v => ({ label: `curve ${v}`, levelPower: 'curve', levelPowerShare: v })),
  ...[0.11, 0.2].map(v => ({ label: `comp ${Math.round(v * 100)}%`, levelPower: 'compound', levelDamageBonus: v })),
];
const FIT_LEVELS = [15, 20, 30, 38, 50, 64];

// Policies. 'random' picks any card. 'greedy' picks the card that raises the power index most
// (towers: a damage/fire-rate card if offered, else anything).
const POLICIES = ['random', 'greedy'];

function pick(policy, cards, build, cfg, level) {
  if (policy === 'random') return cards[Math.floor(Math.random() * cards.length)];
  let best = cards[0], bestV = -1;
  for (const c of cards) {
    if (c.targetId === 'filler') continue;
    build.apply(c);
    const v = powerIndex(build, build.stats(cfg, level), level);
    build.unapply(c);
    if (v > bestV) { bestV = v; best = c; }
  }
  return best;
}

function simulate(setting, policy) {
  const cfg = { ...structuredClone(defaults), upgradeMode: 'offers', ...setting };
  const build = new Build();
  const out = {};
  let level = 1, nextTowerXp = XP_PER_TOWER;
  for (const oldLevel of CHECK_LEVELS) {
    const xp = xpToReach(oldLevel);
    // Walk XP forward, interleaving level-ups and tower offers in XP order.
    for (;;) {
      const nextLevelXp = xpToReach(level + 1, cfg.levelXpMult);
      const nextEvent = Math.min(nextLevelXp, nextTowerXp);
      if (nextEvent > xp) break;
      if (nextLevelXp <= nextTowerXp) {
        level++;
        const cards = makeOffer(levelTargets(build, cfg), 3, cfg.rarityWeights);
        const c = cards.length && pick(policy, cards, build, cfg, level);
        if (c) build.apply(c);
      } else {
        nextTowerXp += XP_PER_TOWER;
        const c = pick(policy, makeOffer(TOWER_TARGETS, 3, cfg.rarityWeights), build, cfg, level);
        build.apply(c);
      }
    }
    out[oldLevel] = { level, ratio: powerIndex(build, build.stats(cfg, level), level) / autoCurve(oldLevel) };
  }
  return out;
}

const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))]; };

console.log(`Old (auto) curve — blaster DPS × at level:  ${CHECK_LEVELS.map(l => `L${l} ${autoCurve(l).toFixed(1)}`).join('  ')}`);
console.log(`New level reached at the same XP:            ${CHECK_LEVELS.map(l => `L${l}→${simulate(SETTINGS[0], 'random')[l].level}`).join('  ')}`);
console.log(`\nNew ÷ old DPS, median over ${RUNS} runs (p10–p90 for the random policy). 1.00 = same power as playtest 1.`);
console.log('Blaster only: other weapons (steps 6–7) will add to this.\n');
console.log(['setting', 'policy', ...CHECK_LEVELS.map(l => `oldL${l}`)].map((x, k) => String(x).padStart(k ? 9 : 12)).join(''));
const fit = [];
for (const setting of SETTINGS) {
  for (const policy of POLICIES) {
    const runs = Array.from({ length: RUNS }, () => simulate(setting, policy));
    const med = Object.fromEntries(CHECK_LEVELS.map(l => [l, median(runs.map(x => x[l].ratio))]));
    console.log([setting.label, policy, ...CHECK_LEVELS.map(l => med[l].toFixed(2))].map((x, k) => String(x).padStart(k ? 9 : 12)).join(''));
    if (policy === 'random') {
      const spread = CHECK_LEVELS.map(l => { const r = runs.map(x => x[l].ratio); return `${pct(r, 0.1).toFixed(2)}–${pct(r, 0.9).toFixed(2)}`; });
      console.log(['', 'p10–p90', ...spread].map((x, k) => String(x).padStart(k ? 9 : 12)).join(''));
      if (setting.levelPower === 'curve') {
        const g = Math.exp(FIT_LEVELS.reduce((a, l) => a + Math.log(med[l]), 0) / FIT_LEVELS.length);
        fit.push([setting.levelPowerShare, g]);
      }
    }
  }
}
// The ratio is proportional to the share wherever the bonus is above its floor of 1, so interpolate linearly.
const [s0, g0] = fit.find(([, g]) => g > 0) ?? fit[0];
console.log(`\nSuggested levelPowerShare ≈ ${(s0 / g0).toFixed(2)} (random picks, median, old levels ${FIT_LEVELS.join('/')}).`);
