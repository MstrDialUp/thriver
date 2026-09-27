import { exportRun } from './metrics.js';

// Autosave (PLAN-playtest3 step 2). Each run is one file, overwritten on every save, so a
// restart, a crash or a closed tab never loses more than the last few seconds.
//
// With `node serve.mjs` running, saves are POSTed to /api/run and land in the repo at
// playtests/greybox/<date>/<runId>.json. Without it (e.g. the old Python server), they go
// to localStorage, and are uploaded the next time the save server answers.

const LOCAL_KEY = 'thriver.greybox.runs';
const LOCAL_MAX = 40;
const REPING_MS = 30_000;

export class Saver {
  constructor() {
    this.server = null;     // null = not asked yet, then true / false
    this.commit = null;     // the build's git commit, from the server
    this.runId = null;
    this.ended = null;      // set once the run is over; a finished run's file is final
    this.lastSaved = 0;     // performance.now() of the last save, 0 = never
    this.lastPing = 0;
    this.ping();
  }

  async ping() {
    this.lastPing = performance.now();
    try {
      const r = await fetch('/api/ping', { cache: 'no-store' });
      const j = r.ok ? await r.json() : null;
      this.server = !!j?.ok;
      this.commit = j?.commit ?? this.commit;
    } catch { this.server = false; }
    if (this.server) this.flushLocal();
    return this.server;
  }

  // A new run: 2026-09-27T16-40-12_s1 (local time, seed).
  start(seed) {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    this.runId = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}_s${seed}`;
    this.ended = null;
    this.startedAt = this.lastSaved = performance.now();
  }

  // Real seconds since the run started (0 before the first run).
  age() { return this.runId ? (performance.now() - this.startedAt) / 1000 : 0; }

  due(everySec) { return this.runId && !this.ended && performance.now() - this.lastSaved >= everySec * 1000; }

  // ended: 'in-progress', or how the run finished: died | left | restarted | closed.
  save(game, ended = 'in-progress', { beacon = false } = {}) {
    if (!this.runId || this.ended) return;
    if (ended !== 'in-progress') this.ended = ended;
    this.lastSaved = performance.now();
    const body = JSON.stringify({
      runId: this.runId, savedAt: new Date().toISOString(), ended, commit: this.commit, note: game.note ?? '',
      ...exportRun(game),
    });
    if (!this.server) {
      this.local(body);
      if (performance.now() - this.lastPing > REPING_MS) this.ping();
      return;
    }
    if (beacon) {
      if (!navigator.sendBeacon?.('/api/run', new Blob([body], { type: 'application/json' }))) this.local(body);
      return;
    }
    fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: body.length < 60_000 })
      .then(r => { if (!r.ok) throw new Error(r.status); })
      .catch(() => { this.server = false; this.local(body); });
  }

  // ---------- browser fallback ----------
  readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}'); } catch { return {}; }
  }

  writeLocal(runs) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(runs)); } catch { /* full or blocked */ }
  }

  local(body) {
    const runs = this.readLocal(), run = JSON.parse(body);
    runs[run.runId] = run;
    const ids = Object.keys(runs).sort();
    for (const id of ids.slice(0, Math.max(0, ids.length - LOCAL_MAX))) delete runs[id];
    this.writeLocal(runs);
  }

  get localCount() { return Object.keys(this.readLocal()).length; }

  // Upload runs saved while the server was away, then forget them.
  async flushLocal() {
    const runs = this.readLocal();
    for (const [id, run] of Object.entries(runs)) {
      try {
        const r = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(run) });
        if (r.ok) delete runs[id];
      } catch { break; }
    }
    this.writeLocal(runs);
  }

  // Debug panel: every run held in the browser, as one .json download.
  downloadLocal() {
    const runs = this.readLocal();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(runs, null, 2)], { type: 'application/json' }));
    a.download = `greybox-runs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return Object.keys(runs).length;
  }

  // HUD line: [text, warn].
  status() {
    if (!this.runId) return ['', false];
    const ago = this.lastSaved ? `${Math.round((performance.now() - this.lastSaved) / 1000)} s ago` : 'not yet';
    if (this.server === false) return [`NOT SAVING TO REPO — browser only (run node serve.mjs) · saved ${ago}`, true];
    return [`saved ${ago} · ${this.runId}`, false];
  }
}
