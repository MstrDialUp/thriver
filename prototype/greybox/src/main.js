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
import { newStats, tickStats, recordDamage, summary, fmtClock } from './metrics.js';

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
  state: 'menu',            // menu | playing | paused | dead | wonMenu | left
  stats: newStats(),
  activeZone: null,
};
window.game = game;         // handy from the browser console

game.input = new Input(canvas);
game.player = new Player(scene);
game.horde = new Horde(scene);
game.combat = new Combat(scene);
game.rewards = new Rewards(scene);
game.director = new Director(game);
game.hud = new Hud();
game.cam = new FollowCamera(camera);

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
  game.horde.clear();
  game.combat.reset();
  game.director.reset();
  game.rewards.reset(game);
  const s = game.world.randomStreetPoint(0, 0, 0, 30, 60) ?? { x: 0, z: -game.world.half + 7 };
  game.player.reset(s.x, s.z);
  game.player.hp = config.maxHp;
  game.world.computeFlow(s.x, 0, s.z);
  setState('playing');
};

game.resetTuning = () => resetConfig();

game.damagePlayer = (amount) => {
  if (config.godMode || game.state !== 'playing' || amount <= 0) return;
  game.player.hp -= amount;
  recordDamage(game.stats, amount, game.player);
  if (game.player.hp <= 0) {
    game.player.hp = 0;
    showOverlay('You died', `Clock at death: ${fmtClock(game.director.remaining)}` +
      (game.director.remaining < 0 ? '   ← overtime, screenshot it' : ''), [['Restart (R)', game.restart]]);
    setState('dead');
  }
};

game.heal = (v) => { game.player.hp = Math.min(config.maxHp, game.player.hp + v); };

game.onEnemyKilled = (i) => {
  const h = game.horde, t = TYPES[h.type[i]];
  game.stats.kills++;
  if (t.xp) game.combat.dropGem(h.x[i], h.y[i], h.z[i], t.xp * (1 + 0.25 * (game.tier - 1)));
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
document.getElementById('play').onclick = () => { game.restart(); game.input.requestLock(); };
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

  if (inp.debugPressed) { guiVisible = !guiVisible; guiVisible ? gui.show() : gui.hide(); if (guiVisible) document.exitPointerLock?.(); }
  if (inp.restartPressed && game.state !== 'menu') game.restart();
  if (inp.pausePressed) {
    if (game.state === 'playing') { setState('paused'); showOverlay('Paused', 'P / Start to resume.', [['Resume', () => setState('playing')]]); }
    else if (game.state === 'paused') setState('playing');
  }
  if (inp.confirmPressed && game.state === 'wonMenu') setState('playing');

  if (game.state === 'playing') {
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    const sdt = dt / steps;
    for (let k = 0; k < steps; k++) {
      const si = k === 0 ? inp : { ...inp, jumpPressed: false, dashPressed: false, slidePressed: false };
      game.player.update(sdt, si, game.cam.yaw, game.world, config);
    }
    game.director.update(dt);
    const contactDps = game.horde.update(dt, game);
    game.damagePlayer(contactDps * dt);
    game.combat.update(dt, game);
    game.rewards.update(dt, game);
    tickStats(game.stats, dt, game.player);
    game.cam.update(dt, inp, game.player, game.world, config);
  } else {
    game.cam.update(dt, { lookX: 0, lookY: 0 }, game.player, game.world, config);
  }

  game.horde.render();
  game.hud.update(dt, game);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
