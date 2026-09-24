import * as THREE from 'three';

// A — XP caches on rooftops (pull the player up).
// B — towers: hold zones modelled on Megabonk's Charge Shrines. Stand inside to fill;
//     leaving drains the progress. Two tiers (Rich, 2026-09-24; PLAN-playtest2 step 1):
//     small — near the player on any flat surface (roof or street), quick, respawning;
//     large — a set number placed at run start, mostly on rooftops, slow, gone once completed.
//     The old "pull back down to the ground" role is set aside.

const ON_SURFACE = 2;   // the player counts as inside if within this height of the zone's surface

export class Rewards {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.caches = [];
    this.zones = [];
    this.cacheGeo = new THREE.OctahedronGeometry(0.8);
    this.cacheMat = new THREE.MeshBasicMaterial({ color: 0xffc83d });
    this.beamGeo = new THREE.CylinderGeometry(0.25, 0.25, 30, 6, 1, true);
    this.cacheBeamMat = new THREE.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: 0.35, depthWrite: false });
    this.zoneBeamMat = new THREE.MeshBasicMaterial({ color: 0x40c4ff, transparent: true, opacity: 0.3, depthWrite: false });
    this.largeBeamGeo = new THREE.CylinderGeometry(0.6, 0.6, 160, 8, 1, true);
    this.largeBeamMat = new THREE.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: 0.35, depthWrite: false });
  }

  reset(game) {
    this.group.clear();
    this.caches = [];
    this.zones = [];
    this.pendingCaches = [];
    this.game = game;
    this.largeTotal = 0;
    if (game.cfg.largeTowers) this.placeLargeTowers(game.world, game.cfg);
  }

  // ---------- A: rooftop caches ----------
  spawnCache(world) {
    // Prefer taller roofs: the reward is where the danger (climbing) is.
    const roofs = world.roofs;
    let b = null;
    for (let k = 0; k < 6; k++) {
      const c = roofs[Math.floor(Math.random() * roofs.length)];
      if (this.caches.some(x => x.box === c)) continue;
      if (!b || c.maxY > b.maxY) b = c;
    }
    if (!b) return false;
    const x = b.minX + 2 + Math.random() * Math.max(0, b.maxX - b.minX - 4);
    const z = b.minZ + 2 + Math.random() * Math.max(0, b.maxZ - b.minZ - 4);
    const mesh = new THREE.Mesh(this.cacheGeo, this.cacheMat);
    mesh.position.set(x, b.maxY + 1.2, z);
    const beam = new THREE.Mesh(this.beamGeo, this.cacheBeamMat);
    beam.position.set(x, b.maxY + 15, z);
    this.group.add(mesh, beam);
    this.caches.push({ box: b, x, y: b.maxY + 1.2, z, mesh, beam });
    return true;
  }

  // ---------- B: towers ----------
  // A zone on a roof is clamped to fit the roof, so its whole ring can be stood in.
  makeZone(p, r, tier) {
    const large = tier === 'large', color = large ? 0xffb030 : 0x40c4ff;
    if (p.box) r = Math.max(3, Math.min(r, (p.box.maxX - p.box.minX) / 2 - 0.5, (p.box.maxZ - p.box.minZ) / 2 - 0.5));
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 2.5, 32, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.set(p.x, p.y + 1.25, p.z);
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(r, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(p.x, p.y + 0.05, p.z);
    fill.scale.setScalar(0.001);
    const beam = new THREE.Mesh(large ? this.largeBeamGeo : this.beamGeo, large ? this.largeBeamMat : this.zoneBeamMat);
    beam.position.set(p.x, p.y + (large ? 80 : 15), p.z);
    this.group.add(ring, fill, beam);
    const z = { x: p.x, y: p.y, z: p.z, onRoof: !!p.box, tier, progress: 0, ring, fill, beam, r };
    this.zones.push(z);
    return z;
  }

  // Small tower near the player: a roof or the street, by smallTowerRoofShare.
  spawnZone(world, player, cfg) {
    const p = Math.random() < cfg.smallTowerRoofShare
      ? world.randomRoofPoint(player.pos.x, player.pos.z, 25, 70, 2)
      : world.randomStreetPoint(player.pos.x, player.pos.z, 25, 70, 30);
    if (!p) return false;
    this.makeZone({ y: 0, ...p }, cfg.holdZoneRadius, 'small');
    return true;
  }

  // Large towers, spread over the map at run start: mostly on rooftops, favouring taller ones.
  placeLargeTowers(world, cfg) {
    const placed = [], spacing = world.half * 0.35;
    for (let tries = 0; placed.length < cfg.largeTowerCount && tries < 400; tries++) {
      let p;
      if (Math.random() < cfg.largeTowerRoofShare) {
        const a = world.randomRoofPoint(0, 0, 0, world.half * 2, 3), b = world.randomRoofPoint(0, 0, 0, world.half * 2, 3);
        p = a && b ? (a.y >= b.y ? a : b) : a ?? b;
      } else {
        const s = world.randomStreetPoint(0, 0, 0, world.half, 30);
        p = s && { ...s, y: 0 };
      }
      if (!p) continue;
      const minD = tries < 300 ? spacing : spacing / 2; // relax spacing if the map is crowded
      if (placed.some(q => Math.hypot(q.x - p.x, q.z - p.z) < minD)) continue;
      placed.push(p);
      this.makeZone(p, cfg.largeTowerRadius, 'large');
    }
    this.largeTotal = placed.length;
  }

  get largeLeft() { return this.zones.filter(z => z.tier === 'large').length; }

  complete(z, game) {
    const { cfg, stats, combat } = game, large = z.tier === 'large';
    z.done = true;
    this.remove(z);
    const xp = (40 + 10 * game.tier) * (large ? cfg.largeTowerXpMult : 1);
    combat.addXp(xp, game);
    game.heal(large ? cfg.largeTowerHeal : 25);
    stats.zonesDone++;
    if (large) stats.largeTowersDone++;
    if (z.onRoof) stats.towersOnRoof++;
    else stats.towersOnGround++;
    game.hud.flash(`${large ? 'Large tower' : 'Tower'} held +${xp} XP`);
    game.sfx?.play('towerDone', z.x, z.y + 1, z.z);
    if (cfg.towerUpgrades) game.offerTower(large);
  }

  remove(obj) {
    for (const k of ['mesh', 'beam', 'ring', 'fill']) if (obj[k]) this.group.remove(obj[k]);
  }

  update(dt, game) {
    const { player, world, cfg, stats, combat } = game;

    // A
    if (cfg.rewardsAtHeight) {
      for (const t of this.pendingCaches) t.time -= dt;
      this.pendingCaches = this.pendingCaches.filter(t => t.time > 0);
      for (let tries = 0; tries < 20 && this.caches.length + this.pendingCaches.length < cfg.cacheCount; tries++) this.spawnCache(world);
      for (const c of this.caches) {
        c.mesh.rotation.y += dt * 2;
        const dx = c.x - player.pos.x, dy = c.y - player.center, dz = c.z - player.pos.z;
        if (dx * dx + dy * dy + dz * dz < 2.5 * 2.5) {
          c.taken = true;
          this.remove(c);
          combat.addXp(10 + c.box.maxY * 0.5, game);
          game.heal(15);
          stats.cachesTaken++;
          game.hud.flash(`Rooftop cache +${Math.round(10 + c.box.maxY * 0.5)} XP`);
          this.pendingCaches.push({ time: cfg.cacheRespawn });
        }
      }
      this.caches = this.caches.filter(c => !c.taken);
    } else if (this.caches.length) {
      this.caches.forEach(c => this.remove(c));
      this.caches = [];
      this.pendingCaches = [];
    }

    // B
    game.activeZone = null;
    const smallOn = cfg.holdZones, largeOn = cfg.largeTowers;
    if (smallOn) {
      const small = this.zones.filter(z => z.tier === 'small').length;
      for (let tries = 0, n = small; tries < 5 && n < cfg.holdZoneCount; tries++) if (this.spawnZone(world, player, cfg)) n++;
    }
    for (const z of this.zones) {
      const large = z.tier === 'large';
      if ((large && !largeOn) || (!large && !smallOn)) { z.done = true; this.remove(z); continue; }
      const dx = z.x - player.pos.x, dz = z.z - player.pos.z, d = Math.hypot(dx, dz);
      const inside = d < z.r && Math.abs(player.pos.y - z.y) < ON_SURFACE;
      const time = large ? cfg.largeHoldTime : cfg.holdTime;
      if (inside) {
        z.progress += dt / time;
        game.activeZone = z;
        stats.timeInZone += dt;
      } else z.progress = Math.max(0, z.progress - (dt * cfg.holdDrain) / time);
      z.fill.scale.setScalar(Math.max(0.001, z.progress));
      if (z.progress >= 1) this.complete(z, game);
      else if (!large && d > 130) { z.done = true; this.remove(z); } // small ones left far behind move
    }
    this.zones = this.zones.filter(z => !z.done);
  }
}
