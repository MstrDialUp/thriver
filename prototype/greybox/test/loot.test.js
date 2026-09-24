import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RARITIES, TOWER_TARGETS, STATS } from '../src/catalog.js';
import { rollRarity, makeOffer, fallbackOrder } from '../src/loot.js';
import { Build } from '../src/build.js';

const WEIGHTS = { common: 55, uncommon: 26, rare: 12, epic: 5, legendary: 2 };

// Small deterministic PRNG (mulberry32) so failures reproduce.
function rng(seed = 1) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('rarity rolls follow the weights', () => {
  const r = rng(7), n = 100_000, count = {};
  for (let i = 0; i < n; i++) { const x = rollRarity(WEIGHTS, r); count[x] = (count[x] ?? 0) + 1; }
  for (const k of RARITIES) assert.ok(Math.abs(count[k] / n - WEIGHTS[k] / 100) < 0.005, `${k}: ${count[k] / n}`);
});

test('an offer never has two cards for the same target', () => {
  const r = rng(3);
  for (let i = 0; i < 20_000; i++) {
    const cards = makeOffer(TOWER_TARGETS, 3, WEIGHTS, r);
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map(c => c.targetId)).size, 3);
  }
});

test('cards only carry rarities their target supports', () => {
  const r = rng(5);
  const byId = Object.fromEntries(TOWER_TARGETS.map(t => [t.id, t]));
  for (let i = 0; i < 20_000; i++) {
    for (const c of makeOffer(TOWER_TARGETS, 3, WEIGHTS, r)) {
      assert.ok(byId[c.targetId].rolls[c.rarity], `${c.targetId} at ${c.rarity}`);
      assert.deepEqual(c.effects, byId[c.targetId].rolls[c.rarity]);
    }
  }
});

test('extra jumps and dashes are about as rare as the Epic/Legendary weights', () => {
  const r = rng(9), n = 50_000;
  let jumpCards = 0, cards = 0;
  for (let i = 0; i < n; i++) {
    for (const c of makeOffer(TOWER_TARGETS, 3, WEIGHTS, r)) {
      cards++;
      if (c.effects.airJumps || c.effects.dashCharges) jumpCards++;
    }
  }
  // 7% of rolls are Epic or Legendary. Fallbacks shift this slightly; it must not balloon.
  assert.ok(jumpCards / cards > 0.05 && jumpCards / cards < 0.09, `${jumpCards / cards}`);
});

test('rarity falls back to the nearest supported one, down first', () => {
  assert.deepEqual(fallbackOrder('rare'), ['rare', 'uncommon', 'common', 'epic', 'legendary']);
  const only = [{ id: 'x', name: 'x', rolls: { epic: { airJumps: 1 } } }];
  assert.equal(makeOffer(only, 3, { common: 1 }, rng(1))[0].rarity, 'epic');
});

test('fewer targets than cards gives a shorter offer', () => {
  assert.equal(makeOffer(TOWER_TARGETS.slice(0, 2), 3, WEIGHTS, rng(2)).length, 2);
});

test('build: percentages add against the base, counts add, reductions are floored', () => {
  const b = new Build();
  const cfg = { moveSpeed: 10, jumpHeight: 2, wallRunTime: 1, wallRunUpSpeed: 1, glideSpeedMult: 1, dashCooldown: 1, maxHp: 100, airJumps: 1, dashCharges: 1 };
  b.apply({ effects: { moveSpeed: 0.05 } });
  b.apply({ effects: { moveSpeed: 0.05 } });
  b.apply({ effects: { airJumps: 1, dashCharges: 1 } });
  for (let i = 0; i < 20; i++) b.apply({ effects: { dashCooldown: -0.08 } });
  b.apply({ effects: { damageMult: 0.08 } });
  const e = b.stats(cfg);
  assert.ok(Math.abs(e.moveSpeed - 11) < 1e-9);
  assert.equal(e.airJumps, 2);
  assert.equal(e.dashCharges, 2);
  assert.equal(e.dashCooldown, 0.25);
  assert.ok(Math.abs(e.damageMult - 1.08) < 1e-9);
  assert.equal(e.fireRateMult, 1);
  b.reset();
  assert.equal(b.stats(cfg).moveSpeed, 10);
});

test('build: hyperbolic stats stack with diminishing returns and never reach 100%', () => {
  const b = new Build();
  assert.equal(b.stats({}).fallReduction, 0);
  b.apply({ effects: { fallReduction: 1 } });
  assert.ok(Math.abs(b.stats({}).fallReduction - 0.5) < 1e-9);
  for (let i = 0; i < 100; i++) b.apply({ effects: { fallReduction: 0.12 } });
  const r = b.stats({}).fallReduction;
  assert.ok(r > 0.9 && r < 1, `${r}`);
});

import { levelTargets, WEAPONS } from '../src/catalog.js';

const LCFG = { maxItemLevel: 8, weaponSlots: 4, skillSlots: 4 };

test('level-up: blaster upgrades use the standard ladder; counts only at Rare and above', () => {
  const b = new Build();
  const t = levelTargets(b, LCFG).find(x => x.id === 'blaster');
  assert.equal(t.id, 'blaster');
  assert.ok(!t.rolls.common.some(fx => 'blaster.projectiles' in fx));
  assert.ok(t.rolls.rare.some(fx => fx['blaster.projectiles'] === 1));
  assert.ok(t.rolls.legendary.some(fx => fx['blaster.projectiles'] === 2));
  assert.ok(t.rolls.legendary.some(fx => fx['blaster.fireRate'] === 0.20));
  assert.ok(t.rolls.common.some(fx => fx['blaster.fireRate'] === 0.05));
  const cards = makeOffer([t], 3, WEIGHTS, rng(4));
  assert.equal(cards.length, 1);
  assert.equal(Object.keys(cards[0].effects).length, 1);
});

test('level-up: an item at max level is no longer offered', () => {
  const b = new Build();
  for (let i = 1; i < LCFG.maxItemLevel; i++) b.apply({ item: 'blaster', effects: { 'blaster.damage': 0.05 } });
  assert.equal(b.items.blaster, 8);
  assert.ok(!levelTargets(b, LCFG).some(t => t.id === 'blaster'));
});

test('build: own() reads item bonuses, which never leak into effective stats; unapply reverses a pick', () => {
  const b = new Build();
  const card = { item: 'blaster', effects: { 'blaster.fireRate': 0.2 } };
  b.apply(card);
  assert.equal(b.own('blaster', 'fireRate'), 0.2);
  assert.equal(b.items.blaster, 2);
  assert.ok(!('blaster.fireRate' in b.stats({ upgradeMode: 'offers', levelDamageBonus: 0.1 })));
  b.unapply(card);
  assert.equal(b.own('blaster', 'fireRate'), 0);
  assert.equal(b.items.blaster, 1);
  assert.equal(b.picks.length, 0);
});

test('build: character level bonus (compound) applies in offers mode only', () => {
  const b = new Build();
  assert.ok(Math.abs(b.stats({ upgradeMode: 'offers', levelPower: 'compound', levelDamageBonus: 0.1 }, 3).levelMult - 1.21) < 1e-9);
  assert.equal(b.stats({ upgradeMode: 'auto', levelDamageBonus: 0.1 }, 3).levelMult, 1);
});

import { levelMult, autoCurve, autoLevelAtXp, xpToReach } from '../src/power.js';

test('power: curve level bonus tracks playtest 1 at the same XP', () => {
  const cfg = { levelPower: 'curve', levelPowerShare: 1, levelXpMult: 4, projectiles: 2 };
  assert.ok(Math.abs(autoLevelAtXp(xpToReach(50)) - 50) < 1e-9);
  // New level 24 at 4× cost ≈ old level 48.
  const old = autoLevelAtXp(xpToReach(24, 4));
  assert.ok(old > 47.5 && old < 49, `${old}`);
  assert.ok(Math.abs(levelMult(24, cfg) - autoCurve(old)) < 1e-9);
  assert.equal(levelMult(1, cfg), 1);
  assert.equal(levelMult(1, { ...cfg, levelPowerShare: 0.5 }), 1); // never below 1
});

import { powerIndex } from '../src/power.js';
import { defaults } from '../src/config.js';

test('level-up: unowned weapons are offered as NEW at their fixed rarity, only while a slot is free', () => {
  const b = new Build();
  const news = levelTargets(b, LCFG).filter(t => t.isNew && t.kind === 'weapon');
  assert.deepEqual(news.map(t => t.id).sort(), ['arc', 'gunDrone', 'meleeDrone', 'mortar', 'pulse']);
  for (const t of news) assert.deepEqual(Object.keys(t.rolls), [WEAPONS[t.id].offerRarity]);
  for (const id of ['pulse', 'arc', 'mortar']) b.apply({ item: id, effects: {} });
  assert.equal(Object.keys(b.items).length, 4);
  assert.equal(levelTargets(b, LCFG).filter(t => t.isNew && t.kind === 'weapon').length, 0);
  assert.equal(levelTargets(b, LCFG).filter(t => t.kind === 'weapon').length, 4); // upgrades for the four owned
});

test('level-up: every stat of every weapon has a registered label and a ladder', () => {
  for (const [id, w] of Object.entries(WEAPONS)) {
    for (const stat of Object.keys(w.stats)) assert.ok(STATS[`${id}.${stat}`], `${id}.${stat}`);
    assert.ok(w.estDps(() => 0, defaults) > 0, id);
  }
});

test('power: a fresh blaster is 1; each extra weapon adds its estimated DPS', () => {
  const eff = new Build().stats({ ...defaults, upgradeMode: 'off' });
  const b = new Build();
  assert.ok(Math.abs(powerIndex(b, eff, 1) - 1) < 1e-9);
  b.apply({ item: 'pulse', effects: {} });
  const withPulse = powerIndex(b, eff, 1);
  assert.ok(withPulse > 1.5 && withPulse < 2.5, `${withPulse}`);
});

import { SKILLS } from '../src/catalog.js';

test('level-up: skills have their own 4-slot cap, separate from weapons', () => {
  const b = new Build();
  const skillNews = levelTargets(b, LCFG).filter(t => t.isNew && t.kind === 'skill');
  assert.equal(skillNews.length, Object.keys(SKILLS).length);
  for (const id of ['magnet', 'shield', 'spider', 'impact']) b.apply({ item: id, effects: {} });
  const t = levelTargets(b, LCFG);
  assert.equal(t.filter(x => x.isNew && x.kind === 'skill').length, 0);
  assert.equal(t.filter(x => x.isNew && x.kind === 'weapon').length, 5); // weapon slots unaffected
  for (const s of Object.keys(SKILLS)) for (const stat of Object.keys(SKILLS[s].stats)) assert.ok(STATS[`${s}.${stat}`], `${s}.${stat}`);
});

import { towerTargets } from '../src/catalog.js';
import { shiftRarity } from '../src/loot.js';

test('towers offer character stats only: no weapons, skills or their upgrades', () => {
  for (const t of TOWER_TARGETS) {
    assert.ok(!t.item && !t.isNew, t.id);
    for (const fx of Object.values(t.rolls)) for (const stat of Object.keys(fx)) {
      assert.ok(STATS[stat] && !STATS[stat].owner, `${t.id}: ${stat}`);
    }
  }
});

test('a tower stat that only feeds one skill is offered only while that skill is owned', () => {
  const b = new Build();
  assert.ok(!towerTargets(b).some(t => t.id === 'impactDamage'));
  b.apply({ item: 'impact', effects: {} });
  assert.ok(towerTargets(b).some(t => t.id === 'impactDamage'));
});

test('large towers: shifting rarity up one step never rolls Common and keeps the total', () => {
  const s = shiftRarity(WEIGHTS, 1);
  assert.equal(s.common, 0);
  assert.equal(s.uncommon, WEIGHTS.common);
  assert.equal(s.legendary, WEIGHTS.epic + WEIGHTS.legendary);
  assert.equal(Object.values(s).reduce((a, b) => a + b), 100);
  assert.deepEqual(shiftRarity(WEIGHTS, 0), WEIGHTS);
  const r = rng(11);
  for (let i = 0; i < 2000; i++) assert.notEqual(rollRarity(s, r), 'common');
});
