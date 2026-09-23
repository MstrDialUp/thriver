import { RARITIES } from './catalog.js';

// Rarity rolls and pick-1-of-n offers. Pure: pass an rng for tests.

export function rollRarity(weights, rng = Math.random) {
  const total = RARITIES.reduce((s, r) => s + (weights[r] ?? 0), 0);
  let x = rng() * total;
  for (const r of RARITIES) {
    x -= weights[r] ?? 0;
    if (x < 0) return r;
  }
  return RARITIES[0];
}

// Nearest supported rarity: step down first, then up.
export function fallbackOrder(rarity) {
  const i = RARITIES.indexOf(rarity);
  return [...RARITIES.slice(0, i + 1).reverse(), ...RARITIES.slice(i + 1)];
}

// Build an offer of up to n cards, each for a different target. A target's roll
// at a rarity is an effects map, or a list of them (one is picked at random).
// For each card: roll a rarity, then pick among the remaining targets that
// have a roll at that rarity (falling back to the nearest rarity that does).
// Rolling rarity first keeps an Epic-only target (e.g. +1 air jump) as rare
// as its rarity says, however few other targets there are.
export function makeOffer(targets, n, weights, rng = Math.random) {
  const left = [...targets];
  const cards = [];
  while (cards.length < n && left.length) {
    const rolled = rollRarity(weights, rng);
    for (const r of fallbackOrder(rolled)) {
      const ok = left.filter(t => t.rolls[r]);
      if (!ok.length) continue;
      const t = ok[Math.floor(rng() * ok.length)];
      left.splice(left.indexOf(t), 1);
      const opts = t.rolls[r], effects = Array.isArray(opts) ? opts[Math.floor(rng() * opts.length)] : opts;
      cards.push({ targetId: t.id, name: t.name, rarity: r, effects, item: t.item, kind: t.kind, isNew: t.isNew });
      break;
    }
  }
  return cards;
}
