import { powerIndex, autoCurve, autoLevelAtXp } from './power.js';

// Q1 measurements. The point of the grey box is to answer "can the horde
// threaten a player with this movement kit?", so we record where the player
// spends time and how much pressure they are under there.

const ELEVATED = 3;      // metres: above this the player counts as "up"
const SURROUNDED = 10;   // enemies within 8 m
const FREE_RADIUS = 20;  // "escaped": no enemy within 20 m

export function newStats() {
  return {
    time: 0, timeElevated: 0, timeSurrounded: 0, timeFree: 0,
    freeStreak: 0, longestFree: 0,
    damageGround: 0, damageElevated: 0,
    timeInZone: 0, zonesDone: 0, cachesTaken: 0,
    kills: 0, relocations: 0, xpTotal: 0,
    bossKillTimes: [], maxAltitude: 0,
    near8: 0, near20: 0,
    damageBySource: {},
    picks: [], menuTime: 0,
    damageFall: 0, hardLandings: 0, maxFall: 0,
    power: [], nextPowerSample: 0,
  };
}

export function tickStats(s, dt, player) {
  s.time += dt;
  const up = player.pos.y > ELEVATED;
  if (up) s.timeElevated += dt;
  if (s.near8 >= SURROUNDED) s.timeSurrounded += dt;
  if (s.near20 === 0) {
    s.timeFree += dt;
    s.freeStreak += dt;
    s.longestFree = Math.max(s.longestFree, s.freeStreak);
  } else s.freeStreak = 0;
  s.maxAltitude = Math.max(s.maxAltitude, player.pos.y);
}

// Fall damage is kept apart so ground/elevated stay comparable with playtest 1.
export function recordDamage(s, amount, player, kind) {
  if (kind === 'fall') s.damageFall += amount;
  else if (player.pos.y > ELEVATED) s.damageElevated += amount;
  else s.damageGround += amount;
}

// Blaster power now, and relative to playtest 1's auto blaster at the same total XP
// (1.0 = as strong as playtest 1 was at this point). See power.js.
export function power(s, game) {
  const index = powerIndex(game.build, game.eff, game.combat.level);
  return { index, vsPlaytest1: index / (autoCurve(autoLevelAtXp(s.xpTotal), game.eff.projectiles) * game.eff.damageMult * game.eff.fireRateMult) };
}

// One sample every 30 real seconds, for Copy metrics JSON.
export function samplePower(s, game) {
  if (s.time < s.nextPowerSample) return;
  s.nextPowerSample += 30;
  const p = power(s, game);
  s.power.push({ t: Math.round(s.time), level: game.combat.level, xp: Math.round(s.xpTotal), index: +p.index.toFixed(2), vsPlaytest1: +p.vsPlaytest1.toFixed(2) });
}

export function summary(s, game) {
  const pw = power(s, game);
  const pct = v => (s.time ? Math.round((100 * v) / s.time) : 0);
  return {
    runClock: fmtClock(game.cfg.runLength - game.director.t),
    realSeconds: Math.round(s.time),
    level: game.combat.level,
    tier: game.tier,
    kills: s.kills,
    pctElevated: pct(s.timeElevated),
    pctSurrounded: pct(s.timeSurrounded),
    pctEscaped: pct(s.timeFree),
    longestEscapeSec: Math.round(s.longestFree),
    damageGround: Math.round(s.damageGround),
    damageElevated: Math.round(s.damageElevated),
    damageFall: Math.round(s.damageFall),
    hardLandings: s.hardLandings,
    maxFallM: Math.round(s.maxFall),
    zonesHeld: s.zonesDone,
    secondsInZones: Math.round(s.timeInZone),
    rooftopCaches: s.cachesTaken,
    upgradesPicked: s.picks.filter(p => p.picked !== 'skip').length,
    secondsInMenus: Math.round(s.menuTime),
    powerIndex: +pw.index.toFixed(2),
    powerVsPlaytest1: +pw.vsPlaytest1.toFixed(2),
    relocations: s.relocations,
    maxAltitude: Math.round(s.maxAltitude),
    bossKillMinutes: s.bossKillTimes,
    damageBySource: Object.fromEntries(Object.entries(s.damageBySource).map(([k, v]) => [k, Math.round(v)])),
  };
}

export function fmtClock(sec) {
  const neg = sec < 0, a = Math.abs(sec);
  const m = Math.floor(a / 60), ss = Math.floor(a % 60);
  return `${neg ? '−' : ''}${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
