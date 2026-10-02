# Engine Trials

Short, throwaway builds of the **same test** in more than one engine, so they can be compared like for like. Godot is first ([`godot/PLAN.md`](godot/PLAN.md)). Unity, and possibly Unreal, may follow with the same spec.

> **What a trial is (Rich, 2026-09-27):** a way to find out **what it's like to set up a build and develop in an engine**, and how it handles the horde. **It is not an engine decision.** Q8 (engine and tooling) stays open until the trials are compared ([design doc](../../docs/design/design-doc.md) §11, §13).
>
> **Where this comes from:** the Q2 spike proposed in [`engine-options.md`](../../docs/research/engine-options.md) §11. Its targets (550 / 2,000 / 5,000), the Steam Deck as the floor, and the frame-rate proposal are **research proposals, not decisions**, and are used here as the yardstick.

**Relationship to the grey box.** The [Q1 grey box](../greybox/README.md) keeps running (playtest 4 and on). Q1 is at "direction set", and trials run in parallel with it, not instead of it. **Nothing here changes Q1.** What moves across from the grey box is **algorithms and tuning numbers, not code**, as the design doc already says for the grey box.

---

## 1. The two things every trial measures

1. **The horde (Q2).** How many enemies stay alive at once at 60, 45 and 30 fps, **on the Steam Deck**, with the grey box's horde behaviour. The same test in every engine (§2).
2. **Developing in it.** Setup time, build and iteration loop, debugging, documentation, and friction. Kept in a log as it happens, not remembered afterwards (§4).

A trial that stops at (1) has answered half its question. Rich's reason for running them is (2) as much as (1).

## 2. The standard horde test

Every engine builds this, and nothing else, before any optional work (§5).

> **Test parameters are proposals (Claude, 2026-09-27).** Values taken from the grey box are marked with their `config.js` name. The rest (the player loop, the neighbour budget, the ramp step, the projectile load, the bullet rate) are **proposed test settings, not design decisions**. Change them before the first trial if they look wrong. **Once the first trial has recorded a run, freeze them.** A number changed later makes the engines incomparable, so a change means re-running the earlier trials.

**Scene**
- **The grey box city, loaded from `shared/city-seed1.json`**: the same boxes (position, size) from the grey box's `mixed` layout at seed 1. Exported once from the grey box, so every engine tests the same city. *(Made in the first trial's M1; see the Godot plan.)*
- Flat grey boxes, one ground plane, one directional light, no shadows at first (then a shadows-on run, recorded separately).
- **Camera:** third-person, 7 m behind the stand-in player (`camDistance: 7` in the grey box), fixed pitch. Not player-controlled during a measured run.

**Stand-in player**
- A capsule on a **scripted, deterministic loop**: 60 s at street level through the streets, then up to a 40 m roof, 30 s on it, and back down. Moves at 9 m/s (`moveSpeed`). No movement kit, weapons or progression.
- The trip up the building is there to drive **climbers and flyers**. The loop repeats until the test ends.

**Horde behaviour** (ported from the grey box's `world.js` and `enemies.js`; algorithms, not code)
- **Flow field** on a 2 m nav grid (`NAV_CELL`), BFS from the player's cell, rebuilt when the player changes cell.
- **Soft separation** through a spatial hash (1.5 m cells for ordinary enemies, `SEP_CELL`), with the **tiered right-of-way rule** (fodder overlaps at `fodderOverlap: 0.6`; bosses push, are never pushed) (design doc §8).
- **A separation budget** ([`engine-options.md`](../../docs/research/engine-options.md) §10): at most **8 neighbours** checked per agent, and agents more than 40 m from the player separate every 4th frame. The same values in every engine.
- **Mix:** 30% climbers (`climberShare`), 25% flyers (`flyerShare`), the rest ground fodder. Plus **4 bosses** alive at all times.
- **Climbers** scale any wall between them and a higher player. **Flyers** fly straight at the player with vertical separation.
- **Spawning** on a 30–45 m ring (`spawnRingMin`/`Max`). **Relocation:** enemies more than 70 m behind reappear around the player (`relocateDistance`).
- Enemies **touch** the player (a contact test only, no damage).

**Projectile stress load**
- **500 player projectiles** alive at once, fired forward from the player at 45 m/s (`projectileSpeed`), each tested against enemies through the hash. Hits kill the enemy, which respawns on the ring (so the count stays up).
- **Enemy bullets:** 10% of enemies fire one bullet every 3 s at 9 m/s.

**Rendering**
- **Instanced drawing:** one instanced draw per enemy type, one for projectiles. Enemy meshes ≤ 100 triangles.
- **Vsync off** for measuring, and the engine's default renderer. Record which renderer that is.

**The ramp**
- Start at **200 enemies**. Every **2 s**, add **50**.
- Keep a rolling **1 s average** of frame time. The first time it goes over **16.7 ms**, record the count as "held at 60". Keep going to **22.2 ms** ("45") and **33.3 ms** ("30"), then stop.
- Also run **fixed counts of 550, 2,000 and 5,000** for 60 s each and record average and 1%-low frame time. These map straight onto the floor / goal / stretch targets.
- Run **three times** on each machine. Report the median.

**Record for every run** (JSON, one file per run, in `playtests/engine-trials/<engine>/<date>/`):
- engine and version, renderer, build type (debug / release), machine, commit
- counts held at 60 / 45 / 30
- for the fixed counts: average and 1%-low frame time, **simulation ms** and **render ms** separately (CPU and GPU if the engine reports both)
- which implementation ran (e.g. script vs native, single-threaded vs threaded)
- anything that went wrong in the run (a free-text `note`)

## 3. Machines

| Machine | Role |
|---|---|
| **Steam Deck** | **The floor.** The counts that count are measured here ([`engine-options.md`](../../docs/research/engine-options.md) §9). Note which model (LCD 60 Hz / OLED 90 Hz), and turn Steam's per-game frame limit **off** for measured runs. |
| **Linux desktop** (Ryzen 5 3600, RTX 2070) | Where development happens. Its numbers are recorded for comparison only. |
| **Desktop pinned to 4 cores** (`taskset -c 0-3 …`) | A quick stand-in for the Deck's CPU between Deck runs. Not a substitute for the Deck: it doesn't reproduce the Deck's GPU or shared power budget. |

## 4. The development log

Each trial keeps a `LOG.md` next to its plan. **One dated entry per work session**, written at the end of the session:

- **What I did** and **how long it took**
- **Friction:** anything that cost more than 10 minutes that it shouldn't have (install problems, build errors, crashes, confusing docs, editor quirks)
- **Went well:** anything that was faster or nicer than expected
- **Links:** the docs, issues or forum threads that helped

At the end of the trial, the log gets a **summary** against these headings, so the trials can be compared side by side:

| Heading | What it asks |
|---|---|
| Setup | Time from nothing to a running build on the desktop, and to a running build on the Deck |
| Iteration loop | Time from a code change to seeing it, for script and for native code |
| Debugging | How it was to debug script, native code, and a crash |
| Performance tooling | Did the profiler show where the time went? |
| Docs and community | How often did the answer exist, and how old was it? |
| Horde fit | How naturally did data-oriented horde code fit the engine? |
| Deck | Export, deploy and run on the Deck: how painful? |
| Would I keep going? | A plain yes / no / maybe, with a reason |

## 5. After the standard test (optional)

Only once §2 is done and recorded:

- **Movement feel.** Port a slice of the movement kit (run, jump, double jump, wall run, dash) with the grey box's tuning numbers, to see what gameplay code is like in the engine. **Movement exploits we want to keep are built on purpose**, e.g. the wall-jump refresh / Wall kick rule (design doc §6 and §11). An engine's character controller will not reproduce the grey box's wall contact by accident.
- **Anything else** is out of scope. No weapons, progression, art, audio or UI beyond a debug overlay.

## 6. Writing up

At the end of each trial:

1. Put the numbers and the log summary in a new section of [`engine-options.md`](../../docs/research/engine-options.md) (**research findings**, with sources: the run JSON files and the log).
2. Update the design doc's Q2 and Q8 entries (§11, §13) with **what was measured**, not with a decision. Q8 is decided by Rich, after the trials he wants to run are done.
3. Commit the trial's code, its log, and its run files.
