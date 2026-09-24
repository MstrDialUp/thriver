import GUI from 'lil-gui';
import { summary } from './metrics.js';
import { RARITIES, WEAPONS, SKILLS } from './catalog.js';

// Live tuning panel. Toggle with ` or Tab.

export function buildDebug(game) {
  const cfg = game.cfg;
  const gui = new GUI({ title: 'Grey box (` to hide)', width: 300 });

  const q1 = gui.addFolder('Q1 — resolutions (A/B/C/D)');
  q1.add(cfg, 'rewardsAtHeight').name('A · rooftop caches');
  q1.add(cfg, 'holdZones').name('B · small towers');
  q1.add(cfg, 'largeTowers').name('B · large towers (off: gone till restart)');
  q1.add(cfg, 'climbers').name('C · climbers');
  q1.add(cfg, 'flyers').name('C · flyers');
  q1.add(cfg, 'rooftopClosets').name('C · rooftop closets');
  q1.add(cfg, 'relocation').name('D · relocation');
  q1.add(cfg, 'fallDamage').name('fall damage (experiment)');

  const mv = gui.addFolder('Movement');
  mv.add(cfg, 'moveSpeed', 4, 20, 0.5);
  mv.add(cfg, 'jumpHeight', 1, 30, 0.5).name('jumpHeight (upgrade→superjump)');
  mv.add(cfg, 'airJumps', 0, 6, 1);
  mv.add(cfg, 'dashCharges', 0, 5, 1);
  mv.add(cfg, 'dashCooldown', 0.1, 3, 0.05);
  mv.add(cfg, 'dashSpeed', 10, 60, 1);
  mv.add(cfg, 'wallRunTime', 0, 10, 0.1);
  mv.add(cfg, 'wallMode', ['free', 'locked']).name('wall movement');
  mv.add(cfg, 'wallRunUnlimited').name('wall run unlimited');
  mv.add(cfg, 'wallRunUpSpeed', 3, 25, 0.5);
  mv.add(cfg, 'glide');
  mv.add(cfg, 'glideFallSpeed', 0.5, 10, 0.25);
  mv.add(cfg, 'slideBoost', 1, 2.5, 0.05);
  mv.add(cfg, 'autoVault').name('auto-vault (Q13)');
  mv.add(cfg, 'fallSafeHeight', 0, 40, 1).name('fall: safe height (m)');
  mv.add(cfg, 'fallSafeJumpMult', 0, 6, 0.25).name('fall: safe × jump height');
  mv.add(cfg, 'fallDmgPerM', 0, 10, 0.25).name('fall: damage per m');
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
  df.add(cfg, 'bossHpMult', 0.5, 10, 0.5).name('boss HP ×');
  df.add(cfg, 'bossXpLevels', 0, 10, 1).name('boss XP (levels)');
  df.add(cfg, 'bulletSpeedMin', 2, 30, 1).name('enemy bullet speed: start');
  df.add(cfg, 'bulletSpeedMax', 2, 40, 1).name('enemy bullet speed: max');
  df.add(cfg, 'bulletDmgExp', 0, 1, 0.05).name('bullet damage scaling (^)');
  df.add(cfg, 'bulletMaxHitPct', 0.05, 1, 0.05).name('bullet max hit (share of HP)');
  df.add(cfg, 'iFrames', 0, 2, 0.05).name('i-frames (s)');
  df.add(cfg, 'contactHitChunk', 1, 30, 1).name('contact dmg per "hit"');
  df.close();

  const tw = gui.addFolder('Towers, orbs, civilians');
  tw.add(cfg, 'holdZoneCount', 0, 10, 1).name('small: alive at once');
  tw.add(cfg, 'holdTime', 1, 20, 0.5).name('small: charge (s)');
  tw.add(cfg, 'smallTowerRoofShare', 0, 1, 0.05).name('small: share on roofs');
  tw.add(cfg, 'largeTowerCount', 0, 40, 1).name('large: per map (restart)');
  tw.add(cfg, 'largeHoldTime', 2, 60, 1).name('large: charge (s)');
  tw.add(cfg, 'largeTowerRoofShare', 0, 1, 0.05).name('large: share on roofs (restart)');
  tw.add(cfg, 'largeTowerRarityShift', 0, 4, 1).name('large: rarity shift');
  tw.add(cfg, 'orbs').name('orbs (restart)');
  tw.add(cfg, 'orbCount', 0, 2000, 50).name('orbs per map (restart)');
  tw.add(cfg, 'orbValue', 0.001, 0.02, 0.001).name('orb value');
  tw.add(cfg, 'civilians');
  tw.add(cfg, 'civPedestrians', 0, 800, 10).name('pedestrians');
  tw.add(cfg, 'civCars', 0, 200, 5).name('cars');
  tw.add(cfg, 'civOnlyTime', 0, 120, 5).name('civilians-only opening (s)');
  tw.add(cfg, 'sound');
  tw.add(cfg, 'volume', 0, 1, 0.05);
  tw.close();

  const pr = gui.addFolder('Progression');
  pr.add(cfg, 'upgradeMode', ['offers', 'auto', 'off']).name('level-up mode (restart)');
  pr.add(cfg, 'levelXpMult', 1, 8, 0.5).name('offers: XP cost ×');
  pr.add(cfg, 'levelPower', ['curve', 'compound']).name('offers: level bonus');
  pr.add(cfg, 'levelPowerShare', 0, 1.5, 0.05).name('curve: share of old power');
  pr.add(cfg, 'levelDamageBonus', 0, 0.3, 0.01).name('compound: damage / level');
  pr.add(cfg, 'maxItemLevel', 2, 20, 1).name('max item level');
  pr.add(cfg, 'towerUpgrades').name('tower upgrade offers');
  for (const r of Object.keys(cfg.rarityWeights)) pr.add(cfg.rarityWeights, r, 0, 100, 1).name(`weight · ${r}`);
  pr.add({ tower: () => game.offerTower() }, 'tower').name('Offer tower upgrade now');
  pr.add(cfg, 'autoPick').name('auto-pick (rarest card)');
  const force = { rarity: 'legendary', go: () => { game.choice.forceRarity = force.rarity; game.hud.flash(`Next offer: ${force.rarity}`); } };
  pr.add(force, 'rarity', RARITIES).name('force rarity');
  pr.add(force, 'go').name('Force it on the next offer');
  const grant = {
    item: 'pulse',
    go: () => {
      if (game.build.items[grant.item]) return game.hud.flash('Already owned');
      game.build.apply({ item: grant.item, effects: {} });   // ignores slot caps: debug only
      game.hud.flash(`Granted ${(WEAPONS[grant.item] ?? SKILLS[grant.item]).name}`);
    },
  };
  pr.add(grant, 'item', [...Object.keys(WEAPONS).filter(id => id !== 'blaster'), ...Object.keys(SKILLS)]).name('grant item');
  pr.add(grant, 'go').name('Grant it');
  pr.add({ v: () => game.combat.vacuum(game.player) }, 'v').name('Vacuum all XP');
  pr.add({ f: () => { game.frozen = !game.frozen; } }, 'f').name('Freeze horde (F)');
  pr.add({ up: () => game.levelUp() }, 'up').name('Level up (.)');
  pr.add({ down: () => game.levelDown() }, 'down').name('Level down, undo pick (,)');
  pr.close();

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
      const data = JSON.stringify({ metrics: summary(game.stats, game), picks: game.stats.picks, power: game.stats.power, bonus: game.build.bonus, config: cfg }, null, 2);
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
