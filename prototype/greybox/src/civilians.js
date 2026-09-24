import * as THREE from 'three';

// Civilians (PLAN-playtest2 step 8; Rich, 2026-09-24): pedestrians and cars that keep the
// city full. Enemies are swapped in for pedestrians over the run (director.spawnOne calls
// convert), and the civilian population shrinks as the horde grows. Enemies never target
// civilians, but enemy bullets hit them (friendly fire). The player can destroy them for a
// little XP, less than any enemy that fights back.
//
// Both kinds are lane walkers on the street grid: they move along a street's axis, on a lane
// offset from its centreline, and may turn at junctions. Cars ignore the player (they shove
// you aside and you can ride on them) and are solid boxes registered with the world, so
// collision, bullets and the camera see them. Pedestrians aren't solid; they wander and run
// from the player. Simulated apart from the horde: no flow field, no separation.

const MAX_PED = 800, MAX_CAR = 200;
const PED = { r: 0.3, h: 1.7, hp: 10, walk: 1.4, run: 4.5, turn: 0.35, lane: 6 };
const CAR = { w: 1, len: 2.2, h: 1.5, hp: 60, speed: 10, turn: 0.3, lane: 1.8 };
const HCELL = 4, HASH = 2048;
const FLEE_STOP = 25;

function makePool(n) {
  const p = { n, count: 0, alive: new Uint8Array(n), axis: new Uint8Array(n), dir: new Int8Array(n), flee: new Uint8Array(n), turnAxis: new Uint8Array(n), turnDir: new Int8Array(n) };
  for (const f of ['line', 'off', 'a', 'x', 'z', 'hp', 'turnAt', 'turnLine', 'turnOff', 'decided', 'flash', 'hitT']) p[f] = new Float32Array(n);
  return p;
}

export class Civilians {
  constructor(scene) {
    this.scene = scene;
    this.ped = makePool(MAX_PED);
    this.car = makePool(MAX_CAR);
    this.boxes = Array.from({ length: MAX_CAR }, (_, i) => ({ minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: CAR.h, maxZ: 0, kind: 'civcar', civ: i, stamp: 0 }));
    this.pedMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(PED.r * 2, PED.h, PED.r * 2), new THREE.MeshLambertMaterial({ color: 0xb9a78e }), MAX_PED);
    this.carMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(CAR.w * 2, CAR.h, CAR.len * 2), new THREE.MeshLambertMaterial({ color: 0x93a4b5 }), MAX_CAR);
    for (const m of [this.pedMesh, this.carMesh]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      m.count = 0;
      scene.add(m);
    }
    this.mat = new THREE.Matrix4();
    this.head = new Int32Array(HASH);
    this.next = new Int32Array(MAX_PED);
    this.t = 0;
  }

  clear() {
    for (let i = 0; i < MAX_CAR; i++) if (this.car.alive[i]) this.world?.removeDynamic(this.boxes[i]);
    for (const p of [this.ped, this.car]) { p.alive.fill(0); p.count = 0; }
  }

  reset(game) {
    this.clear();
    this.world = game.world;
    this.t = 0;
    const cfg = game.cfg;
    if (!cfg.civilians) return;
    for (let k = 0; k < cfg.civPedestrians; k++) this.spawn(this.ped, game, 8, cfg.civRing * 0.9, false);
    for (let k = 0; k < cfg.civCars; k++) this.spawn(this.car, game, 10, cfg.civRing * 0.9, false);
  }

  // ---------- lanes ----------
  laneOff(p, axis, dir, i) {
    if (p === this.car) return (axis === 0 ? -dir : dir) * CAR.lane; // opposite directions use opposite lanes
    return (p.off[i] >= 0 ? 1 : -1) * PED.lane;                      // pedestrians keep their side of the street
  }

  setPos(p, i) {
    if (p.axis[i] === 0) { p.x[i] = p.a[i]; p.z[i] = p.line[i] + p.off[i]; }
    else { p.z[i] = p.a[i]; p.x[i] = p.line[i] + p.off[i]; }
  }

  hidden(game, x, z) {
    const yaw = game.cam.yaw, dx = x - game.player.pos.x, dz = z - game.player.pos.z, d = Math.hypot(dx, dz) || 1;
    return (dx * -Math.sin(yaw) + dz * -Math.cos(yaw)) / d < 0.55;
  }

  // Put a new walker on a random lane point in a ring around the player (preferring out of view).
  spawn(p, game, rMin, rMax, wantHidden = true, idx = -1) {
    const world = game.world, lines = world.streetLines, px = game.player.pos.x, pz = game.player.pos.z;
    let i = idx;
    if (i < 0) { i = p.alive.indexOf(0); if (i < 0) return -1; }
    const isCar = p === this.car, lim = world.half - 4;
    for (let tries = 0; tries < 12; tries++) {
      const ang = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
      const x = px + Math.cos(ang) * d, z = pz + Math.sin(ang) * d, axis = Math.random() < 0.5 ? 0 : 1;
      const perp = axis === 0 ? z : x;
      const line = lines.reduce((b, c) => (Math.abs(c - perp) < Math.abs(b - perp) ? c : b), lines[0]);
      const a = Math.max(-lim, Math.min(lim, axis === 0 ? x : z)), dir = Math.random() < 0.5 ? 1 : -1;
      p.axis[i] = axis; p.dir[i] = dir; p.line[i] = line; p.a[i] = a;
      p.off[i] = Math.random() < 0.5 ? 1 : -1; // side seed for pedestrians
      p.off[i] = this.laneOff(p, axis, dir, i);
      this.setPos(p, i);
      const cx = p.x[i], cz = p.z[i];
      if (wantHidden && tries < 10 && !this.hidden(game, cx, cz)) continue;
      if (isCar ? (world.blockedAt(cx, 0.75, cz, CAR.len + 0.3) || Math.hypot(cx - px, cz - pz) < 8) : world.blockedAt(cx, 1, cz, PED.r)) continue;
      if (idx < 0) p.count++;
      p.alive[i] = 1; p.hp[i] = isCar ? CAR.hp : PED.hp; p.flee[i] = 0; p.flash[i] = 0; p.hitT[i] = -9;
      p.turnAt[i] = NaN; p.decided[i] = NaN;
      if (isCar) { this.carBox(i); world.addDynamic(this.boxes[i]); }
      return i;
    }
    if (idx >= 0) this.remove(p, i); // couldn't re-place a recycled one
    return -1;
  }

  remove(p, i) {
    if (!p.alive[i]) return;
    p.alive[i] = 0;
    p.count--;
    if (p === this.car) this.world.removeDynamic(this.boxes[i]);
  }

  carBox(i) {
    const c = this.car, b = this.boxes[i], along = c.axis[i] === 0;
    const hx = along ? CAR.len : CAR.w, hz = along ? CAR.w : CAR.len;
    b.minX = c.x[i] - hx; b.maxX = c.x[i] + hx; b.minZ = c.z[i] - hz; b.maxZ = c.z[i] + hz;
  }

  // Move walker i by v along its lane, planning and taking turns at junctions.
  step(p, i, v, dt, world, turnP) {
    const lines = world.streetLines, dir = p.dir[i];
    let a = p.a[i] + dir * v * dt;
    if (Number.isNaN(p.turnAt[i])) {
      let cross = null;
      for (const c of lines) if (dir * (c - p.a[i]) > 0.01 && (cross === null || Math.abs(c - p.a[i]) < Math.abs(cross - p.a[i]))) cross = c;
      if (cross !== null && Math.abs(cross - p.a[i]) < 10 && p.decided[i] !== cross) {
        p.decided[i] = cross;
        if (Math.random() < turnP) {
          const na = 1 - p.axis[i], nd = Math.random() < 0.5 ? 1 : -1, noff = this.laneOff(p, na, nd, i), at = cross + noff;
          if (dir * (at - p.a[i]) > 0.1) { p.turnAt[i] = at; p.turnAxis[i] = na; p.turnDir[i] = nd; p.turnLine[i] = cross; p.turnOff[i] = noff; }
        }
      }
    }
    if (!Number.isNaN(p.turnAt[i]) && dir * (a - p.turnAt[i]) >= 0) {
      const oldLine = p.line[i];
      a = p.line[i] + p.off[i]; // the old lane's coordinate is where we start on the new axis
      p.axis[i] = p.turnAxis[i]; p.dir[i] = p.turnDir[i]; p.line[i] = p.turnLine[i]; p.off[i] = p.turnOff[i];
      p.turnAt[i] = NaN; p.decided[i] = oldLine; // don't turn straight back onto the street we left
    }
    const lim = world.half - 3;
    if (a > lim || a < -lim) { // map edge: turn around
      a = Math.max(-lim, Math.min(lim, a));
      p.dir[i] = -p.dir[i];
      p.off[i] = this.laneOff(p, p.axis[i], p.dir[i], i);
      p.turnAt[i] = NaN;
    }
    p.a[i] = a;
    this.setPos(p, i);
  }

  update(dt, game) {
    const { cfg, world, player } = game;
    this.t += dt;
    if (!cfg.civilians) { if (this.ped.count || this.car.count) this.reset(game); return; }
    const px = player.pos.x, pz = player.pos.z;
    const frac = Math.max(0, 1 - game.horde.count / cfg.maxEnemies); // fewer civilians as the horde grows

    // Pedestrians: wander, run from the player.
    const P = this.ped;
    for (let i = 0; i < MAX_PED; i++) {
      if (!P.alive[i]) continue;
      if (P.flash[i] > 0) P.flash[i] -= dt;
      const d = Math.hypot(P.x[i] - px, P.z[i] - pz);
      if (d > cfg.civRing) { this.remove(P, i); continue; }
      if (d < cfg.civFleeRadius) P.flee[i] = 1;
      else if (d > FLEE_STOP) P.flee[i] = 0;
      if (P.flee[i]) {
        const pa = P.axis[i] === 0 ? px : pz, away = P.a[i] >= pa ? 1 : -1;
        if (away !== P.dir[i]) { P.dir[i] = away; P.turnAt[i] = NaN; }
      }
      this.step(P, i, P.flee[i] ? PED.run : PED.walk, dt, world, PED.turn);
    }

    // Cars: drive; shove the player aside; carry a player standing on the roof.
    const C = this.car;
    for (let i = 0; i < MAX_CAR; i++) {
      if (!C.alive[i]) continue;
      if (C.flash[i] > 0) C.flash[i] -= dt;
      if (Math.hypot(C.x[i] - px, C.z[i] - pz) > cfg.civRing) { this.remove(C, i); continue; }
      const b = this.boxes[i];
      const riding = player.grounded && Math.abs(player.pos.y - CAR.h) < 0.1 && px > b.minX - 0.3 && px < b.maxX + 0.3 && pz > b.minZ - 0.3 && pz < b.maxZ + 0.3;
      const ox = C.x[i], oz = C.z[i];
      this.step(C, i, CAR.speed, dt, world, CAR.turn);
      this.carBox(i);
      world.updateDynamic(b);
      if (riding) { player.pos.x += C.x[i] - ox; player.pos.z += C.z[i] - oz; }
      else this.shove(i, player, world);
    }

    // Population: top up out of view, or thin out, toward the target for this horde size.
    const want = (pool, base, rMin) => {
      const target = Math.round(base * frac);
      for (let k = 0; k < 6 && pool.count < target; k++) if (this.spawn(pool, game, rMin, cfg.civRing * 0.9) < 0) break;
      for (let k = 0; k < 4 && pool.count > target; k++) {
        let far = -1, fd = -1;
        for (let i = 0; i < pool.n; i++) {
          if (!pool.alive[i] || !this.hidden(game, pool.x[i], pool.z[i])) continue;
          const d = Math.hypot(pool.x[i] - px, pool.z[i] - pz);
          if (d > fd) { fd = d; far = i; }
        }
        if (far < 0) break;
        this.remove(pool, far);
      }
    };
    want(P, cfg.civPedestrians, 40);
    want(C, cfg.civCars, 40);

    this.rebuildHash();
  }

  // A car driving into the player pushes them ahead of its bumper (or onto its roof if that's blocked).
  shove(i, player, world) {
    const b = this.boxes[i], p = player.pos, r = 0.4;
    if (p.y >= b.maxY - 0.3 || p.y + player.height <= 0) return;
    if (!(p.x + r > b.minX && p.x - r < b.maxX && p.z + r > b.minZ && p.z - r < b.maxZ)) return;
    const C = this.car, dir = C.dir[i];
    const nx = C.axis[i] === 0 ? (dir > 0 ? b.maxX + r + 0.05 : b.minX - r - 0.05) : p.x;
    const nz = C.axis[i] === 1 ? (dir > 0 ? b.maxZ + r + 0.05 : b.minZ - r - 0.05) : p.z;
    if (!world.blockedAt(nx, p.y + 0.5, nz, r)) { p.x = nx; p.z = nz; }
    else p.y = b.maxY;
  }

  // ---------- queries ----------
  key(x, z) { return ((Math.floor(x / HCELL) * 73856093) ^ (Math.floor(z / HCELL) * 83492791)) & (HASH - 1); }

  rebuildHash() {
    this.head.fill(-1);
    const P = this.ped;
    for (let i = 0; i < MAX_PED; i++) {
      if (!P.alive[i]) continue;
      const k = this.key(P.x[i], P.z[i]);
      this.next[i] = this.head[k]; this.head[k] = i;
    }
  }

  // Pedestrians whose body is within r of (x, y, z).
  forPeds(x, y, z, r, fn) {
    const P = this.ped, c = Math.ceil(r / HCELL), ix = Math.floor(x / HCELL), iz = Math.floor(z / HCELL), seen = new Set();
    for (let dx = -c - 1; dx <= c + 1; dx++) for (let dz = -c - 1; dz <= c + 1; dz++) {
      const k = (((ix + dx) * 73856093) ^ ((iz + dz) * 83492791)) & (HASH - 1);
      if (seen.has(k)) continue;
      seen.add(k);
      for (let i = this.head[k]; i !== -1; i = this.next[i]) {
        if (!P.alive[i]) continue;
        const ey = Math.max(0, Math.min(y, PED.h)) - y, ex = P.x[i] - x, ez = P.z[i] - z, rr = r + PED.r;
        if (ex * ex + ez * ez <= rr * rr && Math.abs(ey) <= r) fn(i);
      }
    }
  }

  pedAt(x, y, z, r) {
    if (y > PED.h + r) return -1;
    let hit = -1;
    this.forPeds(x, y, z, r, i => { if (hit < 0) hit = i; });
    return hit;
  }

  // Nearest civilians' centres within range, for weapons with nothing else to shoot.
  nearest(x, y, z, n, range) {
    const out = [], r2 = range * range;
    for (const [p, h] of [[this.ped, PED.h], [this.car, CAR.h]]) {
      for (let i = 0; i < p.n; i++) {
        if (!p.alive[i]) continue;
        const d = (p.x[i] - x) ** 2 + (h / 2 - y) ** 2 + (p.z[i] - z) ** 2;
        if (d <= r2) out.push([d, p.x[i], h / 2, p.z[i]]);
      }
    }
    return out.sort((a, b) => a[0] - b[0]).slice(0, n).map(o => o.slice(1));
  }

  // ---------- damage ----------
  // byPlayer: a kill drops XP. Returns true if it killed.
  hurt(p, i, amount, game, byPlayer) {
    if (!p.alive[i] || amount <= 0) return false;
    p.hp[i] -= amount;
    p.flash[i] = 0.08;
    if (p.hp[i] > 0) return false;
    const isCar = p === this.car;
    if (byPlayer) {
      game.stats.civKilled++;
      game.combat.dropGem(p.x[i], isCar ? CAR.h : 0.8, p.z[i], isCar ? game.cfg.civCarXp : game.cfg.civPedXp);
    }
    this.remove(p, i);
    return true;
  }

  damagePed(i, amount, game, byPlayer = true) { return this.hurt(this.ped, i, amount, game, byPlayer); }
  damageCar(i, amount, game, byPlayer = true) { return this.hurt(this.car, i, amount, game, byPlayer); }

  // Area damage from the player. rehit (s): skip civilians this source hit that recently (Melee Drone).
  damageRadius(x, y, z, r, amount, game, rehit = 0) {
    const ok = (p, i) => { if (rehit && this.t - p.hitT[i] < rehit) return false; p.hitT[i] = this.t; return true; };
    this.forPeds(x, y, z, r, i => { if (ok(this.ped, i)) this.damagePed(i, amount, game); });
    const C = this.car;
    for (let i = 0; i < MAX_CAR; i++) {
      if (!C.alive[i]) continue;
      const b = this.boxes[i];
      const dx = Math.max(b.minX - x, 0, x - b.maxX), dy = Math.max(b.minY - y, 0, y - b.maxY), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
      if (dx * dx + dy * dy + dz * dz <= r * r && ok(C, i)) this.damageCar(i, amount, game);
    }
  }

  // Swap an out-of-view pedestrian in the spawn ring for an enemy: returns its spot, or null.
  convert(game) {
    const { cfg, player } = game, P = this.ped;
    for (let i = 0; i < MAX_PED; i++) {
      if (!P.alive[i]) continue;
      const d = Math.hypot(P.x[i] - player.pos.x, P.z[i] - player.pos.z);
      if (d < cfg.spawnRingMin || d > cfg.spawnRingMax || !this.hidden(game, P.x[i], P.z[i])) continue;
      const pt = { x: P.x[i], y: 0, z: P.z[i] };
      this.remove(P, i);
      return pt;
    }
    return null;
  }

  render() {
    const draw = (p, mesh, h) => {
      let n = 0;
      for (let i = 0; i < p.n; i++) {
        if (!p.alive[i]) continue;
        this.mat.makeRotationY(p.axis[i] === 0 ? Math.PI / 2 : 0);
        if (p.flash[i] > 0) this.mat.scale(new THREE.Vector3(1.15, 1.15, 1.15));
        this.mat.setPosition(p.x[i], h / 2, p.z[i]);
        mesh.setMatrixAt(n++, this.mat);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    };
    draw(this.ped, this.pedMesh, PED.h);
    draw(this.car, this.carMesh, CAR.h);
  }
}
