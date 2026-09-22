# Synthesis — What We Take From Each

> **Read this one first.** The five game documents are the evidence. This is the argument.
>
> **Status:** Living document. Updated as research and prototyping change our conclusions.
> **Last updated:** 2026-09-22

---

## 1. The Reference Set

| Game | What it contributes | What it cannot give us |
|---|---|---|
| **Prototype (2009)** | Urban power fantasy, chained traversal, city-as-ammunition, chaos generation, earned ultimates | Run structure, progression math, camera solutions, horde tech |
| **Vampire Survivors (2021)** | The 30-minute arc, reward cadence, evolution system, slot scarcity, meta-progression | Anything 3D, anything spatial, anything about verticality |
| **Megabonk (2025)** | Proof the 3D pitch works; multi-floor structure; 3D movement kit; uncapped scaling; a published list of what goes wrong | Deep meta-progression, build diversity at the ceiling, crowd collision |
| **Crackdown (2007)** | Verticality as core mechanic, the orb economy, audio-led navigation, city built for jump arcs | Combat, horde density, run structure |
| **Risk of Rain 2 (2019)** | The 2D→3D translation, difficulty coefficient, credit director, item stacking math, hand-authored-space strategy | Bullet-heaven entity density, session length |

---

## 2. Comparison Matrix

| | Prototype | Vampire Survivors | Megabonk | Crackdown | Risk of Rain 2 |
|---|---|---|---|---|---|
| **Dimension** | 3D open city | 2D plane | 3D w/ verticality | 3D open city | 3D arenas |
| **Session length** | ~14h campaign | 15/20/30 min | ~27 min + boss | ~10h campaign | Indefinite (5–10 min/stage) |
| **Run-based** | No | Yes | Yes | No | Yes |
| **Enemy density** | Dozens (mixed AI) | Hundreds+ | Hundreds | Dozens | Dozens |
| **Player input** | Full action kit | **Move only** | Move + jump/slide | Full action kit | Move + 4 abilities |
| **Combat** | Manual | **Automatic** | **Automatic** | Manual | Manual |
| **Verticality** | **Core** | None | **Significant** | **Core** | Moderate |
| **Progression** | EP → menu unlocks | XP → offers + evolution | XP → offers | **Use-based, implicit** | Gold → chests → items |
| **Difficulty model** | Authored | Time-based waves | Time + player multiplier | Static | **Continuous formula** |
| **Meta-progression** | None | **Deep** (gold, PowerUps, eggs) | Thin (slots, unlocks) | N/A | **None by design** (unlocks only) |
| **Build slots** | ~5 weapons, swap freely | **6 + 6, capped** | Expandable via meta | 5 skills, all active | Unlimited stacking |
| **Team size** | Large studio | **1** | **1** | Mid studio | Small |
| **Engine** | Proprietary (Titanium) | Phaser → **Unity** | **Unity** | RenderWare 4 | **Unity** |

---

## 3. Where They Agree — Our Design Pillars

When five games from three genres converge on the same principle, that principle is load-bearing. These are the pillars.

### Pillar 1 — Movement is the product

Prototype's traversal carried a game with mediocre missions. Crackdown's orb hunting outlasted its story entirely. Megabonk's most-praised feature is 3D terrain, and its developer *adopted a movement exploit rather than patching it*. Vampire Survivors reduced input to movement alone and won a BAFTA for game design.

**Every game in this set is, at its core, about moving through space.** Our game must be worth playing for the movement alone, before a single weapon is considered.

### Pillar 2 — Something good every few seconds

Vampire Survivors' defining quality is that it "barely lets you go a few seconds without something good happening." Crackdown distributed **800** orbs so that the next hit of progress is always within sight. Megabonk guarantees the first elite chest. Risk of Rain 2's chests and item pickups punctuate every stage.

**Reward density is not polish. It is the mechanic.**

### Pillar 3 — The complete arc, compressed and repeatable

Weak → overwhelming, in one sitting, then reset. Vampire Survivors does it in 30 minutes, Megabonk in ~27, Risk of Rain 2 across a stage sequence. Prototype does it once over 14 hours — which is precisely why it is our *feel* reference and not our *structure* reference.

### Pillar 4 — Scarcity creates build identity

Vampire Survivors' 6+6 cap is why runs differ. Megabonk's most-cited failure is that builds *converge* at the ceiling. Risk of Rain 2's unlimited stacking works only because item variety is enormous and acquisition is throttled by a superlinear cost curve.

**Constraints make builds. Abundance makes one build.**

### Pillar 5 — Losing must be productive

Vampire Survivors: gold, always. Risk of Rain 2: unlocks and logbook. Megabonk: silver — but thin enough that players complained. Crackdown: orbs persist.

**Every run must bank something. This is non-negotiable and it is the cheapest retention mechanism in the genre.**

### Pillar 6 — The world is ammunition

Prototype: cars, tanks, helicopters, people. Crackdown: props that become weapons as Strength scales. Both make the environment an active part of the build rather than a backdrop.

In an urban bullet heaven this is nearly free content and it is a genuine differentiator — no survivors-like meaningfully does it.

### Pillar 7 — Escalate the spectacle continuously

The end-state of a Vampire Survivors run is described as "delirious." Risk of Rain 2's pleasure is the snowball. Prototype's is the pandemonium. Megabonk's numbers go to 1390% crit.

**The visual and numeric absurdity at minute 25 is the reward for minute 1.**

### Pillar 8 — Time is the antagonist

Risk of Rain 2 makes this explicit and mathematical. Vampire Survivors makes it a Reaper at 30:00. Megabonk accelerates each floor. The clock, not the level, is what is coming for you.

---

## 4. Where They Conflict — The Real Design Problems

This is the section that matters most. These are not details to resolve later; they are the project.

---

### ⚠️ CONFLICT 1 — Traversal is escape; bullet heaven requires encirclement

**This is our central design problem.**

Everything we want from Prototype and Crackdown — wall-running, gliding, superjumps, no fall damage, rooftop routes — exists to **let the player leave a dangerous situation**. Everything we want from Vampire Survivors depends on the player **being unable to leave**. Vampire Survivors works precisely because a flat plane, a capped move speed, and enemies spawning from all sides make pressure inescapable.

A player who can wall-run up a skyscraper and glide away has trivially defeated a ground-bound horde. If our traversal is as good as Prototype's, our horde must be able to answer it — or our horde stops mattering, and with it the entire genre we are building in.

**Three candidate resolutions, drawn from the research:**

| # | Approach | Source | How it works | Risk |
|---|---|---|---|---|
| **A** | **Put the rewards at height** | Crackdown | XP, chests, and upgrades spawn on rooftops and ledges. Climbing is not escape — climbing is where the run is won. The player *chooses* danger because that is where progress lives. | Requires careful placement authoring; may make ground level feel dead |
| **B** | **A defended positional objective** | Risk of Rain 2 (teleporter) | A timed objective the player must hold ground to complete. Running away stops progress. Manufactures the surrounded state without removing movement. | Can feel like an artificial leash; interrupts flow |
| **C** | **The horde climbs** | — | Flying enemies, wall-crawlers, leapers, ranged units that punish altitude. Verticality becomes contested rather than safe. | Hardest technically (3D pathing, the Megabonk stacking bug); risks removing the *relief* that makes traversal feel good |

**Current inclination:** these are **complementary, not exclusive**, and the likely answer is all three in measured proportion — A as the primary pull upward, C as the pressure that makes altitude contested rather than safe, and B as a periodic structural beat. But the balance between them is exactly what a prototype must determine, and it should be determined **before any content is authored**.

> **This is the first thing to prototype.** Not the weapons, not the upgrade tree, not the art. Build a grey-box city block, a player with Prototype's movement kit, and a horde, and find out what happens. Every other decision in the project depends on the answer.

---

### ⚠️ CONFLICT 2 — Minimal input vs. a movement-driven game

Vampire Survivors' genius is that the player only moves, which makes arbitrary screen density readable and the game playable with half your attention. Our pitch requires jump, traversal, camera control, and probably more — and 3D verticality raises cognitive load substantially on its own.

**The tension:** every input we add raises the skill ceiling (good, addresses the genre's late-run passivity problem) and raises the barrier to entry (bad, loses the genre's signature accessibility).

**The likely resolution:** keep **combat** fully automatic — weapons fire on cooldown with no aim, exactly as the genre does — and spend *all* of our input budget on **movement**. The player's skill expression is entirely "where am I and how did I get there," which is precisely Vampire Survivors' philosophy extended into three dimensions rather than abandoned.

> **Stated as a rule:** *Manual movement, automatic combat.* Any proposed input that is not a movement input should have to argue for itself.

This also neatly addresses the genre's endemic late-run passivity (Section 4, Conflict 5): even when your damage is absurd, navigating a vertical city under pressure still demands attention.

---

### ⚠️ CONFLICT 3 — Horde density vs. 3D collision

Vampire Survivors puts hundreds of enemies on screen on a 2D plane where crowding is trivially resolved. Megabonk shipped with a known, complained-about bug: **enemies pile on top of one another, and large bosses get displaced to the top of the pile, out of effective attack range.**

We are planning *more* verticality than Megabonk, which means *more* opportunity for physics to resolve crowding along the Z axis. **We will hit this exact bug.**

**Candidate mitigations (to be evaluated in a technical spike, not assumed):**

- Non-physical horde agents with **soft separation** steering rather than rigid-body collision
- **Flow-field navigation** with density pressure, so crowds distribute rather than converge on a point
- **Density caps within a radius**, with overflow enemies held back or despawned
- **Vertical displacement clamping** — horde agents simply cannot be pushed upward by other agents
- **Risk of Rain 2's credit system** as a design-level control: convert late-run budget into *stronger* enemies rather than *more*, capping entity counts by design

That last one is worth emphasising: **RoR2's credit director is a performance control disguised as a design system.** It may be our single most valuable borrowing.

---

### ⚠️ CONFLICT 4 — Meta-progression depth: how much permanent power?

The research gives us two opposite, both-successful answers:

- **Vampire Survivors:** deep permanent stacking power (PowerUps, Golden Eggs) — and it eventually **trivialises the game**, producing the post-completion collapse.
- **Risk of Rain 2:** **zero** permanent power; unlocks grant options only — and the difficulty curve stays honest forever.
- **Megabonk:** thin permanent power (four shared slots) — and players **complained it felt unrewarding**.

So: too much trivialises, too little frustrates, and none-at-all works *if* the unlock surface is large enough.

**The synthesised answer:**

1. **Unlocks grant options, not power** (RoR2's discipline)
2. **Some permanent power exists**, but it is **refundable** (Vampire Survivors' PowerUp respec) so players can opt back into difficulty
3. **A player-selected difficulty multiplier that pays out in progression** (Megabonk's best idea) lets mastered players raise their own ceiling *and* be rewarded for it
4. **A large objective surface** (Megabonk's 200+ quests, Crackdown's 800 orbs) keeps directing players at unexplored content

Items 2 and 3 together are the genre's best available answer to the post-mastery collapse that afflicts **every game in this research set**.

---

### ⚠️ CONFLICT 5 — Power fantasy vs. the late-run passivity problem

**Every single game in this set has this problem:**

- Vampire Survivors: late runs play themselves; post-unlock, challenge evaporates
- Risk of Rain 2: "kill most things by standing still with chain reactions, which becomes boring"
- Megabonk: builds converge to two characters and specific items at the ceiling
- Prototype: once you find an effective tool, the other eleven are decoration
- Crackdown: maxed Agility exhausts the city's vertical challenge

**This is a structural property of the escalating-power genre, not a series of individual oversights.** The pleasure *is* becoming overpowered, and becoming overpowered *is* what removes the challenge.

**Our structural advantage:** verticality. If traversing the city remains demanding regardless of your damage output — if the spatial challenge is decoupled from the combat challenge — the player never fully disengages. **Combat gets easy; the city does not.**

This may be our most important differentiator, and it is a direct consequence of combining Prototype with Vampire Survivors. It is worth protecting in every subsequent design decision.

---

### ⚠️ CONFLICT 6 — Map variety in 3D

IGN's criticism of Megabonk was **only two maps**. Risk of Rain 2 abandoned full procedural generation because *"the level of difficulty needed to make interesting / memorable procedural maps in 3D was too much for our team size."*

3D spaces are learned and exhausted far faster than 2D ones, and hand-authoring them is expensive.

**The urban setting is a genuine advantage here.** Cities are naturally modular: blocks, districts, streets, rooftops. **Hand-authored building and block prefabs, procedurally assembled, with randomised pickup and enemy placement** is the approach both Risk of Rain 2 and Megabonk converged on independently, and it fits an urban environment better than it fits a forest.

Additionally, **verticality profile is itself a variation axis** that no other survivors-like has: a low-rise industrial district, a dense financial district of towers, a construction site of exposed girders, and an elevated highway interchange are mechanically different spaces even with shared art.

---

## 5. The Synthesised Design — What This All Points To

Combining every "carry forward" across the five documents:

### Run structure
- **~25–30 minute total run**, segmented into **3 districts/floors** with **accelerating durations** (Megabonk's 10/9/8)
- **Portal/transition between districts** — breath, anticipation, a new space to learn
- **A hard terminus** (Vampire Survivors' Reaper) so the run ends decisively rather than trailing off
- **Scheduled beats per district**: mini-boss and swarm events at fixed times

### Difficulty
- **A continuous difficulty coefficient** driven primarily by time, multiplied by district (RoR2's formula shape)
- **A credit-based spawn director** — one budget controlling both quantity and quality, with a "too cheap to spawn" threshold that retires trash mobs automatically **and caps entity counts for free**
- **Enemy health scaling faster than damage** (~30%/20%) so the failure mode is being overwhelmed, not one-shot
- **A player-selected difficulty multiplier** that pays out in progression

### Progression in-run
- **XP from kills and pickups**, with **elevated pickups** (Crackdown) pulling the player upward into danger
- **Level-up pauses and offers 3–4 choices** from weapons and perks
- **Capped loadout slots** to force build identity
- **Evolution**: max weapon + paired perk + a trigger (elite chest) → dramatically stronger form
- **Offer-steering tools from day one** — reroll, banish, lock (Megabonk's most fixable omission)
- **Uncapped rollover crit and overheal** (Megabonk) so stats never go dead
- **Hyperbolic stacking** for percentage effects (RoR2) so they can stack forever without breaking
- **Multiplicative stack amplifiers** for the characteristic exponential blowups
- **Earned screen-clearing ultimates** (Prototype's Devastators / Critical Mass) as the pressure release valve

### Movement
- **Chained, uninterrupted traversal**: wall-run → jump → glide → dash, auto-vault on sprint, **no fall damage, no stamina**
- **Deep and exploit-friendly** (Megabonk's bunnyhop) — adopt what players discover
- **Traversal upgrades available mid-run** that open new routes (Crackdown's agility loop, compressed into 25 minutes)
- **Audible pickup cues** — essential in a vertical space where line of sight constantly breaks

### The city
- **Hand-authored blocks and buildings, procedurally assembled** into districts
- **Districts differentiated by verticality profile**, not just art
- **Environment as ammunition** — cars, debris, signage as weapons (Prototype + Crackdown)
- **Readable, simplified art direction** serving navigation, silhouette legibility, and collision cost
- **Autonomous faction conflict** as ambient chaos and a possible horde-thinning mechanic (Prototype)

### Meta
- **Gold from every run, win or lose**
- **Unlocks grant options; permanent power is limited and refundable**
- **A large objective/quest surface** directing players at unexplored content
- **A designated unbalanced sandbox** (RoR2's Artifacts / VS's Arcana) so the core loop need not carry all the fun

---

## 6. Open Questions Requiring Answers Before Content Work

These are carried into `docs/design/design-doc.md` and should be resolved by prototype, not by argument.

| # | Question | Blocking | Method |
|---|---|---|---|
| **Q1** | **How do we make a horde threatening to a player with Prototype-grade traversal?** | Everything | Grey-box prototype: one block, full movement kit, a horde. Test A/B/C from Conflict 1. |
| **Q2** | **What is our entity budget, and what architecture achieves it in 3D with verticality?** | Content scope, engine choice | Technical spike. Evaluate ECS/data-oriented approaches against a target count. |
| **Q3** | **How do we prevent the Megabonk enemy-stacking bug?** | Combat feel, boss design | Spike alongside Q2. Soft separation vs. flow fields vs. density caps. |
| **Q4** | **Manual movement + automatic combat — is that the right input split?** | Entire control scheme | Prototype. Proposed as a rule in Conflict 2; needs confirmation in hand. |
| **Q5** | **How much permanent meta-power, and is it refundable?** | Economy design | Design decision informed by Conflict 4; testable only with a full loop. |
| **Q6** | **Does the city stay mechanically interesting once traversal is maxed?** | Long-term retention | Crackdown's failure mode. Needs a mid-run traversal upgrade curve that keeps escalating. |
| **Q7** | **How many districts, and how much authored content per district, to avoid Megabonk's "only two maps" criticism?** | Production scope | Scoping exercise once the assembly approach is proven. |
| **Q8** | **Engine and tooling choice** | Everything | Should follow Q2's spike, not precede it. Do not repeat Crackdown's mid-production engine switch. |

---

## 7. Two Things Worth Remembering

**First: the genre's value is in systems design, not production budget.** Vampire Survivors was built in a browser framework by one unemployed person using default engine assets on a £1,100 budget. Megabonk was built by one person in Unity in thirteen months. Both sold over a million copies. Risk of Rain 2 was made by self-taught developers who had never built a 3D game, and sold four million. **Nothing in this project should be chosen for prestige.**

**Second: a game about movement cannot be sold in a still image.** David Jones worried Crackdown "does not look good in screenshots," and it tested poorly until Microsoft bundled the Halo 3 beta. Megabonk succeeded in large part because it was *clippable*. If our appeal is how traversal feels, our marketing burden is on motion from day one — and that is a design consideration, not just a marketing one.

---

## Source Documents

- [`prototype-2009.md`](prototype-2009.md) — urban power fantasy, traversal, chaos
- [`vampire-survivors.md`](vampire-survivors.md) — the genre's structure and math
- [`megabonk.md`](megabonk.md) — proof of concept and list of hazards
- [`crackdown-2007.md`](crackdown-2007.md) — verticality as core mechanic
- [`risk-of-rain-2.md`](risk-of-rain-2.md) — the 2D→3D translation and scaling model
