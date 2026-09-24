import { TYPES, T, FLYER_TYPES } from './enemies.js';

// Run clock, spawning, boss schedule, tiers, and the nuke (design doc §5, §8).
//
// Two difficulty scalers: sliding (time: +slidingPerMin HP per minute) and
// tiered (x tierMult per lower-boss kill). Lower bosses spawn at fixed times,
// never despawn, and each kill raises the tier by exactly one regardless of
// which boss it was. The final boss needs all five dead and the clock >= 22:00.

export class Director {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.t = 0;                 // run clock, seconds (scaled by timeScale)
    this.spawnAcc = 0;
    this.bossesSpawned = 0;
    this.bossesKilled = 0;
    this.finalSpawned = false;
    this.finalKilled = false;
    this.nuked = false;
    this.flowTimer = 0;
  }

  get minutes() { return this.t / 60; }
  get remaining() { return this.game.cfg.runLength - this.t; }

  hpMult() {
    const { cfg, tier } = this.game;
    return (1 + cfg.slidingPerMin * this.minutes) * Math.pow(cfg.tierMult, tier - 1);
  }

  // Health scales faster than damage (RoR2): failure should be "overwhelmed", not one-shot.
  dmgMult() { return Math.sqrt(this.hpMult()); }

  // Enemy bullets start slow and speed up with run time, not tier (players who avoid bosses stay low-tier).
  bulletSpeed() {
    const c = this.game.cfg, k = Math.min(1, this.minutes / c.bulletSpeedRampMin);
    return c.bulletSpeedMin + (c.bulletSpeedMax - c.bulletSpeedMin) * k;
  }

  // Civilians only for the opening seconds (PLAN-playtest2 step 8).
  get civOnly() { return this.game.cfg.civilians && this.t < this.game.cfg.civOnlyTime; }

  update(dt) {
    const g = this.game, cfg = g.cfg;
    this.t += dt * cfg.timeScale;

    this.flowTimer -= dt;
    if (this.flowTimer <= 0) {
      this.flowTimer = 0.2;
      g.world.computeFlow(g.player.pos.x, g.player.pos.y, g.player.pos.z);
    }

    // Horde spawning.
    const rate = this.civOnly ? 0 : cfg.spawnPerSec + cfg.spawnGrowthPerMin * this.minutes;
    this.spawnAcc += rate * dt * cfg.timeScale;
    let guard = 0;
    while (this.spawnAcc >= 1 && guard++ < 50) {
      this.spawnAcc -= 1;
      if (g.horde.count >= cfg.maxEnemies) { this.spawnAcc = 0; break; }
      this.spawnOne();
    }

    // Lower bosses on schedule.
    const bossTimes = cfg.bossTimes;
    while (this.bossesSpawned < bossTimes.length && this.t >= bossTimes[this.bossesSpawned] * 60) {
      this.bossesSpawned++;
      this.spawnBoss(T.boss);
      g.hud.flash(`Lower boss ${this.bossesSpawned} has arrived`);
    }

    // Final boss gate.
    if (!this.finalSpawned && this.bossesKilled >= bossTimes.length && this.t >= cfg.finalBossMinTime * 60) {
      this.finalSpawned = true;
      this.spawnBoss(T.final);
      g.hud.flash('FINAL BOSS');
    }

    // The nuke.
    if (this.remaining <= 0 && cfg.nuke) {
      if (!this.nuked) {
        this.nuked = true;
        g.damagePlayer(g.eff.maxHp * 0.6, 'nuke');
        g.hud.nukeFlash();
      }
      const over = -this.remaining;
      g.damagePlayer(5 * Math.pow(2, over / 15) * dt * cfg.timeScale, 'nuke');
    }
  }

  pickType() {
    const cfg = this.game.cfg, r = Math.random();
    if (cfg.flyers && r < cfg.flyerShare) {
      const pool = FLYER_TYPES.filter(i => TYPES[i].minTier <= this.game.tier);
      const total = pool.reduce((s, i) => s + TYPES[i].weight, 0);
      let x = Math.random() * total;
      for (const i of pool) if ((x -= TYPES[i].weight) <= 0) return i;
      return pool[0];
    }
    if (cfg.climbers && r < cfg.flyerShare + cfg.climberShare) return T.climber;
    return T.walker;
  }

  spawnPoint(typeIdx, closetRoll = Math.random()) {
    const g = this.game, cfg = g.cfg, p = g.player.pos, t = TYPES[typeIdx];
    if (t.kind === 'flyer' || t.kind === 'jet') {
      const a = Math.random() * Math.PI * 2, d = cfg.spawnRingMin + Math.random() * (cfg.spawnRingMax - cfg.spawnRingMin);
      const x = g.world.clamp(p.x + Math.cos(a) * d), z = g.world.clamp(p.z + Math.sin(a) * d);
      const sup = g.world.support(x, z, 500, t.r);
      return { x, y: Math.max(sup + 3, p.y + 5 + Math.random() * 15), z };
    }
    // C — rooftop monster closets
    if (cfg.rooftopClosets && g.world.closets.length && closetRoll < cfg.closetShare) {
      const cands = g.world.closets.filter(b => {
        const d = Math.hypot((b.minX + b.maxX) / 2 - p.x, (b.minZ + b.maxZ) / 2 - p.z);
        return d > 15 && d < 80;
      });
      if (cands.length) {
        const b = cands[Math.floor(Math.random() * cands.length)];
        return { x: (b.minX + b.maxX) / 2 + (Math.random() - 0.5) * 3, y: b.maxY, z: (b.minZ + b.maxZ) / 2 + (Math.random() - 0.5) * 3 };
      }
    }
    const s = g.world.randomStreetPoint(p.x, p.z, cfg.spawnRingMin, cfg.spawnRingMax);
    return s ? { x: s.x, y: 0, z: s.z } : null;
  }

  spawnOne() {
    const type = this.pickType(), t = TYPES[type];
    // A new street-level enemy takes the place of a pedestrian out of view, so the city "turns".
    const cfg = this.game.cfg, ground = t.kind === 'ground' || t.kind === 'climber';
    const closetRoll = Math.random(), closet = cfg.rooftopClosets && closetRoll < cfg.closetShare;
    const pt = (ground && !closet && cfg.civilians && this.game.civ.convert(this.game)) || this.spawnPoint(type, closetRoll);
    if (!pt) return;
    this.game.horde.spawn(type, pt.x, pt.y, pt.z, this.game.tier, this.hpMult(), this.dmgMult());
  }

  spawnBoss(type) {
    const g = this.game;
    const s = g.world.randomStreetPoint(g.player.pos.x, g.player.pos.z, 35, 50, 40) ?? { x: g.player.pos.x + 40, z: g.player.pos.z };
    const hp = type === T.final ? this.hpMult() : this.hpMult() * (0.6 + 0.4 * (this.bossesSpawned)) * g.cfg.bossHpMult;
    g.horde.spawn(type, s.x, 0, s.z, g.tier, hp, this.dmgMult());
  }

  // D — move an enemy that fell far behind to a fresh point near the player.
  relocate(i) {
    const g = this.game, h = g.horde;
    const pt = this.spawnPoint(h.type[i]);
    if (!pt) return;
    h.x[i] = pt.x; h.y[i] = pt.y; h.z[i] = pt.z;
    h.vx[i] = h.vy[i] = h.vz[i] = 0;
    g.stats.relocations++;
  }

  onKilled(i) {
    const g = this.game, t = TYPES[g.horde.type[i]];
    if (t.final) {
      this.finalKilled = true;
      g.onFinalBossKilled();
    } else if (t.boss) {
      this.bossesKilled++;
      g.tier = Math.min(g.tier + 1, 6); // sequential: one tier per kill, whichever boss it was
      g.stats.bossKillTimes.push(+(this.t / 60).toFixed(2));
      g.hud.flash(`Boss down — tier ${g.tier}`);
    }
  }

  // Debug helper: jump the clock to just before the next scheduled boss.
  skipToNextBoss() {
    const next = this.game.cfg.bossTimes[this.bossesSpawned];
    if (next !== undefined) this.t = Math.max(this.t, next * 60 - 1);
    else this.t = Math.max(this.t, this.game.cfg.finalBossMinTime * 60 - 1);
  }
}
