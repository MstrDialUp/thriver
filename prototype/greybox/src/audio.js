// Grey-box sound (PLAN-playtest2 step 9). Web Audio with positional panners, so sound fades
// with 3D distance (vertical as well as horizontal). Every sound is synthesised in code:
// no asset files, in keeping with the no-build grey box. Placeholder sounds, not a mix.
//
// Voice limits per sound, plus a minimum gap between plays, so hundreds of shots a second
// don't turn into noise. Far sources are skipped.

const MAX_DIST = 90;

// name: [voices, min gap (s), base gain, positional]
const SPECS = {
  shot:      [4, 0.05, 0.35, true],
  droneShot: [3, 0.06, 0.25, true],
  zap:       [2, 0.08, 0.35, true],
  mortar:    [2, 0.10, 0.4, true],
  boom:      [3, 0.06, 0.6, true],
  enemyShot: [4, 0.05, 0.35, true],
  step:      [2, 0.00, 0.25, false],
  wallStep:  [2, 0.00, 0.25, false],
  land:      [2, 0.05, 0.7, false],
  hurt:      [1, 0.12, 0.6, false],
  shieldHit: [1, 0.12, 0.5, false],
  orb:       [3, 0.03, 0.4, true],
  towerDone: [1, 0.20, 0.7, true],
};

export class Sfx {
  constructor(camera) {
    this.camera = camera;
    this.ctx = null;
    this.active = {};
    this.last = {};
    this.stepT = 0;
  }

  // Needs a user gesture (the Play button).
  start() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.buffers = this.makeBuffers();
    // Looping hums: the tower being held (pitch rises with progress), the nearest orb, the nearest large tower.
    this.charge = this.loop('square', 0);
    this.orbHum = this.loop('sine', 0, true);
    this.towerHum = this.loop('triangle', 0, true);
  }

  // ---------- synthesis ----------
  buffer(dur, fn) {
    const sr = this.ctx.sampleRate, n = Math.floor(sr * dur), b = this.ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = fn(i / sr, i / n);
    return b;
  }

  makeBuffers() {
    const noise = () => Math.random() * 2 - 1, env = (k, a = 6) => Math.exp(-a * k);
    const sweep = (f0, f1) => { let ph = 0; return (t, k) => { ph += (f0 + (f1 - f0) * k) / this.ctx.sampleRate; return ph; }; };
    const sq = p => (p % 1 < 0.5 ? 1 : -1), sin = p => Math.sin(2 * Math.PI * p);
    const s1 = sweep(900, 300), s2 = sweep(1400, 900), s3 = sweep(420, 90), s4 = sweep(160, 40), s5 = sweep(1500, 2600);
    const s6 = sweep(700, 1800), s7 = sweep(300, 900), lp = { v: 0 };
    return {
      shot: this.buffer(0.07, (t, k) => (noise() * 0.5 + sq(s1(t, k)) * 0.5) * env(k, 5)),
      droneShot: this.buffer(0.06, (t, k) => sq(s2(t, k)) * env(k, 5)),
      zap: this.buffer(0.12, (t, k) => (noise() * sq(t * 60)) * env(k, 4)),
      mortar: this.buffer(0.15, (t, k) => sin(s3(t, k)) * env(k, 4)),
      boom: this.buffer(0.5, (t, k) => { lp.v += (noise() - lp.v) * 0.08; return (lp.v * 3 + sin(s4(t, k)) * 0.6) * env(k, 5); }),
      enemyShot: this.buffer(0.1, (t, k) => sq(s5(t, k)) * 0.6 * env(k, 6)),
      step: this.buffer(0.05, (t, k) => { lp.v += (noise() - lp.v) * 0.2; return lp.v * 2 * env(k, 8); }),
      wallStep: this.buffer(0.04, (t, k) => (noise() * 0.6 + sq(t * 900) * 0.4) * env(k, 10)),
      land: this.buffer(0.22, (t, k) => { lp.v += (noise() - lp.v) * 0.1; return (lp.v * 3 + sin(t * 70) * 0.7) * env(k, 6); }),
      hurt: this.buffer(0.22, (t, k) => (sq(s7(t, 1 - k)) * 0.6 + noise() * 0.3) * env(k, 4)),
      shieldHit: this.buffer(0.25, (t, k) => (sin(t * 1800) * 0.6 + sin(t * 2710) * 0.4) * env(k, 7)),
      orb: this.buffer(0.18, (t, k) => sin(s6(t, k)) * env(k, 5)),
      towerDone: this.buffer(0.6, (t, k) => (sin(t * 523) + sin(t * 659) * 0.8 + sin(t * 784) * 0.6) * 0.4 * env(k, 3)),
    };
  }

  panner() {
    const p = this.ctx.createPanner();
    p.panningModel = 'equalpower';
    p.distanceModel = 'inverse';
    p.refDistance = 4;
    p.rolloffFactor = 1.2;
    p.maxDistance = MAX_DIST * 2;
    return p;
  }

  loop(type, freq, positional = false) {
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq || 200;
    gain.gain.value = 0;
    osc.connect(gain);
    let pan = null;
    if (positional) { pan = this.panner(); gain.connect(pan); pan.connect(this.master); } else gain.connect(this.master);
    osc.start();
    return { osc, gain, pan };
  }

  setPos(pan, x, y, z) {
    if (pan.positionX) { pan.positionX.value = x; pan.positionY.value = y; pan.positionZ.value = z; }
    else pan.setPosition(x, y, z);
  }

  // ---------- playback ----------
  play(name, x, y, z, vol = 1) {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const [voices, gap, base, positional] = SPECS[name];
    const now = ctx.currentTime;
    if ((this.active[name] ?? 0) >= voices || now - (this.last[name] ?? -9) < gap) return;
    if (positional && x !== undefined) {
      const c = this.camera.position;
      if ((x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2 > MAX_DIST * MAX_DIST) return;
    }
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = this.buffers[name];
    src.playbackRate.value = 0.94 + Math.random() * 0.12;
    g.gain.value = base * vol;
    src.connect(g);
    if (positional && x !== undefined) { const p = this.panner(); this.setPos(p, x, y, z); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    this.active[name] = (this.active[name] ?? 0) + 1;
    this.last[name] = now;
    src.onended = () => { this.active[name]--; };
    src.start();
  }

  get enabled() { return this.game?.cfg.sound ?? true; }

  update(dt, game) {
    this.game = game;
    const ctx = this.ctx;
    if (!ctx) return;
    const cfg = game.cfg, playing = game.state === 'playing' && cfg.sound;
    this.master.gain.value = cfg.sound ? cfg.volume : 0;

    // Listener follows the camera.
    const c = this.camera, L = ctx.listener, f = c.getWorldDirection(this._f ??= c.position.clone());
    if (L.positionX) {
      L.positionX.value = c.position.x; L.positionY.value = c.position.y; L.positionZ.value = c.position.z;
      L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z;
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(c.position.x, c.position.y, c.position.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }

    // Footsteps and wall steps, faster with speed.
    const p = game.player, hs = Math.hypot(p.vel.x, p.vel.z);
    const onWall = p.wallState > 0, walking = p.grounded && hs > 2 && p.slideTimer <= 0;
    if (playing && (walking || onWall)) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = onWall ? 0.18 : Math.max(0.22, 2.6 / Math.max(hs, 1));
        this.play(onWall ? 'wallStep' : 'step');
      }
    } else this.stepT = 0;

    // Tower charge: a rising tone while a tower fills.
    const z = game.activeZone, t = ctx.currentTime;
    this.charge.gain.gain.setTargetAtTime(playing && z ? 0.05 : 0, t, 0.05);
    if (z) this.charge.osc.frequency.setTargetAtTime(160 + 500 * z.progress, t, 0.05);

    // Hums (Crackdown's orb hum): the nearest orb within 25 m, the nearest large tower within 70 m.
    const orb = playing ? game.orbs.nearest(p.pos.x, p.center, p.pos.z, 25) : null;
    this.orbHum.gain.gain.setTargetAtTime(orb ? 0.12 : 0, t, 0.1);
    if (orb) { this.setPos(this.orbHum.pan, orb.x, orb.y, orb.z); this.orbHum.osc.frequency.value = 880; }
    let tower = null, td = 70 * 70;
    if (playing) for (const zz of game.rewards.zones) {
      if (zz.tier !== 'large') continue;
      const d = (zz.x - p.pos.x) ** 2 + (zz.z - p.pos.z) ** 2;
      if (d < td) { td = d; tower = zz; }
    }
    this.towerHum.gain.gain.setTargetAtTime(tower ? 0.15 : 0, t, 0.1);
    if (tower) { this.setPos(this.towerHum.pan, tower.x, tower.y + 2, tower.z); this.towerHum.osc.frequency.value = 110; }
  }
}
