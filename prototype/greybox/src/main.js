import * as THREE from 'three';
import { config, resetConfig } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { FollowCamera } from './camera.js';
import { Horde, TYPES } from './enemies.js';
import { Combat } from './combat.js';
import { Rewards } from './rewards.js';
import { Director } from './director.js';
import { Hud } from './hud.js';
import { buildDebug } from './debug.js';
import { Build } from './build.js';
import { Choice } from './choice.js';
import { Skills } from './skills.js';
import { towerTargets, levelTargets } from './catalog.js';
import { Orbs } from './orbs.js';
import { Civilians } from './civilians.js';
import { Sfx } from './audio.js';
import { newStats, tickStats, recordDamage, summary, fmtClock, samplePower } from './metrics.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fb4c8);
scene.fog = new THREE.Fog(0x9fb4c8, 120, 420);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 900);
scene.add(new THREE.HemisphereLight(0xe6eeff, 0x40444a, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.3);
sun.position.set(120, 220, 60);
scene.add(sun);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const game = {
  cfg: config, scene, TYPES,
  tier: 1,
  state: 'menu',            // menu | playing | choosing | paused | dead | wonMenu | left
  stats: newStats(),
  activeZone: null,
};
window.game = game;         // handy from the browser console

game.build = new Build();
game.eff = game.build.stats(config);  // effective stats: base config + the run's upgrades
game.input = new Input(canvas);
game.player = new Player(scene);
game.horde = new Horde(scene);
game.combat = new Combat(scene);
game.rewards = new Rewards(scene);
game.director = new Director(game);
game.hud = new Hud();
game.skills = new Skills(scene);
game.choice = new Choice(game, () => { setState('playing'); game.input.requestLock(); });
game.cam = new FollowCamera(camera);
game.orbs = new Orbs(scene);
game.civ = new Civilians(scene);
game.sfx = new Sfx(camera);

let worldKey = '';
function buildWorld() {
  const key = `${config.layout}:${config.seed}`;
  if (key === worldKey) return;
  game.world?.dispose();
  game.world = new World(scene, { layout: config.layout, seed: config.seed });
  game.world.markClosets(0.2);
  worldKey = key;
}

game.restart = () => {
  buildWorld();
  game.tier = 1;
  game.stats = newStats();
  game.build.reset();
  game.frozen = false;
  game.choice.reset();
  game.skills.reset();
  game.eff = game.build.stats(config);
  game.horde.clear();
  game.combat.reset(game.eff);
  game.director.reset();
  game.civ.clear();          // before placing towers and orbs, so last run's cars don't get in the way
  game.rewards.reset(game);
  game.orbs.reset(game.world, config);
  const s = game.world.randomStreetPoint(0, 0, 0, 30, 60) ?? { x: 0, z: -game.world.half + 7 };
  game.player.reset(s.x, s.z);
  game.civ.reset(game);
  game.iframes = 0;
  game.contactAcc = 0;
  game.player.hp = game.eff.maxHp;
  game.world.computeFlow(s.x, 0, s.z);
  setState('playing');
};

game.resetTuning = () => resetConfig();

// kind: contact | bullet | fall | nuke. source: index of the enemy that dealt the hit, or -1.
// I-frames (PLAN-playtest2 step 4): after a hit, nothing but the nuke lands for eff.iFrames seconds.
// Contact damage is continuous, so it counts as a hit once it has dealt contactHitChunk.
game.damagePlayer = (amount, kind = 'contact', source = -1) => {
  if (config.godMode || game.state !== 'playing' || amount <= 0) return;
  const eff = game.eff;
  if (kind !== 'nuke') {
    if (game.iframes > 0) return;
    if (kind === 'bullet') amount = Math.min(amount, eff.maxHp * eff.bulletMaxHitPct);
    if (kind === 'contact' || kind === 'bullet') amount *= 1 - eff.damageReduction;
    if (kind === 'contact') {
      game.contactAcc += amount;
      if (game.contactAcc >= eff.contactHitChunk) { game.contactAcc = 0; game.iframes = eff.iFrames; }
    } else game.iframes = eff.iFrames;
  }
  game.skills.onHit(game, kind, source);
  const before = amount;
  amount = game.skills.absorb(amount);
  if (kind !== 'contact' || game.iframes > 0) game.sfx.play(amount > 0 ? 'hurt' : 'shieldHit');
  game.hud.hurt(before / eff.maxHp);
  if (amount <= 0) return;
  game.player.hp -= amount;
  recordDamage(game.stats, amount, game.player, kind);
  if (game.player.hp <= 0) {
    game.player.hp = 0;
    showOverlay('You died', `Clock at death: ${fmtClock(game.director.remaining)}` +
      (game.director.remaining < 0 ? '   ← overtime, screenshot it' : ''), [['Restart (R)', game.restart]]);
    setState('dead');
  }
};

// A landing: the Impact skill, and fall damage above the safe height.
game.onLand = (fall) => {
  const eff = game.eff, safe = Math.max(eff.fallSafeHeight, eff.fallSafeJumpMult * eff.jumpHeight);
  if (fall > 1) game.sfx.play('land', game.player.pos.x, game.player.pos.y, game.player.pos.z, Math.min(1, 0.3 + fall / 20));
  game.stats.maxFall = Math.max(game.stats.maxFall, fall);
  game.skills.onLand(game, fall, safe);
  if (fall <= safe) return;
  game.stats.hardLandings++;
  if (!eff.fallDamage) return;
  const dmg = eff.fallDmgPerM * (fall - safe) * (1 - eff.fallReduction);
  game.damagePlayer(dmg, 'fall');
  game.hud.flash(`Hard landing −${Math.round(dmg)}`);
};

game.offerTower = (large = false) => game.choice.offer(large ? 'largeTower' : 'tower', () => towerTargets(game.build), large ? config.largeTowerRarityShift : 0);
game.offerLevel = () => game.choice.offer('level', () => levelTargets(game.build, game.eff));

// Debug: . levels up (through the normal XP path, so offers mode opens a menu);
// , levels down and undoes that level's pick. Only while playing with no menu queued.
game.levelUp = () => game.combat.addXp(game.combat.xpNext - game.combat.xp, game, true);
game.levelDown = () => {
  const c = game.combat;
  if (c.level <= 1 || game.choice.pending) return;
  c.level--;
  c.xp = 0;
  c.xpNext = c.xpForLevel(c.level, game.eff);
  const card = game.build.levelPicks.pop();
  if (card) game.build.unapply(card);
  game.hud.flash(`Level ${c.level}${card ? ` (undid ${card.name})` : ''}`);
};

game.heal = (v) => { game.player.hp = Math.min(game.eff.maxHp, game.player.hp + v); };

// Area hits that aren't aimed at one enemy (Pulse, Mortar, Impact, ...): they also destroy
// enemy bullets in the sphere (step 5) and hurt civilians in it (step 8). civDmg 0 = bullets only.
game.areaHit = (x, y, z, r, civDmg, source, rehit = 0) => {
  game.stats.bulletsDestroyed += game.horde.destroyBullets(x, y, z, r);
  if (civDmg > 0) game.civ.damageRadius(x, y, z, r, civDmg, game, rehit);
};

// Every weapon and skill damages enemies through here, so damage can be credited per source.
game.damageEnemy = (i, amount, source) => {
  const h = game.horde;
  if (!h.alive[i] || amount <= 0) return;
  h.hp[i] -= amount;
  h.hitFlash[i] = 0.08;
  const by = game.stats.damageBySource;
  by[source] = (by[source] ?? 0) + amount;
  if (h.hp[i] <= 0) game.onEnemyKilled(i);
};

game.onEnemyKilled = (i) => {
  const h = game.horde, t = TYPES[h.type[i]];
  game.stats.kills++;
  if (t.boss) {
    // A boss drops XP worth a few levels at the time of the kill, as a cluster of gems.
    const c = game.combat, levels = t.final ? config.finalBossXpLevels : config.bossXpLevels;
    let xp = c.xpNext - c.xp;
    for (let l = 1; l < levels; l++) xp += c.xpForLevel(c.level + l, game.eff);
    for (let k = 0; k < 12; k++) c.dropGem(h.x[i] + (Math.random() - 0.5) * 4, h.y[i] + Math.random() * 3, h.z[i] + (Math.random() - 0.5) * 4, xp / 12);
  } else if (t.xp) game.combat.dropGem(h.x[i], h.y[i], h.z[i], t.xp * (1 + 0.25 * (game.tier - 1)));
  game.director.onKilled(i);
  h.kill(i);
};

game.onFinalBossKilled = () => {
  setState('wonMenu');
  // Development placeholder for the post-boss choice (design doc §5).
  showOverlay('Final boss defeated', `Clock: ${fmtClock(game.director.remaining)}\nContinue into overtime for score, or leave the run.`, [
    ['Continue into overtime (Enter)', () => setState('playing')],
    ['Leave run', () => { showOverlay('Run won', `Left at ${fmtClock(game.director.remaining)}`, [['Restart (R)', game.restart]]); setState('left'); }],
  ]);
};

// ---------- overlay ----------
const overlay = document.getElementById('overlay');
const card = overlay.querySelector('.card');
function showOverlay(title, text, buttons) {
  const m = summary(game.stats, game);
  card.innerHTML = `<h1>${title}</h1><pre>${text}\n\n${JSON.stringify(m, null, 1).replace(/[{}"]/g, '')}</pre>`;
  for (const [label, fn] of buttons) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => { fn(); if (game.state === 'playing') game.input.requestLock(); };
    card.appendChild(b);
  }
  overlay.style.display = 'flex';
}
function setState(s) {
  game.state = s;
  if (s === 'playing') overlay.style.display = 'none';
}
document.getElementById('play').onclick = () => { game.sfx.start(); game.restart(); game.input.requestLock(); };
canvas.addEventListener('click', () => { if (game.state === 'playing') game.input.requestLock(); });
document.addEventListener('pointerlockchange', () => {
  if (!game.input.locked && game.state === 'playing' && game.input.lastDevice === 'mouse' && !guiVisible) {
    setState('paused');
    showOverlay('Paused', 'Click to resume.', [['Resume', () => setState('playing')]]);
  }
});

buildWorld();
const gui = buildDebug(game);
gui.hide();
let guiVisible = false;

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const inp = game.input.poll(config);
  game.eff = game.build.stats(config, game.combat.level);
  game.skills.modifyStats(game.eff, game);

  if (inp.debugPressed) { guiVisible = !guiVisible; guiVisible ? gui.show() : gui.hide(); if (guiVisible) document.exitPointerLock?.(); }
  if (inp.restartPressed && game.state !== 'menu') game.restart();
  if (inp.pausePressed) {
    if (game.state === 'playing') { setState('paused'); showOverlay('Paused', 'P / Start to resume.', [['Resume', () => setState('playing')]]); }
    else if (game.state === 'paused') setState('playing');
  }
  if (inp.confirmPressed && game.state === 'wonMenu') setState('playing');
  if (game.state === 'playing' && inp.levelUpPressed) game.levelUp();
  if (game.state === 'playing' && inp.levelDownPressed) game.levelDown();

  if (game.state === 'playing' && inp.freezePressed) {
    game.frozen = !game.frozen;
    game.hud.flash(game.frozen ? 'Horde frozen (F)' : 'Horde unfrozen');
  }

  if (game.state === 'playing' && game.choice.pending && config.autoPick) game.choice.autoPickAll();
  if (game.state === 'playing' && game.choice.pending) {
    setState('choosing');
    game.choice.open();
    game.hud.clearToast(); // e.g. "Level 7", which would sit behind the menu title
    document.exitPointerLock?.();
  } else if (game.state === 'choosing') {
    // Not simulated this frame even if the pick resumes play, so the A press that picked doesn't also jump.
    game.stats.menuTime += dt;
    game.choice.handle(inp);
  } else if (game.state === 'playing') {
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    const sdt = dt / steps;
    for (let k = 0; k < steps; k++) {
      const si = k === 0 ? inp : { ...inp, jumpPressed: false, dashPressed: false, slidePressed: false };
      game.player.update(sdt, si, game.cam.yaw, game.world, game.eff);
    }
    if (game.frozen) {
      // Debug freeze (playtest 1 request): the player moves; the horde, clock, weapons,
      // rewards and stats all stand still. Landings don't count.
      game.player.landFall = 0;
    } else {
      if (game.player.landFall > 0) { game.onLand(game.player.landFall); game.player.landFall = 0; }
      game.iframes = Math.max(0, game.iframes - dt);
      game.contactAcc = Math.max(0, game.contactAcc - game.eff.contactHitChunk * dt); // leaky: only a burst counts as a hit
      if (game.eff.hpRegen > 0) game.heal(game.eff.hpRegen * dt);
      game.director.update(dt);
      game.civ.update(dt, game);
      const contactDps = game.horde.update(dt, game);
      game.damagePlayer(contactDps * dt);
      game.combat.update(dt, game);
      game.rewards.update(dt, game);
      game.orbs.update(dt, game);
      game.skills.update(dt, game, game.eff);
      tickStats(game.stats, dt, game.player);
      samplePower(game.stats, game);
    }
    game.cam.update(dt, inp, game.player, game.world, config);
    game.player.mesh.visible = !(game.iframes > 0 && Math.floor(game.iframes * 20) % 2); // i-frame flicker
  } else {
    game.cam.update(dt, { lookX: 0, lookY: 0 }, game.player, game.world, config);
  }

  game.horde.render();
  game.civ.render();
  game.sfx.update(dt, game);
  game.hud.update(dt, game);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
