# Plan — Playtest 3 changes

**Status:** Agreed 2026-09-27 (review answers folded in below). **All 10 steps built** (2026-09-27). Next: playtest 4 (sessions in the [README](README.md#test-plan)).

**Built differently from the plan:**
- **Wall-jump refresh off (step 6).** The plan's first idea was "a wall touch still allows a wall jump, but air jumps only come back on the ground". That doesn't close the climb, because chained wall jumps gain height on their own. As built, with the refresh off, a wall jump **needs wall-run time left and uses 0.5 s of it** (`wallJumpCost`), and still refills the air jumps as before. Once the wall-run time is spent, a wall gives nothing. Height is then bounded by your jumps plus your wall-run stat, which is Rich's framing.
- **The restart hold and the save age use real time**, not frame time. Frame dt is capped, so a slow frame rate would have stretched the 1 s hold. A restart marks the old file `restarted` only if the run is over 5 s old; shorter runs never get a file at all.
- **Orb popups** sit at the right edge, a third of the way down, clear of the toast and the tower bar.
- **Altitude and airborne damage feed `damageMult` each frame** (as Momentum does), so the HUD's power index includes them while they're active.
- **+1 projectile applies to Blaster and Gun Drone only**, not Mortar shells. Mortar already dominated playtest 3.
- **`levelPowerShare` stays at 0.3.** `tools/power-curve.mjs` now suggests 0.32 (Breakaway joined the level-up pool), but playtest 3 already ran above target.
- **The high-pitched noise (step 9)** is most likely the orb hum. It was an 880 Hz sine that almost never stopped, because one of the 500 orbs is nearly always within 25 m. It's now 330 Hz and half the volume. The charge tone changed from a square wave to a triangle with a lower top pitch. A **hum volume** slider was added. Rich still has to confirm this was the noise.

Source: Rich's [notes](../../playtests/greybox/playtest_thoughts_greybox3_20260927) and the two runs in [`playtest3_stats`](../../playtests/greybox/playtest3_stats) (2026-09-24).

**Goal:** get the grey box to a place where Rich can **playtest continuously without losing data**, and move it closer to the intended loop. Engine work comes after this.

## Decisions and answers (Rich, 2026-09-27)

- **Metrics save through a local save server**, written into the repo as files. No more copy-paste.
- **The wall-touch jump reset:** add a **debug toggle**, and an **item** that turns the reset on. Measure how strong it is.
- **Into the grey box now:** damage by height, damage while airborne, global projectile count, tower fill speed.
- **Escape AoE is an item:** while you own it, escapes trigger an area-damage effect.
- **Poison (status effects): design doc only.** It needs a status-effect system, which is too big for the grey box right now.
- **The escape AoE is centred on the player's last surrounded position before they escaped**, where it will hit the most enemies.
- **Wall kick is a tower upgrade for now.** Megabonk-style pick-up items would need a lot of new logic. They wait for the engine build.
- **The raw playtest files move to `playtests/greybox/`.**

Everything else below is a placeholder proposal. All review items were answered on 2026-09-27.

## What playtest 3 showed (observations, not conclusions)

Two runs, `mixed` layout, 600 enemies, clock speed 1, level-up mode `offers`.

| | Run 1 | Run 2 | Playtest 2 range |
|---|---|---|---|
| Clock at end / real s | 14:31 / 929 | 10:19 / 1180 | 20:37–29:03 / 56–563 |
| Level / kills | 38 / 9341 | 36 / 14524 | 4–24 / 122–4155 |
| up % | 55 | 59 | 18–39 |
| surrounded % / escaped % | 10 / 10 | 8 / 5 | 3–27 / 4–26 |
| longest escape (s) | 34 | 33 | — |
| damage ground / elevated / fall | 202 / 492 / 23 | 155 / 424 / 57 | ground-heavy |
| power vs playtest 1 | 1.58 | 2.45 | 0.74–1.39 |
| boss kills (min) | 5.1, 9.2, 13.3 | 5.3, 9.4, 15.2 | at most 2 |
| orbs (roof / wall / street) | 25 / 11 / 57 | 39 / 10 / 62 | — |
| seconds in menus | 194 | 238 | — |
| top damage source | Mortar 74% | Mortar 80% | — |

- **The player now spends most of the run up high, and takes most of their damage there.** That's a reversal from playtest 2, where almost all damage was on the ground.
- **Runs last:** three boss kills each, level 36–38.
- **Power is running above target:** 1.58 and 2.45.
- **Mortar does three quarters of all damage in both runs.** This is evidence for the design doc §7 OPEN on a dominant scaling vector.
- **A third session, the one that leaned hardest on the wall-jump reset, was lost** to an accidental R press.

## Order of work

Stop the data loss first, then the quality-of-life fixes, then the loop additions. Each step can be played on its own.

| # | Step | Size | Notes |
|---|---|---|---|
| 1 | Log playtest 3 (README, design doc §13) | S | Docs only |
| 2 | Local save server + autosave | M | Decision |
| 3 | Restart guard on R | S | |
| 4 | Pause menu that fits, Esc resumes | S | |
| 5 | Orb pickup popups | S | |
| 6 | Wall-jump refresh: toggle, item, metrics | S | Decision; Q1, Q6 |
| 7 | New tower stats: fill speed, height damage, air damage, projectiles | M | Decision (numbers are placeholders) |
| 8 | Escape AoE item | M | Decision |
| 9 | High-pitched noise (web only) | S | Investigate |
| 10 | Design doc updates | S | Docs only |

## 1. Log playtest 3

- Add a **Playtest 3 — 2026-09-24** entry to the README playtest log: the table above, the observations, and Rich's 0927 notes, in the same shape as playtest 2.
- Update the §13 Q1 row: three playtests, and "damage while elevated now exceeds ground damage".
- Link `playtest3_stats` and the notes file.
- Move the raw files (`playtest_stats`, `playtest2_stats`, `playtest3_stats`, `playtest_thoughts_*`) into `playtests/greybox/`, next to the autosaved runs from step 2, and fix the links. *(Rich, 2026-09-27)*

## 2. Local save server and autosave

**Today:** metrics exist only in memory until *Copy metrics JSON* is clicked. R, a crash, or a closed tab loses the run.

**After:**

- **`serve.mjs`** (Node, no dependencies) replaces `python3 -m http.server`. Run it with `node serve.mjs` from `prototype/greybox`.
  - It serves the static files, as now.
  - `POST /api/run` writes the body to **`playtests/greybox/<YYYY-MM-DD>/<runId>.json`** at the repo root. It **overwrites the same file** on every save, so each run is one file that is always current.
  - It stamps each save with the **git commit** of the build, so data can always be matched to the code that produced it.
- **Run ID** = start time plus seed, e.g. `2026-09-27T16-40-12_s42`.
- **The run saves:**
  - every **30 s** of real time (the same cadence as the power samples),
  - on **death**, **win/leave**, **restart**, and **pause**,
  - on **page hide or close** (`pagehide` + `navigator.sendBeacon`).
- **Saved data** = the same payload as *Copy metrics JSON*, plus `runId`, `savedAt`, `ended` (`died` / `restarted` / `left` / `in-progress`), and `commit`.
- **Fallback:** if the server isn't there (someone ran the old Python server), saves go to **localStorage**. The debug panel gets **Saved runs → download all**, and the server uploads any stored runs the next time it's reachable.
- **HUD indicator** (small, bottom corner): `saved 12 s ago` in grey, or `NOT SAVING (browser only)` in amber. This makes it obvious when data isn't reaching the repo.
- **Session notes (proposal):** a text box in the debug panel (`note`) that is saved with the run, so a thought can be written down mid-run without alt-tabbing.
- *Copy metrics JSON* stays.
- Update the README's *Run it* section.

## 3. Restart guard

- **During a run**, R (or Back on a controller) must be **held for 1 s**. A ring on the HUD fills while it's held. A tap does nothing except flash "hold R to restart".
- **On the death, win and leave screens**, R restarts immediately, as now.
- **Every restart saves the run first** (step 2), so even a deliberate restart loses nothing.

## 4. Pause menu

**Today:** `showOverlay` prints the whole summary as one `<pre>` in a 560 px card. Late in a run, the stats push **Resume** off the screen. Esc only releases the mouse.

**After:**

- **Buttons go at the top** of the card, above the stats.
- **The card grows to about 1000 px and the stats flow in 2–3 columns.** The stats area scrolls within the card, and the card never grows taller than the window.
- **Esc resumes while paused**, alongside P and Start. Esc still releases the mouse first, which is the browser's rule.
- The same change applies to the death, win and leave screens.

## 5. Orb pickup popups

- Picking up an orb shows a short popup, e.g. **`+0.3% jump height`**, in the orb's colour.
- Quick pickups of the same stat merge into one popup that counts up (`+1.2% jump height ×4`). This avoids a stack of messages when you run through a line of orbs.
- The popups sit at the right edge of the screen (built; see the status notes).

## 6. Wall-jump refresh

**Today** (`player.js:101–108`): a wall jump is allowed whenever you touch a wall, even after the wall-run timer has run out. It also resets `airJumpsLeft`. Mash jump while pushing into a wall and you climb without limit. Rich used this heavily in the lost run.

**After:**

- A new **config toggle, `wallJumpRefresh`** (Movement folder), controls whether a wall jump refills air jumps.
  - **Off (the new default):** a wall jump needs wall-run time left and uses 0.5 s of it. Once the time is spent, a wall touch gives nothing, so you get as high as your jumps and wall-run stat allow, which is Rich's framing. *(Built this way; see the status notes for why the first idea didn't close the climb.)*
  - **On:** today's behaviour.
- **A new Epic tower card, "Wall kick"**, turns the refresh on for the rest of the run. It's a movement trait, so it's a character stat under the 9/24 rule. *(Rich, 2026-09-27: a tower upgrade for now. World pick-up items, as in Megabonk, need more logic and wait for the engine build.)*
- **Metrics:** `wallRefreshes` (how many times a wall jump refilled jumps), `heightFromRefresh` (metres gained while airborne after a refresh), and `maxAltitude`, as now. These say how strong it is.

## 7. New tower stats

All go on the tower table as character stats (the 9/24 rule allows all-damage and all-fire-rate, so conditional damage fits). Numbers are placeholders.

| Card | Effect | Rolls (C / U / R) |
|---|---|---|
| **Tower fill speed** | Towers charge faster (small and large) | +5 / 8 / 12% |
| **Altitude damage** | +x% damage per 10 m above the ground, capped at 60 m | +1 / 1.5 / 2.5% per 10 m |
| **Airborne damage** | +x% damage while not grounded (wall running counts as airborne) | +4 / 6 / 10% |
| **+1 projectile** | +1 projectile for every weapon that fires projectiles (Blaster, Gun Drone). Epic only, like +1 jump | Epic |

- **Metrics:** damage dealt while elevated vs on the ground, alongside the existing `damageBySource`. Altitude and airborne damage both reward being up high, so the Q1 numbers (`up %`, surrounded, escaped) need watching.
- **The HUD build panel** lists the new stats.
- Unit tests in `test/` for the new tower targets (offer rules, stacking).

## 8. Escape AoE item

Rich: an item that, while you own it, makes escapes trigger an area-damage effect.

- A **skill** (takes a slot, level-up offers, levels 1–8), because it carries combat weight. *(Proposal.)*
- **Last surrounded position** *(Rich, 2026-09-27)*: while 5 or more enemies are within 8 m, the game keeps updating the player's position. That spot is where the burst lands.
- **Trigger** *(proposal)*: it fires when the player **breaks away**, meaning the count within 8 m drops below 5 within 1.5 s of a dash, air jump or wall jump. Breaking away is driven by movement, so a crowd that thins because it got killed doesn't count. **3 s cooldown.**
- **Radius** 8 m, growing with level. **Damage** scales like the other area weapons.
- Its damage is logged in `damageBySource`, and it clears enemy bullets like the other area weapons.

## 9. High-pitched noise (web only)

- **Not gameplay.** Likely candidates: the orb and large-tower hums (`audio.js:165`), or the tower charge sweep at the top of its pitch rise.
- Reproduce it, then fix it with a lower pitch or a separate **hum volume** slider. No design doc entry.

## 10. Design doc updates

- **§6:** an OPEN callout for the **wall-touch jump refresh**. Rich: "this is the kind of movement exploit I was going for". It's being tested behind an item. Link it to the research input "deep, exploit-friendly movement (Megabonk adopted bunny-hopping)" and to Q6.
- **§11:** a note that movement exploits worth keeping must be **built on purpose**, not left to physics quirks, so they carry over to the production engine. This is something the engine spike should check.
- **§7:**
  - 🧪 grey-box entries for the new tower stats and the escape AoE item.
  - An OPEN proposal for **status effects (poison)**, design doc only.
  - Playtest 3's Mortar share as evidence for the "dominant unbounded scaling vector" OPEN.
- **§12:** wall-refresh climbing next to "unreachable hiding spots". Climbers and flyers need to reach whatever height it allows.
- **§13 / §14 / §15:** Q1 row update. Add the wall refresh and status effects to §14. Log the 2026-09-27 grey-box experiments in §15.

## Playtest 4 sessions (proposal)

1. **Wall refresh off vs on** (toggle, same seed). Compare `up %`, `maxAltitude`, `escaped %` and longest escape. Then a run where Wall kick is picked up naturally.
2. **Height rewards.** Pick altitude and airborne damage whenever offered. Does `up %` climb past 60, and does the horde still threaten you?
3. **Mortar-free run** (skip Mortar whenever offered). Is power still near target without it?
4. **Continuous play.** Several runs back to back with deliberate R restarts. Check that `playtests/greybox/` has one complete file per run.
