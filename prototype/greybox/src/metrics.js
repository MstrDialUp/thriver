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

export function recordDamage(s, amount, player) {
  if (player.pos.y > ELEVATED) s.damageElevated += amount;
  else s.damageGround += amount;
}

export function summary(s, game) {
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
    zonesHeld: s.zonesDone,
    secondsInZones: Math.round(s.timeInZone),
    rooftopCaches: s.cachesTaken,
    relocations: s.relocations,
    maxAltitude: Math.round(s.maxAltitude),
    bossKillMinutes: s.bossKillTimes,
  };
}

export function fmtClock(sec) {
  const neg = sec < 0, a = Math.abs(sec);
  const m = Math.floor(a / 60), ss = Math.floor(a % 60);
  return `${neg ? '−' : ''}${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
