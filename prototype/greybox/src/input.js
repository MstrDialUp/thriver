// Keyboard + mouse (pointer lock) and a standard-mapping gamepad, merged into
// one per-frame snapshot. "Pressed" flags are true only on the frame the
// button went down.

const DEADZONE = 0.18;

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedKeys = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.padPrev = [];
    this.locked = false;
    this.lastDevice = 'mouse';

    addEventListener('keydown', e => {
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressedKeys.add(e.code);
      this.keys.add(e.code);
      this.lastDevice = 'mouse';
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
  }

  requestLock() {
    try { this.canvas.requestPointerLock()?.catch?.(() => {}); } catch { /* not allowed here */ }
  }

  poll(cfg) {
    const k = this.keys, p = this.pressedKeys;
    const s = {
      moveX: (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0),
      moveY: (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0),
      lookX: this.mouseDX * cfg.mouseSensitivity,
      lookY: this.mouseDY * cfg.mouseSensitivity,
      jumpHeld: k.has('Space'),
      jumpPressed: p.has('Space'),
      dashPressed: p.has('ShiftLeft') || p.has('ShiftRight'),
      slideHeld: k.has('ControlLeft') || k.has('KeyC'),
      slidePressed: p.has('ControlLeft') || p.has('KeyC'),
      pausePressed: p.has('KeyP'),
      restartPressed: p.has('KeyR'),
      debugPressed: p.has('Backquote') || p.has('Tab'),
      confirmPressed: p.has('Enter'),
    };
    this.mouseDX = this.mouseDY = 0;
    p.clear();

    const pad = [...(navigator.getGamepads?.() ?? [])].find(g => g && g.connected);
    if (pad) {
      const dz = v => (Math.abs(v) < DEADZONE ? 0 : v);
      const btn = i => !!pad.buttons[i]?.pressed;
      const edge = i => btn(i) && !this.padPrev[i];
      const lx = dz(pad.axes[0] ?? 0), ly = dz(pad.axes[1] ?? 0);
      const rx = dz(pad.axes[2] ?? 0), ry = dz(pad.axes[3] ?? 0);
      const any = lx || ly || rx || ry || pad.buttons.some(b => b.pressed);
      if (any) this.lastDevice = 'pad';
      s.moveX += lx; s.moveY -= ly;
      s.lookX += rx * cfg.stickSensitivity / 60;
      s.lookY += ry * cfg.stickSensitivity / 60;
      s.jumpHeld ||= btn(0);           // A
      s.jumpPressed ||= edge(0);
      s.slideHeld ||= btn(1);          // B
      s.slidePressed ||= edge(1);
      s.dashPressed ||= edge(5) || edge(2) || edge(7); // RB, X, RT
      s.pausePressed ||= edge(9);      // Start
      s.restartPressed ||= edge(8);    // Back/Select
      s.confirmPressed ||= edge(0);
      this.padPrev = pad.buttons.map(b => b.pressed);
    }
    const len = Math.hypot(s.moveX, s.moveY);
    if (len > 1) { s.moveX /= len; s.moveY /= len; }
    if (cfg.invertY) s.lookY = -s.lookY;
    return s;
  }
}
