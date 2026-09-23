// Upgrade data. Pure data, no Three.js, so Node can test it.
// All numbers are grey-box placeholders (PLAN-progression.md), not design decisions.

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY_COLORS = { common: '#e8e8e8', uncommon: '#4aa3ff', rare: '#b067ff', epic: '#ff4d4d', legendary: '#ffd23f' };

// How each bonus combines with the base config value (build.stats):
//   pct  — base × (1 + Σ)        percentages add together against the base
//   add  — base + Σ              whole counts
//   mult — 1 + Σ                 an effective-only multiplier with no config base
//   hyper — 1 − 1/(1 + Σ)      hyperbolic (RoR2): stacks forever, never reaches 100%
// `min` floors the pct factor (so reductions can't reach zero).
export const STATS = {
  moveSpeed:      { mode: 'pct', label: 'Move speed' },
  jumpHeight:     { mode: 'pct', label: 'Jump height' },
  wallRunTime:    { mode: 'pct', label: 'Wall-run time' },
  wallRunUpSpeed: { mode: 'pct', label: 'Wall-run climb speed' },
  glideSpeedMult: { mode: 'pct', label: 'Glide speed' },
  dashCooldown:   { mode: 'pct', label: 'Dash cooldown', min: 0.25 },
  maxHp:          { mode: 'pct', label: 'Max health' },
  fallReduction:  { mode: 'hyper', label: 'Fall damage reduction' },
  damageMult:     { mode: 'mult', label: 'Damage (all)' },
  fireRateMult:   { mode: 'mult', label: 'Fire rate (all)' },
  airJumps:       { mode: 'add', label: 'Air jumps' },
  dashCharges:    { mode: 'add', label: 'Dash charges' },
};

// A percentage stat on the tower ladder: [common, uncommon, rare].
const towerPct = (stat, [c, u, r]) => ({
  id: stat,
  name: STATS[stat].label,
  rolls: { common: { [stat]: c }, uncommon: { [stat]: u }, rare: { [stat]: r } },
});

// Tower (hold zone) table: movement and character upgrades.
// Extra jumps and dashes only exist at Epic and above, so they always outrank a percentage roll.
export const TOWER_TARGETS = [
  towerPct('moveSpeed', [0.02, 0.03, 0.05]),
  towerPct('jumpHeight', [0.06, 0.10, 0.15]),
  towerPct('wallRunTime', [0.04, 0.06, 0.10]),
  towerPct('wallRunUpSpeed', [0.03, 0.05, 0.08]),
  towerPct('glideSpeedMult', [0.03, 0.05, 0.08]),
  towerPct('dashCooldown', [-0.03, -0.05, -0.08]),
  towerPct('maxHp', [0.04, 0.06, 0.10]),
  towerPct('fallReduction', [0.05, 0.08, 0.12]),
  towerPct('damageMult', [0.03, 0.05, 0.08]),
  towerPct('fireRateMult', [0.03, 0.05, 0.08]),
  { id: 'airJump', name: '+1 air jump', rolls: { epic: { airJumps: 1 } } },
  { id: 'dashCharge', name: '+1 dash charge', rolls: { epic: { dashCharges: 1 } } },
  { id: 'jumpAndDash', name: '+1 air jump and +1 dash', rolls: { legendary: { airJumps: 1, dashCharges: 1 } } },
];

// ---------- Level-up table: weapons and skills ----------
// Standard ladder for a weapon/skill percentage stat, and for counts (+1 at Rare/Epic, +2 at Legendary).
export const LADDER_PCT = { common: 0.05, uncommon: 0.08, rare: 0.12, epic: 0.16, legendary: 0.20 };
export const LADDER_COUNT = { rare: 1, epic: 1, legendary: 2 };
export const LADDER_BIG = { common: 0.10, uncommon: 0.15, rare: 0.20, epic: 0.30, legendary: 0.40 }; // skills' main stats
export const LADDER_CD = Object.fromEntries(Object.entries(LADDER_PCT).map(([r, v]) => [r, -v])); // cooldowns shrink

const DMG = { label: 'Damage', ladder: LADDER_PCT };
const RATE = { label: 'Fire rate', ladder: LADDER_PCT };
const COOLDOWN = { label: 'Cooldown', ladder: LADDER_CD };
const count = label => ({ label, ladder: LADDER_COUNT, count: true });

// For DPS estimates only (power index, tools/power-curve.mjs): enemies per m² assumed
// around the player in a dense horde, and how wide a melee satellite's sweep is.
export const AOE_DENSITY = 0.15;
const SWEEP_WIDTH = 1.8;
const area = r => Math.PI * r * r * AOE_DENSITY;
const cdMult = own => Math.max(0.25, 1 + own('cooldown'));

// offerRarity: the rarity a NEW copy is offered at (null = starting weapon, never offered).
// base: the weapon's own numbers (the blaster's live in config). stats: upgradeable stats.
// Bonuses are stored as '<item>.<stat>' in build.bonus and read by the item (build.own),
// not merged into game.eff. estDps(own, eff): DPS before the global damage, fire-rate and
// level multipliers, under the density assumptions above. All values are placeholders.
export const WEAPONS = {
  blaster: {
    name: 'Blaster', offerRarity: null, desc: 'Auto-fires at the nearest enemies.',
    stats: { damage: DMG, fireRate: RATE, projectiles: count('Projectiles'), range: { label: 'Range', ladder: LADDER_PCT } },
    estDps: (own, eff) => eff.damage * (1 + own('damage')) * Math.min(20, eff.projectiles + own('projectiles')) * (1 + own('fireRate')) / eff.fireInterval,
  },
  pulse: {
    name: 'Pulse', offerRarity: 'common', desc: 'Damages everything around you in a sphere, on a beat.',
    base: { damage: 6, interval: 0.8, radius: 4 },
    stats: { damage: DMG, fireRate: { label: 'Pulse rate', ladder: LADDER_PCT }, size: { label: 'Size', ladder: LADDER_PCT } },
    estDps(own) { const b = this.base; return b.damage * (1 + own('damage')) * area(b.radius * (1 + own('size'))) * (1 + own('fireRate')) / b.interval; },
  },
  arc: {
    name: 'Arc', offerRarity: 'common', desc: 'Lightning that jumps from enemy to enemy.',
    base: { damage: 14, interval: 1.2, range: 22, chains: 3, chainRange: 6 },
    stats: { damage: DMG, fireRate: RATE, chains: count('Chains'), chainRange: { label: 'Chain range', ladder: LADDER_PCT } },
    estDps(own) { const b = this.base; return b.damage * (1 + own('damage')) * (1 + b.chains + own('chains')) * (1 + own('fireRate')) / b.interval; },
  },
  meleeDrone: {
    name: 'Melee Drone', offerRarity: 'uncommon', desc: 'Satellites orbit you and hit what they touch.',
    base: { damage: 25, count: 1, orbit: 2.5, spin: 3, active: 4, cooldown: 3, rehit: 0.5 },
    stats: { damage: DMG, cooldown: COOLDOWN, spin: { label: 'Rotation speed', ladder: LADDER_PCT }, count: count('Satellites') },
    estDps(own) {
      const b = this.base, hitsPerSec = b.spin * (1 + own('spin')) * b.orbit * SWEEP_WIDTH * AOE_DENSITY;
      return b.damage * (1 + own('damage')) * (b.count + own('count')) * hitsPerSec * b.active / (b.active + b.cooldown * cdMult(own));
    },
  },
  mortar: {
    name: 'Mortar', offerRarity: 'uncommon', desc: 'Lobs shells into the densest crowd. +50% damage to enemies below you.',
    base: { damage: 30, interval: 2.5, range: 35, radius: 3, shells: 1, below: 0.5, flight: 0.8 },
    stats: { damage: DMG, fireRate: RATE, radius: { label: 'Blast radius', ladder: LADDER_PCT }, shells: count('Shells') },
    estDps(own) { const b = this.base; return b.damage * (1 + own('damage')) * (b.shells + own('shells')) * area(b.radius * (1 + own('radius'))) * (1 + own('fireRate')) / b.interval; },
  },
  gunDrone: {
    name: 'Gun Drone', offerRarity: 'rare', desc: 'Drones follow you and shoot for a while, then recharge.',
    base: { damage: 16, interval: 0.4, range: 22, lifetime: 12, cooldown: 5, count: 1 },
    stats: { damage: DMG, fireRate: RATE, cooldown: COOLDOWN, lifetime: { label: 'Lifetime', ladder: LADDER_PCT }, count: count('Drones') },
    estDps(own) {
      const b = this.base, life = b.lifetime * (1 + own('lifetime'));
      return b.damage * (1 + own('damage')) * (b.count + own('count')) * (1 + own('fireRate')) / b.interval * life / (life + b.cooldown * cdMult(own));
    },
  },
};

// Skills: behaviour lives in skills.js; same shape as WEAPONS, minus estDps (skills are
// conditional, so the power index leaves them out). All values are placeholders.
const BIG = label => ({ label, ladder: LADDER_BIG });
const PCT = label => ({ label, ladder: LADDER_PCT });
export const SKILLS = {
  magnet: {
    name: 'XP Magnet', offerRarity: 'common', desc: 'Pick up XP from further away (+50% radius).',
    base: { radius: 0.5 }, stats: { radius: BIG('Pickup radius') },
  },
  shield: {
    name: 'Shield', offerRarity: 'uncommon', desc: 'A 25-point shield takes hits first. Refills 5 s after you were last hit.',
    base: { amount: 25, delay: 5, refill: 1 }, stats: { amount: BIG('Shield'), delay: { label: 'Recharge delay', ladder: LADDER_CD } },
  },
  retaliation: {
    name: 'Retaliation', offerRarity: 'uncommon', desc: 'Enemies that touch or shoot you take 20 damage back.',
    base: { damage: 20, rehit: 0.5 }, stats: { damage: BIG('Damage') },
  },
  slipstream: {
    name: 'Slipstream', offerRarity: 'uncommon', desc: 'Dashing through enemies deals 25 damage to each.',
    base: { damage: 25, width: 1.2 }, stats: { damage: PCT('Damage'), width: BIG('Dash hit width') },
  },
  momentum: {
    name: 'Momentum', offerRarity: 'uncommon', desc: '+3% damage per m/s you move above your run speed (dashing, falling, sliding).',
    base: { perMs: 0.03, linger: 1 }, stats: { perMs: BIG('Bonus per m/s') },
  },
  impact: {
    name: 'Impact', offerRarity: 'uncommon', desc: 'Landing from above the safe height sends out a shockwave. Bigger drop, bigger wave.',
    base: { damage: 40, radius: 4, dmgPerM: 0.1, radiusPerM: 0.08 }, stats: { damage: PCT('Damage'), radius: PCT('Radius') },
  },
  spider: {
    name: 'Spider', offerRarity: 'rare', desc: 'Run into a wall to run up it, no jump needed.',
    base: {}, stats: { speed: PCT('Wall-run speed'), power: PCT('Wall-jump power') },
  },
  hacker: {
    name: 'Hacker', offerRarity: 'rare', desc: 'While you hold a tower zone, enemies in its sphere take 15 damage per second.',
    base: { dps: 15, tick: 0.25 }, stats: { size: PCT('Sphere size'), damage: PCT('Damage') },
  },
  updraft: {
    name: 'Updraft', offerRarity: 'epic', desc: 'Gliding lifts you for up to 2 s per jump.',
    base: { time: 2, speed: 1.5 }, stats: { time: BIG('Lift duration'), speed: BIG('Lift speed') },
  },
};

const KINDS = [['weapon', WEAPONS, 'weaponSlots'], ['skill', SKILLS, 'skillSlots']];
export const itemInfo = id => WEAPONS[id] ?? SKILLS[id];
export const itemKind = id => (WEAPONS[id] ? 'weapon' : 'skill');

for (const [, table] of KINDS) {
  for (const [id, it] of Object.entries(table)) {
    for (const [stat, s] of Object.entries(it.stats)) {
      STATS[`${id}.${stat}`] = { mode: s.count ? 'add' : 'pct', label: s.label, owner: id };
    }
  }
}

// Targets for a level-up offer: an upgrade card for every owned item below max
// level (one random stat per rolled rarity), and a NEW card for every unowned
// item while a slot of its kind is free (weapons and skills have separate caps).
export function levelTargets(build, cfg) {
  const targets = [];
  for (const [kind, table, slots] of KINDS) {
    const owned = Object.keys(table).filter(id => build.items[id]).length;
    for (const [id, it] of Object.entries(table)) {
      if (build.items[id]) {
        if (build.items[id] >= cfg.maxItemLevel) continue;
        const rolls = {};
        for (const [stat, s] of Object.entries(it.stats)) {
          for (const [r, v] of Object.entries(s.ladder)) (rolls[r] ??= []).push({ [`${id}.${stat}`]: v });
        }
        targets.push({ id, name: it.name, item: id, kind, rolls });
      } else if (it.offerRarity && owned < cfg[slots]) {
        targets.push({ id, name: it.name, item: id, kind, isNew: true, rolls: { [it.offerRarity]: {} } });
      }
    }
  }
  return targets;
}

// Shown when an offer has fewer than three real cards.
export const FILLER = { targetId: 'filler', name: 'Patch up', rarity: 'common', effects: {}, heal: 30, xp: 10 };

export function describeEffects(effects) {
  return Object.entries(effects).map(([stat, v]) => {
    const s = STATS[stat];
    if (s.mode === 'add') return `${v > 0 ? '+' : ''}${v} ${s.label.toLowerCase()}`;
    return `${s.label} ${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
  }).join(', ');
}
