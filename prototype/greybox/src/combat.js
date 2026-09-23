import * as THREE from 'three';
import { TYPES } from './enemies.js';

const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);

// One stand-in auto weapon, XP gems, and automatic level-ups.
// The real upgrade pool is out of scope for the grey box: each level just
// adds damage, fire rate, and eventually more projectiles, so the power
// curve exists and can be felt.

const MAX_SHOTS = 400;
const MAX_GEMS = 1500;

export class Combat {
  constructor(scene) {
    this.shotPos = new Float32Array(MAX_SHOTS * 3);
    this.shotVel = new Float32Array(MAX_SHOTS * 3);
    this.shotLife = new Float32Array(MAX_SHOTS);
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

  reset() {
    this.shotLife.fill(0);
    this.gemVal.fill(0);
    this.fireTimer = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = this.xpForLevel(1);
  }

  xpForLevel(l) { return 5 + l * 6; }

  get damage() { return this.cfg.damage * (1 + 0.15 * (this.level - 1)); }

  update(dt, game) {
    const { player, horde, world, cfg } = game;
    this.cfg = cfg;

    // ---- fire ----
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = cfg.fireInterval * Math.pow(0.97, this.level - 1);
      const n = Math.min(10, cfg.projectiles + Math.floor((this.level - 1) / 3));
      const targets = this.nearest(horde, player, n, cfg.range);
      for (const i of targets) {
        const t = TYPES[horde.type[i]];
        this.fire(player.pos.x, player.center + 0.3, player.pos.z, horde.x[i], horde.y[i] + t.h / 2, horde.z[i], cfg.projectileSpeed);
      }
    }

    // ---- shots ----
    let ns = 0;
    const dmg = this.damage;
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
        horde.hp[hitI] -= dmg;
        horde.hitFlash[hitI] = 0.08;
        if (horde.hp[hitI] <= 0) game.onEnemyKilled(hitI);
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
      if (d < cfg.magnetRadius) {
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

  nearest(horde, player, n, range) {
    const px = player.pos.x, py = player.center, pz = player.pos.z, r2 = range * range;
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

  fire(x, y, z, tx, ty, tz, speed) {
    for (let s = 0; s < MAX_SHOTS; s++) {
      if (this.shotLife[s] > 0) continue;
      const dx = tx - x, dy = ty - y, dz = tz - z, l = hyp(dx, dy, dz) || 1;
      this.shotPos.set([x, y, z], s * 3);
      this.shotVel.set([(dx / l) * speed, (dy / l) * speed, (dz / l) * speed], s * 3);
      this.shotLife[s] = 1.2;
      return;
    }
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
      this.xpNext = this.xpForLevel(this.level);
      game.hud.flash(`Level ${this.level}`);
    }
  }
}
