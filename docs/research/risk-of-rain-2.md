# Risk of Rain 2 (2019/2020) — Research

> **Why this game is in our reference set:** It is the proven answer to "how do you make a 3D horde roguelike feel good." Risk of Rain 2 solved the 2D→3D transition that our project requires, published its reasoning, and shipped the genre's best mathematical model for scaling difficulty against time. Its item-stacking system is the most rigorous power-curve design available to us.

---

## 1. Snapshot

| | |
|---|---|
| **Early access** | March 28, 2019 (Windows) |
| **1.0 release** | August 2020 |
| **Developer** | Hopoo Games |
| **Engine** | **Unity** |
| **Genre** | Third-person co-op roguelike shooter |
| **Metacritic** | 85 (PC); OpenCritic 93% recommend; IGN 9/10; GameRevolution 5/5 |
| **Sales** | 650,000 players in week one · **1M+ in the first month** · **4M on PC by March 2021** |
| **Predecessor** | *Risk of Rain* (2013), 2D |
| **Ownership** | IP acquired by **Gearbox**, November 2022 |
| **Studio fate** | Hopoo Games went on hiatus September 2024; co-founders joined **Valve** |

**The origin is instructive.** Risk of Rain 2 was initially planned as another **2D** game where you played the monsters. It became 3D for a mundane, practical reason: **they wanted collected items to be visible on the player character, and doing that with 2D sprites was impractical.** As Paul Morse put it: *"One week it was 2D, the next it was 2.5, and the next week it was 3D."* Hopoo were self-taught and **had never made a 3D game before.**

---

## 2. Core Mechanics

### 2.1 The run loop

1. Drop onto a stage
2. Kill enemies for gold; open chests for items
3. **Find and activate the teleporter**
4. **Survive a boss fight and an enemy onslaught while the teleporter charges**
5. Unspent gold converts to experience
6. Advance to the next stage — **difficulty carries over and keeps climbing**

The loop repeats indefinitely. There is no fixed end; there is only the point at which the escalating difficulty finally exceeds your accumulated power.

**The teleporter is the key structural device.** It forces the player to **stop running and hold ground** in a defined radius while the charge completes. In an open 3D level where the player can otherwise kite forever, the teleporter is the mechanism that *manufactures the surrounded state*.

> **This matters enormously to us.** Risk of Rain 2 faces our exact problem — a mobile player in an open 3D space who could simply leave — and its answer is a **timed, positional objective that must be defended**. This is the second candidate solution to our central design tension, alongside Crackdown's "put the rewards at height."

### 2.2 Difficulty scaling — the genre's best-documented model

Risk of Rain 2's difficulty is a **continuously recalculated coefficient**, not a wave table. This is the most mathematically precise scaling model in our research set, and it is public:

```
playerFactor = 1 + 0.3 × (playerCount − 1)
timeFactor   = 0.0506 × difficultyValue × playerCount^0.2
stageFactor  = 1.15 ^ stagesCompleted

coeff = (playerFactor + timeInMinutes × timeFactor) × stageFactor
```

Where `difficultyValue` is 1 (Drizzle), 2 (Rainstorm), or 3 (Monsoon), and `timeInMinutes` increments every second.

Enemy level derives from the coefficient:

```
enemyLevel = 1 + (coeff − playerFactor) / 0.33
```

And per level, enemies gain **+30% health and +20% damage**.

Boss scaling is separate:

```
enemyHP     = enemyHP × round((1 + coeff / 2.5) × livingPlayers × 10) / 10
enemyDamage = enemyDamage × round((1 + coeff / 30) × 10) / 10
```

Economy scales too, which is what keeps the run coherent:

```
money cost = baseCost × coeff^1.25
XP reward  = coeff × monsterValue × rewardMultiplier
gold reward = 2 × coeff × monsterValue × rewardMultiplier
```

**Three properties worth extracting:**

1. **Time is the primary difficulty axis, stages are a multiplier.** `1.15^stagesCompleted` means the player is *punished for taking too long* and *rewarded for efficiency*, which creates a real strategic tension: farm more items, or move on before the curve outruns you. This is the core decision in every RoR2 run.
2. **Health scales faster than damage (30% vs 20%).** Enemies become spongier faster than they become lethal, which preserves player agency deep into a run — you are not one-shot, you are *overwhelmed*. That is the right failure mode for a horde game.
3. **Costs scale superlinearly (`coeff^1.25`) while gold scales linearly (`2 × coeff`).** Purchasing power *decreases* over time, which naturally throttles item acquisition late and prevents infinite snowballing. An elegant, self-correcting economy.

**The difficulty bar** is displayed to the player with named tiers, escalating in tone: *Easy → Normal → Hard → Very Hard → Insane → Impossible → I SEE YOU → I'M COMING FOR YOU → HAHAHAHA* (capping around level 99). Making the scaling **legible and characterful** is itself a good design decision — the player feels the clock.

**Difficulty presets:**

| | Time scaling | Armor bonus | Health regen |
|---|---|---|---|
| **Drizzle** | 50% | +70 | ×1.5 |
| **Rainstorm** | 100% | — | ×1.0 |
| **Monsoon** | 150% | — | ×0.6 |

### 2.3 The Director — spawn management

Enemy spawning is handled by **Directors**, which accumulate **credits** that increase linearly with the difficulty coefficient, then periodically pick a random enemy type and **spend credits to spawn a group of up to four**.

Key details:

- Weak enemies are cheap; bosses are the most expensive
- **Elite modifiers multiply cost**: Blazing / Overloading / Glacial elites cost **6×** a normal monster; Malachite / Celestine elites cost **36×**
- A Director **will not spawn a group that is "too cheap"** for its current credit pool — the threshold being the cost of a full elite pack (36× or 216× base, depending on stage)

> **This last rule is quietly brilliant and we should copy it.** It means that as difficulty rises, the game *automatically stops spawning trash* and shifts toward elites and bosses. The composition of the horde evolves without anyone authoring a wave table. One number — credits — drives both quantity and quality of threat.

For a bullet heaven this is especially valuable: it is a **built-in solution to entity count explosion**. Rather than spawning 5,000 weak enemies at minute 25, a credit system naturally converts that budget into 200 strong ones. **That is a performance control disguised as a design system.**

### 2.4 Item stacking

Items have **no collection limit** and stack infinitely. Two stacking models:

**Linear stacking** — each copy adds the same flat bonus. Used for damage, health, most direct stats.

**Hyperbolic stacking** — used for percentage effects that must never reach 100% (proc chances, damage reduction, cooldown reduction):

```
f(x) = 1 − 1 / (1 + a · x)
```

where `a` is one item's effect and `x` is the stack count. This asymptotically approaches 100% without ever reaching it.

> **This is the cleanest solution in existence to "how do I let players stack a percentage forever without breaking the game."** It should be considered a default tool in our design, not a novelty.

**Item tiers:** White (common) → Green (uncommon) → Red (legendary) → Yellow (boss) → Blue (lunar, with drawbacks) → Void (corrupting variants).

**Items are visible on the character.** Hopoo built "a pretty solid system for placing items on characters and displaying them, even with every item in the game showing at once," and described the result: *"It gives you a true sense of progression to see your character standing at the Obelisk decked out in random items."* This was the original reason the game became 3D at all.

---

## 3. Design Philosophy (derived)

1. **Time is the enemy.** The clock, not the level, is the difficulty source. Every second costs you.
2. **Make efficiency versus greed the core decision.** Stage multipliers punish farming; items reward it. The tension is the game.
3. **Manufacture the stand-and-fight moment.** The teleporter exists because an open 3D space lets players run forever.
4. **Scale health faster than damage.** Death by attrition, not by one-shot.
5. **Throttle the economy as power grows.** Superlinear costs against linear income.
6. **Let one number drive spawn quantity *and* quality.** Credits handle both, and cap entity counts for free.
7. **Never cap a stack; bound it asymptotically instead.** Hyperbolic scaling.
8. **Show the build on the character.** Progression should be visible, not just numeric.
9. **Make difficulty legible and characterful.** The named difficulty bar is feedback, not just a stat.
10. **Hand-author spaces, randomise contents.** See technical profile.

---

## 4. Why It Is Fun (what players actually say)

- **The snowball.** The universally cited pleasure: items stack multiplicatively in effect, and a run that gets going turns the player into something absurd. Chain-reaction builds where enemies die from across the map.
- **Visible progression.** Seeing your character physically covered in collected items is repeatedly cited as satisfying in a way a stat sheet is not.
- **The greed decision.** Deciding whether to open one more chest before the teleporter, knowing the clock is scaling, produces real tension every single stage.
- **Co-op chaos.** Four players with different snowballs produce a spectacle nobody authored.
- **Character variety.** Distinct survivors with genuinely different kits and skill ceilings.
- **The clock as antagonist.** Watching the difficulty bar climb through "Impossible" into "HAHAHAHA" while you are still alive is a specific, memorable pleasure.

---

## 5. What Makes It Stand Out

**It is the successful 2D→3D horde roguelike translation.** The exact transition our project requires, executed by self-taught developers with no prior 3D experience, to 4 million sales. The published postmortem is the single most directly useful document in our research set.

**The difficulty coefficient.** Most roguelikes author waves. Risk of Rain 2 wrote a formula and let it run. It is more elegant, infinitely scalable, and vastly cheaper to maintain.

**Credit-based direction.** Spawn quality and quantity from one budget.

**Hyperbolic stacking.** Solves unbounded percentage scaling properly.

**Items on the model.** The design constraint that forced 3D, and one of the best-loved features.

---

## 6. Concrete Tuning Numbers

| Dial | Value |
|---|---|
| **Time factor base** | 0.0506 per minute × difficulty × playerCount^0.2 |
| **Stage multiplier** | **1.15 ^ stagesCompleted** |
| **Multiplayer factor** | 1 + 0.3 × (players − 1) |
| **Enemy level divisor** | 0.33 |
| **Per-level enemy health** | **+30%** |
| **Per-level enemy damage** | **+20%** |
| **Boss HP scaling** | (1 + coeff/2.5) × livingPlayers |
| **Boss damage scaling** | (1 + coeff/30) |
| **Cost scaling** | baseCost × **coeff^1.25** |
| **Gold reward** | **2 × coeff** × monsterValue |
| **Tier-1 elite cost** | **6×** base monster |
| **Tier-2 elite cost** | **36×** base monster |
| **Max spawn group size** | **4** |
| **"Too cheap" threshold** | 36× or 216× base cost, by stage |
| **Difficulty presets** | Drizzle 50% / Rainstorm 100% / Monsoon 150% |
| **Drizzle bonuses** | +70 armor, ×1.5 regen |
| **Monsoon penalty** | ×0.6 regen |
| **Max difficulty level** | ~99 |
| **Hyperbolic stacking** | f(x) = 1 − 1/(1 + a·x) |
| **Stage length** | Player-determined (teleporter-gated), typically 5–10 min |

---

## 7. Failure Modes and Criticism

**Snowballing trivialises the late game.** The most substantive complaint. Players report that with the right items, **even Monsoon becomes trivially easy**, and the player can kill everything by standing still while chain reactions do the work. The build stops requiring play.

> This is the same late-run passivity problem Vampire Survivors has, arrived at by a different route. **It appears in every game in this research set.** It should be treated as a structural property of the genre that must be actively designed against, not an oversight.

**Specific items are too strong.** Kjaro's Band and Runald's Band are the canonical examples — cited as improving *any* build to the point of boredom, with two copies giving at least a 16% chance of a 250% base damage proc. When an item is build-agnostic and dominant, it flattens variety.

**Character balance spread.** Sniper, Acrid, and Bandit are reported as significantly harder and weaker in the late game; Engineer is reported as both easier and stronger. The gap between the accessible-and-strong and the difficult-and-weak is wide.

**Red items early can break a run.** Too much power too fast removes the tension the difficulty curve is supposed to create.

**Artifacts are deliberately unbalanced.** Hopoo stated explicitly that Artifact design **would not prioritise balance**, because limiting their strength for the sake of a "normal" run felt wrong — the intent is that they are fun and add replayability, "almost like secrets or cheat codes."

> **This is a legitimate and interesting design stance**, and close to Vampire Survivors' Arcana. The lesson: *have a designated space where you deliberately do not balance.* It relieves pressure on the core loop and gives mastered players a reason to return. But keep it clearly separated from the balanced core.

### The lessons, stated plainly

1. **Late-run passivity is endemic to the genre.** Every reference game has it. Design against it explicitly or inherit it.
2. **Build-agnostic dominant items flatten variety.** Power should be conditional — require a synergy, a playstyle, or a tradeoff.
3. **Have an explicit unbalanced sandbox** (Artifacts / Arcana) so the core loop does not have to carry all the fun.
4. **Watch the difficulty/power crossover point.** If items arrive too fast, the curve never threatens.

---

## 8. Meta-Progression and Retention

| Layer | Mechanism |
|---|---|
| **Unlocks** | Survivors, items, and abilities unlocked via specific in-run challenges |
| **Artifacts** | Deliberately unbalanced run modifiers, unlocked by solving code puzzles |
| **Logbook** | Lore and stat entries for every item and monster, filled by encountering them |
| **Difficulty presets** | Player-selected (Drizzle / Rainstorm / Monsoon) |
| **Loop** | Runs continue indefinitely; going deeper is its own goal |
| **Co-op** | Up to four players |
| **Expansions** | Three, sustaining the game for years |

**Notable design choices:**

- **No permanent stat progression at all.** Unlike Vampire Survivors, RoR2 does not let you buy permanent power. Unlocks grant *options*, never strength. This keeps the difficulty curve honest forever — a veteran and a newcomer face the same numbers.
- **Challenge-based unlocks** direct players toward specific behaviours and characters.
- **Unspent gold converts to XP** at stage end, which prevents hoarding and makes every coin useful.

> **A real tension for us.** Megabonk was criticised for thin meta-progression. Risk of Rain 2 has *none* and was not criticised for it — because its unlock surface is large, its runs are long and varied, and its difficulty stays meaningful. **The lesson is not "add permanent power," it is "make losing runs feel productive."** RoR2 does that with unlocks and logbook progress; Vampire Survivors does it with gold. Either works. Doing neither does not.

---

## 9. Technical Profile

**Engine:** Unity. **Platforms:** Windows, Switch, PS4/5, Xbox One/Series, Stadia. **Team:** small indie (Hopoo Games). **Prior 3D experience:** none — the team learned 3D development from scratch for this project.

### 9.1 The level generation decision — directly applicable to us

Hopoo **abandoned full procedural generation**. Their stated reason:

> *"the level of difficulty needed to make interesting / memorable procedural maps in 3D was too much for our team size."*

Their solution: **hand-crafted premade levels with randomised object and enemy placement.** The article notes this specifically *mitigated verticality complexity*.

> **This is the most important practical lesson in this document.** A small team building a 3D game with verticality should expect fully procedural level generation to be beyond reach, and should plan for hand-authored spaces with randomised contents. Megabonk arrived at effectively the same answer — procedurally assembled floors drawn from only two authored map themes.
>
> For an urban game this is good news: hand-authored city blocks and districts with randomised assembly, enemy placement, and pickup placement is a well-trodden path, and city architecture is naturally modular.

### 9.2 Items displayed on the character

Hopoo built a system capable of **displaying every item in the game on the player model simultaneously** without breaking. This was the original reason for the move to 3D and remains one of the most-praised features. It is a non-trivial technical commitment — attachment points, LODs, and draw-call budgets for a model that can carry dozens of accumulated props.

> Worth deciding early whether we want this, because retrofitting it is expensive. In an urban game the equivalent could be visible weapon mounts, accumulated gear, or escalating visual corruption/augmentation.

### 9.3 3D design space for items

Hopoo noted that 3D "has given us a ton of new design space for item effects" — citing the Royal Capacitor, which targets a specific enemy for a lightning strike, as an effect only meaningful in 3D. **Our verticality should expand item design space further still**: effects keyed to altitude, fall impacts, line-of-sight from height, vertical AoE columns, and gliding.

### 9.4 Entity scale

Risk of Rain 2's entity counts are **substantially lower than a bullet heaven's** — dozens of enemies, not hundreds or thousands. The Director's credit system is a large part of why: it converts budget into *stronger* enemies rather than *more* of them.

> **An important caution.** Risk of Rain 2 is not a direct model for our entity counts. It is a model for our *camera, readability, level design, and scaling math*. Our horde density target sits between RoR2 and Vampire Survivors, and the credit system may be the mechanism that lets us control where on that spectrum we land at any moment in a run.

---

## 10. Carry Forward / Leave Behind

### ✅ Carry forward

| What | Why |
|---|---|
| **A continuous difficulty coefficient** | A formula, not a wave table. Cheap, infinitely scalable, tunable with a few constants. |
| **Time as the primary difficulty axis** | The clock is the antagonist. Matches the survivors-like's 30-minute arc exactly. |
| **Credit-based spawn direction** | One budget driving quantity *and* quality. Doubles as an entity-count performance control. |
| **"Too cheap to spawn" threshold** | Automatically retires trash mobs as difficulty climbs. |
| **Health scaling faster than damage (30/20)** | Death by being overwhelmed, not by being one-shot. Correct failure mode for a horde game. |
| **Superlinear costs against linear income** | Self-throttling economy that limits late snowball. |
| **Hyperbolic stacking for percentages** | The correct way to allow infinite stacking of proc chances and reductions. |
| **Infinite linear stacking for flat stats** | Where the absurd numbers come from. |
| **A defended, timed positional objective (teleporter)** | Manufactures the surrounded state in an open 3D space. **Candidate solution to our central tension.** |
| **Legible, characterful difficulty display** | The player should feel the clock. |
| **Items visible on the character** | Progression you can see. Decide early — expensive to retrofit. |
| **Hand-authored spaces, randomised contents** | The proven small-team answer for 3D with verticality. |
| **Unspent currency converts at stage end** | No hoarding; every coin matters. |
| **A designated unbalanced sandbox (Artifacts)** | Relieves the core loop of carrying all the fun. |
| **Unlocks grant options, not power** | Keeps the difficulty curve honest permanently. |

### ❌ Leave behind

| What | Why |
|---|---|
| **Unconditional, build-agnostic power items** | Kjaro/Runald flatten variety. Make strong items conditional. |
| **Late-run stand-still passivity** | Endemic to the genre. Must be designed against, not inherited. |
| **Wide character power spread** | Weak-and-hard vs strong-and-easy is a bad axis to have. |
| **RoR2's low entity density** | We are a bullet heaven. Our floor for on-screen enemies is much higher. |
| **Indefinite runs with no terminus** | Vampire Survivors' hard stop is better for a 20–30 minute session. |

### 🔑 The two ideas that matter most for us

1. **The difficulty coefficient + credit director** together give us a horde that scales in both intensity and composition from a handful of tunable constants, with entity count naturally bounded. This should be the backbone of our enemy system.
2. **The teleporter** is the second candidate answer to our central tension — alongside Crackdown's elevated rewards. A timed objective the player must defend makes escape self-defeating without ever taking movement away. See `docs/research/00-synthesis.md`.

---

## Sources

- [Risk of Rain 2 — Wikipedia](https://en.wikipedia.org/wiki/Risk_of_Rain_2)
- [How moving from 2D to 3D shaped the design of Risk of Rain 2 — Game Developer](https://www.gamedeveloper.com/design/how-moving-from-2d-to-3d-shaped-the-design-of-i-risk-of-rain-2-i-)
- [Difficulty — Risk of Rain 2 Wiki (wiki.gg)](https://riskofrain2.wiki.gg/wiki/Difficulty)
- [Directors — Risk of Rain 2 Wiki](https://riskofrain2.fandom.com/wiki/Directors)
- [Item Stacking — Risk of Rain 2 Wiki](https://riskofrain2.wiki.gg/wiki/Item_Stacking)
- [Risk of Rain 2 is in development and it is making the jump from 2D to 3D — PCGamesN](https://www.pcgamesn.com/risk-of-rain/risk-of-rain-2-announcement)
- [Risk Of Rain 2's Developers Discuss The Game's Shift To 3D — Kotaku](https://kotaku.com/risk-of-rain-2-developers-discuss-the-games-shift-to-3d-1821553824)
- [Risk of Rain 2: The Difficulty Curve as a Clock — Aside House](https://asidehouse.com/respawn/risk-of-rain-2-the-difficulty-curve-as-a-clock/)
- [Why do you use the artifacts you do? — Steam Discussions](https://steamcommunity.com/app/632360/discussions/0/2291716608423465276/)
