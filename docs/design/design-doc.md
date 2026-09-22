# Thriver — Living Design Document

> **Status:** Seeded. Pitch and research-derived pillars only.
> **Working title:** Thriver (placeholder — from the project directory name)
> **Last updated:** 2026-09-22
>
> ⚠️ **This document is deliberately mostly empty.** It contains the pitch, the pillars the research supports, and the questions the research raised. **It contains no design decisions that have not been made.** Sections marked `UNFILLED` are yours to write. Anything that looks like a decision but is not marked as one is a research finding, not a choice.

---

## 1. Pitch

> A 3D bullet heaven survivors-like that takes place in an urban environment with lots of verticality where you collect weapons, skills, and perk items to overcome large amounts of enemies.

---

## 2. The Fantasy

`UNFILLED` — *What is the player? Why are they in this city? What are they becoming over 25 minutes? The research says narrative load is near-zero in this genre (Prototype and Crackdown both succeeded with weak stories), but the* fantasy *still needs one sentence, because it determines art direction, enemy identity, and weapon feel.*

---

## 3. Design Pillars

Derived from convergence across all five reference games. See [`../research/00-synthesis.md`](../research/00-synthesis.md) §3 for the evidence.

These are proposed, not ratified. Strike any that do not match your intent.

1. **Movement is the product.** The game must be worth playing for traversal alone, before a single weapon is considered.
2. **Something good every few seconds.** Reward density is a mechanic, not polish.
3. **The complete arc, compressed and repeatable.** Weak → overwhelming, in one sitting, then reset.
4. **Scarcity creates build identity.** Constraints make builds; abundance makes one build.
5. **Losing must be productive.** Every run banks something. Non-negotiable.
6. **The world is ammunition.** The city is an active part of the build, not a backdrop.
7. **Escalate the spectacle continuously.** Minute 25 is the reward for minute 1.
8. **Time is the antagonist.** The clock, not the level, is what is coming for you.

---

## 4. The Central Design Problem

> **OPEN — Q1: How do we make a horde threatening to a player with Prototype-grade traversal?**
>
> Everything we want from Prototype and Crackdown (wall-running, gliding, superjumps, no fall damage) exists to **let the player escape**. Everything we want from Vampire Survivors depends on the player **being unable to escape**.
>
> A player who can wall-run up a skyscraper and glide away has trivially defeated a ground-bound horde. If our traversal is as good as Prototype's, our horde must answer it — or the horde stops mattering, and with it the genre we are building in.
>
> **Three candidate resolutions from the research (not mutually exclusive):**
>
> - **A — Rewards at height** *(Crackdown)*: XP, chests, and upgrades spawn on rooftops and ledges. Climbing is not escape; climbing is where the run is won.
> - **B — A defended positional objective** *(Risk of Rain 2's teleporter)*: a timed objective the player must hold ground to complete. Running away stops progress.
> - **C — The horde climbs**: flying, wall-crawling, leaping, and ranged enemies make altitude contested rather than safe.
>
> **This must be answered by a grey-box prototype before any content work begins.** Every other decision depends on it.

---

## 5. Core Loop

`UNFILLED`

Research inputs available when you fill this in:

- Vampire Survivors' 30-minute single-stage arc
- Megabonk's 3-floor accelerating structure (10/9/8 min) with portal transitions
- Risk of Rain 2's teleporter-gated stage progression
- Vampire Survivors' hard terminus (the Reaper) so runs end decisively

> **OPEN — Run length and segmentation?** Single continuous stage, or multiple accelerating districts with transitions? The research favours segmentation for a 3D game (players need to learn spaces, and shorter floors give three spaces instead of one exhausted one) but this is your call.

---

## 6. Movement and Traversal

`UNFILLED`

> **OPEN — Q4: What is the input split?**
>
> The research proposes a rule: ***manual movement, automatic combat*** — keep combat fully automatic as the genre does, and spend the entire input budget on movement. This extends Vampire Survivors' "one verb" philosophy into three dimensions rather than abandoning it, and it addresses the genre's endemic late-run passivity (see §12). Needs confirmation in hand.

> **OPEN — Q6: Does the city stay interesting once traversal is maxed?**
>
> Crackdown's failure mode: once Agility was maxed and every orb collected, the city's vertical challenge was gone. We need a traversal upgrade curve that keeps escalating *within* a 25-minute run, not one that saturates at minute 8.

---

## 7. Weapons, Skills, and Perk Items

`UNFILLED`

Research inputs:

- **Vampire Survivors' evolution system** — max weapon + paired passive + trigger → dramatically stronger form. Widely regarded as the best single system in the genre; turns stat items into goals and elite kills into anticipation.
- **Capped loadout slots** (VS: 6 weapons + 6 passives) to force commitment
- **Offer-steering from day one** — reroll, banish, lock. Megabonk's most-complained-about omission produced restart-scumming.
- **Uncapped rollover crit and overheal** (Megabonk) so stats never go dead
- **Hyperbolic stacking** `f(x) = 1 − 1/(1 + a·x)` (Risk of Rain 2) for percentages that must stack forever without reaching 100%
- **Multiplicative stack amplifiers** for the genre's characteristic exponential blowups
- **Earned screen-clearing ultimates** (Prototype's Critical Mass → Devastators) as a pressure release valve

> **OPEN — How many slots, and are they expandable?** Megabonk made slot expansion its primary meta-progression lever and was criticised for the meta being thin. Vampire Survivors kept them fixed.

> **OPEN — Do we have a dominant unbounded scaling vector?** Megabonk's #1 criticism: when one scaling vector is unbounded (gold→damage) and others are bounded, the unbounded one wins at every skill ceiling and build diversity collapses. Either bound them all, or make several unbounded in *different directions*.

---

## 8. Enemies and Difficulty

`UNFILLED`

Research inputs — the most transferable math in the set:

- **A continuous difficulty coefficient** driven by time, multiplied by district. RoR2's shape: `coeff = (playerFactor + minutes × timeFactor) × 1.15^stagesCompleted`
- **A credit-based spawn director**: one budget controlling both quantity *and* quality, with a "too cheap to spawn" threshold that automatically retires trash mobs as difficulty rises. **This is a performance control disguised as a design system** — it naturally caps entity counts by converting budget into stronger enemies rather than more of them.
- **Health scaling faster than damage** (RoR2: +30% / +20% per level) so the failure mode is being *overwhelmed*, not one-shot
- **A player-selected difficulty multiplier that pays out in progression** (Megabonk, up to ~600–700%)
- **Scheduled beats** — Megabonk's mini-bosses and swarms at fixed times per floor

> **OPEN — Where on the density spectrum do we sit?** Risk of Rain 2 runs dozens of enemies; Vampire Survivors runs hundreds. We are a bullet heaven, so our floor is high — but in 3D with verticality, every entity costs far more. This is a design question *and* a technical one (see Q2).

---

## 9. The City

`UNFILLED`

Research inputs:

- **Hand-authored blocks and buildings, procedurally assembled.** Both Risk of Rain 2 and Megabonk independently converged on this. Hopoo's stated reason: *"the level of difficulty needed to make interesting / memorable procedural maps in 3D was too much for our team size."* Cities are naturally modular, so this fits us better than it fit them.
- **Districts differentiated by verticality profile, not just art.** A low-rise industrial zone, a dense financial district, a construction site of exposed girders, and an elevated highway interchange are mechanically different spaces. No other survivors-like has this axis.
- **Architecture designed around jump arcs** (Crackdown), not around realism
- **Readable, simplified art direction** serving navigation, silhouette legibility, and collision cost. Prototype's drab monochrome Manhattan was a *mechanical* problem in a vertical city, not just an aesthetic one.
- **Audible pickup cues** (Crackdown's orb hum) — essential where line of sight constantly breaks
- **Environment as ammunition** — cars, debris, signage
- **Autonomous faction conflict** (Prototype's Blue/Red/Purple zones) as ambient chaos and a possible horde-thinning mechanic

> **OPEN — Q7: How many districts, and how much authored content each?** IGN's criticism of Megabonk was "only two maps." 3D spaces exhaust faster than 2D ones.

---

## 10. Meta-Progression

`UNFILLED`

> **OPEN — Q5: How much permanent power, and is it refundable?**
>
> The research gives three answers, all from successful games:
> - **Vampire Survivors** — deep permanent stacking power. Eventually **trivialises the game**.
> - **Risk of Rain 2** — **zero** permanent power; unlocks grant options only. Difficulty stays honest forever.
> - **Megabonk** — thin permanent power. Players **complained it felt unrewarding**.
>
> Too much trivialises, too little frustrates, none works *if* the unlock surface is large enough.
>
> **Synthesised proposal (not yet a decision):** unlocks grant *options* not power; limited permanent power that is **refundable** so players can opt back into difficulty; a **player-selected difficulty multiplier that pays out in progression**; and a large objective surface directing players at unexplored content.

Also available:
- **Gold from every run, win or lose** — table stakes
- **A designated unbalanced sandbox** (RoR2's Artifacts, VS's Arcana) so the core loop need not carry all the fun
- **An infinitely escalating gold sink** (Megabonk's chest prices) so currency never becomes worthless

---

## 11. Technical

`UNFILLED`

> **OPEN — Q2: What is our entity budget, and what architecture achieves it in 3D with verticality?**
>
> This is the project's dominant technical risk. Every reference point we have scales *against* us: we want 3D rather than sprites, real 3D pathfinding rather than "move toward player on a plane," physical urban geometry with collision, and comparable-or-higher entity counts than Vampire Survivors.
>
> Sobering data point: **Vampire Survivors — a 2D sprite game — hit a performance wall in Phaser and was ported to Unity specifically for performance.** This problem bites earlier than expected.
>
> The genre's known architectural answer is **ECS / data-oriented design**. Specific paths (Unity DOTS/Burst, Unreal Mass Entity, Godot + custom ECS, bespoke) have tradeoffs that belong in a spike.

> **OPEN — Q3: How do we prevent the Megabonk enemy-stacking bug?**
>
> Megabonk shipped with a known, complained-about failure: enemies pile on top of one another, and large bosses get displaced to the top of the pile, out of effective attack range. **We have more verticality than Megabonk, so we will hit this harder.**
>
> Candidate mitigations to evaluate: non-physical agents with soft separation steering; flow-field navigation with density pressure; density caps within a radius; vertical displacement clamping for horde agents; and RoR2's credit system as a design-level entity cap.

> **OPEN — Q8: Engine and tooling.**
>
> Should follow Q2's spike, not precede it. Crackdown switched to RenderWare 4 mid-production in 2005, "caused significant problems," and needed Microsoft to supply extra programmers. **Decide early, prototype the hard case first, then commit.**

**One piece of perspective the research strongly supports:** the genre's value is in systems design, not technology. Vampire Survivors was built in a browser framework by one unemployed person using default engine assets on £1,100. Megabonk was one person in Unity in thirteen months. Risk of Rain 2 was self-taught developers who had never made a 3D game. **Nothing here should be chosen for prestige.**

---

## 12. Known Genre Hazards

Every reference game in our set has these. They are structural properties of the escalating-power genre, not individual oversights. Listed here so they are designed against rather than inherited.

| Hazard | Where it appears | Our potential answer |
|---|---|---|
| **Late-run passivity** — the build plays itself | **All five games** | Verticality. If the city stays demanding regardless of damage output, the player never disengages. **Possibly our most important differentiator.** |
| **Post-mastery collapse** — challenge evaporates once everything is unlocked | Vampire Survivors, Crackdown | Player-selected difficulty multiplier; refundable permanent power; a large objective surface |
| **Build convergence at the ceiling** | Megabonk (its #1 criticism), Risk of Rain 2 | No single unbounded dominant scaling vector; conditional rather than build-agnostic power items |
| **RNG dependency → restart-scumming** | Megabonk | Offer-steering: reroll, banish, lock. From day one. |
| **Map exhaustion in 3D** | Megabonk ("only two maps") | Districts varied by verticality profile; modular urban assembly |
| **Camera/target legibility in dense 3D combat** | Prototype (already strained at *its* density) | Unsolved. Needs original work — we cannot inherit a solution. |
| **Dead stats poisoning the upgrade pool** | Megabonk (knockback and Luck both non-functional) | Ship no stat that does not work |
| **A movement game that does not sell in screenshots** | Crackdown (tested poorly; needed the Halo 3 beta) | Plan for motion-first marketing from day one. This is a design consideration, not just a marketing one. |

---

## 13. Open Questions Register

| # | Question | Blocks | Resolution method | Status |
|---|---|---|---|---|
| **Q1** | How do we make a horde threatening to a player with Prototype-grade traversal? | Everything | Grey-box prototype | 🔴 Open |
| **Q2** | Entity budget and horde architecture in 3D with verticality? | Content scope, engine | Technical spike | 🔴 Open |
| **Q3** | How do we prevent the enemy-stacking bug? | Combat feel, bosses | Spike alongside Q2 | 🔴 Open |
| **Q4** | Manual movement + automatic combat — right input split? | Control scheme | Prototype | 🔴 Open |
| **Q5** | How much permanent meta-power, and refundable? | Economy | Design + full-loop test | 🔴 Open |
| **Q6** | Does the city stay interesting once traversal is maxed? | Retention | Prototype | 🔴 Open |
| **Q7** | How many districts, how much content each? | Production scope | Scoping after Q2 | 🔴 Open |
| **Q8** | Engine and tooling choice | Everything | Follows Q2 | 🔴 Open |

---

## 14. Explicitly Not Decided

Recorded so that nothing in this document is mistaken for a commitment:

- Title, setting specifics, tone, art direction
- Player character identity and fantasy
- Run length and segmentation
- Weapon, skill, and perk taxonomy and counts
- Slot counts and expandability
- Enemy roster and faction structure
- Meta-progression currency and structure
- Platform targets, engine, scope, team, schedule
- Monetisation and price point
- Multiplayer or co-op (all five references differ; Risk of Rain 2's co-op is central to its appeal)

---

## Research

Full research documents live in [`../research/`](../research/). Start with [`00-synthesis.md`](../research/00-synthesis.md).

- [Prototype (2009)](../research/prototype-2009.md) — urban power fantasy, traversal, chaos generation
- [Vampire Survivors](../research/vampire-survivors.md) — the genre's structure and math
- [Megabonk](../research/megabonk.md) — proof of concept, and a list of what goes wrong
- [Crackdown (2007)](../research/crackdown-2007.md) — verticality as a core mechanic
- [Risk of Rain 2](../research/risk-of-rain-2.md) — the 2D→3D translation and scaling model
