import { RARITIES, RARITY_COLORS, FILLER, STATS, itemInfo } from './catalog.js';
import { makeOffer } from './loot.js';
import { fmtClock } from './metrics.js';

// Pick-1-of-3 menu, shared by towers and level-ups. Offers queue up; main.js
// pauses the game (state 'choosing') while one is on screen.
// Input: click, 1/2/3 to pick, 4 to skip; controller d-pad + A, Y to skip.
// Keys and buttons are ignored briefly after opening, so a jump press mid-fight doesn't pick card 1.

const INPUT_GRACE_MS = 350;

const SOURCES = {
  tower: { title: 'Tower upgrade', color: '#40c4ff' },
  level: { title: 'Level up', color: '#3cff9e' },
};

export class Choice {
  constructor(game, onClose) {
    this.game = game;
    this.onClose = onClose;
    this.el = document.getElementById('choice');
    this.reset();
  }

  reset() {
    this.queue = [];
    this.current = null;
    this.el.style.display = 'none';
  }

  get pending() { return this.queue.length; }

  // getTargets runs when the menu opens, so queued offers see the picks made before them.
  offer(source, getTargets) {
    this.queue.push({ source, getTargets });
  }

  // Roll the next queued offer. forceRarity (debug) applies to this one offer only.
  roll() {
    const { source, getTargets } = this.queue.shift();
    const weights = this.forceRarity ? { [this.forceRarity]: 1 } : this.game.eff.rarityWeights;
    this.forceRarity = null;
    const cards = makeOffer(getTargets(), 3, weights);
    if (cards.length < 3) cards.push({ ...FILLER });
    return { source, cards };
  }

  open() {
    this.current = this.roll();
    this.sel = 0;
    this.openedAt = performance.now();
    this.render();
    this.el.style.display = 'flex';
  }

  render() {
    const { source, cards } = this.current, src = SOURCES[source];
    const more = this.queue.length ? ` <span class="more">+${this.queue.length} more</span>` : '';
    this.el.innerHTML = `<h2 style="color:${src.color}">${src.title}${more}</h2><div class="cards"></div>` +
      `<button class="skip">Skip (4 / Y)</button>`;
    const row = this.el.querySelector('.cards');
    cards.forEach((c, k) => {
      const b = document.createElement('button');
      b.className = 'upcard' + (k === this.sel ? ' sel' : '');
      b.style.setProperty('--rc', RARITY_COLORS[c.rarity]);
      b.innerHTML = `<div class="rar">${c.rarity}${c.isNew ? ' · NEW' : ''}</div><div class="nm">${c.name}</div>` +
        `<div class="fx">${this.describe(c)}</div><div class="key">${k + 1}</div>`;
      b.onclick = () => this.pick(k);
      row.appendChild(b);
    });
    this.el.querySelector('.skip').onclick = () => this.pick(-1);
  }

  // "+5% (total +12%)" per stat, so the player can see what they already have.
  describe(c) {
    if (c.targetId === 'filler') return `Heal ${c.heal} · +${c.xp} XP`;
    if (c.isNew) return `<small>New ${c.kind}</small><br>${itemInfo(c.item).desc}`;
    const bonus = this.game.build.bonus, effects = Object.entries(c.effects);
    const lv = c.item ? `<small>Level ${this.game.build.items[c.item]} → ${this.game.build.items[c.item] + 1}</small><br>` : '';
    const pct = x => `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)}%`;
    return lv + effects.map(([stat, v]) => {
      const s = STATS[stat], total = (bonus[stat] ?? 0) + v;
      const label = effects.length > 1 || c.item ? `${s.label} ` : ''; // single-stat tower cards already carry the name
      if (s.mode === 'add') return `${label}+${v} <small>(total +${total})</small>`;
      if (s.mode === 'hyper') return `${label}${pct(v)} <small>(total ${pct(1 - 1 / (1 + total))}, diminishing)</small>`;
      return `${label}${pct(v)} <small>(total ${pct(total)})</small>`;
    }).join('<br>');
  }

  handle(inp) {
    if (performance.now() - this.openedAt < INPUT_GRACE_MS) return;
    if (inp.choicePressed) return this.pick(inp.choicePressed - 1);
    if (inp.skipPressed) return this.pick(-1);
    if (inp.navPressed) { this.sel = (this.sel + inp.navPressed + 3) % 3; this.render(); }
    if (inp.confirmPressed) this.pick(this.sel);
  }

  // Debug auto-pick: resolve every queued offer without showing the menu, taking the rarest
  // real card (Megabonk's "auto select by highest rarity"; megabonk.md §7.10).
  autoPickAll() {
    while (this.queue.length) {
      this.current = this.roll();
      const rank = c => (c.targetId === 'filler' ? -1 : RARITIES.indexOf(c.rarity));
      const cards = this.current.cards, best = cards.reduce((b, c, k) => (rank(c) > rank(cards[b]) ? k : b), 0);
      this.resolve(best);
      this.game.hud.flash(`Auto-picked ${cards[best].name}`);
    }
    this.current = null;
  }

  pick(k) {
    if (k >= 0 && !this.current.cards[k]) return;
    this.resolve(k);
    if (this.queue.length) return this.open();
    this.current = null;
    this.el.style.display = 'none';
    this.onClose();
  }

  // Apply card k (−1 = skip) of the current offer and log it.
  resolve(k) {
    const g = this.game, { source, cards } = this.current, card = cards[k];
    if (source === 'level') g.build.levelPicks.push(card && card.targetId !== 'filler' ? card : null);
    if (card) {
      if (card.targetId === 'filler') {
        g.heal(card.heal);
        g.combat.addXp(card.xp, g);
      } else {
        const hpBefore = g.eff.maxHp;
        g.build.apply(card);
        g.eff = g.build.stats(g.cfg, g.combat.level);
        g.skills.modifyStats(g.eff, g);
        g.player.hp += Math.max(0, g.eff.maxHp - hpBefore); // max-health picks fill the new headroom
      }
    }
    g.stats.picks.push({
      t: Math.round(g.stats.time), clock: fmtClock(g.director.remaining), level: g.combat.level, source,
      picked: card ? `${card.targetId}@${card.rarity}` : 'skip',
      offered: cards.map(c => `${c.targetId}@${c.rarity}`),
    });
  }
}
