import * as THREE from 'three';

const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);

// City blocks as axis-aligned boxes. Everything (player collision, enemy
// pathing, camera, bullets) queries these boxes, so the grey box needs no
// physics engine.

const BLOCK = 44;
const STREET = 14;
const GRID_CELL = 16;   // box lookup grid
const NAV_CELL = 2;     // flow-field grid

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor(scene, { layout = 'mixed', seed = 1, blocks = 6 } = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.boxes = [];
    this.rng = mulberry32(seed);
    this.pitch = BLOCK + STREET;
    this.blocks = blocks;
    this.half = (blocks * this.pitch) / 2;
    this.queryStamp = 0;

    for (let bx = 0; bx < blocks; bx++) {
      for (let bz = 0; bz < blocks; bz++) {
        const x0 = -this.half + STREET / 2 + bx * this.pitch;
        const z0 = -this.half + STREET / 2 + bz * this.pitch;
        const district = layout === 'mixed' ? (bx < blocks / 2 ? 'towers' : 'lowrise') : layout;
        if (district === 'towers') this.towerBlock(x0, z0);
        else this.lowriseBlock(x0, z0);
      }
    }
    this.placeCars(blocks);

    this.roofs = this.boxes.filter(b => b.kind === 'building');
    this.buildMeshes();
    this.buildLookupGrid();
    this.buildNavGrid();
  }

  addBox(minX, minZ, maxX, maxZ, height, kind = 'building', minY = 0) {
    const b = { minX, minY, minZ, maxX, maxY: minY + height, maxZ, kind, stamp: 0, closet: false };
    this.boxes.push(b);
    return b;
  }

  // Chicago-like: towers of 25-90 m on lots, often on a lower podium you can use as a step.
  towerBlock(x0, z0) {
    const r = this.rng, lot = BLOCK / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const lx = x0 + i * lot, lz = z0 + j * lot;
      const roll = r();
      if (roll < 0.15) continue; // plaza
      if (r() < 0.5) this.addBox(lx + 1, lz + 1, lx + lot - 1, lz + lot - 1, 5 + r() * 7); // podium
      const w = 10 + r() * 8, d = 10 + r() * 8;
      const cx = lx + lot / 2 + (r() - 0.5) * (lot - w - 2);
      const cz = lz + lot / 2 + (r() - 0.5) * (lot - d - 2);
      this.addBox(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 25 + r() * 65);
    }
  }

  // Paris-like: a perimeter block of uniform ~16-20 m buildings around a courtyard,
  // with one gap so the courtyard is reachable from the street.
  lowriseBlock(x0, z0) {
    const r = this.rng, depth = 12, gapSide = Math.floor(r() * 4);
    const x1 = x0 + BLOCK, z1 = z0 + BLOCK;
    const strips = [
      [x0, z0, x1, z0 + depth, 'x'],
      [x0, z1 - depth, x1, z1, 'x'],
      [x0, z0 + depth, x0 + depth, z1 - depth, 'z'],
      [x1 - depth, z0 + depth, x1, z1 - depth, 'z'],
    ];
    strips.forEach(([ax, az, bx, bz, axis], s) => {
      const len = axis === 'x' ? bx - ax : bz - az;
      const segs = 2 + Math.floor(r() * 2);
      const segLen = len / segs;
      for (let k = 0; k < segs; k++) {
        if (s === gapSide && k === Math.floor(segs / 2)) continue; // courtyard entrance
        const h = 15 + r() * 5;
        if (axis === 'x') this.addBox(ax + k * segLen, az, ax + (k + 1) * segLen, bz, h);
        else this.addBox(ax, az + k * segLen, bx, az + (k + 1) * segLen, h);
      }
    });
  }

  // Parked cars along inner streets: low obstacles for testing snagging / auto-vault.
  placeCars(blocks) {
    const r = this.rng;
    for (let n = 0; n < 90; n++) {
      const line = -this.half + (1 + Math.floor(r() * (blocks - 1))) * this.pitch;
      const along = -this.half + 10 + r() * (2 * this.half - 20);
      const lane = (r() < 0.5 ? -1 : 1) * 4;
      if (r() < 0.5) this.addBox(line + lane - 1, along - 2.2, line + lane + 1, along + 2.2, 1.5, 'car');
      else this.addBox(along - 2.2, line + lane - 1, along + 2.2, line + lane + 1, 1.5, 'car');
    }
  }

  buildMeshes() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.half * 2, this.half * 2),
      new THREE.MeshLambertMaterial({ color: 0x55585e }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.group.add(ground);
    const grid = new THREE.GridHelper(this.half * 2, Math.round(this.half * 2 / 8), 0x6b6f76, 0x62666c);
    grid.position.y = 0.02;
    this.group.add(grid);

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1b1d21 });
    for (const b of this.boxes) {
      const w = b.maxX - b.minX, h = b.maxY - b.minY, d = b.maxZ - b.minZ;
      const geo = new THREE.BoxGeometry(w, h, d);
      let color;
      if (b.kind === 'car') color = 0x3a6ea5;
      else {
        const t = Math.min(1, (b.maxY - 5) / 85); // taller = lighter, helps read depth
        color = new THREE.Color().setHSL(0.08, 0.06, 0.42 + t * 0.3);
      }
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
      mesh.position.set((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
      this.group.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      this.group.add(edges);
      b.mesh = mesh;
    }

    // Invisible-wall bounds (design doc §9), drawn faintly so testers know where they are.
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
    const s = this.half * 2, H = 120;
    for (let k = 0; k < 4; k++) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(s, H), wallMat);
      wall.position.y = H / 2;
      const a = (k * Math.PI) / 2;
      wall.position.x = Math.sin(a) * this.half;
      wall.position.z = Math.cos(a) * this.half;
      wall.rotation.y = a;
      this.group.add(wall);
    }
  }

  markClosets(fraction) {
    for (const b of this.roofs) {
      b.closet = this.rng() < fraction;
      if (b.closet) {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.3, 4),
          new THREE.MeshBasicMaterial({ color: 0xaa33cc }),
        );
        pad.position.set((b.minX + b.maxX) / 2, b.maxY + 0.15, (b.minZ + b.maxZ) / 2);
        this.group.add(pad);
      }
    }
    this.closets = this.roofs.filter(b => b.closet);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); });
  }

  // ---------- spatial lookup ----------

  buildLookupGrid() {
    this.gridN = Math.ceil((this.half * 2) / GRID_CELL);
    this.grid = Array.from({ length: this.gridN * this.gridN }, () => []);
    for (const b of this.boxes) {
      const [i0, j0] = this.cellOf(b.minX, b.minZ), [i1, j1] = this.cellOf(b.maxX, b.maxZ);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) this.grid[i + j * this.gridN].push(b);
    }
  }

  cellOf(x, z) {
    const n = this.gridN - 1;
    return [
      Math.max(0, Math.min(n, Math.floor((x + this.half) / GRID_CELL))),
      Math.max(0, Math.min(n, Math.floor((z + this.half) / GRID_CELL))),
    ];
  }

  // Calls fn(box) once for every box whose XZ footprint overlaps the rectangle.
  forNear(minX, minZ, maxX, maxZ, fn) {
    const stamp = ++this.queryStamp;
    const [i0, j0] = this.cellOf(minX, minZ), [i1, j1] = this.cellOf(maxX, maxZ);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      for (const b of this.grid[i + j * this.gridN]) {
        if (b.stamp === stamp) continue;
        b.stamp = stamp;
        if (b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ) continue;
        if (fn(b) === false) return;
      }
    }
  }

  // First box containing the point (expanded by r in XZ), or null.
  blockedAt(x, y, z, r = 0) {
    let hit = null;
    this.forNear(x - r, z - r, x + r, z + r, b => {
      if (y >= b.minY && y < b.maxY && x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) {
        hit = b; return false;
      }
    });
    return hit;
  }

  // Highest surface under (x, z) at or below y + step. 0 is the street.
  support(x, z, y, r = 0.3, step = 0.6) {
    let top = 0;
    this.forNear(x - r, z - r, x + r, z + r, b => {
      if (b.maxY <= y + step && b.maxY > top) top = b.maxY;
    });
    return top;
  }

  // The building whose roof the point is standing on (within tolerance), or null.
  roofUnder(x, y, z) {
    let hit = null;
    this.forNear(x, z, x, z, b => {
      if (Math.abs(b.maxY - y) < 0.6 && b.kind === 'building') { hit = b; return false; }
    });
    return hit;
  }

  // Distance along a ray to the first box, or maxT.
  raycast(ox, oy, oz, dx, dy, dz, maxT) {
    let best = maxT;
    const ex = ox + dx * maxT, ez = oz + dz * maxT;
    this.forNear(Math.min(ox, ex), Math.min(oz, ez), Math.max(ox, ex), Math.max(oz, ez), b => {
      let t0 = 0, t1 = best;
      for (const [o, d, lo, hi] of [[ox, dx, b.minX, b.maxX], [oy, dy, b.minY, b.maxY], [oz, dz, b.minZ, b.maxZ]]) {
        if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return; continue; }
        let a = (lo - o) / d, c = (hi - o) / d;
        if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, c);
        if (t0 > t1) return;
      }
      if (t0 < best) best = t0;
    });
    return best;
  }

  randomStreetPoint(cx, cz, rMin, rMax, tries = 12) {
    for (let k = 0; k < tries; k++) {
      const a = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
      const x = this.clamp(cx + Math.cos(a) * d), z = this.clamp(cz + Math.sin(a) * d);
      if (!this.blockedAt(x, 0.5, z, 0.6)) return { x, z };
    }
    return null;
  }

  // A roof building's top is clear if nothing (a tower on a podium) stands on the point.
  roofClear(b, x, z, r = 0.6) {
    return !this.blockedAt(x, b.maxY + 0.5, z, r);
  }

  // A point on a roof within [rMin, rMax] of (cx, cz), at least `margin` in from the edge:
  // { x, y, z, box } or null.
  randomRoofPoint(cx, cz, rMin, rMax, margin = 2, tries = 30, rand = Math.random) {
    // Only roofs that reach into the ring, so a small ring near the player still finds one.
    const near = this.roofs.filter(b => {
      const dx = Math.max(b.minX - cx, 0, cx - b.maxX), dz = Math.max(b.minZ - cz, 0, cz - b.maxZ);
      const fx = Math.max(Math.abs(b.minX - cx), Math.abs(b.maxX - cx)), fz = Math.max(Math.abs(b.minZ - cz), Math.abs(b.maxZ - cz));
      return Math.hypot(dx, dz) <= rMax && Math.hypot(fx, fz) >= rMin;
    });
    if (!near.length) return null;
    for (let k = 0; k < tries; k++) {
      const b = near[Math.floor(rand() * near.length)];
      if (b.maxX - b.minX < margin * 2 + 1 || b.maxZ - b.minZ < margin * 2 + 1) continue;
      const x = b.minX + margin + rand() * (b.maxX - b.minX - margin * 2);
      const z = b.minZ + margin + rand() * (b.maxZ - b.minZ - margin * 2);
      const d = Math.hypot(x - cx, z - cz);
      if (d < rMin || d > rMax || !this.roofClear(b, x, z)) continue;
      return { x, y: b.maxY, z, box: b };
    }
    return null;
  }

  // A point floating `off` metres out from a building's wall, between `minH` and 2 m below the roof.
  randomWallPoint(rand = Math.random, off = 1, minH = 4) {
    for (let k = 0; k < 30; k++) {
      const b = this.roofs[Math.floor(rand() * this.roofs.length)];
      if (b.maxY - b.minY < minH + 3) continue;
      const face = Math.floor(rand() * 4), y = b.minY + minH + rand() * (b.maxY - b.minY - minH - 2);
      const u = rand();
      let x, z;
      if (face < 2) { z = b.minZ + 1 + u * (b.maxZ - b.minZ - 2); x = face === 0 ? b.minX - off : b.maxX + off; }
      else { x = b.minX + 1 + u * (b.maxX - b.minX - 2); z = face === 2 ? b.minZ - off : b.maxZ + off; }
      if (Math.abs(x) > this.half - 2 || Math.abs(z) > this.half - 2 || this.blockedAt(x, y, z, 0.6)) continue;
      return { x, y, z, box: b };
    }
    return null;
  }

  // Street centreline coordinates between blocks (the map-edge half-streets are left out).
  get streetLines() {
    return (this._lines ??= Array.from({ length: this.blocks - 1 }, (_, k) => -this.half + (k + 1) * this.pitch));
  }

  // ---------- moving boxes (civilian cars) ----------
  // Kept in the lookup grid so collision, bullets and the camera see them. Not in the nav grid.
  addDynamic(b) {
    b.stamp = 0;
    b.cells = null;
    this.updateDynamic(b);
  }

  updateDynamic(b) {
    const [i0, j0] = this.cellOf(b.minX, b.minZ), [i1, j1] = this.cellOf(b.maxX, b.maxZ), c = b.cells;
    if (c && c[0] === i0 && c[1] === j0 && c[2] === i1 && c[3] === j1) return;
    if (c) this.removeFromCells(b);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) this.grid[i + j * this.gridN].push(b);
    b.cells = [i0, j0, i1, j1];
  }

  removeDynamic(b) { if (b.cells) this.removeFromCells(b); b.cells = null; }

  removeFromCells(b) {
    const [i0, j0, i1, j1] = b.cells;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const cell = this.grid[i + j * this.gridN], k = cell.indexOf(b);
      if (k >= 0) cell.splice(k, 1);
    }
  }

  clamp(v, margin = 1) {
    return Math.max(-this.half + margin, Math.min(this.half - margin, v));
  }

  // ---------- flow field (street-level pathing) ----------

  buildNavGrid() {
    this.navN = Math.ceil((this.half * 2) / NAV_CELL);
    const N = this.navN;
    this.navBlocked = new Uint8Array(N * N);
    this.flow = new Int32Array(N * N).fill(-1);
    this.queue = new Int32Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = -this.half + (i + 0.5) * NAV_CELL, z = -this.half + (j + 0.5) * NAV_CELL;
      if (this.blockedAt(x, 0.5, z, 0.4)) this.navBlocked[i + j * N] = 1;
    }
  }

  navCell(x, z) {
    const N = this.navN;
    const i = Math.max(0, Math.min(N - 1, Math.floor((x + this.half) / NAV_CELL)));
    const j = Math.max(0, Math.min(N - 1, Math.floor((z + this.half) / NAV_CELL)));
    return i + j * N;
  }

  // BFS from the player. If the player is up on a building, seed from the street
  // cells hugging that building so the horde gathers at its base.
  computeFlow(px, py, pz) {
    const N = this.navN, flow = this.flow, blocked = this.navBlocked, q = this.queue;
    flow.fill(-1);
    let head = 0, tail = 0;
    const seed = c => { if (!blocked[c] && flow[c] < 0) { flow[c] = 0; q[tail++] = c; } };
    const pc = this.navCell(px, pz);
    const roof = py > 1 ? this.roofUnder(px, py, pz) : null;
    if (roof) {
      const m = 2.5;
      for (let x = roof.minX - m; x <= roof.maxX + m; x += NAV_CELL) {
        seed(this.navCell(x, roof.minZ - m)); seed(this.navCell(x, roof.maxZ + m));
      }
      for (let z = roof.minZ - m; z <= roof.maxZ + m; z += NAV_CELL) {
        seed(this.navCell(roof.minX - m, z)); seed(this.navCell(roof.maxX + m, z));
      }
    }
    seed(pc);
    if (tail === 0) { // player stands inside a blocked cell (on a car, say): seed its neighbours
      const i = pc % N, j = (pc / N) | 0;
      for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) {
        const a = i + di, b = j + dj;
        if (a >= 0 && b >= 0 && a < N && b < N) seed(a + b * N);
      }
    }
    while (head < tail) {
      const c = q[head++], i = c % N, j = (c / N) | 0, d = flow[c] + 1;
      if (i > 0) { const n = c - 1; if (!blocked[n] && flow[n] < 0) { flow[n] = d; q[tail++] = n; } }
      if (i < N - 1) { const n = c + 1; if (!blocked[n] && flow[n] < 0) { flow[n] = d; q[tail++] = n; } }
      if (j > 0) { const n = c - N; if (!blocked[n] && flow[n] < 0) { flow[n] = d; q[tail++] = n; } }
      if (j < N - 1) { const n = c + N; if (!blocked[n] && flow[n] < 0) { flow[n] = d; q[tail++] = n; } }
    }
  }

  // Unit XZ direction downhill in the flow field, or null at the target / unreachable.
  flowDir(x, z, out) {
    const N = this.navN, c = this.navCell(x, z), here = this.flow[c];
    if (here <= 0) return null;
    const i = c % N, j = (c / N) | 0;
    let best = here, bi = 0, bj = 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= N || b >= N) continue;
      const v = this.flow[a + b * N];
      // diagonal moves only if both orthogonal neighbours are open (no corner cutting)
      if (di && dj && (this.navBlocked[a + j * N] || this.navBlocked[i + b * N])) continue;
      if (v >= 0 && v < best) { best = v; bi = di; bj = dj; }
    }
    if (best === here) return null;
    const tx = -this.half + (i + bi + 0.5) * NAV_CELL, tz = -this.half + (j + bj + 0.5) * NAV_CELL;
    const dx = tx - x, dz = tz - z, len = hyp(dx, dz) || 1;
    out.x = dx / len; out.z = dz / len;
    return out;
  }
}
