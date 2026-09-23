import * as THREE from 'three';

// A — XP caches on rooftops (pull the player up).
// B — ground-level hold zones modelled on Megabonk's Charge Shrines: stand inside
//     to fill; leaving drains the progress (pull the player back down).

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
  }

  reset(game) {
    this.group.clear();
    this.caches = [];
    this.zones = [];
    this.pendingCaches = [];
    this.game = game;
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

  // ---------- B: hold zones ----------
  spawnZone(world, player, cfg) {
    const p = world.randomStreetPoint(player.pos.x, player.pos.z, 25, 70, 30);
    if (!p) return false;
    const r = cfg.holdZoneRadius;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 2.5, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x40c4ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.set(p.x, 1.25, p.z);
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(r, 32),
      new THREE.MeshBasicMaterial({ color: 0x40c4ff, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(p.x, 0.05, p.z);
    fill.scale.setScalar(0.001);
    const beam = new THREE.Mesh(this.beamGeo, this.zoneBeamMat);
    beam.position.set(p.x, 15, p.z);
    this.group.add(ring, fill, beam);
    this.zones.push({ x: p.x, z: p.z, progress: 0, ring, fill, beam, r });
    return true;
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
    if (cfg.holdZones) {
      for (let tries = 0; tries < 5 && this.zones.length < cfg.holdZoneCount; tries++) this.spawnZone(world, player, cfg);
      for (const z of this.zones) {
        const dx = z.x - player.pos.x, dz = z.z - player.pos.z, d = Math.hypot(dx, dz);
        const inside = d < z.r && player.pos.y < 3;
        if (inside) {
          z.progress += dt / cfg.holdTime;
          game.activeZone = z;
          stats.timeInZone += dt;
        } else z.progress = Math.max(0, z.progress - (dt * cfg.holdDrain) / cfg.holdTime);
        z.fill.scale.setScalar(Math.max(0.001, z.progress));
        if (z.progress >= 1) {
          z.done = true;
          this.remove(z);
          const xp = 40 + 10 * game.tier;
          combat.addXp(xp, game);
          game.heal(25);
          stats.zonesDone++;
          game.hud.flash(`Zone held +${xp} XP`);
          if (cfg.towerUpgrades) game.offerTower();
        } else if (d > 130) { z.done = true; this.remove(z); } // too far behind: move it
      }
      this.zones = this.zones.filter(z => !z.done);
    } else if (this.zones.length) {
      this.zones.forEach(z => this.remove(z));
      this.zones = [];
    }
  }
}
