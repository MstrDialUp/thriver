import * as THREE from 'three';
import { TYPES } from './enemies.js';
import { WEAPON_CLASSES } from './weapons.js';

const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);

// The weapon loadout (kept in step with build.items), the shared projectile pool, XP gems, and levels.

const MAX_SHOTS = 400;
const MAX_GEMS = 1500;

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.weapons = new Map();
    this.shotPos = new Float32Array(MAX_SHOTS * 3);
    this.shotVel = new Float32Array(MAX_SHOTS * 3);
    this.shotLife = new Float32Array(MAX_SHOTS);
    this.shotDmg = new Float32Array(MAX_SHOTS);
    this.shotSrc = new Array(MAX_SHOTS);
    this.shotMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff27a }), MAX_SHOTS);
    this.shotMesh.frustumCulled = false;
    scene.add(this.shotMesh);

    this.gemPos = new Float32Array(MAX_GEMS * 3);
    this.gemVal = new Float32Array(MAX_GEMS);
    this.gemVy = new Float32Array(MAX_GEMS);
    this.gemMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0x3cff9e }), MAX_GEMS);
    this.gemMesh.frustumCulled = false;
    scene.add(this.gemMesh);

    this.mat = new THREE.Matrix4();
    this.reset();
  }

  reset(cfg) {
    this.shotLife.fill(0);
    this.gemVal.fill(0);
    for (const w of this.weapons.values()) w.dispose();
    this.weapons.clear();
    this.level = 1;
    this.xp = 0;
    this.xpNext = this.xpForLevel(1, cfg);
  }

  // Offers mode multiplies the cost so there are about half as many level-ups (the total is quadratic in level).
  xpForLevel(l, cfg) { return (5 + l * 6) * (cfg?.upgradeMode === 'offers' ? cfg.levelXpMult : 1); }

  update(dt, game) {
    const { player, horde, world, eff } = game;

    this.syncWeapons(game.build);
    for (const w of this.weapons.values()) w.update(dt, game, eff);

    // ---- shots ----
    let ns = 0;
    for (let s = 0; s < MAX_SHOTS; s++) {
      if (this.shotLife[s] <= 0) continue;
      this.shotLife[s] -= dt;
      const o = s * 3;
      const x = (this.shotPos[o] += this.shotVel[o] * dt);
      const y = (this.shotPos[o + 1] += this.shotVel[o + 1] * dt);
      const z = (this.shotPos[o + 2] += this.shotVel[o + 2] * dt);
      if (y < 0 || world.blockedAt(x, y, z)) { this.shotLife[s] = 0; continue; }
      let hitI = -1;
      horde.forNear(x, y, z, i => {
        if (hitI >= 0) return;
        const t = TYPES[horde.type[i]];
        const dx = horde.x[i] - x, dy = horde.y[i] + t.h / 2 - y, dz = horde.z[i] - z, rr = t.r + 0.3, hh = t.h / 2 + 0.3;
        if (dx * dx + dz * dz < rr * rr && Math.abs(dy) < hh) hitI = i;
      });
      if (hitI >= 0) {
        this.shotLife[s] = 0;
        game.damageEnemy(hitI, this.shotDmg[s], this.shotSrc[s]);
        continue;
      }
      this.mat.makeTranslation(x, y, z);
      this.shotMesh.setMatrixAt(ns++, this.mat);
    }
    this.shotMesh.count = ns;
    this.shotMesh.instanceMatrix.needsUpdate = true;

    // ---- gems ----
    let ng = 0;
    const px = player.pos.x, py = player.center, pz = player.pos.z;
    for (let g = 0; g < MAX_GEMS; g++) {
      if (this.gemVal[g] <= 0) continue;
      const o = g * 3;
      let x = this.gemPos[o], y = this.gemPos[o + 1], z = this.gemPos[o + 2];
      const dx = px - x, dy = py - y, dz = pz - z, d = hyp(dx, dy, dz);
      if (d < 1.0) { this.addXp(this.gemVal[g], game); this.gemVal[g] = 0; continue; }
      if (d < eff.magnetRadius) {
        const s = 18 * dt / d;
        x += dx * s; y += dy * s; z += dz * s;
      } else { // fall to the surface below
        const sup = world.support(x, z, y, 0.2);
        if (y > sup + 0.4) { this.gemVy[g] -= 30 * dt; y = Math.max(sup + 0.4, y + this.gemVy[g] * dt); }
        else this.gemVy[g] = 0;
      }
      this.gemPos[o] = x; this.gemPos[o + 1] = y; this.gemPos[o + 2] = z;
      this.mat.makeTranslation(x, y, z);
      this.gemMesh.setMatrixAt(ng++, this.mat);
    }
    this.gemMesh.count = ng;
    this.gemMesh.instanceMatrix.needsUpdate = true;
  }

  // Create weapons the build has acquired; drop ones it no longer has (level-down undo).
  syncWeapons(build) {
    for (const id of Object.keys(build.items)) {
      if (WEAPON_CLASSES[id] && !this.weapons.has(id)) this.weapons.set(id, new WEAPON_CLASSES[id](this.scene));
    }
    for (const [id, w] of this.weapons) {
      if (!build.items[id]) { w.dispose(); this.weapons.delete(id); }
    }
  }

  // Nearest n enemies to `from` ({ pos, center }) within range.
  nearest(horde, from, n, range) {
    const px = from.pos.x, py = from.center, pz = from.pos.z, r2 = range * range;
    const best = [];
    for (let i = 0; i < horde.alive.length; i++) {
      if (!horde.alive[i]) continue;
      const dx = horde.x[i] - px, dy = horde.y[i] - py, dz = horde.z[i] - pz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d > r2) continue;
      if (best.length < n) best.push([d, i]);
      else if (d < best[n - 1][0]) best[n - 1] = [d, i];
      else continue;
      best.sort((a, b) => a[0] - b[0]);
    }
    return best.map(b => b[1]);
  }

  fire(x, y, z, tx, ty, tz, speed, dmg, source) {
    for (let s = 0; s < MAX_SHOTS; s++) {
      if (this.shotLife[s] > 0) continue;
      const dx = tx - x, dy = ty - y, dz = tz - z, l = hyp(dx, dy, dz) || 1;
      this.shotPos.set([x, y, z], s * 3);
      this.shotVel.set([(dx / l) * speed, (dy / l) * speed, (dz / l) * speed], s * 3);
      this.shotLife[s] = 1.2;
      this.shotDmg[s] = dmg;
      this.shotSrc[s] = source;
      return;
    }
  }

  // Debug: pull every gem on the map onto the player (collected next frame).
  vacuum(player) {
    for (let g = 0; g < MAX_GEMS; g++) if (this.gemVal[g] > 0) this.gemPos.set([player.pos.x, player.center, player.pos.z], g * 3);
  }

  dropGem(x, y, z, value) {
    for (let g = 0; g < MAX_GEMS; g++) {
      if (this.gemVal[g] > 0) continue;
      this.gemPos.set([x, y + 0.4, z], g * 3);
      this.gemVal[g] = value;
      this.gemVy[g] = 0;
      return;
    }
  }

  addXp(v, game) {
    this.xp += v;
    game.stats.xpTotal += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = this.xpForLevel(this.level, game.eff);
      game.hud.flash(`Level ${this.level}`);
      if (game.eff.upgradeMode === 'offers') game.offerLevel();
    }
  }
}
