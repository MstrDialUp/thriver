import { WEAPONS } from './catalog.js';

// Power index: estimated total weapon DPS relative to a level-1 blaster with no
// upgrades. Each weapon's estimate is WEAPONS[id].estDps (range and targeting are
// ignored; a dense horde is assumed, see AOE_DENSITY). Shared by the in-game metric
// and tools/power-curve.mjs so both measure the same thing. Pure, no Three.js.

// Playtest 1's auto-scaling blaster at a given level (upgradeMode 'auto').
export function autoCurve(level, baseProjectiles = 2) {
  const lv = level - 1;
  return (1 + 0.15 * lv) / Math.pow(0.97, lv) * Math.min(10, baseProjectiles + Math.floor(lv / 3)) / baseProjectiles;
}

export function powerIndex(build, eff, level) {
  const tower = eff.damageMult * eff.fireRateMult;
  if (eff.upgradeMode === 'auto') return autoCurve(level, eff.projectiles) * tower;
  const none = () => 0;
  let dps = 0;
  for (const id of Object.keys(build.items)) {
    if (WEAPONS[id]) dps += WEAPONS[id].estDps(s => build.own(id, s), eff);
  }
  return eff.levelMult * tower * dps / WEAPONS.blaster.estDps(none, eff);
}

// Playtest 1 (auto) level reached with the same total XP (continuous).
export function autoLevelAtXp(xp) {
  return (-2 + Math.sqrt(4 + 12 * (5 + xp))) / 6;
}

// Character level bonus in offers mode (build.stats → eff.levelMult).
//   curve    — a share of what playtest 1's auto blaster had at the same total XP, so power
//              tracks the old curve by construction; picks, towers and weapons stack on top.
//   compound — (1 + levelDamageBonus)^(level − 1).
export function levelMult(level, cfg) {
  if (cfg.levelPower === 'compound') return Math.pow(1 + cfg.levelDamageBonus, level - 1);
  const old = autoLevelAtXp(xpToReach(level, cfg.levelXpMult));
  return Math.max(1, cfg.levelPowerShare * autoCurve(old, cfg.projectiles));
}

// Total XP needed to reach a level: Σ xpForLevel(1..level-1), with xpForLevel(l) = (5 + 6l) × mult.
export function xpToReach(level, mult = 1) {
  return (level - 1) * (3 * level + 5) * mult;
}
