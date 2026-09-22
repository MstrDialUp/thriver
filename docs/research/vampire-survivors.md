# Vampire Survivors (2021/2022) — Research

> **Why this game is in our reference set:** It defines the genre. Vampire Survivors is the origin of the 30-minute power curve we want — one weapon and a handful of enemies at 00:00, a screen-filling whirling dervish at 30:00. Its run structure, evolution system, and dopamine pacing are the skeleton of our core loop.

---

## 1. Snapshot

| | |
|---|---|
| **Early access** | December 2021 (itch.io earlier in 2021) |
| **1.0 release** | October 20, 2022 (Windows, macOS) |
| **Developer** | Luca Galante, solo, under the name **poncle** |
| **Origin** | Made while unemployed in 2020; prior career in the gambling/slot-machine industry |
| **Initial asset spend** | ~£1,100 on art, music, and assets |
| **Engine** | **Phaser** (HTML5) through v1.5; migrated to **Unity** from v1.6 onward for performance |
| **Direct inspiration** | *Magic Survival* (2019), a mobile game with auto-attacking survival combat |
| **Metacritic** | 87 (PC), 95 (Xbox Series X\|S), 91 (iOS) |
| **Concurrents** | 30,000 by late Jan 2022; 70,000+ by Feb 2022 |
| **Creator's outcome** | ~£40 million by August 2024 (*Sunday Times* estimate) |
| **Awards** | BAFTA Best Game **and** Game Design (2023); D.I.C.E. Action Game of the Year (2023); Golden Joystick Breakthrough (2022); BAFTA Evolving Game (2025) |

Vampire Survivors did not just succeed — it **created a genre category**. "Bullet heaven" / "survivors-like" exists as a term because of this game.

---

## 2. Core Mechanics

### 2.1 The single verb

**The player can only move.** There is no attack button, no aim, no dodge, no ability activation. All weapons fire automatically on their own cooldowns, in directions determined by each weapon's own rule (toward facing, nearest enemy, random, orbiting, etc.).

This is the single most important design decision in the game. Consequences:

- **All skill relocates to positioning.** Since you cannot aim, where you stand and which way you are facing *is* your aim. Path planning becomes the entire skill expression.
- **Input cost is near zero**, which makes the game playable one-handed, on mobile, in a Tesla, and while half-attending. Accessibility is a direct consequence of mechanical minimalism.
- **Screen density can be arbitrarily high** without overwhelming the player, because the player is not executing precise actions. They are reading flow and finding gaps.

### 2.2 Run structure

- Each run is a **single stage** with a soft time limit of **15, 20, or 30 minutes** depending on the stage.
- Enemies spawn immediately and escalate continuously in density, variety, and stats.
- At the time limit, **Death (the Reaper)** spawns and is designed to end the run near-instantly. **Additional Reapers spawn every subsequent minute.**
- Surviving past the limit is possible only with specific build pieces (e.g. Infinite Corridor, Crimson Shroud) that let you actually damage or freeze Death.

The Reaper is worth noting as design: it is not a difficulty curve, it is a **wall**. The game does not taper off — it hard-stops you, which makes 30:00 a clean, legible goal and prevents the late run from degenerating into an infinite victory lap.

### 2.3 Leveling and the upgrade offer

- Enemies drop **experience gems**; gems come in tiers by enemy value.
- Leveling **pauses the game** and offers a choice of **three to four** options drawn from weapons and passives.
- Loadout caps: **6 weapon slots, 6 passive slots.** Once both are full and maxed, standard level-up rewards are exhausted and convert to other rewards.

The cap is critical. It forces **commitment**: taking a weapon early means not taking a different one later. Build identity emerges from scarcity, not from abundance.

### 2.4 Weapon evolution — the engine of the power curve

The headline system. A base weapon becomes a dramatically stronger **evolved** form when three conditions align:

1. The base weapon is at **max level**
2. The player holds the weapon's specific **paired passive item** (usually also at a required level)
3. The player opens a **treasure chest** (dropped by elite/boss enemies)

Example pairings (the structure matters more than the specifics): Whip + Hollow Heart → Bloody Tear; King Bible + Spellbinder → Unholy Vespers; Garlic + Pummarola → Soul Eater.

**Why this design is so effective:**

- It converts passives from boring stat sticks into **keys**. A +max-HP passive is dull; a +max-HP passive that unlocks your weapon's ultimate form is a target.
- It creates a **multi-step goal** that persists across many level-ups. The player always knows what they are working toward.
- It makes chest drops meaningful. The chest is not loot, it is a **trigger**, which converts elite kills into anticipation.
- The power jump is large and *visible* — evolution is the moment a run visibly changes character.

### 2.5 Other in-run systems

- **Chests** — dropped by elites; contain 1, 3, or 5 upgrades, with escalating slot-machine presentation. (Galante has said directly that his slot-machine background informed the chest-opening animations. This is not incidental; it is applied gambling-industry presentation craft.)
- **Pickups** — floor chicken (heal), gold, magnets (collect all gems on screen), bombs (clear screen).
- **Destructible environment props** that drop pickups, encouraging movement toward specific points.
- **Arcana** — powerful run-modifying cards, selected at run start, that break or invert normal rules. The high-variance layer that keeps a mastered game interesting.

### 2.6 Meta-progression

- **Gold** earned in runs is spent on **PowerUps** — permanent, stacking stat upgrades (might, armor, max health, move speed, cooldown, luck, growth, greed, etc.) applied to all future runs.
- **Character unlocks**, **stage unlocks**, **weapon unlocks**, and **Arcana unlocks** are gated behind specific in-run achievements.
- **Golden Eggs** (late-game) grant permanent random stat increases, effectively an infinite grind sink.
- PowerUps can be **refunded** freely, letting players respec for challenge runs.

---

## 3. Design Philosophy (derived)

1. **One verb, maximum consequence.** Remove every input you can. What remains must carry all the meaning.
2. **The player should never wait.** Something good must happen every few seconds — a gem, a level, a chest, a pickup, an evolution. Dead time is the enemy.
3. **Scarcity creates identity.** 6+6 slots means builds diverge. Unlimited slots would make every run converge to the same loadout.
4. **Make passives into keys.** Every component of the build should point at another component. Nothing is inert.
5. **Telegraph the goal, then deliver the spike.** Evolution is visible on the HUD before it happens, anticipated, then delivered as a dramatic jump.
6. **Escalate sensory output continuously.** The screen at 25:00 should be visually absurd compared to 02:00. The spectacle *is* the reward for surviving.
7. **End the run decisively.** The Reaper prevents the power fantasy from curdling into tedium.
8. **Cheap to enter, deep to master.** £4–5 price, instant comprehension, hundreds of hours of unlock depth underneath.

---

## 4. Why It Is Fun (what players actually say)

**The dopamine cadence is the most-cited quality.** The recurring player description is that the game "barely lets you go a few seconds without something good happening." Enemies drop XP, level-ups hand you a choice, chests pop with upgrades. Reviewers repeatedly reached for the same phrase: **"pure dopamine."** One outlet described it as "an escalating dopamine rush disguised as a retro game."

**The transformation arc, every single run.** You start vulnerable with one weak attack and end as an unstoppable force. Crucially, this is a **complete power fantasy journey compressed into 30 minutes** — and then it resets. Players get the full arc multiple times per sitting. Most games deliver that arc once per 40-hour campaign.

**Movement-only means every step matters.** Because positioning is the entire skill, players report that navigating gaps in the horde feels tense and meaningful even though the inputs are trivial.

**Build discovery.** The evolution system means players are constantly learning combinations. Reviewers noted that "no one streamer played entirely the same," which drove enormous organic visibility.

**The delirium at the end.** The late-run state — screen saturated with effects, hundreds of enemies dissolving on contact, numbers everywhere — is described as reaching "almost delirious heights." Players chase that state.

---

## 5. What Makes It Stand Out

**It inverted the bullet hell.** The genre's name — "reverse bullet hell" — captures it: the screen fills with projectiles, but they are *yours*. The fantasy of being the overwhelming force rather than the threaded needle was unoccupied territory.

**Radical mechanical minimalism at a moment of genre bloat.** Released into a market of increasingly complex roguelikes, it asked for one stick and nothing else.

**Price-to-depth ratio.** A few dollars for hundreds of hours generated extraordinary word of mouth and made it a trivially easy recommendation.

**Post-launch as a design discipline.** poncle shipped free stages (Whiteout, Laborratory, Emerald Diorama, Ante Chamber) alongside paid DLC (Moonspell, Tides of Foscari, Ode to Castlevania, Legacy of the Bloodmoon), winning a BAFTA for *Evolving Game* in 2025. The game kept its audience for years, not months.

**Presentation craft from an unexpected discipline.** The slot-machine chest sequence is the clearest example of gambling-industry feedback design applied legitimately to a premium game.

---

## 6. Concrete Tuning Numbers

These are the actual dials. This is the most directly transferable section in the research set.

| Dial | Value |
|---|---|
| **Run length** | 15 / 20 / 30 minutes (stage-dependent); 30 is the signature |
| **Level-up choices offered** | 3–4 |
| **Weapon slots** | 6 |
| **Passive slots** | 6 |
| **Hard stop** | Reaper at time limit; +1 Reaper per minute after |
| **Evolution requirements** | Max weapon + paired passive + chest from elite |
| **Chest contents** | 1, 3, or 5 items, escalating presentation |
| **Price point** | ~$4.99 premium; free-to-play w/ ads on mobile |
| **Meta currency** | Gold → PowerUps (permanent, stacking, refundable) |
| **Infinite sink** | Golden Eggs (permanent random stat increments) |

**Curve shape (qualitative, from play):**

- **00:00–02:00** — a handful of enemies, one weapon, rapid early levels. Low threat, fast reward.
- **02:00–08:00** — steady density increase; first elites; first chest; build direction becomes clear.
- **08:00–15:00** — enemy formations become patterned (walls, spirals, swarms); first evolution typically lands here; the run's identity locks in.
- **15:00–25:00** — density becomes screen-filling; multiple evolutions online; player transitions from evading to bulldozing.
- **25:00–30:00** — saturation. Enemies die on contact. Spectacle peaks.
- **30:00** — Reaper. Hard stop.

**The key property to replicate:** the *ratio* of threat growth to power growth inverts around the midpoint. Before it, enemies outpace you and you evade. After it, you outpace enemies and you delete. The pleasure is concentrated at the crossover and everything after.

---

## 7. Failure Modes and Criticism

**The "solved meta" / post-completion collapse.** The single most substantive criticism. Once a player has unlocked all characters, stages, weapons, and PowerUps, **the challenge evaporates and with it the reason to play**. Players describe finishing the unlock tree, farming gold that has nothing left to buy, and finding the game hollow. The difficulty ceiling is too low to sustain play after mastery.

> **This is the failure mode most likely to bite us.** Our game will have a finite unlock tree too. Vampire Survivors' answer was years of DLC. If we cannot sustain that content cadence, we need a *systemic* answer — scaling difficulty tiers, seeded challenges, or a ranked/endless mode with a real ceiling.

**Repetition and shallowness.** The same minimalism that makes it accessible is also its ceiling. Critics noted the action "is sometimes boring and repetitive." With no dodge, no aim, and no active ability, there is a low cap on moment-to-moment engagement. Prolonged play becomes passive.

**Balance spread.** Ample reported balancing issues — some weapons and characters are strictly better, and once the community identifies them the discovery pleasure degrades into rote execution.

**Spawn mechanic complaints.** Players have raised issues with how enemies spawn, particularly around offscreen spawning and formations that can corner a player unfairly.

**Passivity in the late run.** Once the build is online, the player is barely participating. Some players enjoy the "sit back" quality (and Steam literally has a "Sit Back and Relax" category for this). Others find it the moment the game stops being a game.

### The lessons, stated plainly

1. **Design the endgame before the unlock tree runs out.** A finite unlock tree is a finite retention window.
2. **Minimalism has an engagement ceiling.** We have more inputs than VS by necessity (3D, verticality, jump). That is an opportunity to raise the ceiling — but every input we add costs us accessibility, so each must earn its place.
3. **If one build dominates, discovery dies.** Requires active balance work and enough synergy density that multiple paths are genuinely viable.
4. **Late-run passivity is a real risk.** Our verticality may be the answer — if navigating the city stays demanding even when your damage is absurd, the player never fully checks out.

---

## 8. Meta-Progression and Retention

**The structure:**

| Layer | Mechanism | Purpose |
|---|---|---|
| **In-run** | XP → level → weapon/passive choice → evolution | The 30-minute arc |
| **Soft permanent** | Gold → PowerUps (stacking stats, refundable) | Makes failed runs productive |
| **Unlocks** | Characters, stages, weapons, Arcana gated behind in-run achievements | The content drip |
| **Infinite sink** | Golden Eggs | Absorbs post-completion grinding |
| **Variance layer** | Arcana selection at run start | Keeps mastered play fresh |
| **Content cadence** | Free stages + paid DLC over years | Reacquisition of lapsed players |

**What works particularly well:**

- **Refundable PowerUps.** Players can strip their permanent power to take on challenge runs. This is a cheap, elegant fix for "my meta-progression made the game too easy" — the player opts back into difficulty. Worth copying directly.
- **Achievement-gated unlocks.** Unlocks are tied to *doing specific things*, not just accumulating time. That directs players toward parts of the game they would otherwise skip.
- **Failed runs are never wasted.** Gold is always earned. This is table stakes for the genre and non-negotiable for us.
- **Arcana as a variance dial.** Instead of balancing everything perfectly, poncle added a layer that deliberately breaks rules in interesting ways. Cheaper than balance and more fun.

---

## 9. Technical Profile

**Engine history — directly relevant to us.**

Vampire Survivors was originally built in **Phaser**, an open-source HTML5/JavaScript 2D framework, because that was the tech Galante already knew. He built the game's basics with **default engine assets**, on a total asset budget of about £1,100.

> **This is a genuinely important lesson.** The most commercially successful game in the genre was built in a browser framework by one person who picked the tool he already knew, using placeholder art. The genre's value is in **systems design**, not technology or production value. Nothing about our technical stack should be chosen for prestige.

**The Unity migration.** From **v1.6 onward, poncle ported the game to Unity, explicitly for performance.** This is the most important technical data point in this document: *even a 2D sprite-based game hit a performance wall in a browser framework at survivors-like entity counts.*

**What that implies for us.** We are targeting:

- **3D** rather than 2D sprites
- **Verticality**, which means real 3D pathfinding rather than "move toward player on a plane"
- Comparable or higher entity counts
- Physical urban geometry with collision

Every one of these multiplies the per-entity cost over Vampire Survivors. **The horde-at-scale problem is our project's dominant technical risk**, and VS's own history is evidence that this problem bites earlier than expected.

**The genre's known architectural answer** is **ECS (Entity Component System)** — data-oriented layouts that process thousands of homogeneous entities in tight cache-friendly loops rather than as individual object-oriented actors. This is the widely cited approach for the genre and is the obvious starting point for our own evaluation. Engine-specific paths (Unity DOTS/Burst, Unreal Mass Entity, Godot with a custom ECS, or a bespoke engine) each have tradeoffs that belong in a technical spike, not in this research doc.

> **Flagged as an open question** in `docs/design/design-doc.md`: what is our entity budget, and what architecture achieves it in 3D with verticality? This should be answered by a prototype, early, before any content work.

---

## 10. Carry Forward / Leave Behind

### ✅ Carry forward

| What | Why |
|---|---|
| **The ~30-minute run arc** | Weak → god, complete, repeatable in a sitting. This is our core loop's shape. |
| **Constant reward cadence** | Something good every few seconds. Non-negotiable. |
| **Capped loadout slots** | Scarcity forces build identity. Pick our numbers, but cap them. |
| **Evolution via weapon + passive + trigger** | Best single system in the genre. Turns stat items into goals and elite kills into anticipation. |
| **Level-up as a pause-and-choose moment** | Gives the player a breath and a decision in the middle of chaos. Especially valuable in 3D where cognitive load is higher. |
| **Chest presentation craft** | Slot-machine escalation. Spend real effort on this; it is cheap and it lands. |
| **Gold from every run, win or lose** | Failed runs must feel productive. |
| **Refundable permanent upgrades** | Lets players opt back into difficulty. Elegant and cheap. |
| **Achievement-gated unlocks** | Directs players toward unexplored content. |
| **A hard stop at the end of the run** | Prevents the late run from becoming a tedious victory lap. |
| **Run-start variance layer (Arcana)** | Cheaper than perfect balance, and better. |
| **Low price, high depth** | Strong genre convention. Word of mouth is the marketing budget. |

### ❌ Leave behind

| What | Why |
|---|---|
| **Movement-only input** | We have jump, verticality, and a 3D camera. Our skill expression is richer; embracing that is our differentiation. But see the warning below. |
| **A difficulty ceiling that ends at 100% unlocks** | The genre's biggest known retention failure. Design our endgame up front. |
| **Late-run total passivity** | If the player can stop paying attention at 20:00, we have lost them at 40 hours. |
| **2D-derived spawn logic** | Offscreen ring-spawning does not translate cleanly to a 3D vertical city and will need original design. |
| **Reliance on a years-long DLC cadence for retention** | Only viable if we can sustain it. Assume we cannot and build systemic longevity instead. |

### ⚠️ The tension with Prototype

Vampire Survivors works because **the player cannot escape the horde** — on an open plane with no verticality and limited move speed, pressure is inescapable and positioning is everything. Prototype's traversal is *designed for escape*. Reconciling these is our central design problem. See `docs/research/00-synthesis.md`.

---

## Sources

- [Vampire Survivors — Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors)
- [Vampire Survivors development sounds like an open-source fueled fever dream — Game Developer](https://www.gamedeveloper.com/design/vampire-survivors-development-sounds-like-an-open-sourced-fueled-fever-dream)
- [Vampire Survivors saved its creator from working on mobile gambling games — PC Gamer](https://www.pcgamer.com/vampire-survivors-saved-its-creator-from-working-on-mobile-gambling-games/)
- [How Vampire Survivors became a hit when creator Poncle was ready to give up — Barclays Games and Creative](https://games.creative.barclays/resource-hub/games/industry-insights/how-vampire-survivors-became-a-hit-when-creator-poncle-was-ready-to-give-up/)
- [How Vampire Survivors built its own unlikely genre, the "survivor-like" — Epic Games Store](https://store.epicgames.com/en-US/news/vampire-survivors-built-genre-autoshooter-bullet-heaven)
- [Evolution — Vampire Survivors Wiki](https://vampire.survivors.wiki/w/Evolution)
- [Weapons — Vampire Survivors Wiki](https://vampire-survivors.fandom.com/wiki/Weapons)
- [Vampire Survivors: How to Survive Past 30 Minutes — Game Rant](https://gamerant.com/vampire-survivors-30-minutes-reaper-boss-death-beat-kill/)
- [Castlevania-Inspired Roguelike Is Pure Dopamine — Kotaku](https://kotaku.com/castlevania-roguelike-vampire-survivors-steam-itch-io-1848402308)
- [Vampire Survivors – an escalating dopamine rush disguised as a retro game — The Vibes](https://www.thevibes.com/articles/lifestyles/53373/vampire-survivors-an-escalating-dopamine-rush-disguised-as-a-retro-game)
- [Boring — Vampire Survivors General Discussions (Steam)](https://steamcommunity.com/app/1794680/discussions/0/5350867208706933331/)
- [Vampire Survivors Critic Reviews — OpenCritic](https://opencritic.com/game/12685/-/reviews)
- [Vampire Survivors–like — Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like)
