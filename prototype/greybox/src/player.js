import * as THREE from 'three';

// Kinematic character controller against the world's boxes.
// Kit (design doc §6): move, dash, slide, jump, double jump, wall jump,
// wall run (wallMode 'free': climb and run along at once, so pushing diagonally into a wall
// climbs diagonally; 'locked', playtest 1-2: vertical when pushing into it OR sideways along it),
// glide (hold jump while falling). No stamina.
//
// Fall height (grey-box experiment, PLAN-progression.md): the highest point since
// the last safe event (ground, air jump, wall contact, gliding). Landing reports it
// in `landFall`; main.js turns it into fall damage.
//
// Skill hooks (skills.js sets these on the effective stats): spider (run up a wall
// from the ground), updraftTime/updraftSpeed (gliding lifts), wallJumpUp.

const RADIUS = 0.4;
const STAND_H = 1.8;
const SLIDE_H = 1.0;

export class Player {
  constructor(scene) {
    this.mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(RADIUS, STAND_H - RADIUS * 2, 4, 10),
      new THREE.MeshLambertMaterial({ color: 0x19e3ff, emissive: 0x0a5a66 }),
    );
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.5), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    nose.position.set(0, 0.4, -0.4);
    this.mesh.add(nose);
    scene.add(this.mesh);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.reset(0, 0);
  }

  reset(x, z) {
    this.pos.set(x, 0, z);
    this.vel.set(0, 0, 0);
    this.height = STAND_H;
    this.grounded = true;
    this.airJumpsLeft = 0;
    this.dashCharges = 1;
    this.dashRecharge = 0;
    this.dashTimer = 0;
    this.dashDir = new THREE.Vector3(0, 0, -1);
    this.dashCount = 0;       // bumped per dash, so Slipstream can hit each enemy once per dash
    this.slideTimer = 0;
    this.wallRunTimer = 0;
    this.wallState = 0;       // 0 none, 1 vertical (mostly climbing), 2 side (mostly running along)
    this.wallUp = 0;          // free mode: share of the input going into the wall (0..1), for the mantle
    this.lastWallNormal = null;
    this.sinceJump = 99;
    this.gliding = false;
    this.lifting = false;     // Updraft: gliding upward
    this.updraftLeft = 0;
    this.fallTop = 0;
    this.landFall = 0;        // fall height of a landing this frame (0 = none); read and cleared by main.js
    this.facing = 0;
    this.hp = 100;
  }

  get center() { return this.pos.y + this.height / 2; }

  update(dt, inp, camYaw, world, cfg) {
    const v = this.vel;
    this.sinceJump += dt;

    // Wish direction, relative to the camera.
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    let wx = fx * inp.moveY + rx * inp.moveX, wz = fz * inp.moveY + rz * inp.moveX;
    const wlen = Math.hypot(wx, wz);
    if (wlen > 1) { wx /= wlen; wz /= wlen; }
    const hasWish = wlen > 0.1;

    // Dash charges.
    if (this.dashCharges < cfg.dashCharges) {
      this.dashRecharge += dt;
      if (this.dashRecharge >= cfg.dashCooldown) { this.dashCharges++; this.dashRecharge = 0; }
    } else this.dashCharges = cfg.dashCharges;

    const wall = this.grounded && !cfg.spider ? null : this.probeWall(world);
    const jumpV = Math.sqrt(2 * cfg.gravity * cfg.jumpHeight);

    // ---- actions ----
    if (inp.dashPressed && this.dashCharges > 0 && this.dashTimer <= 0) {
      this.dashCharges--;
      this.dashTimer = cfg.dashTime;
      this.dashCount++;
      if (hasWish) this.dashDir.set(wx, 0, wz).normalize();
      else this.dashDir.set(fx, 0, fz);
      this.slideTimer = 0;
    }

    if (inp.jumpPressed) {
      if (this.grounded) {
        v.y = jumpV;
        this.grounded = false;
        this.slideTimer = 0; // slide-jump keeps the slide's horizontal speed
        this.sinceJump = 0;
        this.updraftLeft = cfg.updraftTime;
      } else if (wall) {
        v.x = wall.nx * cfg.wallJumpPush + wx * 3;
        v.z = wall.nz * cfg.wallJumpPush + wz * 3;
        v.y = jumpV * 0.95 * cfg.wallJumpUp;
        this.airJumpsLeft = cfg.airJumps;
        this.wallState = 0;
        this.sinceJump = 0;
        this.updraftLeft = cfg.updraftTime;
      } else if (this.airJumpsLeft > 0) {
        this.airJumpsLeft--;
        this.fallTop = this.pos.y;
        this.updraftLeft = cfg.updraftTime;
        v.y = jumpV;
        if (hasWish) { // redirect, keep speed
          const hs = Math.max(Math.hypot(v.x, v.z), cfg.moveSpeed * 0.8);
          v.x = wx * hs; v.z = wz * hs;
        }
        this.sinceJump = 0;
      }
    }

    if (inp.slidePressed && this.grounded && Math.hypot(v.x, v.z) > 3) {
      this.slideTimer = cfg.slideTime;
      const hs = Math.hypot(v.x, v.z), target = Math.max(hs, cfg.moveSpeed * cfg.slideBoost);
      v.x *= target / hs; v.z *= target / hs;
    }

    // Spider: pushing into a wall from the ground starts a wall run.
    if (cfg.spider && this.grounded && wall && hasWish && this.dashTimer <= 0 && -(wx * wall.nx + wz * wall.nz) > 0.5) {
      this.grounded = false;
      this.slideTimer = 0;
    }

    // ---- velocity ----
    this.gliding = false;
    const prevWallState = this.wallState;
    this.wallState = 0;

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      v.x = this.dashDir.x * cfg.dashSpeed;
      v.z = this.dashDir.z * cfg.dashSpeed;
      v.y = 0;
      if (this.dashTimer <= 0) { // exit with a bit of carried momentum
        v.x = this.dashDir.x * cfg.moveSpeed * 1.25;
        v.z = this.dashDir.z * cfg.moveSpeed * 1.25;
      }
    } else if (this.grounded) {
      if (this.slideTimer > 0) {
        this.slideTimer -= dt;
        const hs = Math.hypot(v.x, v.z);
        const ns = Math.max(0, hs - cfg.slideFriction * dt);
        if (hs > 0) { v.x *= ns / hs; v.z *= ns / hs; }
        if (!inp.slideHeld || ns < 2) this.slideTimer = 0;
      } else {
        accelerate(v, wx * cfg.moveSpeed, wz * cfg.moveSpeed, cfg.accelGround * dt);
      }
      v.y = 0;
    } else {
      const prevUp = this.wallUp;
      this.wallUp = 0;
      if (wall && cfg.wallMode === 'free' && (cfg.wallRunUnlimited || this.wallRunTimer < cfg.wallRunTime)) {
        // Split the input into "into the wall" (climb) and "along the wall" (run), and do both.
        const into = -(wx * wall.nx + wz * wall.nz);
        const tx = wx + into * wall.nx, tz = wz + into * wall.nz, along = Math.hypot(tx, tz);
        const up = Math.max(0, (into - 0.15) / 0.85);
        if (hasWish && (up > 0 || (along > 0.3 && v.y < cfg.wallRunUpSpeed))) {
          this.wallState = up >= 0.5 ? 1 : 2;
          this.wallUp = up;
          if (up > 0) v.y = cfg.wallRunUpSpeed * up;
          else v.y = Math.max(v.y - cfg.gravity * cfg.wallRunSideGravity * dt, -1.5);
          // Along the wall: keep any faster momentum in that direction, else run at move speed.
          const ux = along > 1e-3 ? tx / along : 0, uz = along > 1e-3 ? tz / along : 0;
          const carried = Math.max(0, v.x * ux + v.z * uz);
          const lat = along > 1e-3 ? Math.max(carried, cfg.moveSpeed * along) : 0;
          v.x = ux * lat - wall.nx * 0.5; v.z = uz * lat - wall.nz * 0.5; // hug the wall
          this.wallRunTimer += dt;
          this.lastWallNormal = wall;
        }
      } else if (wall && (cfg.wallRunUnlimited || this.wallRunTimer < cfg.wallRunTime)) {
        const into = -(wx * wall.nx + wz * wall.nz);
        const hs = Math.hypot(v.x, v.z);
        if (into > 0.5) {
          this.wallState = 1;
          v.y = cfg.wallRunUpSpeed;
          v.x = -wall.nx; v.z = -wall.nz; // hug the wall
        } else if (hasWish && hs > 4 && v.y < cfg.wallRunUpSpeed) {
          this.wallState = 2;
          const dn = v.x * wall.nx + v.z * wall.nz;
          v.x -= wall.nx * (dn + 0.5); v.z -= wall.nz * (dn + 0.5);
          v.y = Math.max(v.y - cfg.gravity * cfg.wallRunSideGravity * dt, -1.5);
        }
        if (this.wallState) { this.wallRunTimer += dt; this.lastWallNormal = wall; }
      }
      if (!this.wallState) {
        if ((prevWallState === 1 || prevUp > 0.2) && this.lastWallNormal) { // ran off the top: mantle onto the roof
          v.x = -this.lastWallNormal.nx * 5; v.z = -this.lastWallNormal.nz * 5;
          v.y = Math.max(v.y, 4);
        }
        const hs = Math.hypot(v.x, v.z);
        let top = Math.max(cfg.moveSpeed, hs);
        v.y -= cfg.gravity * dt;
        if (cfg.glide && inp.jumpHeld && (v.y < 0 || this.lifting) && this.sinceJump > 0.25) {
          this.gliding = true;
          this.lifting = this.updraftLeft > 0;
          if (this.lifting) { this.updraftLeft -= dt; v.y = cfg.updraftSpeed; }
          else v.y = Math.max(v.y, -cfg.glideFallSpeed);
          top = Math.max(cfg.moveSpeed * cfg.glideSpeedMult, hs);
        } else this.lifting = false;
        if (hasWish) accelerate(v, wx * top, wz * top, cfg.accelAir * dt);
      }
    }

    // ---- integrate with collision ----
    const targetH = this.slideTimer > 0 ? SLIDE_H : STAND_H;
    if (targetH > this.height && world.blockedAt(this.pos.x, this.pos.y + STAND_H - 0.05, this.pos.z, RADIUS)) {
      // cannot stand up under something; stay low
    } else this.height = targetH;

    const hitX = this.moveAxis(world, 'x', v.x * dt, cfg);
    const hitZ = this.moveAxis(world, 'z', v.z * dt, cfg);
    if (hitX) v.x = 0;
    if (hitZ) v.z = 0;
    const wasGrounded = this.grounded;
    this.grounded = false;
    this.moveAxis(world, 'y', v.y * dt, cfg);
    if (this.pos.y <= 0) { this.pos.y = 0; this.grounded = true; }
    if (!this.grounded && v.y <= 0 && wasGrounded) {
      // stayed on the same surface this frame?
      const top = world.support(this.pos.x, this.pos.z, this.pos.y, RADIUS * 0.9, 0.05);
      if (Math.abs(top - this.pos.y) < 0.06) { this.pos.y = top; this.grounded = true; }
    }
    if (this.grounded) {
      if (!wasGrounded) this.landFall = Math.max(this.landFall, this.fallTop - this.pos.y);
      this.fallTop = this.pos.y;
    } else if (wall || this.gliding) this.fallTop = this.pos.y; // sliding down a wall or gliding is safe
    else this.fallTop = Math.max(this.fallTop, this.pos.y);
    if (this.grounded) {
      v.y = 0;
      this.airJumpsLeft = cfg.airJumps;
      this.wallRunTimer = 0;
      this.wallState = 0;
    }

    // Invisible walls.
    const lim = world.half - RADIUS;
    this.pos.x = Math.max(-lim, Math.min(lim, this.pos.x));
    this.pos.z = Math.max(-lim, Math.min(lim, this.pos.z));

    // ---- visuals ----
    const hs = Math.hypot(v.x, v.z);
    if (hs > 0.5) this.facing = Math.atan2(-v.x, -v.z);
    this.mesh.position.set(this.pos.x, this.pos.y + this.height / 2, this.pos.z);
    this.mesh.scale.y = this.height / STAND_H;
    this.mesh.rotation.y = this.facing;
    const col = this.dashTimer > 0 ? 0xffffff : this.gliding ? 0x99ff99 : this.wallState ? 0xffcc66 : this.slideTimer > 0 ? 0xff99ff : 0x19e3ff;
    this.mesh.material.color.setHex(col);
  }

  moveAxis(world, axis, delta, cfg) {
    if (!delta) return null;
    const p = this.pos;
    p[axis] += delta;
    const r = RADIUS, h = this.height;
    let hit = null;
    world.forNear(p.x - r, p.z - r, p.x + r, p.z + r, b => {
      if (!(p.x - r < b.maxX && p.x + r > b.minX && p.y < b.maxY && p.y + h > b.minY && p.z - r < b.maxZ && p.z + r > b.minZ)) return;
      if (axis === 'y') {
        if (delta < 0) { p.y = b.maxY; this.grounded = true; }
        else { p.y = b.minY - h; this.vel.y = 0; }
        return;
      }
      // Optional auto-vault (Q13): step up onto low obstacles without losing speed.
      const rise = b.maxY - p.y;
      if (cfg.autoVault && rise > 0 && rise <= 1.9 && (this.grounded || this.vel.y <= 0)) {
        p.y = b.maxY + 0.01;
        return;
      }
      if (axis === 'x') p.x = delta > 0 ? b.minX - r - 1e-4 : b.maxX + r + 1e-4;
      else p.z = delta > 0 ? b.minZ - r - 1e-4 : b.maxZ + r + 1e-4;
      hit = b;
    });
    return hit;
  }

  // Nearest wall face within reach, as an outward normal.
  probeWall(world) {
    const p = this.pos, reach = RADIUS + 0.25;
    let best = null, bestD = 0.3;
    world.forNear(p.x - reach, p.z - reach, p.x + reach, p.z + reach, b => {
      if (b.maxY < p.y + 0.4 || b.minY > p.y + this.height - 0.2) return;
      const insideX = p.x > b.minX && p.x < b.maxX, insideZ = p.z > b.minZ && p.z < b.maxZ;
      const faces = [];
      if (insideZ) faces.push([b.minX - (p.x + RADIUS), -1, 0], [(p.x - RADIUS) - b.maxX, 1, 0]);
      if (insideX) faces.push([b.minZ - (p.z + RADIUS), 0, -1], [(p.z - RADIUS) - b.maxZ, 0, 1]);
      for (const [d, nx, nz] of faces) {
        if (d >= -0.05 && d < bestD) { bestD = d; best = { nx, nz, box: b }; }
      }
    });
    return best;
  }
}

function accelerate(v, tx, tz, maxDelta) {
  const dx = tx - v.x, dz = tz - v.z, d = Math.hypot(dx, dz);
  if (d <= maxDelta) { v.x = tx; v.z = tz; }
  else { v.x += (dx / d) * maxDelta; v.z += (dz / d) * maxDelta; }
}
