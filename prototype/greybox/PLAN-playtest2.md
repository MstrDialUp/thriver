# Plan — Playtest 2 changes

**Status:** Agreed 2026-09-24 (review answers folded in below). **All 9 steps built** (2026-09-24). Next: playtest 3 (sessions at the end).

**Built differently from the plan:**
- **Towers on roofs are clamped to fit the roof**, so a 9 m large tower on a 12 m-wide building has a smaller ring. Otherwise part of the ring would hang in the air.
- **The enemy share is tied to horde size.** The civilian target is `base × (1 − enemies / maxEnemies)`, so civilians thin out as the horde fills up and come back if the player clears it.
- **Cars** can turn at junctions and U-turn at the map edge. They never damage the player.
- **Arc** clears bullets where it strikes but doesn't hurt civilians. **Mortar** only targets enemies, so it's idle during the civilians-only opening. Blaster and Gun Drone shoot civilians only when no enemy is in range. Numbers are **grey-box placeholders** unless listed under "Decisions".

Source: [playtest 2 log](README.md#playtest-2--2026-09-24) and Rich's [notes](../../playtest_thoughts_greybox1_20260924).

## Decisions (Rich, 2026-09-24; design doc §4, §7, §15)

- **Towers offer character stats only**, never weapons, skills, or upgrades to them. Movement counts as a character stat. All-damage and all-fire-rate stay.
- **Nearly every player stat goes on the tower table**, in small percentages, including ones other skills also touch (fall damage, impact damage, pickup radius).
- **Two tiers of tower.**
  - **Small:** quick to charge, respawns constantly, pays XP + heal + pick 1 of 3 (as now). Smaller upgrades than a large tower.
  - **Large:** slow to charge, pays health + XP + a character upgrade. A set number per map, gone once completed. More than 5–8.
- **Towers spawn on any flat surface, roof or ground. Large towers go almost exclusively on rooftops**, to push the player up. B's pull-down role is set aside.

**Grey-box direction from the plan review (Rich, 2026-09-24), not yet design decisions:**

- **Orbs:** 500 per map, and they can also spawn **on the sides of buildings**.
- **I-frames also pause contact damage.** Getting hurt flashes the screen border red.
- **The city is full of civilians.** A large population of **pedestrians and cars** fills the screen, and enemies are **swapped in for a share of them**. That share grows with tier and time. Only civilians for the first 30 seconds.
  - **Cars** drive as if the player isn't there. They still take damage.
  - **Pedestrians** wander the street grid (sidewalks and roads). When the player comes close, they **run**.
  - **Civilians can be destroyed for XP**, less than an enemy that fights back.
  - **Enemies never attack civilians**, but **civilians take friendly fire** from enemies' ranged attacks.

Everything else below is a placeholder proposal.

## Order of work

Towers first, because they're the decisions. Then the cheap fixes Rich asked for, then the bigger additions. Each step is playable on its own.

| # | Step | Size | Notes |
|---|---|---|---|
| 1 | Two tower tiers, placement on any flat surface | M | Decisions |
| 2 | Tower stat table: more stats, small percentages | S | Decision (content is placeholder) |
| 3 | HUD: empty weapon and skill slots | S | |
| 4 | Balance: boss HP and XP, enemy bullet speed and damage, i-frames, damage flash | S | |
| 5 | Enemy bullets destroyable by damage | M | |
| 6 | Freer wall movement | M | Touches the movement kit (Q1, Q13) |
| 7 | Crackdown-style stat orbs | M | Design doc §7 OPEN |
| 8 | Civilians: pedestrians and cars, swapped for enemies over the run | L | Replaces the spawn opening |
| 9 | Sound | L | Web Audio; see below |

## 1. Two tower tiers

**Today** (`rewards.js`): 3 hold zones at a time, spawned at street level 25–70 m from the player, 6 s to fill, drained at 1.5× when you leave. Only count while the player is below 3 m. They're moved if they fall 130 m behind. On completion: `40 + 10 × tier` XP, 25 HP, and a tower pick 1 of 3.

**After:**

| | Small tower | Large tower |
|---|---|---|
| **Placement** | Any flat surface, near the player (25–70 m, as now): street or roof, **50/50** (`smallTowerRoofShare`) | Placed **at run start**, spread across the map with a minimum spacing. **90% on roofs** (`largeTowerRoofShare`), favouring taller roofs, like caches |
| **Count** | 3 at a time, respawning (as now) | **12 per map** (`largeTowerCount`, placeholder above Rich's "more than 5–8"). Never respawn |
| **Charge time** | 6 s (as now) | **20 s** (`largeHoldTime`) |
| **Leaving** | Drains at 1.5× (as now) | Same rule |
| **Far away** | Moved when 130 m behind (as now) | Stays put. It's part of the map |
| **Reward** | XP + 25 HP + pick 1 of 3 at normal rarity weights | **3× the XP**, **50 HP**, and a pick 1 of 3 with a **rarity floor of Uncommon** and weights shifted up one step, so the upgrade is bigger |
| **Look** | Blue ring and beam (as now) | Gold ring, bigger radius (9 m), taller beam visible across the map |

**Changes:**

- `world.js`: add `randomRoofPoint(cx, cz, rMin, rMax)` and `roofPointsSpread(n, minSpacing)`. Both return `{x, y, z}` with `y` as the surface height.
- `rewards.js`: zones carry a `tier` (`small`/`large`) and a surface `y`. Change the "inside" test from `player.pos.y < 3` to "within the radius and standing within 2 m of the zone's surface height". Draw the ring and fill at the surface height. Large towers are placed in `reset()`.
- `loot.js`: the offer takes an optional rarity floor and weight shift. Large towers use it.
- `hud.js`: show `large towers 9/12`.
- `metrics.js`: split `zonesDone` into `smallHeld` / `largeHeld`, and add `towersHeldOnRoof` / `towersHeldOnGround`. Keep `zonesHeld` as the total so the numbers stay comparable with playtests 1 and 2.
- `debug.js`: counts, charge times, roof shares, rarity floor.
- **Hacker** (a skill) works on both tiers, unchanged.
- **Rooftop caches (A) stay** for now. Whether orbs (step 7) replace them is for playtest 3.

## 2. Tower stat table

The table is already all character stats. Step 1's rule (no weapons or skills) holds without change. This step adds stats, all small percentages (Common / Uncommon / Rare), placeholders:

| Stat | New? | Roll | Notes |
|---|---|---|---|
| Pickup radius | New to towers (`magnetRadius` exists) | +5 / 8 / 12% | Overlaps XP Magnet, as Rich asked |
| Impact damage | New stat | +5 / 8 / 12% | **Only offered if Impact is owned**, otherwise it's a dead card (design doc §12, dead stats) |
| XP gain | New stat | +3 / 5 / 8% | |
| Damage reduction | New stat, hyperbolic | 2 / 3 / 5% | Stacks forever, never reaches 100% |
| Health regen | New stat | +0.2 / 0.3 / 0.5 HP/s | |
| Dash distance | New stat | +4 / 6 / 10% | |
| Slide speed | New stat | +4 / 6 / 10% | |
| Existing ten | — | as now | Move speed, jump height, wall-run time and climb speed, glide speed, dash cooldown, max health, fall reduction, all damage, all fire rate |

Epic and Legendary rolls (+1 air jump, +1 dash, both) stay as they are.

**Rule carried in:** a stat that only affects an item is offered only when that item is owned. `catalog.js` gets a `requires` field and `loot.js` filters on it. Tests cover it.

## 3. HUD empty slots

The build panel shows `weapons  Blaster 3 · Mortar 1 · [ ] · [ ]` and the same for skills, using the slot caps from config.

## 4. Balance

| Note | Today | Proposal (placeholders) |
|---|---|---|
| **Bosses need more health** | Lower boss HP = `hpMult × (0.6 + 0.4 × n)` | Multiply by `bossHpMult` = **3** |
| **Boss large XP drop** | Normal enemy XP | Lower boss drops XP worth about **two levels** at the time of the kill; final boss about five. Dropped as a gem cluster (needs a magnet or walking over) |
| **Early projectiles slower** | Every enemy bullet flies at 18 m/s | Speed ramps with run time, from **9 m/s at the start to 18 m/s after 12 minutes** (`bulletSpeedMin/Max`, `bulletSpeedRampMin`). Time, not tier, because players who avoid bosses stay at a low tier |
| **Late projectiles one-shot the player (~10 min)** | Bullet damage scales with the same `dmgMult` as contact damage | Bullets use a **gentler multiplier** (the square root of `dmgMult`), and **a single bullet can take at most 25% of max HP** (`bulletMaxHitPct`) |
| **I-frames after a hit** | None | **0.5 s** of immunity after any hit (`iFrames`). **Contact damage pauses too** (Rich). Contact damage is continuous, so an i-frame window starts once contact has dealt a chunk of damage in a short span (placeholder: 5 HP within 0.25 s) |
| **Show that you've been hurt** | Only the HP bar | **The screen border flashes red** on any damage, stronger for bigger hits (`damageFlash`). Rich offered the player model or the screen border; the border reads better when the camera is pulled back or the player is hidden behind a wall |

## 5. Destroyable enemy bullets

- Bullets get **1 HP** (placeholder `bulletHp`).
- **Projectile weapons** (Blaster, Gun Drone) hit bullets they pass through, and the shot is used up.
- **Area weapons** (Pulse, Arc chains, Melee Drone, Mortar blasts, Impact) destroy bullets inside their area.
- The bullet hash reuses the enemy spatial hash's cell size.
- Metric: `bulletsDestroyed`.

## 6. Freer wall movement

**Today** (`player.js`): on a wall, the player is in exactly one state, **vertical** (pushing into the wall: climb at `wallRunUpSpeed`) or **side** (moving along it at speed). No diagonals.

**Proposal:** one wall state. Split the input direction into an **into-wall** part and an **along-wall** part, and apply both at once:

- **Upward speed** = `wallRunUpSpeed × into-wall share`
- **Sideways speed** = run speed × along-wall share

Pushing diagonally into a wall climbs diagonally. The timer (`wallRunTime`), the gravity while running sideways, and the wall jump stay as they are. Spider (a skill) is unchanged.

Keep the old behaviour behind a toggle (`wallMode: 'free' | 'locked'`) so playtest 3 can compare them.

## 7. Crackdown-style stat orbs

Rich: *"have 'orbs' that give distinct bonuses (speed, jump height, etc) color coded by what they do. These should be very small bonuses though, decimals of a percent."* Review: **500 per map, and on the sides of buildings too.**

- **500 orbs** per map (`orbCount`), placed at run start, **one-time pickups** as in Crackdown.
- **Three placements** (`orbShares`, placeholder **40 / 30 / 30**):
  - **roofs and ledges**
  - **building sides**: floating about 1 m off a wall face, between 4 m and the roof. You reach them by wall-running, wall-jumping or gliding past.
  - **street level**
- **One colour per stat**: six stats to start (move speed, jump height, wall-run time, max health, all damage, pickup radius), each worth **+0.3%** (`orbValue`).
- Instanced, like enemies. A faint glow, and a pickup flash.
- The HUD shows orbs taken and the total bonus per stat in the build panel.
- Metrics: `orbsTaken`, split by placement (roof, wall, street).
- Design doc §7 records orbs as OPEN. Playtest 3 decides whether they replace the rooftop caches.

## 8. Civilians: pedestrians and cars

Rich: the city should always feel full. **Fill it with pedestrians and cars, then swap some of them for enemies.** The enemy share grows as tiers go up and time runs down. This replaces the "non-attacking enemies for 30 seconds" idea.

**Population**
- **Pedestrians** and **moving cars** live in a ring around the player, like the horde. They're recycled at the ring's edge (as D does for enemies), so the density near the player stays constant.
- Placeholders: **300 pedestrians**, **60 cars** (`civPedestrians`, `civCars`). The parked cars (the auto-vault snag test) stay as they are.
- They're **instanced boxes on the street grid**, simulated separately from the horde: no flow field, and no separation against the horde. Pedestrians keep a light separation among themselves.

**The swap**
- **0:00–0:30: civilians only.** No enemies spawn (`civOnlyTime`).
- After that, the director spawns enemies as now. Each new enemy **replaces a civilian that's out of the player's view** where possible, so the population stays roughly constant and the city visibly "turns".
- **The enemy share grows** with the director's existing scalers (sliding time and tier). With the current spawn rates, enemies outnumber civilians within a few minutes, and civilians mostly disappear by the late run. How fast is a tuning question for playtest 3.
- Bosses, closet spawns (rooftops) and flyers spawn as now. Only ground spawns replace civilians.

**Behaviour**
- **Cars** drive the road lanes and turn at junctions. They **ignore the player**: they don't stop or swerve. They're solid, and the player can land on and jump off them. They don't damage the player (a placeholder; Rich didn't say).
- **Pedestrians** wander the sidewalks and road grid. Within **12 m** of the player (`civFleeRadius`), they **run away** at about twice walking speed until they're 25 m clear.

**Damage and XP**
- **Player weapons damage civilians.** Auto-aim **prefers enemies**. Civilians get hit incidentally (area weapons, stray shots) or targeted only when no enemy is in range, so they don't soak up the build's damage.
- **XP, less than any enemy that fights back** (the lowest is 1): pedestrian **0.3**, car **0.6** (placeholders). Cars have more HP.
- **Enemies never target civilians.** **Enemy bullets hit civilians** in their path (friendly fire), and the bullet is used up.
- Metrics: `civKilled` (by the player), `civFriendlyFire` (by enemy bullets).

## 9. Sound

Rich asked whether this needs a real engine. **It doesn't: the browser has positional audio built in.** Web Audio's `PannerNode` (wrapped by Three.js as `PositionalAudio`) fades sound with 3D distance, so vertical distance counts as well as horizontal.

- **Synthesised sounds, no asset files**: short noise bursts and oscillator blips generated in code. That keeps the grey box's no-build, no-assets setup.
- **Voice limits per sound type**, and the nearest sources win. Hundreds of shots a second would otherwise be noise. The limit is a knob.
- **The list, from Rich's note:**
  - weapon fire (except Pulse)
  - drones and shooting enemies
  - footsteps, wall steps, landings
  - damage, with a different sound when the shield takes it
  - tower charge-up, rising in pitch as it fills
- **Also proposed:** a hum on nearby orbs and large towers. Crackdown used this to lead players to orbs, and the research calls audible pickup cues essential in a vertical space (design doc §9).
- A master volume and a mute in the debug panel.

## Review answers (Rich, 2026-09-24)

- **Q-A. I-frames:** they **also pause contact damage**, plus a red damage flash (step 4).
- **Q-B. Opening:** civilians, not harmless enemies. They don't chase: cars ignore the player, pedestrians wander, then run when approached. Enemies are swapped in over time (step 8).
- **Q-C. Civilians:** destroyable for XP (less than enemies). Enemies don't attack them, but enemy ranged attacks can hit them (step 8).
- **Q-D. Large towers:** 12 per map with a 20 s charge is fine to start with, at this map size.
- **Q-E. Orbs:** **500**, including on building sides (step 7).

## Playtest 3 sessions

1. **Towers.** Do large rooftop towers pull you up? Watch `up %`, `towersHeldOnRoof` and `largeHeld`. Does going up still cost something? Watch damage while elevated and fall damage.
2. **Wall movement, free vs locked.** Does it feel better, and does it change `up %` or escape %?
3. **Balance.** Do runs get past 10 minutes without being one-shot? Does killing bosses feel worth it?
4. **Orbs.** Do you go out of your way for them? Do wall orbs get you wall-running more? Watch `orbsTaken` by placement, and compare with rooftop caches.
5. **Civilians.** Does the city feel full, and does the swap to enemies read as the city turning? Is it too easy early, with civilians as free XP?
6. **Sound on vs off.** Can you find towers and orbs by ear?
7. **Enemy count** (from the engine report, [`engine-options.md`](../../docs/research/engine-options.md) §8): runs at 550, 1,000 and 2,000 `maxEnemies`, to see which **reads** as absurd.
