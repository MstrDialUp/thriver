# Plan — Tower upgrades, level-up offers, new weapons and skills

**Status:** Plan agreed 2026-09-23. **All 8 steps built** (2026-09-23). Next: playtest 2 (README test sessions 9–12). Numbers are **prototype placeholders** unless listed under "Decisions" below.

## Decisions from review (2026-09-23)

Confirmed as **design decisions** (these go into design doc §15):
- **Towers (hold zones) grant a pick-1-of-3 of movement/character upgrades**, rolled on a rarity drop table, in addition to their XP and heal.
- **Level-ups present pick 1 of 3** from a separate table of weapons, skills and upgrades to owned ones.
- **No two cards in one offer target the same weapon, skill or stat.**
- **Slots: 4 weapons + 4 skills.** Content will grow past the caps. In the grey box the pool is 5 weapons / 9 skills, so the caps already bite.

Taken as **prototype defaults** (placeholders, not decisions):
- Percentage upgrades **add together against the base value**.
- Max level 8 per weapon or skill.
- **Skip** is the only offer-steering tool for now (no reroll or banish yet).
- When fewer than 3 valid cards exist, a **heal + XP filler card** fills the gap.
- Tower menus pause the game. Towers keep their XP and heal.
- Retaliation: flat damage, scaled by the player's damage bonus, and it also hits enemies that shoot you.
- Offer rarities for new items as listed in the tables below.
- Legendary tower roll = **+1 air jump and +1 dash charge**.
- Jump height gets larger steps than the other % stats (+6 / 10 / 15%).
- Levelling is **half as fast**, with **no loss of power against the enemy curve** (see "Power budget").
- **Character level bonus:** each level-up grants an automatic damage bonus. Trial for now: "we'll see how it plays out". *(Step 5 changed its shape from a flat compounding % to one that follows playtest 1's curve; see Power budget.)*

**Grey-box experiment (Rich, 2026-09-23), not yet a decision:**
- **Fall damage**, as risk to set against height's reward. Falling from a great height hurts. Towers offer fall damage reduction. **Touching a wall prevents fall damage**, so a player can slide down a wall to get down safely. **Gliding also prevents it** (correction, 2026-09-23). That makes glide strong, so whether glide should become an acquirable skill instead of part of the base kit is **to be assessed later**. Rich expects this to become "a good push and pull part of the mechanic, risk vs reward".
- **Impact** (a skill): the Ground Pound behaviour under the Impact name. No button. It triggers on a landing from above the safe height, and it scales with skill level and the height dropped.

## Why this belongs in the Q1 grey box

CLAUDE.md says design work mustn't run ahead of Q1. Most of this pass is a Q1 instrument rather than a content pass:

- **Tower upgrades make B pull harder.** Paying movement upgrades gives the player a reason to go back down into the horde.
- **Movement upgrades are escape tools.** Stacking them over a run is the Q6 curve, and it tests whether C and D keep up as traversal grows.
- **Fall damage and Impact change what height costs and what it's worth.** Playtest 1 found "taller = tougher". Fall damage makes leaving a rooftop cost something, and Impact turns the drop into an attack. Both push directly on that finding.
- **Spider, Hacker, Retaliation, Slipstream, Momentum and Updraft** each change how the player relates to walls, zones or encirclement.

## Current state (what changes)

| Today | After |
|---|---|
| `combat.js`: one auto weapon that scales on its own every level | The blaster becomes one weapon in a slot system. A level-up opens a pick-1-of-3 menu and grants a small automatic "character level" bonus (see Power budget) |
| `rewards.js`: a zone pays XP + 25 HP | The zone pays XP + HP **and** opens a tower pick-1-of-3 |
| `player.js` reads movement stats from `config`. There's no fall damage | It reads an **effective stats** object (base `config` + upgrades), and it tracks fall height and applies fall damage |
| `enemies.js` returns total contact DPS | It also reports which enemies are touching the player, and bullets remember who fired them |
| Enemy damage is inlined in the projectile loop | One `game.damageEnemy(i, amount, source)` for every weapon and skill, so metrics can credit damage per source |

## Core system

### Rarity

**Common (white) · Uncommon (blue) · Rare (purple) · Epic (red) · Legendary (yellow)**, using Megabonk's colours (`megabonk.md` §2.5). Starting weights: **55 / 26 / 12 / 5 / 2**, adjustable in the debug panel.

Rarity comes from **magnitude** (the same stat rolls bigger at a higher rarity) and **type** (some upgrades have a minimum rarity).

### Offer generation (towers and level-ups)

```
offer(targets, n = 3):
  targets = eligible targets (unowned only while a slot of that kind is free; owned only below max level)
  for each card, until n cards or no targets left:
     roll a rarity from the weights
     pick a remaining target that has a roll at that rarity
       (none? try the nearest rarity: down first, then up)
     remove that target, so no other card can use it
  top up with one filler card if fewer than n
```

**Rarity is rolled first, then the target** (changed while building step 2). Picking the target first would make an Epic-only target like +1 air jump show up on about 1 card in 6, far more often than its rarity says. Distinctness comes from removing each target once it's used. Both properties have unit tests (`src/loot.js`, `test/loot.test.js`).

### Effective stats

`build.js` holds the run's build. `build.stats(cfg)` merges the base `config` with the upgrades every frame. The debug panel keeps editing the base values, and restart clears the build. This also fixes a current bug: changes to `config` carry over into the next run.

**Fix on the way:** `wallRunTime >= 10` currently means "unlimited", so upgrades could turn on unlimited wall-running by accident. It becomes a separate `wallRunUnlimited` toggle.

## Fall damage (new base mechanic)

Nothing in the kit has fall damage today. The synthesis lists "no fall damage" only as an **unconfirmed research proposal** (§5 Movement), so this replaces an open proposal, not a decision. Proposed model, with every value in the debug panel:

- **Fall height** = the highest point since the last "safe" event, minus the landing height. Safe events: touching the ground, an air jump, **any wall contact**, and **gliding**. Wall contact resets the height **continuously**, so sliding down a wall all the way to the ground is safe, even after wall-run time has run out. Pushing off a wall starts a new fall from that point. **Gliding resets it in the same way**, so gliding down to a landing is safe, and letting go of glide starts a new fall from wherever you are.
- **Safe height:** no damage below `max(8 m, 3 × effective jump height)`. Scaling with jump height means a superjump never punishes its own landing.
- **Damage:** `fallDmgPerM × (fall height − safe height)`, starting at 1.5 HP per metre. A 60 m drop does about 78 damage at base HP.
- **Toggle:** `fallDamage` on/off in the Q1 folder, so a session can compare with and without.
- **Metrics:** fall damage is recorded separately from ground and elevated damage.

**Fall damage reduction** joins the tower table. It stacks **hyperbolically**, `1 − 1/(1 + Σ)` (the RoR2 rule already in the design doc §7 research inputs), so 24 towers can't reach 100% immunity.

## Tower table (movement and character)

| Upgrade | Common | Uncommon | Rare | Epic | Legendary |
|---|---|---|---|---|---|
| Move speed | +2% | +3% | +5% | — | — |
| Jump height | +6% | +10% | +15% | — | — |
| Wall-run time | +4% | +6% | +10% | — | — |
| Wall-run climb speed | +3% | +5% | +8% | — | — |
| Glide speed | +3% | +5% | +8% | — | — |
| Dash cooldown | −3% | −5% | −8% | — | — |
| Fall damage reduction | +5% | +8% | +12% | — | — |
| Max health | +4% | +6% | +10% | — | — |
| Damage (all sources) | +3% | +5% | +8% | — | — |
| Fire rate (all weapons) | +3% | +5% | +8% | — | — |
| +1 air jump | — | — | — | ✔ | — |
| +1 dash charge | — | — | — | ✔ | — |
| +1 air jump **and** +1 dash | — | — | — | — | ✔ |

## Level-up table

Offers are made up of **unowned** weapons and skills at a fixed offer rarity, and **stat upgrades** to owned ones, where the card's rarity is the rolled magnitude.

Standard % ladder: **+5 / +8 / +12 / +16 / +20%**. Count stats (projectiles, satellites, drones, chain jumps) are +1 at Rare or Epic and +2 at Legendary.

### Weapons (5; cap 4)

| Weapon | Offer rarity | Base behaviour | Upgradeable stats |
|---|---|---|---|
| **Blaster** (starting) | — | 12 dmg, 0.45 s, 2 projectiles, 28 m | damage, fire rate, projectiles, range |
| **Pulse** (Aura / Garlic) | Common | 4 m sphere; 6 dmg to everything inside every 0.8 s | damage, pulse rate, size |
| **Arc** (chain lightning) | Common | Every 1.2 s, zaps the nearest enemy then chains to 3 more within 6 m; 10 dmg | damage, fire rate, chains, chain range |
| **Melee Drone** | Uncommon | 1 satellite orbiting at 2.5 m; 15 dmg on touch (0.5 s re-hit per enemy); active 4 s, then 3 s cooldown | damage, cooldown, rotation speed, count |
| **Mortar** | Uncommon | Every 2.5 s, lobs a shell at the densest cluster within 35 m; 30 dmg in 3 m; +50% vs targets below you | damage, fire rate, blast radius, shells |
| **Gun Drone** | Rare | A drone follows you and shoots the nearest enemy in 22 m: 8 dmg every 0.6 s; lives 10 s, respawns after 6 s | damage, fire rate, cooldown, lifetime, count |

### Skills (9; cap 4)

| Skill | Offer rarity | Behaviour | Upgradeable stats |
|---|---|---|---|
| **XP Magnet** | Common | Pickup radius +50% (base 4 m) | radius |
| **Shield** | Uncommon | 25-point shield; refills after 5 s without damage | amount, recharge delay |
| **Retaliation** | Uncommon | Each toucher and shooter takes 20 dmg back (per enemy, 0.5 s cooldown), scaled by your damage bonus | damage |
| **Slipstream** | Uncommon | Dashing through enemies deals 25 dmg to each | damage, dash hit width |
| **Momentum** | Uncommon | +1% damage per m/s above base move speed | bonus per m/s |
| **Impact** | Uncommon | A landing from above the safe height sends out a shockwave. No button. Damage = base × skill level × fall-height factor; the radius grows with height | damage, radius |
| **Spider** | Rare | Pushing into a wall while grounded starts a wall run | wall-run speed, wall-jump power |
| **Hacker** | Rare | While you stand in an active tower zone, enemies inside `zone radius × (1 + bonus)` take 15 DPS (a sphere, so it reaches climbers above) | sphere size, damage |
| **Updraft** | Epic | While gliding, you gain height slowly for up to 2 s per jump | lift duration, lift speed |

**Impact and fall damage reduction work together, not against each other.** The shockwave triggers on any landing that is *over the safe height*, whether or not reduction brings the damage to zero. Otherwise stacking reduction would switch off your own skill.

The first draft's Impact *weapon* is gone. The name now belongs to this skill, so there are 5 weapons.

## Power budget (half-speed levelling without getting weaker)

**Halving XP drops doesn't halve the levels.** The XP-per-level cost rises linearly, so the total needed rises quadratically. With half the XP, playtest 1's level 50 becomes about **level 35**. To actually halve the number of levels, the **per-level cost needs to roughly quadruple** (`xpForLevel` 5 + 6l → 20 + 24l). XP drops stay as they are, so the bosses, caches and zones keep their relative value.

**The old curve was very steep.** The auto-scaling blaster had these multipliers over its level-1 DPS (damage × fire rate × projectiles):

| Old level | 10 | 20 | 38 (run 1 end) | 50 (run 2 end) |
|---|---|---|---|---|
| Blaster DPS × | 7.7 | 27.5 | 101 | 186 |

Twenty-five picks of +5–20% can't reproduce 186× on their own, especially when bonuses add up against the base. If nothing else changes, the player gets much weaker, which you've ruled out. The proposed fix has three parts:

1. **Character level bonus.** Every level-up also grants an automatic all-damage bonus, shown on the HUD. This carries the bulk of the old curve, so power keeps tracking time as it did before.
2. **Picks and breadth carry the rest.** Weapon upgrades plus up to 4 weapons firing at once should make a well-built player land **at or somewhat above** the old curve, and a scattered build somewhat below it.
3. **A power-curve tool sets the bonus.** `tools/power-curve.mjs` (Node) simulates many runs with random and greedy picks (level-ups and tower offers every ~316 XP, playtest 1 run 2's rate). It compares the new DPS against the old curve at the same total XP.

**What the tool found (step 5, 2026-09-23).** The first estimate (+10–12% compounding per level) was **badly wrong**: it gives only **~10% of playtest 1's power** from mid-run on. Why:
- The old blaster's growth came mostly from auto-scaling: +1 projectile every 3 levels (up to 5×), plus damage and fire rate every level. That's 186× by level 50.
- The blaster maxes out after 7 picks, so its upgrades can add about 1.6× at most.
- A flat compounding % has the wrong shape. Matching the late run needs about 22% per level, and even that leaves the early and mid run at 25–35% of the old power.

**So the level bonus now follows the old curve directly** (`levelPower: 'curve'`): `levelMult = levelPowerShare × (playtest 1's blaster power at the same total XP)`, floored at 1. Picks, towers and (later) extra weapons stack on top. The compounding version stays available as `levelPower: 'compound'` for comparison.

With the blaster only, the tool suggests **levelPowerShare = 0.70**. New ÷ old DPS by old level, median of 300 runs:

| | L5 | L10 | L15 | L20 | L30 | L38 | L50 | L64 |
|---|---|---|---|---|---|---|---|---|
| random picks | 0.41 | 0.53 | 0.89 | 0.78 | 0.96 | 1.01 | 1.11 | 1.25 |
| greedy picks | 0.41 | 0.53 | 0.93 | 0.83 | 1.07 | 1.18 | 1.47 | 1.92 |

- **The first couple of minutes are weaker** (0.4–0.5 at old levels 5–10). That's the cost of half as many level-ups: power arrives in bigger, rarer steps, and the old curve rose fastest right at the start.
- **The share should drop as content arrives.** Every weapon and skill added in steps 6–7 raises power on top of the level bonus, so re-run the tool in step 8 and lower the share. That also moves more of the player's power from automatic levels into picks, which is what makes upgrades "worth it".
- **Checked in game:** `auto` mode reads exactly 1.00 against playtest 1 at level 38, and offers mode read 1.06 at the same XP after 18 picks.

**Re-run after step 6 (all five new weapons in the pool): levelPowerShare 0.70 → 0.25.** With the new weapons, 0.70 made a typical build 2–5× playtest 1 (up to 10× with good picks). The tool suggests 0.23; 0.25 is used to soften the early game. New ÷ old DPS by old level, median of 300 runs:

| | L5 | L10 | L15 | L20 | L30 | L38 | L50 | L64 |
|---|---|---|---|---|---|---|---|---|
| random picks | 0.69 | 0.42 | 0.81 | 0.73 | 1.01 | 1.17 | 1.42 | 1.77 |
| greedy picks | 0.76 | 0.57 | 0.99 | 0.91 | 1.44 | 1.85 | 2.66 | 3.80 |

- The automatic level bonus now carries only a quarter of the old curve, so **picks carry most of the power**: a good build ends up about 2× a random one.
- **These numbers rest on DPS estimates** for area weapons (an assumed 0.15 enemies/m² around the player, `AOE_DENSITY` in catalog.js). The playtest is the real check: kill rate, survival, and the HUD's "vs playtest 1" ratio, which uses the same estimates.
- The dip at old level 10 is the first minutes of the run, before the first new weapon lands.

**Re-run after step 7 (skills in the pool): levelPowerShare 0.25 → 0.30.** Skills compete with weapons for picks, and the tool counts **weapon DPS only**, so a skill pick adds nothing to its estimate. The suggestion rose to 0.29. New ÷ old DPS by old level, median of 300 runs, at 0.30:

| | L5 | L10 | L15 | L20 | L30 | L38 | L50 | L64 |
|---|---|---|---|---|---|---|---|---|
| random picks | 0.39 | 0.38 | 0.71 | 0.68 | 0.96 | 1.13 | 1.35 | 1.65 |
| greedy picks (weapons only) | 0.72 | 0.59 | 1.08 | 0.99 | 1.51 | 1.88 | 2.64 | 3.75 |

- **Skill damage isn't counted**: Impact, Slipstream, Retaliation, Hacker and Momentum all deal or boost damage, conditionally. A build that uses them is stronger than this table says, and the HUD's "vs playtest 1" figure has the same blind spot. The playtest's damage-by-source numbers will show how much they add.
- **The early game is weaker than playtest 1** (0.4–0.7 until old level ~20). Watch whether the first few minutes feel sluggish; if they do, the fix is a larger share early (e.g. a floor on the first few levels), not a larger share overall.

In game, a **power index** metric (current blaster DPS ÷ level-1 blaster DPS, sampled every 30 s, with a "vs playtest 1" ratio at the same XP) is on the HUD and in Copy metrics JSON. The next playtest can then compare it directly with the old curve. Enemy scaling is unchanged.

## Choice menu

- A new `state: 'choosing'` pauses the game, releases the mouse, and shows 3 cards: name, rarity colour, current → new value, and a NEW tag for unowned items. There's also a Skip button.
- Input: mouse, keys **1 / 2 / 3** (**4** to skip; not S, which is move-back), controller d-pad + A (Y to skip). Keys and buttons are ignored for 0.35 s after the menu opens, so a jump press mid-fight can't pick a card by accident.
- If several offers are waiting, they're queued and the HUD shows "+N pending". Tower cards have a blue header.

## HUD, metrics, debug

- **HUD:** a build panel (weapons and skills with their levels) and a movement line showing the upgraded values.
- **Metrics:** every pick `{ t, clock, level, source, id, stat, rarity, offered }`, the final build, damage per source, fall damage, time spent in menus (excluded from real seconds), and the power index per minute.
- **Debug** (includes playtest 1's requests):
  - `.` level up, `,` level down (undoes the last level-up pick).
  - `F` freezes the horde (enemies, bullets and the clock stop; the player moves freely).
  - A vacuum button that pulls every gem on the map to the player.
  - A grant-item dropdown, force-rarity for the next offer, rarity weight sliders, and fall-damage tunables.
  - Upgrade mode `offers` / `auto` (the old scaling) / `off`. `auto` keeps playtest 1 reproducible, and it's the A/B for Q1.
  - An auto-pick toggle (highest rarity) for fast test runs.

## Files

| File | Change |
|---|---|
| `src/loot.js` **new** | Rarity, weighted roll, `offer()`. Pure JS, testable in Node |
| `src/catalog.js` **new** | Data: tower table, weapons, skills, ladders, minimum rarities, offer rarities |
| `src/build.js` **new** | Build state, apply or undo a pick, `stats(cfg)`, the character level bonus |
| `src/weapons.js` **new** | Weapon interface; Blaster (moved), Pulse, Arc, Melee Drone, Mortar, Gun Drone |
| `src/skills.js` **new** | Magnet, Shield, Retaliation, Slipstream, Momentum, Impact, Spider, Hacker, Updraft |
| `src/choice.js` **new** | Menu DOM, input, queue |
| `src/combat.js` | Shared projectile pool, gems, XP; new `xpForLevel`; level-ups queue offers |
| `src/main.js` | `choosing` and freeze states, `damageEnemy`, shield and retaliation in `damagePlayer`, build reset |
| `src/player.js` | Effective stats, fall tracking and damage, landing event (for Impact), Spider, Slipstream dash hits, Updraft, `wallRunUnlimited` |
| `src/enemies.js` | Touching list, bullet source index |
| `src/rewards.js` | Tower offer on completion; Hacker sphere |
| `src/config.js`, `debug.js`, `hud.js`, `metrics.js`, `index.html` | As above |
| `test/loot.test.js` **new** | Offers are distinct and respect slot caps, max levels and minimum rarities; the rarity distribution matches the weights |
| `tools/power-curve.mjs` **new** | Old vs new power curve simulation |

## Build order

Each step leaves the game playable.

1. **Refactor, no behaviour change.** Effective stats, `damageEnemy`, touching list, weapon interface. Check: `auto` mode plays as before.
2. **Loot core, menu, tower table** (without fall-damage reduction yet). Unit tests.
3. **Fall damage** (toggleable), then add the reduction to the tower table.
4. **Level-up offers with blaster upgrades**, the new XP curve, the character level bonus, and the level up/down keys.
5. **Power-curve tool.** Set X and the ladders.
6. **Weapons:** Pulse, Arc, Melee Drone, Mortar, Gun Drone.
7. **Skills:** Magnet, Shield, Retaliation, Spider, Hacker, then Slipstream, Momentum, Impact, Updraft.
8. **HUD, metrics, remaining debug tools.** Re-run the power-curve tool with every weapon in place.
9. **Docs.**
   - README: controls, "What's in it", new test sessions (offers vs auto; fall damage on vs off).
   - Design doc: §15 entries for the confirmed decisions (fall damage and Impact go in as an experiment, not a decision), a prototype stand-in note in §7 (§7 stays `UNFILLED`), and §14 kept honest.
   - Synthesis §5: mark the "no fall damage" line as being tested (fall damage is an experiment in the grey box).

Verification: `node --test`, the power-curve tool's output against the old curve, a browser smoke test after each step (grant items from `window.game`), then your playtest.

## Hazards checked (design doc §12)

- **Dead stats:** every card must visibly do something, and the HUD shows the effective values. Momentum is the riskiest: with a small bonus per m/s it could be invisible.
- **Dominant vector:** the tower's all-damage bonus, the character level bonus and the weapon damage upgrades all multiply together. The power index and damage-per-source metrics watch for this.
- **RNG → restart-scumming:** skip only for now.
- **Menu frequency:** halved. The auto-pick toggle covers fast test runs.

## Questions

None blocking. Parked for later: **should glide become an acquirable skill** rather than base kit, now that it prevents fall damage? (Rich, 2026-09-23.) Assess after playtesting fall damage.
