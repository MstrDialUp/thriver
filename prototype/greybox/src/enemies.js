import * as THREE from 'three';

// The horde, stored as flat typed arrays (data-oriented, cheap to iterate),
// rendered with one InstancedMesh per type.
//
// kind 'ground'  — follows the street-level flow field, never climbs
// kind 'climber' — like ground, but climbs any wall between it and a higher player
// kind 'flyer'   — flies straight at the player (ranged ones hold a distance and shoot)
// kind 'jet'     — high-speed strafing passes
//
// Collision rule (design doc §8): fodder may partly overlap; bosses have right of way;
// ground agents are never pushed upward (no Megabonk-style piles).

export const TYPES = [
  { name: 'walker',  kind: 'ground',  hp: 20,    speed: 5.2, r: 0.45, h: 1.7, dmg: 12, xp: 1,  color: 0xd9534f },
  { name: 'climber', kind: 'climber', hp: 24,    speed: 4.6, r: 0.45, h: 1.2, dmg: 12, xp: 2,  color: 0xe67e22, climb: 5 },
  { name: 'bird',    kind: 'flyer',   hp: 8,     speed: 9,   r: 0.35, h: 0.35, dmg: 6, xp: 1,  color: 0x5dade2, minTier: 1, weight: 4 },
  { name: 'drone',   kind: 'flyer',   hp: 18,    speed: 6,   r: 0.45, h: 0.3, dmg: 5,  xp: 2,  color: 0xaab7b8, minTier: 1, weight: 2, ranged: true, keepDist: 14, fireEvery: 2.2, bulletDmg: 8 },
  { name: 'bigbird', kind: 'flyer',   hp: 45,    speed: 10,  r: 0.7,  h: 0.6, dmg: 14, xp: 4,  color: 0x2874a6, minTier: 2, weight: 3 },
  { name: 'heli',    kind: 'flyer',   hp: 180,   speed: 5,   r: 1.5,  h: 1.6, dmg: 20, xp: 12, color: 0x1e8449, minTier: 3, weight: 0.6, ranged: true, keepDist: 20, fireEvery: 1.2, bulletDmg: 10 },
  { name: 'jet',     kind: 'jet',     hp: 70,    speed: 26,  r: 1.0,  h: 0.6, dmg: 35, xp: 8,  color: 0x8e44ad, minTier: 4, weight: 0.6 },
  { name: 'hero',    kind: 'flyer',   hp: 320,   speed: 11,  r: 0.6,  h: 1.8, dmg: 30, xp: 25, color: 0xf4d03f, minTier: 5, weight: 0.4 },
  { name: 'boss',    kind: 'climber', hp: 1500,  speed: 4.4, r: 2.2,  h: 5,   dmg: 30, xp: 60, color: 0x7b241c, climb: 4, boss: true },
  { name: 'final',   kind: 'climber', hp: 12000, speed: 4.8, r: 3,    h: 8,   dmg: 45, xp: 0,  color: 0x111111, climb: 4.5, boss: true, final: true },
];
export const T = Object.fromEntries(TYPES.map((t, i) => [t.name, i]));
// Flat per-type tables for the hot loops.
const TR = Float32Array.from(TYPES, t => t.r);
const TH = Float32Array.from(TYPES, t => t.h);
const TBOSS = Uint8Array.from(TYPES, t => (t.boss ? 1 : 0));
const TBASIC = Uint8Array.from(TYPES, t => (t.name === 'walker' || t.name === 'bird' ? 1 : 0));
const TFLY = Uint8Array.from(TYPES, t => (t.kind === 'flyer' ? 1 : 0));
const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c); // Math.hypot is slow in V8
export const FLYER_TYPES = TYPES.map((t, i) => i).filter(i => TYPES[i].minTier);

const MAX = 2500;
const HASH = 8192;
const CELL = 4;          // hash for projectile hits (covers boss radii)
const SEP_CELL = 1.5;    // finer hash for separating ordinary enemies
const SEP_CELL_Y = 2;
const GRAV = 30;
const MAX_BULLETS = 500;

export class Horde {
  constructor(scene) {
    this.scene = scene;
    this.alive = new Uint8Array(MAX);
    this.type = new Uint8Array(MAX);
    this.spawnTier = new Uint8Array(MAX);
    this.climbing = new Uint8Array(MAX);
    this.serial = new Uint32Array(MAX); // bumped on every spawn, so a stale index can be detected
    this.nextSerial = 1;
    this.touching = [];                 // enemies in contact with the player this frame
    for (const f of ['x', 'y', 'z', 'vx', 'vy', 'vz', 'hp', 'maxHp', 'dmgMult', 'fireT', 'hitFlash']) this[f] = new Float32Array(MAX);
    this.free = [];
    for (let i = MAX - 1; i >= 0; i--) this.free.push(i);
    this.count = 0;
    this.cellHead = new Int32Array(HASH);
    this.cellNext = new Int32Array(MAX);
    this.pushX = new Float32Array(MAX);
    this.pushY = new Float32Array(MAX);
    this.pushZ = new Float32Array(MAX);
    this.tmp = { x: 0, z: 0 };
    this.keys = new Int32Array(27);
    this.sepHead = new Int32Array(HASH);
    this.sepNext = new Int32Array(MAX);
    this.bossList = [];

    this.meshes = TYPES.map(t => {
      const geo = t.kind === 'jet' ? new THREE.ConeGeometry(t.r, 3.2, 6).rotateX(Math.PI / 2)
        : t.name === 'hero' ? new THREE.CapsuleGeometry(t.r * 0.7, t.h - t.r * 1.4, 3, 8)
        : new THREE.BoxGeometry(t.r * 2, t.h, t.r * 2);
      const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: t.color }), MAX);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.count = 0;
      m.frustumCulled = false;
      scene.add(m);
      return m;
    });
    this.mat = new THREE.Matrix4();

    // Tall beams so bosses can be found in a vertical city.
    this.beams = Array.from({ length: 8 }, () => {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 200, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.25, depthWrite: false }),
      );
      b.visible = false;
      scene.add(b);
      return b;
    });

    // Enemy bullets
    this.bx = new Float32Array(MAX_BULLETS * 3);
    this.bv = new Float32Array(MAX_BULLETS * 3);
    this.bLife = new Float32Array(MAX_BULLETS);
    this.bDmg = new Float32Array(MAX_BULLETS);
    this.bSrc = new Int32Array(MAX_BULLETS);
    this.bSrcSerial = new Uint32Array(MAX_BULLETS);
    this.liveBullets = [];
    this.bulletMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.25, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3355 }), MAX_BULLETS);
    this.bulletMesh.count = 0;
    this.bulletMesh.frustumCulled = false;
    scene.add(this.bulletMesh);
  }

  clear() {
    this.alive.fill(0);
    this.free = [];
    for (let i = MAX - 1; i >= 0; i--) this.free.push(i);
    this.count = 0;
    this.bLife.fill(0);
    this.liveBullets.length = 0;
  }

  spawn(typeIdx, x, y, z, tier, hpMult, dmgMult) {
    if (!this.free.length) return -1;
    const i = this.free.pop();
    const t = TYPES[typeIdx];
    this.alive[i] = 1; this.type[i] = typeIdx; this.spawnTier[i] = tier;
    this.serial[i] = this.nextSerial++;
    this.x[i] = x; this.y[i] = y; this.z[i] = z;
    this.vx[i] = this.vy[i] = this.vz[i] = 0;
    this.hp[i] = this.maxHp[i] = t.hp * hpMult;
    this.dmgMult[i] = dmgMult;
    this.fireT[i] = (t.fireEvery ?? 1) * Math.random();
    this.climbing[i] = 0;
    this.hitFlash[i] = 0;
    this.count++;
    return i;
  }

  kill(i) {
    this.alive[i] = 0;
    this.free.push(i);
    this.count--;
  }

  // ---------- spatial hash ----------
  hashKey(x, y, z) {
    const ix = Math.floor(x / CELL), iy = Math.floor(y / CELL), iz = Math.floor(z / CELL);
    return ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) & (HASH - 1);
  }

  rebuildHash() {
    this.cellHead.fill(-1);
    for (let i = 0; i < MAX; i++) {
      if (!this.alive[i]) continue;
      const k = this.hashKey(this.x[i], this.y[i], this.z[i]);
      this.cellNext[i] = this.cellHead[k];
      this.cellHead[k] = i;
    }
  }

  // Calls fn(i) for enemies in the 27 cells around a point (may include some farther ones).
  forNear(x, y, z, fn) {
    const n = this.neighbourKeys(Math.floor(x / CELL), Math.floor(y / CELL), Math.floor(z / CELL));
    for (let q = 0; q < n; q++) {
      for (let i = this.cellHead[this.keys[q]]; i !== -1; i = this.cellNext[i]) if (this.alive[i]) fn(i);
    }
  }

  // Every live enemy whose centre is within r of (x, y, z). For radii beyond forNear's one-cell reach.
  forRadius(x, y, z, r, fn) {
    const c = Math.ceil(r / CELL), ix = Math.floor(x / CELL), iy = Math.floor(y / CELL), iz = Math.floor(z / CELL);
    const seen = new Set(), r2 = r * r;
    for (let dx = -c; dx <= c; dx++) for (let dy = -c; dy <= c; dy++) for (let dz = -c; dz <= c; dz++) {
      const k = (((ix + dx) * 73856093) ^ ((iy + dy) * 19349663) ^ ((iz + dz) * 83492791)) & (HASH - 1);
      if (seen.has(k)) continue;
      seen.add(k);
      for (let i = this.cellHead[k]; i !== -1; i = this.cellNext[i]) {
        if (!this.alive[i]) continue;
        const ex = this.x[i] - x, ey = this.y[i] + TYPES[this.type[i]].h / 2 - y, ez = this.z[i] - z;
        if (ex * ex + ey * ey + ez * ez <= r2) fn(i);
      }
    }
  }

  // Fills this.keys with the distinct hash keys of the 27 cells around (ix, iy, iz).
  neighbourKeys(ix, iy, iz) {
    const keys = this.keys;
    let n = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const k = (((ix + dx) * 73856093) ^ ((iy + dy) * 19349663) ^ ((iz + dz) * 83492791)) & (HASH - 1);
      let dup = false;
      for (let q = 0; q < n; q++) if (keys[q] === k) { dup = true; break; }
      if (!dup) keys[n++] = k;
    }
    return n;
  }

  // ---------- simulation ----------
  update(dt, game) {
    const { player, world, cfg, stats } = game;
    const px = player.pos.x, py = player.pos.y, pz = player.pos.z, pcy = player.center;
    const tmp = this.tmp;
    let near8 = 0, near20 = 0, contactDps = 0;
    this.touching.length = 0;

    for (let i = 0; i < MAX; i++) {
      if (!this.alive[i]) continue;
      const t = TYPES[this.type[i]];
      let x = this.x[i], y = this.y[i], z = this.z[i];
      if (this.hitFlash[i] > 0) this.hitFlash[i] -= dt;

      if (t.kind === 'ground' || t.kind === 'climber') {
        let dx, dz;
        const dir = y < 0.6 ? world.flowDir(x, z, tmp) : null;
        if (dir) { dx = dir.x; dz = dir.z; }
        else {
          dx = px - x; dz = pz - z;
          const l = hyp(dx, dz) || 1; dx /= l; dz /= l;
          if (l < 0.5) { dx = dz = 0; }
        }
        const nx = x + dx * t.speed * dt, nz = z + dz * t.speed * dt;
        const blk = world.blockedAt(nx, y + 0.3, nz, t.r * 0.8);
        const wantsUp = t.kind === 'climber' && py > y + 1.2;
        this.climbing[i] = 0;
        if (blk && wantsUp) {
          y += t.climb * dt;          // climb the wall; horizontal motion resumes once over the top
          this.vy[i] = 0;
          this.climbing[i] = 1;
        } else if (blk) {
          if (!world.blockedAt(nx, y + 0.3, z, t.r * 0.8)) x = nx;
          else if (!world.blockedAt(x, y + 0.3, nz, t.r * 0.8)) z = nz;
        } else { x = nx; z = nz; }
        if (!this.climbing[i]) {
          const sup = world.support(x, z, y, t.r * 0.6);
          this.vy[i] -= GRAV * dt;
          y += this.vy[i] * dt;
          if (y <= sup) { y = sup; this.vy[i] = 0; }
        }
        this.vx[i] = dx; this.vz[i] = dz; // facing only
      } else if (t.kind === 'flyer') {
        let tx = px, ty = pcy + 0.5, tz = pz;
        if (t.ranged) {
          let ax = x - px, az = z - pz;
          const l = hyp(ax, az) || 1;
          tx = px + (ax / l) * t.keepDist; tz = pz + (az / l) * t.keepDist; ty = py + 6;
        }
        let dx = tx - x, dy = ty - y, dz = tz - z;
        const l = hyp(dx, dy, dz) || 1;
        const k = Math.min(1, dt * 3);
        this.vx[i] += ((dx / l) * t.speed - this.vx[i]) * k;
        this.vy[i] += ((dy / l) * t.speed - this.vy[i]) * k;
        this.vz[i] += ((dz / l) * t.speed - this.vz[i]) * k;
        const nx = x + this.vx[i] * dt, ny = y + this.vy[i] * dt, nz = z + this.vz[i] * dt;
        const blk = world.blockedAt(nx, ny, nz, t.r);
        if (blk) { y += t.speed * dt; this.vy[i] = Math.max(0, this.vy[i]); } // rise over buildings
        else { x = nx; y = ny; z = nz; }
        if (y < 0.5) y = 0.5;
        if (t.ranged) {
          this.fireT[i] -= dt;
          const d = hyp(px - x, pcy - y, pz - z);
          if (this.fireT[i] <= 0 && d < t.keepDist * 1.8) {
            this.fireT[i] = t.fireEvery * (0.8 + Math.random() * 0.4);
            // Bullets scale more gently than contact damage, and speed up over the run (PLAN-playtest2 step 4).
            this.fireBullet(x, y, z, px, pcy, pz, t.bulletDmg * Math.pow(this.dmgMult[i], cfg.bulletDmgExp), i, game.director.bulletSpeed());
            game.sfx?.play('enemyShot', x, y, z);
          }
        }
      } else if (t.kind === 'jet') {
        let vx = this.vx[i], vz = this.vz[i];
        const dx = px - x, dz = pz - z, d = hyp(dx, dz);
        if ((!vx && !vz) || (d > 90 && dx * vx + dz * vz < 0)) { // (re)aim a pass at the player
          vx = (dx / (d || 1)) * t.speed; vz = (dz / (d || 1)) * t.speed;
        }
        x += vx * dt; z += vz * dt;
        const ty = pcy + 0.5;
        y += Math.sign(ty - y) * Math.min(Math.abs(ty - y), 8 * dt);
        const blk = world.blockedAt(x, y, z, t.r);
        if (blk) y = blk.maxY + 1;
        this.vx[i] = vx; this.vz[i] = vz;
      }

      x = world.clamp(x, t.r); z = world.clamp(z, t.r);
      this.x[i] = x; this.y[i] = y; this.z[i] = z;

      // contact damage + pressure metrics
      const ex = x - px, ey = (y + t.h / 2) - pcy, ez = z - pz;
      const d2 = ex * ex + ey * ey + ez * ez;
      const reach = t.r + 0.6;
      if (d2 < reach * reach) { contactDps += t.dmg * this.dmgMult[i]; this.touching.push(i); }
      if (d2 < 64) near8++;
      if (d2 < 400) near20++;

      // D — relocation: enemies left far behind reappear around the player (bosses included).
      if (cfg.relocation && t.kind !== 'jet') {
        const far = ex * ex + ez * ez > cfg.relocateDistance * cfg.relocateDistance;
        if (far) game.director.relocate(i);
      }
    }

    this.separate(dt, cfg, game.tier, world);
    this.updateBullets(dt, game);

    stats.near8 = near8;
    stats.near20 = near20;
    return contactDps;
  }

  separate(dt, cfg, tier, world) {
    this.rebuildHash(); // coarse hash, used by projectile hits afterwards
    const X = this.x, Y = this.y, Z = this.z, type = this.type, alive = this.alive, st = this.spawnTier;
    const head = this.sepHead, next = this.sepNext, keys = this.keys;
    const PX = this.pushX, PY = this.pushY, PZ = this.pushZ;
    PX.fill(0); PY.fill(0); PZ.fill(0);
    const fodderK = 1 - cfg.fodderOverlap;

    // Fine hash of ordinary enemies; bosses are handled in their own pass.
    head.fill(-1);
    const bosses = this.bossList;
    bosses.length = 0;
    for (let i = 0; i < MAX; i++) {
      if (!alive[i]) continue;
      if (TBOSS[type[i]]) { bosses.push(i); continue; }
      const k = ((Math.floor(X[i] / SEP_CELL) * 73856093) ^ (Math.floor(Y[i] / SEP_CELL_Y) * 19349663) ^ (Math.floor(Z[i] / SEP_CELL) * 83492791)) & (HASH - 1);
      next[i] = head[k]; head[k] = i;
    }

    const pair = (i, j, wi, wj, k) => {
      const ti = type[i], tj = type[j], hi = TH[ti], hj = TH[tj];
      const dy = (Y[j] + hj / 2) - (Y[i] + hi / 2);
      if (dy > (hi + hj) / 2 || -dy > (hi + hj) / 2) return; // different heights: no interaction
      const dx = X[j] - X[i], dz = Z[j] - Z[i], rr = TR[ti] + TR[tj];
      const d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2) || 0.01, m = (rr - d) * k, ux = (dx / d) * m, uz = (dz / d) * m;
      PX[i] -= ux * wi; PZ[i] -= uz * wi;
      PX[j] += ux * wj; PZ[j] += uz * wj;
      if (TFLY[ti] && TFLY[tj]) {                 // flyers may separate vertically too
        const s = (dy >= 0 ? 1 : -1) * m * 0.5;
        PY[i] -= s * wi; PY[j] += s * wj;
      }
    };

    for (let i = 0; i < MAX; i++) {
      if (!alive[i] || TBOSS[type[i]]) continue;
      const fi = st[i] < tier || TBASIC[type[i]];
      const n = this.neighbourKeys(Math.floor(X[i] / SEP_CELL), Math.floor(Y[i] / SEP_CELL_Y), Math.floor(Z[i] / SEP_CELL));
      for (let q = 0; q < n; q++) {
        for (let j = head[keys[q]]; j !== -1; j = next[j]) {
          if (j <= i) continue;
          const k = fi && (st[j] < tier || TBASIC[type[j]]) ? fodderK : 1; // fodder may overlap
          pair(i, j, 0.5, 0.5, k);
        }
      }
    }
    // Right of way: bosses push everything else and are never pushed by non-bosses.
    for (const b of bosses) {
      for (let j = 0; j < MAX; j++) {
        if (!alive[j] || j === b) continue;
        if (TBOSS[type[j]]) { if (j > b) pair(b, j, 0.5, 0.5, 1); }
        else pair(b, j, 0, 1, 1);
      }
    }

    for (let i = 0; i < MAX; i++) {
      if (!alive[i]) continue;
      const px = PX[i], pz = PZ[i], py = PY[i];
      if (!px && !pz && !py) continue;
      const nx = X[i] + (px > 1 ? 1 : px < -1 ? -1 : px), nz = Z[i] + (pz > 1 ? 1 : pz < -1 ? -1 : pz);
      // Sideways only (ground agents are never pushed up — no piles), and never into buildings.
      if (!world.blockedAt(nx, Y[i] + 0.3, nz, TR[type[i]] * 0.8)) { X[i] = nx; Z[i] = nz; }
      if (py) Y[i] += py > 1 ? 1 : py < -1 ? -1 : py;
    }
  }

  fireBullet(x, y, z, tx, ty, tz, dmg, src = -1, s = 18) {
    for (let b = 0; b < MAX_BULLETS; b++) {
      if (this.bLife[b] > 0) continue;
      const dx = tx - x, dy = ty - y, dz = tz - z, l = hyp(dx, dy, dz) || 1;
      this.bx.set([x, y, z], b * 3);
      this.bv.set([(dx / l) * s, (dy / l) * s, (dz / l) * s], b * 3);
      this.bLife[b] = 4;
      this.bDmg[b] = dmg;
      this.bSrc[b] = src;
      this.bSrcSerial[b] = src >= 0 ? this.serial[src] : 0;
      return;
    }
  }

  // Enemy bullets inside a sphere are destroyed (player damage, PLAN-playtest2 step 5). Returns how many.
  destroyBullets(x, y, z, r) {
    let n = 0;
    const r2 = r * r;
    for (const b of this.liveBullets) {
      if (this.bLife[b] <= 0) continue;
      const o = b * 3, dx = this.bx[o] - x, dy = this.bx[o + 1] - y, dz = this.bx[o + 2] - z;
      if (dx * dx + dy * dy + dz * dz <= r2) { this.bLife[b] = 0; n++; }
    }
    return n;
  }

  updateBullets(dt, game) {
    const { player, world, civ, stats } = game;
    let n = 0;
    this.liveBullets.length = 0;
    for (let b = 0; b < MAX_BULLETS; b++) {
      if (this.bLife[b] <= 0) continue;
      this.bLife[b] -= dt;
      const o = b * 3;
      this.bx[o] += this.bv[o] * dt; this.bx[o + 1] += this.bv[o + 1] * dt; this.bx[o + 2] += this.bv[o + 2] * dt;
      const x = this.bx[o], y = this.bx[o + 1], z = this.bx[o + 2];
      const blk = y < 0 ? null : world.blockedAt(x, y, z);
      if (blk || y < 0) {
        if (blk?.civ !== undefined && civ.damageCar(blk.civ, this.bDmg[b], game, false)) stats.civFriendlyFire++; // friendly fire
        this.bLife[b] = 0; continue;
      }
      const ped = civ.pedAt(x, y, z, 0.45);
      if (ped >= 0) {
        if (civ.damagePed(ped, this.bDmg[b], game, false)) stats.civFriendlyFire++;
        this.bLife[b] = 0; continue;
      }
      const dx = x - player.pos.x, dy = y - player.center, dz = z - player.pos.z;
      if (dx * dx + dy * dy * 0.5 + dz * dz < 0.8) {
        const src = this.bSrc[b];
        game.damagePlayer(this.bDmg[b], 'bullet', src >= 0 && this.alive[src] && this.serial[src] === this.bSrcSerial[b] ? src : -1);
        this.bLife[b] = 0; continue;
      }
      this.liveBullets.push(b);
      this.mat.makeTranslation(x, y, z);
      this.bulletMesh.setMatrixAt(n++, this.mat);
    }
    this.bulletMesh.count = n;
    this.bulletMesh.instanceMatrix.needsUpdate = true;
  }

  render() {
    const counts = new Array(TYPES.length).fill(0);
    let beam = 0;
    for (let i = 0; i < MAX; i++) {
      if (!this.alive[i]) continue;
      const ty = this.type[i], t = TYPES[ty];
      const yaw = Math.atan2(this.vx[i], this.vz[i]);
      this.mat.makeRotationY(yaw);
      const s = this.hitFlash[i] > 0 ? 1.15 : 1;
      if (s !== 1) this.mat.scale(new THREE.Vector3(s, s, s));
      this.mat.setPosition(this.x[i], this.y[i] + t.h / 2, this.z[i]);
      this.meshes[ty].setMatrixAt(counts[ty]++, this.mat);
      if (t.boss && beam < this.beams.length) {
        const b = this.beams[beam++];
        b.visible = true;
        b.position.set(this.x[i], 100, this.z[i]);
      }
    }
    for (let k = beam; k < this.beams.length; k++) this.beams[k].visible = false;
    this.meshes.forEach((m, ty) => { m.count = counts[ty]; m.instanceMatrix.needsUpdate = true; });
  }
}
