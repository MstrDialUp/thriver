import { summary, fmtClock } from './metrics.js';
import { STATS, itemInfo, itemKind, fmtNum } from './catalog.js';

// Plain DOM overlay. Updated at ~10 Hz except for the bars.

const $ = id => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      clock: $('clock'), hp: $('hpfill'), xp: $('xpfill'), level: $('level'), tier: $('tier'),
      bosses: $('bosses'), metrics: $('metrics'), toast: $('toast'), zone: $('zone'), zonefill: $('zonefill'),
      fps: $('fps'), flash: $('flash'), move: $('move'), build: $('build'), shieldbar: $('shieldbar'), shield: $('shieldfill'),
      hurt: $('hurt'), zonelabel: $('zonelabel'),
    };
    this.hurtLevel = 0;
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

  clearToast() {
    this.toastTimer = 0;
    this.el.toast.style.opacity = 0;
  }

  // Red screen border when hurt (PLAN-playtest2 step 4). frac = share of max HP; small ticks add up.
  hurt(frac) { this.hurtLevel = Math.min(1, this.hurtLevel + 0.25 + frac * 4); }

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
    const { player, combat, director, horde } = game;
    const cfg = game.eff;
    this.frames++; this.fpsTime += dt;
    if (this.fpsTime > 0.5) {
      this.el.fps.textContent = `${Math.round(this.frames / this.fpsTime)} fps · ${horde.count} enemies · ${game.civ.ped.count + game.civ.car.count} civilians`;
      this.frames = 0; this.fpsTime = 0;
    }
    this.el.hp.style.width = `${Math.max(0, (100 * player.hp) / cfg.maxHp)}%`;
    this.el.xp.style.width = `${(100 * combat.xp) / combat.xpNext}%`;
    const shieldMax = game.skills.maxShield(game);
    this.el.shieldbar.style.display = shieldMax ? 'block' : 'none';
    if (shieldMax) this.el.shield.style.width = `${(100 * game.skills.shield) / shieldMax}%`;
    if (this.toastTimer > 0 && (this.toastTimer -= dt) <= 0) this.el.toast.style.opacity = 0;
    this.hurtLevel = Math.max(0, this.hurtLevel - dt * 2.5);
    this.el.hurt.style.opacity = this.hurtLevel.toFixed(2);

    const z = game.activeZone;
    this.el.zone.style.display = z ? 'block' : 'none';
    if (z) {
      this.el.zonefill.style.width = `${Math.round(z.progress * 100)}%`;
      this.el.zonefill.style.background = z.tier === 'large' ? '#ffb030' : '#40c4ff';
      this.el.zonelabel.textContent = z.tier === 'large' ? 'holding LARGE tower' : 'holding tower';
    }

    const p = player;
    const state = p.dashTimer > 0 ? 'dash' : p.gliding ? 'glide' : p.wallState === 1 ? 'wall run ↑' : p.wallState === 2 ? 'wall run' : p.slideTimer > 0 ? 'slide' : p.grounded ? '' : 'air';
    const fall = p.grounded ? 0 : p.fallTop - p.pos.y;
    const safe = Math.max(cfg.fallSafeHeight, cfg.fallSafeJumpMult * cfg.jumpHeight);
    this.el.move.textContent = `${game.frozen ? 'FROZEN (F)  ' : ''}${fall > safe && cfg.fallDamage ? `FALL ${fall.toFixed(0)} m  ` : ''}${state}  jumps ${p.grounded ? cfg.airJumps : p.airJumpsLeft}/${cfg.airJumps} · dash ${p.dashCharges}/${cfg.dashCharges} · alt ${p.pos.y.toFixed(0)} m` +
      (game.skills.momentum > 0.005 ? ` · momentum +${Math.round(game.skills.momentum * 100)}%` : '') +
      (p.lifting ? ' · updraft' : '');

    if ((this.slow -= dt) > 0) return;
    this.slow = 0.1;
    const rem = director.remaining;
    this.el.clock.textContent = fmtClock(rem);
    this.el.clock.classList.toggle('neg', rem < 0);
    this.el.level.textContent = `Lv ${combat.level}` + (cfg.levelMult > 1.001 ? ` · level damage ×${cfg.levelMult.toFixed(2)}` : '');
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

    this.el.build.textContent = this.buildText(game);

    const s = summary(game.stats, game);
    this.el.metrics.textContent =
      `up ${s.pctElevated}% · surrounded ${s.pctSurrounded}% · escaped ${s.pctEscaped}%\n` +
      `longest escape ${s.longestEscapeSec}s · dmg ground/up ${s.damageGround}/${s.damageElevated}\n` +
      `towers ${s.zonesHeld} (large ${s.largeTowersHeld}, ${game.rewards.largeLeft}/${game.rewards.largeTotal} left) · caches ${s.rooftopCaches}\n` +
      `orbs ${s.orbsTaken}/${game.orbs.count} · kills ${s.kills} · civilians ${s.civKilled}\n` +
      `power ×${s.powerIndex} · vs playtest 1 ${s.powerVsPlaytest1}`;
  }

  // Build panel: owned weapons and skills with levels, then the tower (stat) bonuses.
  buildText(game) {
    const { build } = game, items = Object.entries(build.items);
    const list = kind => {
      const owned = items.filter(([id]) => itemKind(id) === kind).map(([id, lv]) => `${itemInfo(id).name} ${lv}`);
      const free = Math.max(0, game.eff[kind === 'weapon' ? 'weaponSlots' : 'skillSlots'] - owned.length);
      return [...owned, ...Array(free).fill('[ ]')].join(' · ');
    };
    const pct = v => `${v > 0 ? '+' : '−'}${(Math.abs(v) * 100).toFixed(Math.abs(v) < 0.1 ? 1 : 0)}%`; // orbs are fractions of a percent
    const stats = Object.entries(build.bonus).filter(([k, v]) => STATS[k] && !STATS[k].owner && Math.abs(v) > 1e-9).map(([k, v]) => {
      const s = STATS[k], label = s.label.toLowerCase();
      if (s.mode === 'add') return `${label} +${fmtNum(v)}`;
      if (s.mode === 'hyper') return `${label} ${pct(1 - 1 / (1 + v))}`;
      return `${label} ${pct(v)}`;
    });
    return `weapons  ${list('weapon')}\nskills   ${list('skill')}` + (stats.length ? `\nstats    ${stats.join(' · ')}` : '');
  }
}
