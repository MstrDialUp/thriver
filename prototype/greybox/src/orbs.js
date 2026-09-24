import * as THREE from 'three';
import { ORB_STATS } from './catalog.js';
import { mulberry32 } from './world.js';

// Crackdown-style orbs (PLAN-playtest2 step 7; Rich, 2026-09-24): many one-time pickups,
// colour-coded by the stat they raise, each worth a fraction of a percent. Placed at run
// start on roofs, floating off building walls, and at street level. The layout comes from
// the world seed, so the same map has the same orbs every run and routes can be learned.

const TOUCH = 1.6;   // pickup distance from the player's centre, metres
const SIZE = 0.35;

export class Orbs {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.list = [];
    this.totals = {};
  }

  reset(world, cfg) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.dispose(); this.mesh = null; }
    this.list = [];
    this.totals = {};
    this.count = 0;
    if (!cfg.orbs) return;
    const rand = mulberry32(cfg.seed * 7919 + 17);
    const nRoof = Math.round(cfg.orbCount * cfg.orbRoofShare), nWall = Math.round(cfg.orbCount * cfg.orbWallShare);
    const quota = { roof: nRoof, wall: nWall, street: Math.max(0, cfg.orbCount - nRoof - nWall) };
    for (const place of ['roof', 'wall', 'street']) {
      for (let n = 0, tries = 0; n < quota[place] && tries < quota[place] * 20; tries++) {
        let p = null;
        if (place === 'roof') { p = world.randomRoofPoint(0, 0, 0, world.half * 2, 1, 10, rand); if (p) p.y += 1; }
        else if (place === 'wall') p = world.randomWallPoint(rand);
        else {
          const x = (rand() * 2 - 1) * (world.half - 2), z = (rand() * 2 - 1) * (world.half - 2);
          if (!world.blockedAt(x, 1, z, 0.8)) p = { x, y: 1, z };
        }
        if (!p) continue;
        const kind = ORB_STATS[Math.floor(rand() * ORB_STATS.length)];
        this.list.push({ x: p.x, y: p.y, z: p.z, place, stat: kind.stat, color: kind.color, taken: false });
        n++;
      }
    }
    this.count = this.list.length;
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(SIZE, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), this.list.length || 1);
    this.mesh.frustumCulled = false;
    const m = new THREE.Matrix4(), c = new THREE.Color();
    this.list.forEach((o, k) => {
      m.makeTranslation(o.x, o.y, o.z);
      this.mesh.setMatrixAt(k, m);
      this.mesh.setColorAt(k, c.setHex(o.color));
    });
    this.mesh.count = this.list.length;
    this.scene.add(this.mesh);
  }

  get taken() { return this.count - this.left; }
  get left() { return this.list.filter(o => !o.taken).length; }

  // The nearest orb still out there, for the audio hum.
  nearest(x, y, z, range) {
    let best = null, bd = range * range;
    for (const o of this.list) {
      if (o.taken) continue;
      const d = (o.x - x) ** 2 + (o.y - y) ** 2 + (o.z - z) ** 2;
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  update(dt, game) {
    if (!this.mesh || !game.cfg.orbs) return;
    const { player, build, cfg, stats } = game, px = player.pos.x, py = player.center, pz = player.pos.z;
    let changed = false;
    for (let k = 0; k < this.list.length; k++) {
      const o = this.list[k];
      if (o.taken) continue;
      const dx = o.x - px, dy = o.y - py, dz = o.z - pz;
      if (dx * dx + dy * dy + dz * dz > TOUCH * TOUCH) continue;
      o.taken = true;
      changed = true;
      const hpBefore = game.eff.maxHp;
      build.addBonus(o.stat, cfg.orbValue);
      this.totals[o.stat] = (this.totals[o.stat] ?? 0) + cfg.orbValue;
      game.eff = build.stats(cfg, game.combat.level);
      game.skills.modifyStats(game.eff, game);
      player.hp += Math.max(0, game.eff.maxHp - hpBefore);
      stats.orbsTaken++;
      stats.orbsByPlace[o.place]++;
      game.sfx?.play('orb', o.x, o.y, o.z);
      this.mesh.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0));
    }
    if (changed) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
