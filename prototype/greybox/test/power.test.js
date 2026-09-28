import { test } from 'node:test';
import assert from 'node:assert/strict';
import { powerIndex } from '../src/power.js';

const eff = extra => ({ upgradeMode: 'offers', damageMult: 1, fireRateMult: 1, levelMult: 1, damage: 12, projectiles: 2, fireInterval: 0.45, extraProjectiles: extra });
const build = items => ({ items: Object.fromEntries(items.map(id => [id, 1])), own: () => 0 });

// Playtest 4: each +1 projectile pick lowered the index, because the level-1 blaster baseline
// counted the bonus too. A plain blaster is the baseline, so the bonus can only raise the index.
test('+1 projectile never lowers the power index', () => {
  for (const items of [['blaster'], ['blaster', 'pulse', 'arc', 'meleeDrone'], ['pulse', 'arc']]) {
    for (let extra = 0; extra < 3; extra++) {
      assert.ok(powerIndex(build(items), eff(extra + 1), 1) >= powerIndex(build(items), eff(extra), 1), `${items} at +${extra + 1}`);
    }
  }
});

test('a level-1 blaster with no upgrades is 1.0', () => {
  assert.equal(powerIndex(build(['blaster']), eff(0), 1), 1);
});
