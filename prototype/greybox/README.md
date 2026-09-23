# Q1 Grey Box

A throwaway browser prototype for one question:

> **Q1 — Can a horde threaten a player who has Prototype-grade traversal?**
> (design doc §4; synthesis Conflict 1)

It is **not** the game, and **not** an engine decision. It answers Q1, and it helps with Q13 (auto-vault) and Q6 (does traversal keep escalating). It does **not** answer Q2 (entity budget) or Q8 (engine): browser performance tells us nothing about a native engine's ceiling.

## Run it

Needs any static file server (ES modules don't load from `file://`) and an internet connection (Three.js and lil-gui load from jsDelivr).

```bash
cd prototype/greybox
python3 -m http.server 8000
# open http://localhost:8000
```

Keyboard + mouse or a controller both work. Click the page to capture the mouse.

| Action | Keyboard / mouse | Controller |
|---|---|---|
| Move | WASD | Left stick |
| Camera | Mouse | Right stick |
| Jump / double jump | Space | A |
| Glide | Hold Space while falling | Hold A |
| Wall run (up) | Jump into a wall and keep pushing into it | same |
| Wall run (along) | Jump next to a wall while moving along it | same |
| Wall jump | Space while touching a wall | A |
| Dash | Shift | RB or X |
| Slide | Ctrl or C (while moving) | B |
| Pause / Restart | P / R | Start / Back |
| Upgrade menu: pick / skip | 1 2 3 or click / 4 | d-pad + A / Y |
| Debug: level up / level down (undoes that level's pick) | . / , | — |
| Debug: freeze the horde | F | — |
| Debug panel | `` ` `` or Tab | — |

## What's in it

| Piece | Stand-in for |
|---|---|
| West half: towers 25–90 m, some on podiums | Chicago |
| East half: uniform 15–20 m perimeter blocks with courtyards | Paris (low verticality) |
| Blue boxes in streets | Parked cars (snag test for auto-vault) |
| Faint red walls at the map edge | Invisible walls (design doc §9) |
| **A** — gold beams | XP caches on rooftops |
| **B** — blue beams / rings | Hold zones: stand inside to fill; leaving drains it |
| **C** — orange enemies | Climbers: scale any wall between them and a higher player |
| **C** — blue / grey / green / purple / yellow flyers | Birds and drones (tier 1), big birds (2), helicopters (3), jets (4), superheroes (5) |
| **C** — purple pads | Rooftop monster closets |
| **D** | Enemies more than 70 m behind the player reappear around them (bosses too) |
| Fall damage *(experiment)* | Landing from above the safe height (8 m, or 3× jump height if higher) costs 1.5 HP per metre over it. **Sliding down a wall or gliding is safe.** The HUD shows `FALL n m` once a fall would hurt. Towers offer diminishing-returns reduction |
| Red beams | Lower bosses (4, 8, 11, 15, 20 min); each kill = +1 tier, in order |
| Final boss | Appears once all 5 lower bosses are dead **and** the clock is ≥ 22:00 |
| Nuke | At 00:00: 60% max HP, then exponentially rising damage; the clock goes negative |

### Progression

Built from [`PLAN-progression.md`](PLAN-progression.md). Every number is a grey-box placeholder.

- **Towers.** Completing a hold zone pays XP and a heal, then offers a **pick 1 of 3** movement/character upgrade rolled on a rarity table (Common → Legendary). Percentage boosts (move speed, jump height, wall-run time and climb speed, glide speed, dash cooldown, fall-damage reduction, max health, all damage, all fire rate) are Common–Rare. +1 air jump or +1 dash is Epic; both together is Legendary.
- **Level-ups** (mode `offers`, the default) also offer a pick 1 of 3: upgrades to weapons and skills you own, and **new** ones while you have a free slot (**4 weapons, 4 skills**). One card per weapon or skill, never two for the same one. Items max out at level 8.
- **Weapons:** Blaster (starting), **Pulse** (damage sphere around you), **Arc** (chain lightning), **Melee Drone** (orbiting satellites), **Mortar** (shells into the densest crowd, +50% to enemies below you), **Gun Drone** (drones that follow and shoot, then recharge).
- **Skills:** **XP Magnet**, **Shield** (recharging; bar under HP), **Retaliation** (touch or shoot you, take damage back), **Slipstream** (dash through enemies to hit them), **Momentum** (damage from speed above run speed, falls included; on the HUD), **Impact** (a shockwave when you land from above the safe height; bigger drops hit harder; a glide landing doesn't trigger it), **Spider** (run into a wall to run up it; also vaults cars), **Hacker** (while you hold a zone, its sphere damages enemies), **Updraft** (Epic: gliding lifts you for 2 s per jump).
- **Pace and power.** A level costs 4× playtest 1's XP, so there are about half as many level-ups. To keep power in line with playtest 1, each level also gives an automatic damage bonus that follows playtest 1's curve (×N next to your level). `node tools/power-curve.mjs` sets its size; see the plan's *Power budget*. The HUD's `power ×N · vs playtest 1 R` line compares your weapons against playtest 1 at the same XP (1.0 = as strong). It counts weapons only, not skill damage.
- **HUD build panel** (top left): weapons, skills, and tower bonuses.
- Level-up mode `auto` restores playtest 1 exactly (no menus; every level scales the blaster) for comparison. `off` = no level scaling at all.

Still out of scope: meta-progression, evolutions, reroll/banish, art, audio, procedural generation.

## Test plan

Every tunable is live in the debug panel. **Clock speed** accelerates the boss schedule and difficulty without changing movement. **Copy metrics JSON** puts the run's numbers and the full config on the clipboard. Paste them back into the project so results are recorded, not remembered.

The HUD tracks the Q1 numbers continuously:

- **up %** — time spent above 3 m
- **surrounded %** — time with ≥ 10 enemies within 8 m
- **escaped %** / **longest escape** — time with no enemy within 20 m
- **damage ground / up** — where the player actually gets hurt

Suggested sessions, 10 minutes each at clock speed 2–3:

1. **Baseline, everything on.** Does climbing buy a few seconds of breathing room but never a permanent escape? (That is the target from design doc §4.)
2. **Only C off** (no climbers, flyers, or closets). Expect escape % to jump. This measures how much of the pressure C is doing.
3. **Only D off.** Does the player out-run the horde across the map?
4. **A off, then B off.** Does the player still go up (or down) without a reward pulling them?
5. **Paris vs. Chicago.** Set layout to `lowrise`, then `towers` (restart). Is low-rise actually harder? (design doc §9)
6. **Wall run unlimited** (Movement folder). Is Prototype-style unlimited climbing too much escape?
7. **Auto-vault on vs. off** (Q13). Do you snag on cars at street level?
8. **Jump height 2.5 → 12.** Does the jump-becomes-superjump curve feel good, and does it break Q1?
9. **Fall damage on vs off** (Q1 folder). Does a cost for dropping off a roof change how often you go up, and how you come down (walls, glide, drops)? Watch `damageFall`, `hardLandings`, and `up %`.
10. **Level-up mode `offers` vs `auto`** (Progression folder, restart). Same clock speed, same seed. Do upgrades change the Q1 numbers (up %, surrounded %, escaped %), and does power feel the same? Compare `powerVsPlaytest1` and the kill count against playtest 1.
11. **Movement-heavy vs combat-heavy tower picks.** One run taking only movement cards at towers, one taking only damage/fire rate. Does stacking jumps, dashes and wall-run time turn traversal into a permanent escape (Q1, Q6)?
12. **First five minutes.** The level bonus is weakest early (about 0.4–0.7 of playtest 1 until old level ~20). Does the opening feel sluggish?

**Debug tools** (debug panel → Progression, plus keys): `.` level up, `,` level down (undoes that level's pick), `F` freeze the horde (you move, nothing else does), vacuum all XP, grant any weapon/skill, force the next offer's rarity, auto-pick (resolves every offer, rarest card first), rarity weights, and the level-bonus settings.

**Copy metrics JSON** also includes every pick (with what was offered alongside it), the power index every 30 s, damage per weapon/skill, fall damage, and time spent in menus.

A second tester matters: the designer is the worst judge of "can I escape the horde?"

## Playtest log

### Playtest 1 — 2026-09-22

Three runs, single tester (the designer — a second tester is still needed, per the note above).

**Findings:**

- **Taller = tougher, contrary to the assumption in design doc §4.** With wall-run kept low-level, tall buildings acted as barriers that pen the player in at height rather than as an escape route. Worth re-testing as wall-run duration is tuned; Conflict 1 assumes the opposite ("a player who can wall-run up a skyscraper and glide away has trivially defeated a ground-bound horde").
- **Schrödinger spawning.** When the player is elevated and a large share of the spawned enemies aren't rendered in view, the world reads as emptier than it should. Proposed fix (not implemented): teleport some fraction of spawned enemies into valid positions just before the player's view cone crosses them — both when climbing up over a roof edge, and when wall-running up past building faces that are now below the player.
- Progression felt good so far.
- **Debug/test-loop requests:** a magnet pickup/power-up to clean up XP scattered across the map; a pause that freezes enemies but leaves the player free to move; level-up / level-down debug keys.

**Raw stats:**

| | Run 1 | Run 2 | Run 3 (debugged) |
|---|---|---|---|
| Clock at death | 19:38 | 19:09 | −01:14 (overtime — screenshot it) |
| Real seconds | 622 | 651 | 197 |
| Level | 38 | 50 | 64 |
| Tier | 3 | 3 | 6 |
| Kills | 4069 | 5168 | 4636 |
| up % (elevated) | 62 | 28 | 18 |
| surrounded % | 7 | 0 | 59 |
| escaped % | 19 | 13 | 2 |
| longest escape (s) | 19 | 4 | 3 |
| damage ground | 195 | 340 | 116 |
| damage elevated | 181 | 99 | 0 |
| zones held | 9 | 24 | 0 |
| seconds in zones | 67 | 146 | 0 |
| rooftop caches | 14 | 7 | 0 |
| relocations | 2857 | 1684 | 670 |
| max altitude (m) | 90 | 33 | 56 |
| boss kill times (min) | 4.48, 8.5 | 4.33, 8.15 | 7.86, 16.05, 25.07, 25.16, 25.39 |

## Performance notes

Measured headless in software rendering on the dev machine, so treat them as upper bounds. With 600 enemies all crowded onto a stationary player, simulation costs about 8 ms per frame. With 1,500 it's about 12–20 ms. Separation (the tiered overlap rule) is the dominant cost. The `maxEnemies` slider goes to 2,500 if you want to find where the browser gives out, but that number does not transfer to a native engine.

## Files

`src/config.js` holds all tunables. `world.js` is the city boxes, collision queries, and flow field. `player.js` is the movement kit (and fall height). `enemies.js` is the horde, separation, and enemy bullets. `director.js` is the clock, spawning, bosses, tiers, and nuke. `rewards.js` is A and B. `combat.js` is the loadout, projectiles, XP, and levels. `weapons.js` and `skills.js` are the items; `catalog.js` is their data and the tower table; `loot.js` rolls rarities and offers; `build.js` is the run's build and effective stats; `choice.js` is the pick-1-of-3 menu; `power.js` is the power index. `metrics.js`, `hud.js`, and `debug.js` handle measurement and UI.

`npm test` runs the unit tests in `test/` (offer rules, stacking, slot caps). `node tools/power-curve.mjs` checks the power curve against playtest 1.
