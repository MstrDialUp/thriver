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
| Red beams | Lower bosses (4, 8, 11, 15, 20 min); each kill = +1 tier, in order |
| Final boss | Appears once all 5 lower bosses are dead **and** the clock is ≥ 22:00 |
| Nuke | At 00:00: 60% max HP, then exponentially rising damage; the clock goes negative |

There is one auto weapon, and levelling up just scales it. No upgrade pool, meta-progression, art, audio, or procedural generation. Those are out of scope.

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
6. **Wall-run time 10 (unlimited).** Is Prototype-style unlimited climbing too much escape?
7. **Auto-vault on vs. off** (Q13). Do you snag on cars at street level?
8. **Jump height 2.5 → 12.** Does the jump-becomes-superjump curve feel good, and does it break Q1?

A second tester matters: the designer is the worst judge of "can I escape the horde?"

## Performance notes

Measured headless in software rendering on the dev machine, so treat them as upper bounds. With 600 enemies all crowded onto a stationary player, simulation costs about 8 ms per frame. With 1,500 it's about 12–20 ms. Separation (the tiered overlap rule) is the dominant cost. The `maxEnemies` slider goes to 2,500 if you want to find where the browser gives out, but that number does not transfer to a native engine.

## Files

`src/config.js` holds all tunables. `world.js` is the city boxes, collision queries, and flow field. `player.js` is the movement kit. `enemies.js` is the horde, separation, and enemy bullets. `director.js` is the clock, spawning, bosses, tiers, and nuke. `rewards.js` is A and B. `combat.js` is the weapon, XP, and levels. `metrics.js`, `hud.js`, and `debug.js` handle measurement and UI.
