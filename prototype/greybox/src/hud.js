import { summary, fmtClock } from './metrics.js';

// Plain DOM overlay. Updated at ~10 Hz except for the bars.

const $ = id => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      clock: $('clock'), hp: $('hpfill'), xp: $('xpfill'), level: $('level'), tier: $('tier'),
      bosses: $('bosses'), metrics: $('metrics'), toast: $('toast'), zone: $('zone'), zonefill: $('zonefill'),
      fps: $('fps'), flash: $('flash'), move: $('move'),
    };
    this.slow = 0;
    this.toastTimer = 0;
    this.frames = 0;
    this.fpsTime = 0;
  }

  flash(text) {
    this.el.toast.textContent = text;
    this.el.toast.style.opacity = 1;
    this.toastTimer = 2.2;
  }

  nukeFlash() {
    this.el.flash.style.transition = 'none';
    this.el.flash.style.opacity = 1;
    requestAnimationFrame(() => {
      this.el.flash.style.transition = 'opacity 2.5s';
      this.el.flash.style.opacity = 0;
    });
    this.flash('NUKE');
  }

  update(dt, game) {
    const { player, combat, director, cfg, horde } = game;
    this.frames++; this.fpsTime += dt;
    if (this.fpsTime > 0.5) {
      this.el.fps.textContent = `${Math.round(this.frames / this.fpsTime)} fps · ${horde.count} enemies`;
      this.frames = 0; this.fpsTime = 0;
    }
    this.el.hp.style.width = `${Math.max(0, (100 * player.hp) / cfg.maxHp)}%`;
    this.el.xp.style.width = `${(100 * combat.xp) / combat.xpNext}%`;
    if (this.toastTimer > 0 && (this.toastTimer -= dt) <= 0) this.el.toast.style.opacity = 0;

    const z = game.activeZone;
    this.el.zone.style.display = z ? 'block' : 'none';
    if (z) this.el.zonefill.style.width = `${Math.round(z.progress * 100)}%`;

    const p = player;
    const state = p.dashTimer > 0 ? 'dash' : p.gliding ? 'glide' : p.wallState === 1 ? 'wall run ↑' : p.wallState === 2 ? 'wall run' : p.slideTimer > 0 ? 'slide' : p.grounded ? '' : 'air';
    this.el.move.textContent = `${state}  jumps ${p.grounded ? cfg.airJumps : p.airJumpsLeft}/${cfg.airJumps} · dash ${p.dashCharges}/${cfg.dashCharges} · alt ${p.pos.y.toFixed(0)} m`;

    if ((this.slow -= dt) > 0) return;
    this.slow = 0.1;
    const rem = director.remaining;
    this.el.clock.textContent = fmtClock(rem);
    this.el.clock.classList.toggle('neg', rem < 0);
    this.el.level.textContent = `Lv ${combat.level}`;
    this.el.tier.textContent = `Tier ${game.tier}  ${'★'.repeat(game.tier - 1)}${'☆'.repeat(6 - game.tier)}`;

    // Bosses: distance and whether they are above/below.
    const lines = [];
    for (let i = 0; i < horde.alive.length; i++) {
      if (!horde.alive[i]) continue;
      const t = game.TYPES[horde.type[i]];
      if (!t.boss) continue;
      const dx = horde.x[i] - p.pos.x, dz = horde.z[i] - p.pos.z, dy = horde.y[i] - p.pos.y;
      const hpPct = Math.round((100 * horde.hp[i]) / horde.maxHp[i]);
      lines.push(`${t.final ? 'FINAL BOSS' : 'Boss'} ${hpPct}% · ${Math.round(Math.hypot(dx, dz))} m${Math.abs(dy) > 3 ? (dy > 0 ? ' ↑' : ' ↓') : ''}`);
    }
    const next = cfg.bossTimes[director.bossesSpawned];
    if (next !== undefined) lines.push(`next boss ${fmtClock(next * 60 - director.t)}`);
    else if (!director.finalSpawned) lines.push(director.bossesKilled >= cfg.bossTimes.length
      ? `final boss at ${fmtClock(cfg.finalBossMinTime * 60 - director.t)}` : `final boss: kill all ${cfg.bossTimes.length} bosses`);
    this.el.bosses.textContent = lines.join('\n');

    const s = summary(game.stats, game);
    this.el.metrics.textContent =
      `up ${s.pctElevated}% · surrounded ${s.pctSurrounded}% · escaped ${s.pctEscaped}%\n` +
      `longest escape ${s.longestEscapeSec}s · dmg ground/up ${s.damageGround}/${s.damageElevated}\n` +
      `zones ${s.zonesHeld} · caches ${s.rooftopCaches} · kills ${s.kills}`;
  }
}
