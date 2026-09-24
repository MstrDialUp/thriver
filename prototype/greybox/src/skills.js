import * as THREE from 'three';
import { SKILLS } from './catalog.js';

// The nine skills (PLAN-progression.md). Each reads its numbers from SKILLS[id].base
// plus its own upgrades (build.own). Hooks, called from main.js:
//   modifyStats(eff, game) — every frame, after build.stats: passive stat skills
//   update(dt, game, eff)  — every simulated frame, after the horde moves
//   absorb(amount)         — Shield, before damage reaches HP
//   onHit(game, kind, src) — Retaliation against shooters
//   onLand(game, fall, safe) — Impact

const has = (game, id) => !!game.build.items[id];

export class Skills {
  constructor(scene) {
    this.scene = scene;
    this.impactGeo = new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2);
    this.hackerMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 14),
      new THREE.MeshBasicMaterial({ color: 0xff3b6b, wireframe: true, transparent: true, opacity: 0.25, depthWrite: false }), // wireframe: the camera sits at its edge
    );
    this.hackerMesh.visible = false;
    scene.add(this.hackerMesh);
    this.reset();
  }

  reset() {
    this.t = 0;
    this.shield = 0;
    this.sinceHit = 99;
    this.momentum = 0;          // current bonus, lingers briefly after a burst of speed
    this.retaliated = new Map(); // enemy serial → last retaliation time
    this.slipHits = new Set();   // enemy serials hit during the current dash
    this.slipDash = -1;
    this.hackerTick = 0;
    for (const w of this.waves ?? []) this.scene.remove(w.mesh);
    this.waves = [];
  }

  own(game, id, stat) { return game.build.own(id, stat); }

  maxShield(game) {
    return has(game, 'shield') ? SKILLS.shield.base.amount * (1 + this.own(game, 'shield', 'amount')) : 0;
  }

  modifyStats(eff, game) {
    eff.spider = has(game, 'spider');
    eff.wallJumpUp = 1;
    eff.updraftTime = 0;
    eff.updraftSpeed = 0;
    if (has(game, 'magnet')) eff.magnetRadius *= 1 + SKILLS.magnet.base.radius + this.own(game, 'magnet', 'radius');
    if (eff.spider) {
      eff.wallRunUpSpeed *= 1 + this.own(game, 'spider', 'speed');
      const power = 1 + this.own(game, 'spider', 'power');
      eff.wallJumpPush *= power;
      eff.wallJumpUp = power;
    }
    if (has(game, 'updraft')) {
      const b = SKILLS.updraft.base;
      eff.updraftTime = b.time * (1 + this.own(game, 'updraft', 'time'));
      eff.updraftSpeed = b.speed * (1 + this.own(game, 'updraft', 'speed'));
    }
    if (has(game, 'momentum')) eff.damageMult *= 1 + this.momentum;
  }

  // Damage scaling shared by damaging skills: the skill's own damage upgrade, times the
  // global damage and level multipliers ("scaled by your damage bonus").
  dmg(game, eff, id, base) { return base * (1 + this.own(game, id, 'damage')) * eff.damageMult * eff.levelMult; }

  update(dt, game, eff) {
    const { player, horde } = game;
    this.t += dt;
    this.sinceHit += dt;

    // Shield: refills over `refill` seconds once `delay` has passed since the last hit.
    const max = this.maxShield(game);
    if (max) {
      const b = SKILLS.shield.base, delay = b.delay * Math.max(0.25, 1 + this.own(game, 'shield', 'delay'));
      if (this.sinceHit >= delay) this.shield = Math.min(max, this.shield + (max / b.refill) * dt);
    } else this.shield = 0;

    // Momentum: bonus from speed above run speed (3D, so falls count); lingers ~1 s.
    if (has(game, 'momentum')) {
      const b = SKILLS.momentum.base, v = player.vel;
      const excess = Math.max(0, Math.hypot(v.x, v.y, v.z) - eff.moveSpeed);
      const bonus = excess * b.perMs * (1 + this.own(game, 'momentum', 'perMs'));
      this.momentum = Math.max(bonus, this.momentum - dt * (this.momentum / b.linger + 0.05));
    } else this.momentum = 0;

    // Retaliation: enemies touching the player, each at most once per `rehit`.
    if (has(game, 'retaliation')) {
      for (const i of horde.touching) this.retaliate(game, eff, i);
      if (this.retaliated.size > 4000) this.retaliated.clear();
    }

    // Slipstream: while dashing, hit each enemy the player passes through once per dash.
    if (has(game, 'slipstream') && player.dashTimer > 0) {
      if (player.dashCount !== this.slipDash) { this.slipDash = player.dashCount; this.slipHits.clear(); }
      const b = SKILLS.slipstream.base, w = b.width * (1 + this.own(game, 'slipstream', 'width'));
      horde.forRadius(player.pos.x, player.center, player.pos.z, w + 0.6, i => {
        const s = horde.serial[i];
        if (this.slipHits.has(s)) return;
        this.slipHits.add(s);
        game.damageEnemy(i, this.dmg(game, eff, 'slipstream', b.damage), 'slipstream');
      });
    }

    // Hacker: while the player holds a tower zone, its sphere damages enemies inside.
    const z = game.activeZone;
    if (has(game, 'hacker') && z) {
      const b = SKILLS.hacker.base, r = z.r * (1 + this.own(game, 'hacker', 'size'));
      this.hackerTick -= dt;
      if (this.hackerTick <= 0) {
        this.hackerTick = b.tick;
        const dmg = this.dmg(game, eff, 'hacker', b.dps * b.tick);
        horde.forRadius(z.x, z.y, z.z, r, i => game.damageEnemy(i, dmg, 'hacker'));
        game.areaHit(z.x, z.y, z.z, r, dmg, 'hacker');
      }
      this.hackerMesh.visible = true;
      this.hackerMesh.position.set(z.x, z.y, z.z);
      this.hackerMesh.scale.setScalar(r);
    } else this.hackerMesh.visible = false;

    // Impact shockwave visuals.
    for (const w of this.waves) {
      w.t += dt / 0.4;
      w.mesh.scale.setScalar(w.r * Math.min(1, w.t));
      w.mesh.material.opacity = 0.7 * (1 - w.t);
      if (w.t >= 1) { this.scene.remove(w.mesh); w.mesh.material.dispose(); }
    }
    this.waves = this.waves.filter(w => w.t < 1);
  }

  retaliate(game, eff, i) {
    const h = game.horde, s = h.serial[i];
    if (this.t - (this.retaliated.get(s) ?? -9) < SKILLS.retaliation.base.rehit) return;
    this.retaliated.set(s, this.t);
    game.damageEnemy(i, this.dmg(game, eff, 'retaliation', SKILLS.retaliation.base.damage), 'retaliation');
  }

  // Shield takes the hit first. Any hit (even fully absorbed) restarts the recharge delay.
  absorb(amount) {
    this.sinceHit = 0;
    const taken = Math.min(this.shield, amount);
    this.shield -= taken;
    return amount - taken;
  }

  onHit(game, kind, source) {
    if (kind === 'bullet' && source >= 0 && has(game, 'retaliation')) this.retaliate(game, game.eff, source);
  }

  // Impact: a shockwave on landings from above the safe height, scaled by the drop.
  onLand(game, fall, safe) {
    if (!has(game, 'impact') || fall <= safe) return;
    const b = SKILLS.impact.base, over = fall - safe, p = game.player;
    const r = (b.radius + b.radiusPerM * over) * (1 + this.own(game, 'impact', 'radius'));
    const dmg = this.dmg(game, game.eff, 'impact', b.damage) * (1 + b.dmgPerM * over) * game.eff.impactDamage;
    game.horde.forRadius(p.pos.x, p.pos.y + 1, p.pos.z, r, i => game.damageEnemy(i, dmg, 'impact'));
    game.areaHit(p.pos.x, p.pos.y + 1, p.pos.z, r, dmg, 'impact');
    const mesh = new THREE.Mesh(this.impactGeo, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    mesh.position.set(p.pos.x, p.pos.y + 0.1, p.pos.z);
    this.scene.add(mesh);
    this.waves.push({ mesh, t: 0, r });
  }
}
