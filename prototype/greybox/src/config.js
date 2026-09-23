// Every tunable in the grey box. The debug panel edits this object live,
// so systems must read from it each frame rather than caching values.
// Units: metres, seconds, metres/second.

export const defaults = {
  // --- Q1 resolution toggles (synthesis Conflict 1) ---
  rewardsAtHeight: true,   // A: XP caches on rooftops
  holdZones: true,         // B: ground-level Charge-Shrine-style zones
  climbers: true,          // C: non-mechanical enemies climb buildings
  flyers: true,            // C: flying enemies (birds, drones, ... by tier)
  rooftopClosets: true,    // C: some rooftops spawn enemies
  relocation: true,        // D: enemies left far behind teleport back near the player
  fallDamage: true,        // experiment: risk to set against height's reward (wall contact and gliding are safe)

  // --- Run ---
  timeScale: 1,            // multiplies the run clock (boss schedule, difficulty); movement is unaffected
  runLength: 30 * 60,
  bossTimes: [4, 8, 11, 15, 20],   // minutes
  finalBossMinTime: 22,            // minutes
  nuke: true,
  godMode: false,

  // --- Player movement (base kit, design doc §6) ---
  moveSpeed: 9,
  accelGround: 70,
  accelAir: 18,
  gravity: 30,
  jumpHeight: 2.5,         // upgradeable: the jump grows into a superjump
  airJumps: 1,             // double jump; upgradeable
  dashSpeed: 30,
  dashTime: 0.16,
  dashCooldown: 0.9,
  dashCharges: 1,
  slideBoost: 1.35,
  slideTime: 0.8,
  slideFriction: 3,
  wallRunTime: 2.5,        // seconds of wall running per landing
  wallRunUnlimited: false, // Prototype-style unlimited wall running (ignores wallRunTime)
  wallRunUpSpeed: 9,
  wallRunSideGravity: 0.2,
  wallJumpPush: 11,
  glide: true,
  glideFallSpeed: 3,
  glideSpeedMult: 1.2,
  autoVault: false,        // Q13 — off by default so it can be compared
  fallSafeHeight: 8,       // no fall damage below max(this, fallSafeJumpMult × jumpHeight)
  fallSafeJumpMult: 3,     // so an upgraded superjump never punishes its own landing
  fallDmgPerM: 1.5,        // HP per metre above the safe height
  maxHp: 100,

  // --- Camera ---
  camDistance: 7,
  mouseSensitivity: 0.0025,
  stickSensitivity: 3,
  invertY: false,

  // --- Horde ---
  maxEnemies: 600,
  spawnPerSec: 3,
  spawnGrowthPerMin: 1.0,  // extra spawns/sec per run-minute
  climberShare: 0.3,
  flyerShare: 0.25,
  closetShare: 0.3,        // share of ground spawns that come from rooftop closets
  relocateDistance: 70,
  spawnRingMin: 30,
  spawnRingMax: 45,
  fodderOverlap: 0.6,      // 0 = fodder fully separates, 1 = fodder overlaps freely

  // --- Difficulty (two scalers, design doc §8) ---
  slidingPerMin: 0.08,     // time-driven: +8% enemy HP per run-minute
  tierMult: 1.6,           // each tier multiplies enemy HP by this

  // --- Progression ---
  upgradeMode: 'offers',   // offers = pick 1 of 3 per level; auto = playtest 1 (each level scales the blaster); off = no scaling
  levelXpMult: 4,          // offers mode: XP cost per level ×4, which halves the number of levels
  levelPower: 'curve',     // offers mode level bonus: curve = share of playtest 1's power at the same XP; compound = +levelDamageBonus per level
  levelPowerShare: 0.3,    // curve: from tools/power-curve.mjs with all weapons and skills (step 7). Re-run when content or ladders change
  levelDamageBonus: 0.11,  // compound: all-damage per level
  maxItemLevel: 8,
  autoPick: false,         // debug: resolve every offer automatically, rarest card first
  weaponSlots: 4,
  skillSlots: 4,
  towerUpgrades: true,     // completing a hold zone offers a pick-1-of-3 movement/character upgrade
  rarityWeights: { common: 55, uncommon: 26, rare: 12, epic: 5, legendary: 2 },

  // --- Weapon: blaster (starting weapon) ---
  fireInterval: 0.45,
  projectiles: 2,
  damage: 12,
  range: 28,
  projectileSpeed: 45,
  magnetRadius: 4,

  // --- Rewards ---
  cacheCount: 18,
  cacheRespawn: 45,
  holdZoneCount: 3,
  holdZoneRadius: 6,
  holdTime: 6,
  holdDrain: 1.5,          // drain speed relative to fill when outside the zone

  // --- World ---
  layout: 'mixed',         // mixed = Chicago-like towers west, Paris-like low-rise east
  seed: 1,
};

export const config = structuredClone(defaults);

export function resetConfig() {
  Object.assign(config, structuredClone(defaults));
}
