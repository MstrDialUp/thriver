# Thriver — Living Design Document

> **Status:** Seeded, with first design decisions (2026-09-22, three rounds). Pitch, pillars, Rich's decisions on Conflicts 1–6 and Q9–Q13, and the boss/tier structure.
> **Working title:** Thriver (placeholder — from the project directory name)
> **Last updated:** 2026-09-22
>
> ⚠️ **This document is still mostly empty.** It contains the pitch, the pillars the research supports, the decisions made so far, and the open questions. Sections marked `UNFILLED` are yours to write.
>
> **How to read it:** a decision is marked **`✅ Decided`** with a date. A direction that has been chosen but still needs a prototype to set its proportions is marked **`🧭 Direction`**. **Anything not marked with either is a research finding, not a choice.** Every decision is also listed in §15.
>
> **Q1 still blocks everything.** Several decisions below (huge maps, heavy flying enemies, relocation) are inputs *to* the Q1 grey-box prototype, not answers to it.

---

## 1. Pitch

> A 3D bullet heaven survivors-like that takes place in an urban environment with lots of verticality where you collect weapons, skills, and perk items to overcome large amounts of enemies.

---

## 2. The Fantasy

`UNFILLED` — *What is the player? Why are they in this city? What are they becoming over one run? The research says narrative load is near-zero in this genre (Prototype and Crackdown both succeeded with weak stories), but the* fantasy *still needs one sentence, because it determines art direction, enemy identity, and weapon feel.*

*Constraint from decisions already made:* the enemy roster includes **flying superheroes** and is allowed to be **absurdist** (§8). Whatever the player is, it has to make sense for the city to throw superheroes, helicopters, and animals at them.

---

## 3. Design Pillars

Derived from convergence across all five reference games. See [`../research/00-synthesis.md`](../research/00-synthesis.md) §3 for the evidence.

These are proposed, not ratified. Strike any that do not match your intent.

1. **Movement is the product.** The game must be worth playing for traversal alone, before a single weapon is considered.
2. **Something good every few seconds.** Reward density is a mechanic, not polish.
3. **The complete arc, compressed and repeatable.** Weak → overwhelming, in one sitting, then reset.
4. **Scarcity creates build identity.** Constraints make builds; abundance makes one build.
5. **Losing must be productive.** Every run banks something. Non-negotiable. *(With no permanent power (§10), this is kept true by run currency that buys unlocks.)*
6. **The world is ammunition.** The city is an active part of the build, not a backdrop.
7. **Escalate the spectacle continuously.** The final minutes are the reward for minute 1.
8. **Time is the antagonist.** The clock, not the level, is what is coming for you. *(Made literal by the nuke, §5.)*

---

## 4. The Central Design Problem

> **OPEN — Q1: How do we make a horde threatening to a player with Prototype-grade traversal?**
>
> Everything we want from Prototype and Crackdown (wall-running, superjumps, no fall damage) exists to **let the player escape**. Everything we want from Vampire Survivors depends on the player **being unable to escape**.
>
> A player who can wall-run up a skyscraper and get away has trivially defeated a ground-bound horde. If our traversal is as good as Prototype's, our horde must answer it — or the horde stops mattering, and with it the genre we are building in. Megabonk has already shipped this problem: its "caveman" exploit let players hide in caves the horde couldn't reach.
>
> **Four candidate resolutions from the research (not mutually exclusive):**
>
> - **A — Rewards at height** *(Crackdown)*: XP, chests, and upgrades spawn on rooftops and ledges.
> - **B — Defended positional objectives** *(RoR2's teleporter; Megabonk's Charge Shrines)*: stand in a zone to make progress; leaving stops it.
> - **C — The horde climbs**: flying, wall-crawling, leaping, and ranged enemies make altitude contested.
> - **D — The horde follows** *(Vampire Survivors)*: enemies left behind are despawned and respawned near the player; bosses are teleported back.
>
> **This must be answered by a grey-box prototype before any content work begins.** Every other decision depends on it.

**🧭 Direction (Rich, 2026-09-22): use all four, and balance reward placement between height and ground.**

- **A pulls up, B pulls down.** Rewards at height draw the player onto rooftops. **Ground-level hold zones**, modelled on Megabonk's Charge Shrines (stand in the zone for a set time; leaving drains and resets the timer), draw the player back to street level where the horde is thickest.
- **Some reward types combine A and B**, paying out for holding a zone rather than for a pickup.
- **C: heavy and escalating.** Flying enemies are present **at every tier** and escalate in kind (birds and drones early; helicopters, fighter jets, superheroes later); non-mechanical enemies climb buildings; some rooftops have monster closets (§8).
- **D: relocation.** Enemies far behind the player teleport back (§8).

> **OPEN — the proportions.** How much reward sits high vs. low, how fast the flying share rises, and how aggressive relocation is. Answered by the Q1 prototype, which should have each of A/B/C/D as a toggle. One thing to check specifically: **climbing still has to buy a few seconds of breathing room**, or traversal loses the relief that makes it feel good.

---

## 5. Core Loop

`UNFILLED` — the loop itself (moment to moment, minute to minute) is not yet written. The run's *frame* is decided:

**✅ Decided (Rich, 2026-09-22) — run frame:**

- **One very large map per run.** No Megabonk-style switching between floors mid-run. The map is explored, as in Vampire Survivors' stages, which are huge compared to the character.
- **Run length: 30 minutes**, subject to tuning.
- **The final boss appears when the player meets certain criteria**, like a GTA wanted-level star system. The pressure is to hit the criteria **early enough to leave time to beat the boss** before the timer runs out.
- **The criteria are lower-boss kills (third round, 2026-09-22):**
  - **Five lower bosses spawn on a schedule, at 4:00, 8:00, 11:00, 15:00, and 20:00.**
  - **Each lower-boss kill raises the enemy tier by one.** The player starts at **tier 1**. Killing a boss is the **only** way to raise the tier.
  - **Tiers only go up one step at a time, whichever boss you kill.** Example: at 10:00 the player is on tier 1 with bosses 1 and 2 both alive. Killing boss 2 first still takes them to tier 2, not tier 3.
  - **Bosses never despawn until killed.** They can be run from and avoided, but new bosses keep arriving on schedule, so **neglected bosses pile up** and the player ends up facing several at once.
  - **The final boss appears only once all five lower bosses are dead (tier 6) *and* the clock has reached at least 22:00.** So the final-boss window is at most **8 minutes** (22:00–30:00). Clearing the lower bosses early doesn't bring the final boss forward. It buys time to prepare instead.
- **Win condition: kill the final boss before the timer runs out.**
- **Killing the final boss doesn't end the run.** The player can leave, or continue into nuke overtime. **During development, the choice is a continue-or-leave menu** (subject to change).
- **The timer goes negative in overtime.** How far past zero you got is the badge of pride, something to screenshot when you inevitably die.
- **Terminus: the nuke.** When the timer ends, a nuke goes off: **an absurd amount of initial damage, then constant damage that increases exponentially until the player dies.**
- **Overtime.** A strong build can survive the nuke for a while, extending the run (like surviving past VS's Reaper, or Megabonk's Final Swarm). **Every run is finite.** For a player who has already won, the nuke phase is overtime played for score. For one who hasn't, it's the end.
- **The late run is allowed to play itself.** Surviving and building well enough to earn a final few minutes where combat takes care of itself *is the reward*. The fun then comes from movement, since the player's kit is at its most upgraded (see §12, late-run passivity).

Research inputs still relevant:

- Vampire Survivors' 30-minute single-stage arc and its hard terminus (the Reaper)
- Megabonk's scheduled beats (mini-bosses at 7:00 and 2:00, swarms at 7:00 and 3:00 per floor)
- Megabonk's Final Swarm, a post-timer phase that paid out a currency multiplier

> **OPEN — Q9: Boss tuning (testing).** What each lower boss is, what it drops (Megabonk's mini-bosses drop chests), how big each tier jump is, whether bosses are teleported back when the player gets far away (VS does this for its bosses; §8 relocation), and whether the tier is shown on the HUD like GTA's stars. Rich: these depend on testing and tuning.

> **OPEN — Q9: Can a player be locked out of winning?** If bosses pile up faster than the player can handle, falling behind could snowball. That may be the intended pressure, but the prototype should check that a player who falls behind has a way back.

> **OPEN — Q9: Nuke and overtime tuning.** How steep the nuke's curve is, and whether overtime pays out beyond score (Megabonk's Final Swarm multiplied silver).

> **OPEN — Q9: What replaces floor transitions?** The research rated Megabonk's floor transitions as its best structural idea for 3D, because they give breathing room and new spaces to learn. A single map gives both up. **The lower-boss schedule and tier jumps now provide the main beats** (five spawns, five tier changes), so this is partly answered. Whether they also give breathing room and a sense of new space is for testing.

---

## 6. Movement and Traversal

**✅ Decided (Rich, 2026-09-22) — input split (Q4):** ***manual movement, automatic combat.*** Combat is fully automatic, and the entire input budget goes to movement. Any proposed input that isn't a movement input has to argue for itself. *(To be confirmed in hand by the prototype, but no longer an open question.)*

**✅ Decided (Rich, 2026-09-22) — base kit:**

| Ability | Notes |
|---|---|
| Move | |
| Dash | |
| Slide | |
| Jump | |
| Double jump | **Upgradeable** in-run to add more mid-air jumps |
| **Jump height** | **Upgradeable** in-run, so the ordinary jump grows into a superjump. *No separate superjump ability.* |
| **Glide** | In the base kit |
| Wall jump | |
| Wall run | |
| **Grapple / web swing** | **Not in the base kit.** Acquired during a run as a weapon/skill, or a character's **starting ability** |

**✅ Decided (Rich, 2026-09-22) — movement upgrades use a mixed slot model:**

- **Small upgrades** (extra air jumps, dash charges, and similar) are **perks in the normal upgrade pool**.
- **Big abilities** (the grapple / web swing) are **weapons or skills that do double duty**: they take a slot, and they also deal damage or otherwise carry combat weight, so choosing movement isn't simply giving up firepower.

**✅ Decided (Rich, 2026-09-22) — camera: third-person, free camera.**

Research inputs not yet decided: chained uninterrupted traversal; no fall damage; no stamina; deep, exploit-friendly movement (Megabonk adopted bunny-hopping); audible pickup cues.

> **OPEN — Q13: Auto-vault?** Glide is in and superjump is replaced by jump-height upgrades. Auto-vault is still undecided. What it did in Prototype and Crackdown: sprinting into a **low obstacle** (car hood, railing, planter, ledge below jump height) carries you over it **with no button press and no loss of speed**, so the player never **snags on street clutter**. That matters most at ground level, where the hold zones and the densest horde are. The downside is less control: it can fire when you didn't want it to. With double jump and slide it may be redundant. **Let the prototype decide:** if players keep catching on cars and railings, add it.

> **OPEN — Camera behaviour in tight spaces.** The free camera is decided. How it handles walls, interiors, and a player wall-running with a building behind them is not, and it overlaps with the camera/target-legibility hazard in §12.

> **OPEN — Q6: Does the city stay interesting once traversal is maxed?**
>
> Crackdown's failure mode: once Agility was maxed and every orb collected, the city's vertical challenge was gone. Upgradeable jumps and the grapple give us an upgrade curve, and the §5 decision relies on movement being at its best in the final minutes. Jump-height upgrades (the jump growing into a superjump) add another rising curve. Whether it keeps escalating to the end of a run instead of saturating at minute 8 is untested.

---

## 7. Weapons, Skills, and Perk Items

`UNFILLED`

Decided elsewhere and relevant here: movement abilities are part of this pool (§6's mixed slot model), and slots **cannot be expanded by meta-progression** (§10: no permanent power).

Research inputs:

- **Vampire Survivors' evolution system** — max weapon + paired passive + trigger → dramatically stronger form. Widely regarded as the best single system in the genre; turns stat items into goals and elite kills into anticipation.
- **Capped loadout slots** (VS: 6 weapons + 6 passives) to force commitment
- **Offer-steering from day one** — reroll, banish, lock. Megabonk's weak offer-steering at launch produced restart-scumming; it has since added banish.
- **Uncapped rollover crit and overheal** (Megabonk) so stats never go dead
- **Hyperbolic stacking** `f(x) = 1 − 1/(1 + a·x)` (Risk of Rain 2) for percentages that must stack forever without reaching 100%
- **Multiplicative stack amplifiers** for the genre's characteristic exponential blowups
- **Earned screen-clearing ultimates** (Prototype's Critical Mass → Devastators) as a pressure release valve

> **OPEN — How many slots, and can they grow during a run?** Meta-progression slot expansion is ruled out (it would be permanent power). In-run expansion (e.g. a rare item that adds a slot) is still possible and undecided.

> **OPEN — Do we have a dominant unbounded scaling vector?** Megabonk's #1 criticism: when one scaling vector is unbounded (gold→damage) and others are bounded, the unbounded one wins at every skill ceiling and build diversity collapses. Either bound them all, or make several unbounded in *different directions*.

---

## 8. Enemies and Difficulty

`UNFILLED` — the roster itself is not written. Direction and constraints so far:

**🧭 Direction (Rich, 2026-09-22) — roster:**

- **Flying enemies at every tier**, escalating in kind as tiers rise *(refined, third round)*:
  - **Lower tiers:** birds, drones.
  - **Higher tiers:** bigger birds, helicopters, fighter jets, superheroes, and so on.
  - Earlier note: a **growing share** of the horde as difficulty rises. *The third-round note sets the escalation of types; the share is a tuning question.*
- **Absurdism is allowed.** It's fine to get a bit absurd with what the enemies are. *(Research caution: Megabonk's memey tone drove virality but became a liability when criticism needed a serious answer. See [`megabonk.md`](../research/megabonk.md) §7.7. The roster being absurd doesn't decide the game's overall tone.)*
- **Non-mechanical enemies (people, animals, etc.) climb buildings** to reach the player.
- **Monster closets on rooftops**: some buildings have spawn points on top.
- **Relocation**: enemies that fall far enough behind the player **teleport back** toward the player, as in Vampire Survivors (where regular enemies despawn and the ring refills, and bosses teleport back to the screen edge).

**🧭 Direction (Rich, 2026-09-22) — crowd collision (see also Q3, §11):**

- **Low-level enemies can partly clip into each other** instead of stacking on top. What counts as "low-level" is a **sliding scale relative to the player's level**.
- **Crowds are pushed to spread out**, sideways and **up building walls**.
- **Bosses, elites, and high-level enemies have right of way.** They are never pushed out of range. This targets Megabonk's boss-on-top-of-the-pile bug directly.

**✅ Decided (Rich, 2026-09-22) — difficulty:**

- **The player-selected difficulty multiplier stays.** Players can raise enemy HP/damage/count in exchange for faster currency and unlock progress (Megabonk's model).
- **Cities have different difficulty; Paris is the hardest** (§9).

**✅ Decided (Rich, 2026-09-22, third round) — two difficulty scalers running at once:**

- **Tiered (big jumps).** The enemy tier, raised one step per lower-boss kill (§5). Each step is a large, noticeable increase.
- **Sliding (slow and steady).** A continuous increase underneath the tiers. **Driven by time** for now (RoR2's coefficient).

*Research observation:* this is almost exactly the shape of Risk of Rain 2's formula below, which pairs a continuous time term with a discrete `1.15^stagesCompleted` multiplier. **Our tier takes the place of RoR2's stage count**: killing a boss plays the role of completing a stage. Another parallel: in both, the step only happens when the player acts (starting the teleporter in RoR2, killing a boss here). Players who avoid bosses keep the tier low, but pay for it as bosses pile up.

Research inputs — the most transferable math in the set:

- **A continuous difficulty coefficient** driven by time. RoR2's shape: `coeff = (playerFactor + minutes × timeFactor) × 1.15^stagesCompleted`. In our structure, **the stage term becomes the tier term** (above).
- **A credit-based spawn director** *(endorsed by Rich as a priority)*: one budget controlling both quantity *and* quality, with a "too cheap to spawn" threshold that automatically retires trash mobs as difficulty rises. **This is a performance control disguised as a design system.** It fits the flying escalation well: flyers can simply become a larger share of what the budget buys.
- **Health scaling faster than damage** (RoR2: +30% / +20% per level) so the failure mode is being *overwhelmed*, not one-shot
- **Scheduled beats** — Megabonk's mini-bosses and swarms at fixed times

> **OPEN — Where on the density spectrum do we sit?** Risk of Rain 2 runs dozens of enemies; Vampire Survivors runs hundreds. We are a bullet heaven, so our floor is high — but in 3D with verticality, every entity costs far more. This is a design question *and* a technical one (see Q2).

> **OPEN — What does the multiplier pay out in, exactly?** Currency rate, unlock progress, challenge eligibility, or a mix. Megabonk's cautionary note: its currency multipliers helped produce a glut (§10, Q12).

---

## 9. The City

**✅ Decided (Rich, 2026-09-22):**

- **Three cities to start: Chicago, Tokyo, Paris**, using the **real names for now**. Can be changed later if needed (Q11 closed).
- **Paris is the hardest**, mainly because **its verticality is limited**, with harder enemies and other tuning on top. *(Worth noting: this treats less verticality as more difficulty, which fits Q1. Fewer escape routes means more encirclement. Paris is a useful early grey-box as the opposite case to Chicago.)*
- **Each run is one huge, explorable map** (§5), not multiple floors.
- **Massive but bounded.** During development the edge is **invisible walls**.
- **Authored core, generated outskirts.** Each city has a **hand-authored central district**, such as Chicago's Loop or Paris's 7th arrondissement. **Everything outside it is procedurally generated from city-themed set pieces**, so the whole map feels cohesive.

Research inputs:

- **Hand-authored pieces, procedurally assembled.** Both Risk of Rain 2 and Megabonk converged on this. Hopoo's stated reason: *"the level of difficulty needed to make interesting / memorable procedural maps in 3D was too much for our team size."* The authored-core plus set-piece model is squarely within that advice.
- **Districts within a city differentiated by verticality profile, not just art.** The Loop's towers vs. low-rise outskirts are mechanically different spaces.
- **Architecture designed around jump arcs** (Crackdown), not around realism
- **Readable, simplified art direction** serving navigation, silhouette legibility, and collision cost. Prototype's drab monochrome Manhattan was a *mechanical* problem in a vertical city, not just an aesthetic one.
- **Audible pickup cues** (Crackdown's orb hum) — essential where line of sight constantly breaks
- **Environment as ammunition** — cars, debris, signage
- **Autonomous faction conflict** (Prototype's Blue/Red/Purple zones) as ambient chaos and a possible horde-thinning mechanic
- **No unreachable pockets.** Megabonk had to patch a "caveman" exploit where players hid where the horde couldn't spawn or path. Generated set pieces have to be checked for these.

> **OPEN — Q10: A ludonarrative reason for the map boundary.** Invisible walls are a development placeholder. We need an in-world reason the player stays inside, ideally one that fits the fantasy (§2), which isn't written yet.

> **OPEN — Q10: How big is "massive"?** Not a number yet. Depends on the entity/memory budget (Q2), the engine (Q8), and target specs. Also undecided: whether the whole map is generated at run start or streamed in.

> **OPEN — Q7: How much content per city?** How large the authored core is, and how big the set-piece library needs to be for generated outskirts not to repeat noticeably. Scoping once the assembly approach is proven. *(The city count, 3, is decided.)*

---

## 10. Meta-Progression

**✅ Decided (Rich, 2026-09-22) — Q5 answered: no permanent power.**

- **Meta-progression unlocks options only: new weapons, items, characters, and skins.** Nothing permanently improves where a character starts. *(Risk of Rain 2's model.)*
- **Unlocks come from both currency and challenges.** Every run, won or lost, banks currency for an unlock shop, and some unlocks are **challenge-only**.
- **A large objective surface of challenges** for players to earn and hunt for is a goal.
- **The player-selected difficulty multiplier** (§8) is the mastery dial and pays out in faster progression.

**What the decision obliges us to do:**

- **The unlock surface has to be large.** That's RoR2's stated condition for zero permanent power to work.
- **Currency has to stay worth earning.** Megabonk's silver went from "too thin" to "way too much" within three months. Once a player has bought everything, currency needs somewhere to go that isn't power.

**⏸ Deferred (Rich, 2026-09-22) — Q12, what currency buys once the shop is exhausted.** For now currency **just accumulates**, and something to spend it on can come later. Known risk: Megabonk's silver glut shows what happens when this waits too long. Whatever the sink turns out to be, it must not be power. Candidates for when it's picked back up: cosmetics, challenge rerolls, sandbox modifiers.

Also available (research, undecided):
- **A designated unbalanced sandbox** (RoR2's Artifacts, VS's Arcana) so the core loop need not carry all the fun
- **An infinitely escalating in-run gold sink** (Megabonk's chest prices) so in-run currency never becomes worthless

---

## 11. Technical

`UNFILLED` — except for the prototype platform below.

**✅ Decided (Rich, 2026-09-22) — the Q1 grey box runs in the browser.** Three.js with plain JavaScript modules, no build step, served as static files ([`../../prototype/greybox/`](../../prototype/greybox/README.md)). Chosen because it's the most accessible option: it runs on Rich's Linux desktop with no install, it's easy to hand to other testers, and the grey-box city is just boxes, so no engine features are needed.

- **It is throwaway, and it is not the production engine.** It answers Q1 (and helps with Q6 and Q13). **It does not answer Q2 or Q8**: browser performance says nothing about a native engine's entity ceiling. That keeps us clear of Crackdown's hazard, because nothing built here carries into production.
- **What transfers:** tuning numbers (movement speeds, jump heights, reward placement, horde mix) and the answers to Q1. **What doesn't:** code and performance figures.

Several open questions here, and some in §5 and §9, **can't be answered until engine and technical choices are made.** Those follow the Q2 spike.

> **OPEN — Q2: What is our entity budget, and what architecture achieves it in 3D with verticality?**
>
> This is the project's dominant technical risk. Every reference point we have scales *against* us: we want 3D rather than sprites, real 3D pathfinding rather than "move toward player on a plane," physical urban geometry with collision, and comparable-or-higher entity counts than Vampire Survivors. **The 2026-09-22 decisions add to the load:** one huge map per run (partly procedurally generated), lots of flying enemies, and climbers on building walls.
>
> Sobering data points: **Vampire Survivors — a 2D sprite game — hit a performance wall in Phaser and was ported to Unity specifically for performance.** Megabonk, after launch, needed "a lot of improvements to FPS late-game" and capped item procs per tick to hold frame rate.
>
> The genre's known architectural answer is **ECS / data-oriented design**. Specific paths (Unity DOTS/Burst, Unreal Mass Entity, Godot + custom ECS, bespoke) have tradeoffs that belong in a spike.

> **OPEN — Q3: How do we prevent the Megabonk enemy-stacking bug?**
>
> Megabonk shipped with a known, complained-about failure: enemies pile on top of one another, and large bosses get displaced to the top of the pile, out of effective attack range. **We have more verticality than Megabonk, so we will hit this harder.**
>
> **🧭 Direction (Rich, 2026-09-22):** all candidate mitigations are endorsed for the spike, with **flow-field navigation** and **RoR2's credit director** as priorities, plus the tiered collision rule in §8 (fodder overlaps; bosses/elites have right of way). Candidate mitigations: non-physical agents with soft separation steering; flow-field navigation with density pressure; density caps within a radius; vertical displacement clamping for horde agents; and RoR2's credit system as a design-level entity cap.

> **OPEN — Q8: Engine and tooling.**
>
> Should follow Q2's spike, not precede it. Crackdown switched to RenderWare 4 mid-production in 2005, "caused significant problems," and needed Microsoft to supply extra programmers. **Decide early, prototype the hard case first, then commit.**

**One piece of perspective the research strongly supports:** the genre's value is in systems design, not technology. Vampire Survivors was built in a browser framework by one unemployed person using default engine assets on £1,100. Megabonk was one person in Unity in thirteen months. Risk of Rain 2 was self-taught developers who had never made a 3D game. **Nothing here should be chosen for prestige.**

---

## 12. Known Genre Hazards

Every reference game in our set has these. They are structural properties of the escalating-power genre, not individual oversights. Listed here so they are designed against rather than inherited.

| Hazard | Where it appears | Our potential answer |
|---|---|---|
| **Late-run passivity** — the build plays itself | **All five games** | **Reframed (Rich, 2026-09-22):** a late run that plays itself is the *earned reward*, as long as it arrives **at the end**, not at minute 12, and is **bounded** (the nuke). Movement carries the engagement, since the kit is most upgraded by then. Megabonk's auto-select upgrade setting is evidence players want this. **What's left of the hazard is timing:** the difficulty curve has to keep the threat real until near the end. |
| **Post-mastery collapse** — challenge evaporates once everything is unlocked | Vampire Survivors, Crackdown | No permanent power *(decided)*; player-selected difficulty multiplier *(decided)*; a large challenge surface *(goal)* |
| **Build convergence at the ceiling** | Megabonk (its #1 criticism), Risk of Rain 2 | No single unbounded dominant scaling vector; conditional rather than build-agnostic power items |
| **RNG dependency → restart-scumming** | Megabonk (launch) | Offer-steering: reroll, banish, lock. From day one. |
| **Map exhaustion in 3D** | Megabonk (two maps at launch, three by Dec 2025) | Three cities *(decided)*; authored cores with generated outskirts *(decided)*; districts varied by verticality profile |
| **Unreachable hiding spots** — geometry the horde can't reach | Megabonk ("caveman" exploit, patched Dec 2025) | Relocation *(direction)*; climbers and flyers *(direction)*; spawn and path coverage checks on every set piece |
| **Meta currency outrunning its sinks** | Megabonk (silver glut; developer cut income) | Q12. A non-power sink that survives the shop being bought out. |
| **Camera/target legibility in dense 3D combat** | Prototype (already strained at *its* density) | Unsolved. Needs original work — we cannot inherit a solution. Heavier with many flying enemies. |
| **Dead stats poisoning the upgrade pool** | Megabonk (knockback and Luck non-functional at launch; knockback later removed from offers) | Ship no stat that does not work |
| **A movement game that does not sell in screenshots** | Crackdown (tested poorly; needed the Halo 3 beta) | Plan for motion-first marketing from day one. This is a design consideration, not just a marketing one. |

---

## 13. Open Questions Register

Kept in sync with [`00-synthesis.md`](../research/00-synthesis.md) §6.

**Status key:** 🔴 Open · 🟡 Direction set / partly decided · 🟢 Decided · ⏸ Deferred

| # | Question | Blocks | Resolution method | Status |
|---|---|---|---|---|
| **Q1** | How do we make a horde threatening to a player with Prototype-grade traversal? (Incl. height-vs-ground reward balance.) | Everything | Browser grey box with A/B/C/D toggles ([`prototype/greybox`](../../prototype/greybox/README.md)) | 🟡 Direction set; grey box built, not yet playtested |
| **Q2** | Entity budget and horde architecture in 3D with verticality? | Content scope, engine, map size | Technical spike | 🔴 Open |
| **Q3** | How do we prevent the enemy-stacking bug? | Combat feel, bosses | Spike alongside Q2 | 🟡 Direction set |
| **Q4** | Manual movement + automatic combat — right input split? | Control scheme | Decided; feel validated in prototype | 🟢 Decided |
| **Q5** | How much permanent meta-power? | Economy | — | 🟢 Decided: none |
| **Q6** | Does the city stay interesting once traversal is maxed? | Retention | Prototype | 🔴 Open |
| **Q7** | How much content per city (authored core, set-piece library)? | Production scope | Scoping after assembly is proven | 🟡 Partly decided (3 cities) |
| **Q8** | Engine and tooling choice | Everything | Follows Q2 | 🔴 Open |
| **Q9** | Run length, final-boss timing, nuke tuning; what replaces floor transitions? | Core loop | Design, then testing | 🟡 Mostly decided: 30 min, five scheduled lower bosses raise the tier, dev menu for exit. Open (testing/tuning): boss drops, tier size, nuke curve, snowball risk |
| **Q10** | Map size; bounded, looping, or streamed? | Map generation, tech | Follows Q2 | 🟡 Bounded and massive (decided). Open: exact size, in-world reason for the boundary |
| **Q11** | Real city names or parodies? | Branding, art | — | 🟢 Real names for now |
| **Q12** | What does meta currency buy once the shop is exhausted? | Economy, retention | Design (must not be power) | ⏸ Deferred; accumulates for now |
| **Q13** | Glide, superjump, auto-vault — in or out? | Movement | Prototype | 🟡 Glide in; jump-height upgrades replace superjump. Open: auto-vault |

---

## 14. Explicitly Not Decided

Recorded so that nothing in this document is mistaken for a commitment:

- Title, overall tone, art direction *(an absurdist enemy roster is allowed; the game's overall tone is not set)*
- Player character identity and fantasy
- Lower-boss identities and drops, tier-jump size, nuke curve, final exit method beyond the dev menu (Q9)
- Map size, and the in-world reason for the boundary (Q10)
- Weapon, skill, and perk taxonomy and counts
- Slot counts, and whether slots can grow during a run
- Auto-vault (Q13); camera behaviour in tight spaces (§6)
- The specific enemy roster and faction structure *(direction only: flyers at every tier, climbers, absurdism)*
- The proportions of the Q1 resolution mix
- Meta currency name and prices; end-game sink deferred (Q12)
- Platform targets, engine, scope, team, schedule
- Monetisation and price point
- Multiplayer or co-op (all five references differ; Risk of Rain 2's co-op is central to its appeal)

---

## 15. Decision Log

Every decision in this document, in order. If it isn't here, it isn't a decision.

| Date | Decision | Section | Type |
|---|---|---|---|
| 2026-09-22 | Manual movement, automatic combat | §6 | ✅ Decided |
| 2026-09-22 | Base kit: move, dash, slide, jump, double jump (upgradeable), wall jump, wall run | §6 | ✅ Decided |
| 2026-09-22 | Grapple / web swing: acquirable weapon/skill, or a character's starting ability | §6 | ✅ Decided |
| 2026-09-22 | Mixed slot model: small movement upgrades are perks; big abilities are dual-purpose weapons/skills | §6 | ✅ Decided |
| 2026-09-22 | One huge map per run; no multi-floor structure | §5, §9 | ✅ Decided |
| 2026-09-22 | Win = kill the final boss before the timer ends | §5 | ✅ Decided |
| 2026-09-22 | Terminus = nuke (huge initial damage, then exponentially rising damage); strong builds extend the run | §5 | ✅ Decided |
| 2026-09-22 | Late run playing itself is the earned reward, carried by movement | §5, §12 | ✅ Decided |
| 2026-09-22 | Three cities: Chicago, Tokyo, Paris; Paris hardest | §9 | ✅ Decided |
| 2026-09-22 | Authored central district + procedurally generated outskirts from city-themed set pieces | §9 | ✅ Decided |
| 2026-09-22 | No permanent meta-power; unlocks are weapons, items, characters, skins | §10 | ✅ Decided |
| 2026-09-22 | Unlocks via both currency (every run) and challenges | §10 | ✅ Decided |
| 2026-09-22 | Keep the player-selected difficulty multiplier | §8, §10 | ✅ Decided |
| 2026-09-22 | Run length 30 minutes (subject to tuning) | §5 | ✅ Decided |
| 2026-09-22 | Final boss spawns when wanted-level-style criteria are met | §5 | ✅ Decided |
| 2026-09-22 | Five lower bosses at 4, 8, 11, 15, 20 min; each kill raises enemy tier by exactly one (sequential, whatever the kill order) | §5 | ✅ Decided |
| 2026-09-22 | Bosses never despawn until killed; avoidable, but neglected bosses pile up | §5 | ✅ Decided |
| 2026-09-22 | Two scalers at once: tiered (big jumps, boss kills) and sliding (slow, steady, time-driven) | §8 | ✅ Decided |
| 2026-09-22 | Final boss appears only when all five lower bosses are dead and the clock is at 22:00 or later | §5 | ✅ Decided |
| 2026-09-22 | Post-final-boss choice is a menu during development (subject to change) | §5 | ✅ Decided |
| 2026-09-22 | Boss kill doesn't end the run: exit (portal or menu) or nuke overtime with a negative timer | §5 | ✅ Decided |
| 2026-09-22 | Glide in the base kit | §6 | ✅ Decided |
| 2026-09-22 | No superjump ability; jump height upgradeable instead | §6 | ✅ Decided |
| 2026-09-22 | Third-person free camera | §6 | ✅ Decided |
| 2026-09-22 | Maps massive but bounded; invisible walls during development | §9 | ✅ Decided |
| 2026-09-22 | Real city names for now | §9 | ✅ Decided |
| 2026-09-22 | Meta currency sink deferred; currency accumulates for now | §10 | ⏸ Deferred |
| 2026-09-22 | Q1 grey box runs in the browser (Three.js); throwaway, does not answer Q2/Q8 | §11 | ✅ Decided |
| 2026-09-22 | Q1 resolution uses A+B+C+D; height rewards balanced by ground-level hold zones | §4 | 🧭 Direction |
| 2026-09-22 | Flying enemies grow as a share of the horde with difficulty; absurdist roster allowed | §8 | 🧭 Direction |
| 2026-09-22 | Flyers at every tier: birds/drones low; bigger birds, helicopters, fighter jets, superheroes high | §8 | 🧭 Direction |
| 2026-09-22 | Non-mechanical enemies climb; rooftop monster closets; VS-style relocation | §8 | 🧭 Direction |
| 2026-09-22 | Tiered collision: fodder may overlap (threshold relative to player level); bosses/elites have right of way | §8, §11 | 🧭 Direction |
| 2026-09-22 | Flow fields and RoR2 credit director as priority mitigations | §8, §11 | 🧭 Direction |

---

## Research

Full research documents live in [`../research/`](../research/). Start with [`00-synthesis.md`](../research/00-synthesis.md).

- [Prototype (2009)](../research/prototype-2009.md) — urban power fantasy, traversal, chaos generation
- [Vampire Survivors](../research/vampire-survivors.md) — the genre's structure and math
- [Megabonk](../research/megabonk.md) — proof of concept, and a list of what goes wrong *(refreshed 2026-09-22 against post-launch updates)*
- [Crackdown (2007)](../research/crackdown-2007.md) — verticality as a core mechanic
- [Risk of Rain 2](../research/risk-of-rain-2.md) — the 2D→3D translation and scaling model
