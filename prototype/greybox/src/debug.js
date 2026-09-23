import GUI from 'lil-gui';
import { summary } from './metrics.js';

// Live tuning panel. Toggle with ` or Tab.

export function buildDebug(game) {
  const cfg = game.cfg;
  const gui = new GUI({ title: 'Grey box (` to hide)', width: 300 });

  const q1 = gui.addFolder('Q1 — resolutions (A/B/C/D)');
  q1.add(cfg, 'rewardsAtHeight').name('A · rooftop caches');
  q1.add(cfg, 'holdZones').name('B · ground hold zones');
  q1.add(cfg, 'climbers').name('C · climbers');
  q1.add(cfg, 'flyers').name('C · flyers');
  q1.add(cfg, 'rooftopClosets').name('C · rooftop closets');
  q1.add(cfg, 'relocation').name('D · relocation');

  const mv = gui.addFolder('Movement');
  mv.add(cfg, 'moveSpeed', 4, 20, 0.5);
  mv.add(cfg, 'jumpHeight', 1, 30, 0.5).name('jumpHeight (upgrade→superjump)');
  mv.add(cfg, 'airJumps', 0, 6, 1);
  mv.add(cfg, 'dashCharges', 0, 5, 1);
  mv.add(cfg, 'dashCooldown', 0.1, 3, 0.05);
  mv.add(cfg, 'dashSpeed', 10, 60, 1);
  mv.add(cfg, 'wallRunTime', 0, 10, 0.1).name('wallRunTime (10≈∞)');
  mv.add(cfg, 'wallRunUpSpeed', 3, 25, 0.5);
  mv.add(cfg, 'glide');
  mv.add(cfg, 'glideFallSpeed', 0.5, 10, 0.25);
  mv.add(cfg, 'slideBoost', 1, 2.5, 0.05);
  mv.add(cfg, 'autoVault').name('auto-vault (Q13)');
  mv.add(cfg, 'gravity', 10, 60, 1);
  mv.add(cfg, 'camDistance', 3, 16, 0.5);
  mv.add(cfg, 'mouseSensitivity', 0.0005, 0.008, 0.0001);
  mv.add(cfg, 'invertY');
  mv.close();

  const hd = gui.addFolder('Horde');
  hd.add(cfg, 'maxEnemies', 50, 2500, 50);
  hd.add(cfg, 'spawnPerSec', 0, 30, 0.5);
  hd.add(cfg, 'spawnGrowthPerMin', 0, 5, 0.1);
  hd.add(cfg, 'flyerShare', 0, 1, 0.05);
  hd.add(cfg, 'climberShare', 0, 1, 0.05);
  hd.add(cfg, 'closetShare', 0, 1, 0.05);
  hd.add(cfg, 'relocateDistance', 30, 200, 5);
  hd.add(cfg, 'fodderOverlap', 0, 1, 0.05);
  hd.close();

  const df = gui.addFolder('Difficulty & weapon');
  df.add(cfg, 'slidingPerMin', 0, 0.5, 0.01).name('sliding (per min)');
  df.add(cfg, 'tierMult', 1, 3, 0.05).name('tier multiplier');
  df.add(cfg, 'damage', 1, 100, 1);
  df.add(cfg, 'fireInterval', 0.05, 2, 0.05);
  df.add(cfg, 'projectiles', 1, 10, 1);
  df.add(cfg, 'range', 10, 60, 1);
  df.add(cfg, 'holdTime', 1, 20, 0.5);
  df.close();

  const run = gui.addFolder('Run');
  run.add(cfg, 'timeScale', 0.25, 20, 0.25).name('clock speed');
  run.add(cfg, 'godMode');
  run.add(cfg, 'nuke');
  run.add(cfg, 'layout', ['mixed', 'towers', 'lowrise']).name('layout (restart)');
  run.add(cfg, 'seed', 1, 999, 1).name('seed (restart)');
  const actions = {
    restart: () => game.restart(),
    skipToBoss: () => game.director.skipToNextBoss(),
    tierUp: () => { game.tier = Math.min(6, game.tier + 1); },
    copyMetrics: () => {
      const data = JSON.stringify({ metrics: summary(game.stats, game), config: cfg }, null, 2);
      navigator.clipboard?.writeText(data).then(
        () => game.hud.flash('Metrics copied to clipboard'),
        () => { console.log(data); game.hud.flash('Clipboard blocked — metrics logged to console'); },
      );
    },
    resetTuning: () => { game.resetTuning(); gui.controllersRecursive().forEach(c => c.updateDisplay()); },
  };
  run.add(actions, 'restart').name('Restart run (R)');
  run.add(actions, 'skipToBoss').name('Skip to next boss');
  run.add(actions, 'tierUp').name('Tier +1 (cheat)');
  run.add(actions, 'copyMetrics').name('Copy metrics JSON');
  run.add(actions, 'resetTuning').name('Reset all tuning');

  return gui;
}
