# Synthesis — What We Take From Each

> **Read this one first.** The five game documents are the evidence. This is the argument.
>
> **Status:** Living document. Updated as research and prototyping change our conclusions.
> **Last updated:** 2026-09-22 (revised: Megabonk research refreshed; Rich's design direction folded into §4–§6)

---

## 1. The Reference Set

| Game | What it contributes | What it cannot give us |
|---|---|---|
| **Prototype (2009)** | Urban power fantasy, chained traversal, city-as-ammunition, chaos generation, earned ultimates | Run structure, progression math, camera solutions, horde tech |
| **Vampire Survivors (2021)** | The 30-minute arc, reward cadence, evolution system, slot scarcity, meta-progression | Anything 3D, anything spatial, anything about verticality |
| **Megabonk (2025)** | Proof the 3D pitch works; 3D movement kit; Charge Shrines (hold-zone objectives); uncapped scaling; a published list of what goes wrong | Deep meta-progression, build diversity at the ceiling, crowd collision |
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

Vampire Survivors: gold, always. Risk of Rain 2: unlocks and logbook. Megabonk: silver — thin enough that players complained at launch, then so plentiful the developer had to cut it (a currency that outran its sinks). Crackdown: orbs persist.

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

> **How to read this section (revised 2026-09-22).** Each conflict states the research argument first. Where Rich has since set a direction or made a decision, it appears in a clearly labelled **Design direction** or **Decided** block, dated. Anything not labelled that way is still a research proposal. The design doc ([`../design/design-doc.md`](../design/design-doc.md)) is the authoritative record of decisions.

---

### ⚠️ CONFLICT 1 — Traversal is escape; bullet heaven requires encirclement

**This is our central design problem.**

Everything we want from Prototype and Crackdown — wall-running, gliding, superjumps, no fall damage, rooftop routes — exists to **let the player leave a dangerous situation**. Everything we want from Vampire Survivors depends on the player **being unable to leave**. Vampire Survivors works precisely because a flat plane, a capped move speed, and enemies spawning from all sides make pressure inescapable.

A player who can wall-run up a skyscraper and glide away has trivially defeated a ground-bound horde. If our traversal is as good as Prototype's, our horde must be able to answer it — or our horde stops mattering, and with it the entire genre we are building in.

**Megabonk has already shipped this problem.** Its Spooky Update patched a "caveman" exploit where players hid in caves that enemies could neither spawn near nor reach (see [`megabonk.md`](megabonk.md) §7.9). In a vertical city, every rooftop, alcove, and interior is a potential cave.

**Four candidate resolutions, drawn from the research:**

| # | Approach | Source | How it works | Risk |
|---|---|---|---|---|
| **A** | **Put the rewards at height** | Crackdown | XP, chests, and upgrades spawn on rooftops and ledges. Climbing is not escape — climbing is where the run is won. The player *chooses* danger because that is where progress lives. | Requires careful placement authoring; may make ground level feel dead |
| **B** | **A defended positional objective** | Risk of Rain 2 (teleporter); **Megabonk (Charge Shrines)** | The player must stay in a zone to make progress. Leaving stops progress. RoR2's version is one big objective per stage. **Megabonk's Charge Shrine is the small, scattered version**: stand in the bubble for a few seconds, and leaving resets the charge. It manufactures the surrounded state without removing movement. | Can feel like an artificial leash; interrupts flow |
| **C** | **The horde climbs** | Megabonk (flying mobs, flying Final Swarm) | Flying enemies, wall-crawlers, leapers, ranged units that punish altitude. Verticality becomes contested rather than safe. | Hardest technically (3D pathing, the Megabonk stacking bug); risks removing the *relief* that makes traversal feel good |
| **D** | **The horde follows** | Vampire Survivors (despawn/respawn ring; bosses teleported back) | Enemies left far behind are despawned and respawned near the player, and important ones (bosses, elites) are teleported back into range. Distance sheds *enemies* but never sheds *pressure*. | Can feel like cheating if visible; needs believable arrival points in 3D (see below) |

D was missing from the first version of this doc. It is arguably **the main reason VS's pressure is inescapable** (see [`vampire-survivors.md`](vampire-survivors.md) §2.2), and it matters even more now that we plan **very large maps** (Conflict 6), because a large map gives the player more room to run.

> **Design direction (Rich, 2026-09-22) — the answer is a mix of all four, and reward placement has to be balanced between height and ground:**
>
> - **A and B pull in opposite directions, on purpose.** Rewards at height (A) pull the player up. **Ground-level Charge-Shrine-style reward zones** (B, modelled on Megabonk's shrines: stand in the zone for a set time, and leaving drains and resets the timer) pull the player **back down** to where the horde is thickest. Some reward types should combine A and B, rewarding a hold instead of a pickup.
> - **C is heavy, and it escalates.** **Many more flying enemies**, **present at every tier**: birds and drones at low tiers; bigger birds, helicopters, fighter jets, and superheroes at high tiers *(refined in the third round)*. **An absurdist roster is fine.** **Non-mechanical enemies (people, animals) climb buildings** to get at the player.
> - **Monster closets on rooftops.** Some buildings have spawn points on top, so altitude is not automatically clear of enemies.
> - **D: enemies teleport back** when the player gets far enough away (VS-style), so distance is never a permanent escape.
>
> **What this does not settle:** the *proportions*. How much reward sits high vs. low, how fast the flying share ramps, and how often the relocation fires are still **Q1, to be answered by the grey-box prototype**. This direction tells the prototype what to test, not what the answer is.

**Tension to watch.** C and D together could remove the *relief* that makes traversal feel good. If altitude is never safe, the wall-run is just another way of being surrounded. The prototype needs to check that **climbing still buys a few seconds of breathing room**, even if never a permanent escape.

> **This is the first thing to prototype.** Not the weapons, not the upgrade tree, not the art. Build a grey-box city block, a player with the movement kit, and a horde with A/B/C/D toggles, and find out what happens. Every other decision in the project depends on the answer.

---

### ⚠️ CONFLICT 2 — Minimal input vs. a movement-driven game

Vampire Survivors' genius is that the player only moves, which makes arbitrary screen density readable and the game playable with half your attention. Our pitch requires jump, traversal, camera control, and probably more — and 3D verticality raises cognitive load substantially on its own.

**The tension:** every input we add raises the skill ceiling (good, addresses the genre's late-run passivity problem) and raises the barrier to entry (bad, loses the genre's signature accessibility).

**The resolution the research proposed:** keep **combat** fully automatic — weapons fire on cooldown with no aim, exactly as the genre does — and spend *all* of our input budget on **movement**. The player's skill expression is entirely "where am I and how did I get there," which is precisely Vampire Survivors' philosophy extended into three dimensions rather than abandoned.

> **Stated as a rule:** *Manual movement, automatic combat.* Any proposed input that is not a movement input should have to argue for itself.

> **Decided (Rich, 2026-09-22):** *Manual movement, automatic combat* is adopted. The base movement kit is:
>
> **move · dash · slide · jump · double jump · wall jump · wall run**
>
> - **Double jump is upgradeable** in-run to add more mid-air jumps.
> - **Glide is in the kit** *(decided 2026-09-22, second round)*.
> - **No separate superjump.** Instead, **jump height is upgradeable**, so the ordinary jump grows into a superjump over the course of a run. This also gives Q6 a traversal upgrade curve that keeps rising.
> - **Camera: third-person, free camera.**
> - **Grapple / web swing** is an acquirable ability, picked up during a run as a weapon/skill, and some characters may **start with it**.
> - **Slot model: mixed.** Small movement upgrades (extra jumps, dash charges, and so on) are **perks in the normal upgrade pool**. Big movement abilities like the grapple are **weapons/skills that do double duty**: they take a slot, but they also deal damage or otherwise pull combat weight, so taking one isn't a pure firepower loss.
>
> Still to confirm in hand (the grey-box prototype): that the kit feels right, and that it stays readable at horde density.

**Auto-vault on sprint is the one kit item still undecided** (Q13). Rich questioned what it adds on top of running, wall-running, and wall-jumping. What it did in the references: in Prototype and Crackdown, sprinting into a **low obstacle** (a car hood, a railing, a planter, a ledge below jump height) carries you over it **without a button press and without losing speed**. It exists to stop the player **snagging on street clutter**, which matters most at ground level, in exactly the places where Conflict 1's hold zones and the horde are densest. The trade-off is less control: an automatic vault can fire when you didn't want it to. With double jump and slide available it may be redundant. **The prototype should answer it**: if players keep snagging on cars and railings, add it. If they don't, skip it.

This also neatly addresses the genre's endemic late-run passivity (Conflict 5): even when your damage is absurd, navigating a vertical city under pressure still demands attention.

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

> **Design direction (Rich, 2026-09-22):** all five mitigations are endorsed, with **flow-field navigation** and **the RoR2 credit director** called out as priorities. On top of them, a **tiered collision rule**:
>
> - **Low-level enemies can partly clip into each other** instead of stacking on top of each other. VS enemies overlap freely in 2D, and players accept it. What counts as "low-level" is a **sliding scale relative to the player's level**, so yesterday's threats become fodder that overlaps.
> - **Crowds are pushed to spread out**, sideways and **up building walls** (climbers use walls as overflow space instead of piling up in the street).
> - **Bosses, elites, and high-level enemies have right of way.** Lower tiers make way for them, and they are never displaced. This directly targets Megabonk's "boss shoved to the top of the pile" failure.
>
> Whether this is achievable at our target entity count is Q2/Q3, to be settled by the technical spike.

---

### ⚠️ CONFLICT 4 — Meta-progression depth: how much permanent power?

The research gives us opposite answers from successful games:

- **Vampire Survivors:** deep permanent stacking power (PowerUps, Golden Eggs) — and it eventually **trivialises the game**, producing the post-completion collapse.
- **Risk of Rain 2:** **zero** permanent power; unlocks grant options only — and the difficulty curve stays honest forever.
- **Megabonk:** thin permanent power (+2 weapon and +2 tome slots, quest-gated and bought with silver, and cheap enough that they're easy to forget ever getting). Players **complained it felt unrewarding** at launch. Then, within three months, they had **more silver than they could spend**, and the developer had to cut income.

So: too much trivialises, too little frustrates, none-at-all works *if* the unlock surface is large enough. And Megabonk adds a fourth lesson: **a meta currency that outruns its sinks is its own failure.**

**The synthesised answer (first version):**

1. **Unlocks grant options, not power** (RoR2's discipline)
2. ~~**Some permanent power exists**, but it is **refundable**~~ — *superseded; see below*
3. **A player-selected difficulty multiplier that pays out in progression** (Megabonk's best idea) lets mastered players raise their own ceiling *and* be rewarded for it
4. **A large objective surface** (Megabonk's 200+ quests, Crackdown's 800 orbs) keeps directing players at unexplored content

> **Decided (Rich, 2026-09-22): no permanent power.** The RoR2 model.
>
> - **Meta-progression unlocks options only:** new **weapons, items, characters, and skins**. Nothing improves a character's starting point.
> - **Unlocks come from both currency and challenges.** Every run, won or lost, banks currency for an unlock shop, and some unlocks come **only** from challenges. The currency is what keeps Pillar 5 ("every run banks something") true for failed runs.
> - **The player-selected difficulty multiplier stays.** It is not permanent power, it is a dial, and it pays out in faster currency and unlocks.
> - **A large challenge surface** for players to earn and hunt for is a stated goal.
>
> **What this implies:** RoR2's condition for zero permanent power to work is that **the unlock surface is large enough**. That is now a content obligation, not a nice-to-have. And Megabonk's silver glut is a warning about the currency: once the shop is bought out, currency is worthless unless there is a sink that isn't power. See Q12.

Without permanent power, the difficulty multiplier and the challenge surface are now carrying the answer to post-mastery collapse on their own.

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

> **Design direction (Rich, 2026-09-22): the late run playing itself is the reward, not the defect.** The challenge is surviving long enough and building well enough to *earn* a final few minutes that essentially play themselves. The fun in those minutes comes from **movement**: by then the player has the most movement abilities unlocked and upgraded, so the city is at its most fun to move through exactly when combat stops asking anything.

This reframes the hazard instead of dismissing it. Passivity is a failure when it arrives **too early** (the run is decided at minute 8 and the other 20 are a formality) or **lasts too long** (an endless victory lap). It is a payoff when it arrives **at the end, is earned, and is bounded**. Two supports for that:

- **Bounded:** the nuke terminus (Conflict 6) ends the victory lap. A great build extends it, but not forever.
- **Evidence it works:** Megabonk added settings to **auto-select level-up upgrades** late in a run (v1.0.49). The developer's response to the late game playing itself was to automate the remaining decisions so players can just move. See [`megabonk.md`](megabonk.md) §7.10.

**The timing is now the design problem.** The difficulty curve has to keep the threat real until close to the end, so the "plays itself" state arrives at minute 25, not at minute 12. That comes down to difficulty tuning and the credit director, not to a separate system.

---

### ⚠️ CONFLICT 6 — Map variety in 3D

IGN's criticism of Megabonk at launch was **only two maps** (a third, Graveyard, arrived about three months later). Risk of Rain 2 abandoned full procedural generation because *"the level of difficulty needed to make interesting / memorable procedural maps in 3D was too much for our team size."*

3D spaces are learned and exhausted far faster than 2D ones, and hand-authoring them is expensive.

**The urban setting is a genuine advantage here.** Cities are naturally modular: blocks, districts, streets, rooftops. **Hand-authored building and block prefabs, procedurally assembled, with randomised pickup and enemy placement** is the approach both Risk of Rain 2 and Megabonk converged on independently, and it fits an urban environment better than it fits a forest.

Additionally, **verticality profile is itself a variation axis** that no other survivors-like has: a low-rise industrial district, a dense financial district of towers, a construction site of exposed girders, and an elevated highway interchange are mechanically different spaces even with shared art.

> **Decided (Rich, 2026-09-22): three cities, one huge map per run.**
>
> - **Three cities to start: Chicago, Tokyo, Paris**, **using the real names for now** (can be revisited later if needed).
> - **Paris is the hardest**, mainly because its **verticality is limited** (low, uniform Haussmann skyline), plus harder enemies and other tuning. *(Note: this is the first design decision that treats **less** verticality as **more** difficulty, which fits Conflict 1: fewer places to escape to means more encirclement. Paris is worth grey-boxing early as the opposite case to Chicago.)*
> - **No multi-floor structure.** Instead of switching between three levels per run as Megabonk does, **each run is one very large map to explore**, closer to Vampire Survivors' stages, which are huge compared to the character.
> - **Massive but bounded.** The map has edges. During development they're **invisible walls**, until we find a **ludonarrative reason** for the player to stay inside the bounds. Exact size depends on engine and target specs.
> - **Authored core, generated outskirts.** Each city has a **hand-authored central district** (e.g. Chicago's Loop, Paris's 7th arrondissement), and **everything outside it is procedurally generated from city-themed set pieces**, so the whole map feels cohesive.
>
> **Run terminus — the nuke.** When the time limit runs out, a nuke goes off: **an absurd amount of initial damage, then constant damage that increases exponentially until the player dies.** A strong build can survive longer and extend the run, like VS's post-Reaper survival or Megabonk's Final Swarm, but **every run is finite**.
>
> **Win condition:** a **final boss must be killed before the timer runs out** to win the run. The nuke is the punishment for not doing it, and **overtime** for players who did.
>
> *Second round (2026-09-22):*
> - **Run length: 30 minutes**, subject to tuning.
> - **The final boss appears when the player meets certain criteria**, like a GTA wanted-level star system. The pressure is to hit the criteria **early enough to leave time to beat the boss** before the timer runs out.
>
> *Third round (2026-09-22) — the criteria:*
> - **Five lower bosses spawn at 4:00, 8:00, 11:00, 15:00, and 20:00.** Each kill raises the **enemy tier** by one (starting at tier 1). Killing bosses is the only way to raise it.
> - **Tiers go up one at a time, whatever the kill order.** Killing boss 2 while boss 1 is still alive still moves the player up just one tier.
> - **Bosses never despawn until killed.** They can be avoided, but new ones keep arriving on schedule, so neglected bosses pile up.
> - **Two scalers run together:** the **tier** (big jumps, from boss kills) and a **sliding** increase (slow and steady, **driven by time**).
> - **The final boss appears only once all five lower bosses are dead and the clock is at 22:00 or later**, giving a final-boss window of at most 8 minutes.
> - **Killing the boss doesn't end the run.** It offers an exit: a **continue-or-leave menu during development**, subject to change (a portal is the alternative). Players who continue go into **nuke overtime**, and the **timer counts into negative numbers**, a badge of pride to screenshot when they inevitably die.

**What the research says about these choices:**

- **The tier system is RoR2's formula, rearranged.** RoR2 multiplies a continuous time-driven coefficient by `1.15^stagesCompleted`: one slow scaler and one stepped scaler, with the step happening when the player chooses to advance. Tiered-plus-sliding is the same structure, with **boss kills in place of stage completions**. That means RoR2's tuning is a usable starting point ([`risk-of-rain-2.md`](risk-of-rain-2.md)).
- **It also fits the flyer escalation.** In GTA, each star escalates the response and the top stars bring helicopters. Tiers are a natural place to introduce new flyer types (drones → helicopters → jets). *Observation, not a decision.*
- **It also answers part of the floor-transition problem** (below). Five scheduled boss spawns and five tier jumps are strong pacing beats.
- **Snowball risk.** Because neglected bosses pile up, a player who falls behind may be unable to recover. That may be the intended pressure, but the prototype should check it.
- **The negative timer is a clip generator.** Megabonk's success was partly how clippable it was ([`megabonk.md`](megabonk.md) §5). A death screenshot showing "−04:37" is a ready-made brag, and it speaks to §7 of this doc: a movement game has a harder time selling itself in stills, so a built-in brag moment helps.
- **Losing Megabonk's floor transitions has a cost.** The first synthesis rated "three accelerating floors with portal transitions" as the best structural idea to steal, because a 3D player needs to learn each space and the transitions give breathing room. A single huge map gives up both the breaks and the "new space" moments. **Pacing beats inside a single map** (scheduled events, district-to-district progression, boss arrivals) have to replace them. See Q9.
- **Huge maps make Conflict 1 harder.** More room means more places to escape to and more potential "caves." Candidate D (relocation) is what makes a huge map compatible with encirclement. Bounding the map limits how far a player can run, but doesn't remove the problem.
- **Huge maps raise the stakes on Q2.** A large 3D city with verticality, plus a dense horde, plus streaming or procedural generation at run start, all compete for the same frame and memory budget. Map size can't be fixed before the entity-budget spike.
- **Generated outskirts are a checked risk, not an unchecked one.** RoR2's warning was about *fully* procedural 3D maps. Assembly from authored set pieces around an authored core is the model RoR2 and Megabonk both converged on.
- **Verticality variation still applies inside each city:** the Loop's towers vs. lower-rise outskirts, and so on.

---

## 5. The Synthesised Design — What This All Points To

Combining every "carry forward" across the five documents, revised 2026-09-22 with Rich's decisions. **Items tagged *(decided)* are decisions. Everything else is still a research proposal.**

### Run structure
- **One very large map per run** — authored city core plus generated outskirts *(decided)*
- **A timed run ending in the nuke**: huge initial damage, then exponentially increasing damage until death; strong builds extend the run *(decided)*
- **30-minute timer**, subject to tuning *(decided)*
- **Five lower bosses at 4, 8, 11, 15, 20 minutes**; each kill raises the enemy tier by one, in sequence; bosses never despawn, so neglected ones pile up *(decided)*
- **Final boss spawns once all five lower bosses are dead and it's at least 22:00**, so the window is at most 8 minutes *(decided)*
- **Win = kill the final boss before the timer ends.** Killing it doesn't end the run: it offers an exit (portal or menu, undecided) or **nuke overtime with a negative timer** *(decided)*
- **Scheduled beats across the run**: mini-bosses and swarm events at fixed times, now also filling the breathing-room and new-space role that floor transitions played in Megabonk
- ~~**3 districts/floors with accelerating durations; portal transitions**~~ — *superseded by the single-map decision*

### Difficulty
- **Two scalers at once: tiered (big jumps, per boss kill) and sliding (slow, steady, time-driven)** *(decided)*. RoR2's formula has the same shape, with the tier in place of the stage count.
- **Per-city difficulty** (Paris hardest) *(decided)*
- **A credit-based spawn director** — one budget controlling both quantity and quality, with a "too cheap to spawn" threshold that retires trash mobs automatically **and caps entity counts for free** *(endorsed as a priority)*
- **Enemy health scaling faster than damage** (~30%/20%) so the failure mode is being overwhelmed, not one-shot
- **A player-selected difficulty multiplier** that pays out in progression *(decided: kept)*

### Enemies
- **Flying enemies at every tier**: birds and drones low; bigger birds, helicopters, fighter jets, superheroes high; a growing share as difficulty rises *(direction)*
- **Absurdist roster permitted** *(direction; overall tone still open — note Megabonk's tone lesson, [`megabonk.md`](megabonk.md) §7.7)*
- **Non-mechanical enemies climb buildings** *(direction)*
- **Rooftop monster closets** as spawn points *(direction)*
- **Relocation of left-behind enemies** — VS-style despawn/respawn and teleport-back *(direction)*
- **Tiered collision:** low-level fodder may overlap; bosses/elites/high-level have right of way *(direction)*

### Progression in-run
- **XP from kills and pickups**, with **elevated pickups** (Crackdown) pulling the player upward into danger, **balanced by ground-level hold-zone rewards** (Megabonk Charge Shrines) pulling them back down *(direction)*
- **Level-up pauses and offers 3–4 choices** from weapons and perks
- **Capped loadout slots** to force build identity. Not expandable by meta-progression, since that would be permanent power *(follows from Conflict 4 decision)*
- **Movement upgrades, mixed model:** small ones are perks in the pool; big ones (grapple) are dual-purpose weapons/skills *(decided)*
- **Evolution**: max weapon + paired perk + a trigger (elite chest) → dramatically stronger form
- **Offer-steering tools from day one** — reroll, banish, lock (Megabonk added banish post-launch; build it in from the start)
- **Uncapped rollover crit and overheal** (Megabonk) so stats never go dead
- **Hyperbolic stacking** for percentage effects (RoR2) so they can stack forever without breaking
- **Multiplicative stack amplifiers** for the characteristic exponential blowups
- **Earned screen-clearing ultimates** (Prototype's Devastators / Critical Mass) as the pressure release valve

### Movement
- **Manual movement, automatic combat** *(decided)*
- **Kit: move, dash, slide, jump, double jump (upgradeable to more air jumps), wall jump, wall run, glide** *(decided)*
- **Jump height upgradeable**, so the jump grows into a superjump; no separate superjump ability *(decided)*
- **Third-person free camera** *(decided)*
- **Grapple / web swing** as an acquirable weapon/skill or a character's starting ability *(decided)*
- **Chained, uninterrupted traversal**, **no fall damage, no stamina** (research proposal; not yet confirmed)
- Auto-vault: **open** (Q13), to be settled by the prototype
- **Deep and exploit-friendly** (Megabonk's bunnyhop) — adopt what players discover
- **Traversal upgrades available mid-run** that open new routes (Crackdown's agility loop, compressed into one run)
- **Audible pickup cues** — essential in a vertical space where line of sight constantly breaks

### The city
- **Three cities: Chicago, Tokyo, Paris**, real names for now *(decided)*
- **Massive but bounded maps**; invisible walls during development, ludonarrative boundary to be found *(decided)*
- **Authored central district + procedurally generated outskirts from city-themed set pieces** *(decided)*
- **Paris hardest**, through limited verticality plus tuning *(decided)*
- **Districts within a city differentiated by verticality profile**, not just art
- **Environment as ammunition** — cars, debris, signage as weapons (Prototype + Crackdown)
- **Readable, simplified art direction** serving navigation, silhouette legibility, and collision cost
- **Autonomous faction conflict** as ambient chaos and a possible horde-thinning mechanic (Prototype)
- **No unreachable pockets** — spawn and pathing coverage for every space the player can occupy (Megabonk's caveman exploit)

### Meta
- **No permanent power.** Unlocks are weapons, items, characters, skins *(decided)*
- **Unlocks from both currency and challenges; currency from every run, win or lose** *(decided)*
- **A large challenge/objective surface** to earn and hunt *(decided as a goal)*
- **Player-selected difficulty multiplier** paying out in progression *(decided)*
- **A currency sink that survives the shop being bought out**: **deferred** (Q12). Currency just accumulates for now, and something to spend it on can come later. Megabonk's silver glut is the known risk of leaving this too long.
- **A designated unbalanced sandbox** (RoR2's Artifacts / VS's Arcana) so the core loop need not carry all the fun

---

## 6. Open Questions Requiring Answers Before Content Work

These are carried into `docs/design/design-doc.md` §13 and should be resolved by prototype, not by argument. Keep the two tables in sync.

**Status key:** 🔴 Open · 🟡 Direction set / partly decided · 🟢 Decided · ⏸ Deferred

| # | Question | Blocking | Method | Status |
|---|---|---|---|---|
| **Q1** | **How do we make a horde threatening to a player with Prototype-grade traversal?** Includes the height-vs-ground reward balance. | Everything | Grey-box prototype: one block, full movement kit, a horde. Test A/B/C/D from Conflict 1. | 🟡 Direction set (mix of A/B/C/D); proportions untested |
| **Q2** | **What is our entity budget, and what architecture achieves it in 3D with verticality?** | Content scope, engine choice, map size | Technical spike. Evaluate ECS/data-oriented approaches against a target count. | 🔴 Open |
| **Q3** | **How do we prevent the Megabonk enemy-stacking bug?** | Combat feel, boss design | Spike alongside Q2. | 🟡 Direction set (tiered collision, flow fields, credit director) |
| **Q4** | **Manual movement + automatic combat — is that the right input split?** | Entire control scheme | Confirm in the prototype | 🟢 Decided (validate feel in prototype) |
| **Q5** | **How much permanent meta-power?** | Economy design | — | 🟢 Decided: none |
| **Q6** | **Does the city stay mechanically interesting once traversal is maxed?** | Long-term retention | Prototype. Upgradeable jumps and the grapple give a curve; whether it keeps escalating to the end of a run is untested. | 🔴 Open |
| **Q7** | **How much content per city (authored core size, set-piece library size)?** | Production scope | Scoping once the assembly approach is proven. City count decided: 3. | 🟡 Partly decided |
| **Q8** | **Engine and tooling choice** | Everything | Should follow Q2's spike, not precede it. Do not repeat Crackdown's mid-production engine switch. | 🔴 Open |
| **Q9** | **Run length, final-boss timing, and nuke tuning; what pacing beats replace floor transitions?** | Core loop | Design, then testing | 🟡 Mostly decided: 30 min, five scheduled lower bosses raise the tier, dev menu for exit. Open (testing/tuning): boss drops, tier size, nuke curve, snowball risk |
| **Q10** | **How big is a map, and is it bounded, looping, or streamed?** | Map generation, tech | Follows Q2 | 🟡 Bounded and massive (decided). Open: exact size (engine-dependent), in-world reason for the boundary |
| **Q11** | **Real city names or parodies?** | Branding, art | — | 🟢 Real names for now |
| **Q12** | **What does meta currency buy once the shop is exhausted?** | Economy, retention | Design; must not be power | ⏸ Deferred; currency accumulates for now |
| **Q13** | **Glide, superjump, auto-vault — in or out of the kit?** | Movement | Prototype | 🟡 Glide in; superjump replaced by jump-height upgrades. Open: auto-vault |

Several of these (Q2, Q8, the size half of Q10, the nuke tuning in Q9) **can't be answered until engine and technical choices are made**, and those in turn follow the Q2 spike.

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
