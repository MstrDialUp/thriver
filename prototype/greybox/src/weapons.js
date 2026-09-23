import * as THREE from 'three';
import { TYPES } from './enemies.js';
import { WEAPONS } from './catalog.js';

// Weapons share one interface: constructor(scene), update(dt, game, eff), dispose().
// Numbers come from WEAPONS[id].base (catalog.js) plus the item's own upgrades
// (build.own), times the global damage / fire-rate / level multipliers.
// Shots go through combat's projectile pool; every hit goes through game.damageEnemy.

// Damage and rate multipliers shared by every weapon.
function mults(game, eff, id) {
  const own = s => game.build.own(id, s);
  return {
    own,
    dmg: (1 + own('damage')) * eff.damageMult * eff.levelMult,
    rate: (1 + own('fireRate')) * eff.fireRateMult,
  };
}

const cdMult = own => Math.max(0.25, 1 + own('cooldown'));
const centerY = (horde, i) => horde.y[i] + TYPES[horde.type[i]].h / 2;

export class Blaster {
  constructor() {
    this.id = 'blaster';
    this.timer = 0;
  }

  update(dt, game, eff) {
    const { player, horde, combat } = game;
    const { own, dmg, rate } = mults(game, eff, this.id);
    // upgradeMode 'auto' is playtest 1's behaviour: every level scales the blaster.
    const lv = eff.upgradeMode === 'auto' ? combat.level - 1 : 0;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = eff.fireInterval * Math.pow(0.97, lv) / rate;
    const n = Math.min(20, eff.projectiles + Math.floor(lv / 3) + own('projectiles'));
    const range = eff.range * (1 + own('range'));
    for (const i of combat.nearest(horde, player, n, range)) {
      combat.fire(player.pos.x, player.center + 0.3, player.pos.z, horde.x[i], centerY(horde, i), horde.z[i], eff.projectileSpeed, eff.damage * (1 + 0.15 * lv) * dmg, this.id);
    }
  }

  dispose() {}
}

// Aura / Garlic: a sphere around the player that damages everything inside on a beat.
export class Pulse {
  constructor(scene) {
    this.id = 'pulse';
    this.scene = scene;
    this.timer = 0;
    this.flash = 0;
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 12),
      new THREE.MeshBasicMaterial({ color: 0x9be7ff, transparent: true, opacity: 0, depthWrite: false }),
    );
    scene.add(this.mesh);
  }

  update(dt, game, eff) {
    const { player, horde } = game, b = WEAPONS.pulse.base;
    const { own, dmg, rate } = mults(game, eff, this.id);
    const r = b.radius * (1 + own('size'));
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = b.interval / rate;
      horde.forRadius(player.pos.x, player.center, player.pos.z, r, i => game.damageEnemy(i, b.damage * dmg, this.id));
      this.flash = 0.3;
    }
    this.flash = Math.max(0, this.flash - dt);
    const k = this.flash / 0.3;
    this.mesh.position.set(player.pos.x, player.center, player.pos.z);
    this.mesh.scale.setScalar(r * (1 - 0.3 * k));
    this.mesh.material.opacity = 0.03 + 0.09 * k; // faint: it surrounds the camera's view of the horde
  }

  dispose() { this.scene.remove(this.mesh); }
}

// Chain lightning: hits the nearest enemy, then jumps to the nearest un-hit enemy in chain range.
export class Arc {
  constructor(scene) {
    this.id = 'arc';
    this.scene = scene;
    this.timer = 0;
    this.show = 0;
    this.maxSegs = 24;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.maxSegs * 6), 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xc9a6ff }));
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    scene.add(this.lines);
  }

  update(dt, game, eff) {
    const { player, horde, combat } = game, b = WEAPONS.arc.base;
    const { own, dmg, rate } = mults(game, eff, this.id);
    this.show -= dt;
    this.lines.visible = this.show > 0;
    this.timer -= dt;
    if (this.timer > 0) return;
    const [first] = combat.nearest(horde, player, 1, b.range);
    if (first === undefined) return;
    this.timer = b.interval / rate;
    const chainR = b.chainRange * (1 + own('chainRange')), jumps = b.chains + own('chains');
    const pos = this.lines.geometry.attributes.position;
    const hit = new Set([first]);
    let segs = 0, px = player.pos.x, py = player.center, pz = player.pos.z, cur = first;
    for (let j = 0; j <= jumps && cur !== undefined; j++) {
      const cx = horde.x[cur], cy = centerY(horde, cur), cz = horde.z[cur];
      if (segs < this.maxSegs) pos.array.set([px, py, pz, cx, cy, cz], 6 * segs++);
      game.damageEnemy(cur, b.damage * dmg, this.id);
      px = cx; py = cy; pz = cz;
      let best, bestD = Infinity;
      horde.forRadius(cx, cy, cz, chainR, i => {
        if (hit.has(i)) return;
        const d = (horde.x[i] - cx) ** 2 + (centerY(horde, i) - cy) ** 2 + (horde.z[i] - cz) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      cur = best;
      if (cur !== undefined) hit.add(cur);
    }
    pos.needsUpdate = true;
    this.lines.geometry.setDrawRange(0, segs * 2);
    this.show = 0.12;
  }

  dispose() { this.scene.remove(this.lines); }
}

// King Bible: satellites orbit the player at chest height for a while, then rest.
export class MeleeDrone {
  constructor(scene) {
    this.id = 'meleeDrone';
    this.scene = scene;
    this.angle = 0;
    this.phase = 0;            // time into the current active + cooldown cycle
    this.lastHit = new Map();  // enemy serial → time of last hit (re-hit cooldown)
    this.t = 0;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({ color: 0xff9f43, emissive: 0x663300 }), 16);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.mat = new THREE.Matrix4();
  }

  update(dt, game, eff) {
    const { player, horde } = game, b = WEAPONS.meleeDrone.base;
    const { own, dmg, rate } = mults(game, eff, this.id);
    const cooldown = b.cooldown * cdMult(own) / rate;
    this.t += dt;
    this.phase = (this.phase + dt) % (b.active + cooldown);
    const n = Math.min(16, b.count + own('count'));
    if (this.phase > b.active) { this.mesh.count = 0; this.mesh.instanceMatrix.needsUpdate = true; return; }
    this.angle += b.spin * (1 + own('spin')) * dt;
    for (let k = 0; k < n; k++) {
      const a = this.angle + (k / n) * Math.PI * 2;
      const x = player.pos.x + Math.cos(a) * b.orbit, y = player.center, z = player.pos.z + Math.sin(a) * b.orbit;
      horde.forNear(x, y, z, i => {
        const t = TYPES[horde.type[i]], rr = t.r + 0.5;
        if ((horde.x[i] - x) ** 2 + (horde.z[i] - z) ** 2 > rr * rr || Math.abs(centerY(horde, i) - y) > t.h / 2 + 0.5) return;
        const s = horde.serial[i];
        if (this.t - (this.lastHit.get(s) ?? -9) < b.rehit) return;
        this.lastHit.set(s, this.t);
        game.damageEnemy(i, b.damage * dmg, this.id);
      });
      this.mat.makeRotationY(-a);
      this.mat.setPosition(x, y, z);
      this.mesh.setMatrixAt(k, this.mat);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.lastHit.size > 4000) this.lastHit.clear();
  }

  dispose() { this.scene.remove(this.mesh); }
}

// Lobs shells at the densest cluster in range; bonus damage to enemies below the player.
export class Mortar {
  constructor(scene) {
    this.id = 'mortar';
    this.scene = scene;
    this.timer = 0;
    this.shells = [];   // { sx, sy, sz, tx, ty, tz, t }
    this.blasts = [];   // { mesh, t, r }
    this.shellMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0x444444 }), 32);
    this.shellMesh.frustumCulled = false;
    this.shellMesh.count = 0;
    scene.add(this.shellMesh);
    this.blastGeo = new THREE.SphereGeometry(1, 16, 10);
    this.mat = new THREE.Matrix4();
  }

  // Densest spot: sample enemies in range and keep the one with the most neighbours in blast radius.
  pickTarget(horde, player, range, r) {
    const cands = [];
    const r2 = range * range;
    for (let i = 0; i < horde.alive.length && cands.length < 400; i++) {
      if (!horde.alive[i]) continue;
      const d = (horde.x[i] - player.pos.x) ** 2 + (horde.y[i] - player.pos.y) ** 2 + (horde.z[i] - player.pos.z) ** 2;
      if (d < r2) cands.push(i);
    }
    let best, bestN = -1;
    for (let k = 0; k < Math.min(12, cands.length); k++) {
      const i = cands[Math.floor(Math.random() * cands.length)];
      let n = 0;
      horde.forRadius(horde.x[i], centerY(horde, i), horde.z[i], r, () => n++);
      if (n > bestN) { bestN = n; best = i; }
    }
    return best;
  }

  update(dt, game, eff) {
    const { player, horde } = game, b = WEAPONS.mortar.base;
    const { own, dmg, rate } = mults(game, eff, this.id);
    const r = b.radius * (1 + own('radius'));
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = b.interval / rate;
      const shots = b.shells + own('shells');
      for (let s = 0; s < shots; s++) {
        const i = this.pickTarget(horde, player, b.range, r);
        if (i === undefined) break;
        this.shells.push({ sx: player.pos.x, sy: player.center + 1, sz: player.pos.z, tx: horde.x[i], ty: horde.y[i], tz: horde.z[i], t: 0 });
      }
    }
    let n = 0;
    for (const s of this.shells) {
      s.t += dt / b.flight;
      if (s.t >= 1) {
        const below = player.pos.y - 2;
        horde.forRadius(s.tx, s.ty + 0.5, s.tz, r, i => game.damageEnemy(i, b.damage * dmg * (horde.y[i] < below ? 1 + b.below : 1), this.id));
        const mesh = new THREE.Mesh(this.blastGeo, new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.5, depthWrite: false }));
        mesh.position.set(s.tx, s.ty + 0.5, s.tz);
        this.scene.add(mesh);
        this.blasts.push({ mesh, t: 0, r });
        continue;
      }
      const x = s.sx + (s.tx - s.sx) * s.t, z = s.sz + (s.tz - s.sz) * s.t;
      const y = s.sy + (s.ty - s.sy) * s.t + Math.sin(Math.PI * s.t) * 8; // lob
      if (n < 32) { this.mat.makeTranslation(x, y, z); this.shellMesh.setMatrixAt(n++, this.mat); }
    }
    this.shells = this.shells.filter(s => s.t < 1);
    this.shellMesh.count = n;
    this.shellMesh.instanceMatrix.needsUpdate = true;
    for (const bl of this.blasts) {
      bl.t += dt / 0.3;
      bl.mesh.scale.setScalar(bl.r * (0.5 + 0.5 * bl.t));
      bl.mesh.material.opacity = 0.5 * (1 - bl.t);
      if (bl.t >= 1) { this.scene.remove(bl.mesh); bl.mesh.material.dispose(); }
    }
    this.blasts = this.blasts.filter(bl => bl.t < 1);
  }

  dispose() {
    this.scene.remove(this.shellMesh);
    for (const bl of this.blasts) this.scene.remove(bl.mesh);
  }
}

// Drones follow the player and shoot the nearest enemy; they live for a while, then recharge.
export class GunDrone {
  constructor(scene) {
    this.id = 'gunDrone';
    this.scene = scene;
    this.life = WEAPONS.gunDrone.base.lifetime;  // start deployed
    this.recharge = 0;
    this.timers = [];
    this.pos = [];
    this.mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshLambertMaterial({ color: 0x7bed9f, emissive: 0x1e5a32 }), 12);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.mat = new THREE.Matrix4();
    this.tmp = new THREE.Vector3();
    this.t = 0;
  }

  update(dt, game, eff) {
    const { player, horde, combat } = game, b = WEAPONS.gunDrone.base;
    const { own, dmg, rate } = mults(game, eff, this.id);
    const n = Math.min(12, b.count + own('count'));
    this.t += dt;
    if (this.life > 0) {
      this.life -= dt;
      if (this.life <= 0) this.recharge = b.cooldown * cdMult(own);
    } else if ((this.recharge -= dt) <= 0) {
      this.life = b.lifetime * (1 + own('lifetime'));
    }
    if (this.life <= 0) { this.mesh.count = 0; this.mesh.instanceMatrix.needsUpdate = true; return; }
    for (let k = 0; k < n; k++) {
      // Hover in a slow ring above the player's shoulders, easing toward the slot.
      const a = this.t * 0.8 + (k / n) * Math.PI * 2;
      const tx = player.pos.x + Math.cos(a) * 2, ty = player.center + 1.4, tz = player.pos.z + Math.sin(a) * 2;
      const p = (this.pos[k] ??= new THREE.Vector3(tx, ty, tz));
      p.lerp(this.tmp.set(tx, ty, tz), Math.min(1, 8 * dt));
      this.timers[k] = (this.timers[k] ?? (k * b.interval) / n) - dt;
      if (this.timers[k] <= 0) {
        const [i] = combat.nearest(horde, { pos: p, center: p.y }, 1, b.range);
        if (i !== undefined) {
          this.timers[k] = b.interval / rate;
          combat.fire(p.x, p.y, p.z, horde.x[i], centerY(horde, i), horde.z[i], eff.projectileSpeed, b.damage * dmg, this.id);
        }
      }
      this.mat.makeTranslation(p.x, p.y, p.z);
      this.mesh.setMatrixAt(k, this.mat);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() { this.scene.remove(this.mesh); }
}

export const WEAPON_CLASSES = { blaster: Blaster, pulse: Pulse, arc: Arc, meleeDrone: MeleeDrone, mortar: Mortar, gunDrone: GunDrone };
