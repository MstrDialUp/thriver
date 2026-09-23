// Third-person free camera (design doc §6) that pulls in when a building
// is between it and the player.

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0;
    this.pitch = 0.35;
    this.dist = 7;
  }

  update(dt, inp, player, world, cfg) {
    this.yaw -= inp.lookX;
    this.pitch = Math.max(-0.7, Math.min(1.35, this.pitch + inp.lookY));

    const px = player.pos.x, py = player.pos.y + 1.6, pz = player.pos.z;
    const cp = Math.cos(this.pitch);
    const dx = Math.sin(this.yaw) * cp, dy = Math.sin(this.pitch), dz = Math.cos(this.yaw) * cp;
    const hit = world.raycast(px, py, pz, dx, dy, dz, cfg.camDistance + 0.4);
    const want = Math.max(1.2, Math.min(cfg.camDistance, hit - 0.4));
    // pull in instantly, ease back out
    this.dist = want < this.dist ? want : this.dist + (want - this.dist) * Math.min(1, dt * 4);

    let cy = py + dy * this.dist;
    if (cy < 0.3) cy = 0.3;
    this.camera.position.set(px + dx * this.dist, cy, pz + dz * this.dist);
    this.camera.lookAt(px, py, pz);
  }
}
