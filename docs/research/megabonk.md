# Megabonk (2025) — Research

> **Why this game is in our reference set:** It is the closest existing game to our pitch and the proof that the concept works. A 3D survivors-like with verticality, made by one person, that sold a million copies in two weeks. Every design problem we are about to hit, Megabonk hit first — and its criticism section is effectively a list of the mistakes available to us.

---

## 1. Snapshot

| | |
|---|---|
| **Released** | September 18, 2025 (Windows, Linux) |
| **Developer** | **Vedinad** — pseudonymous solo developer |
| **Engine** | **Unity** |
| **Development start** | August 2024 — roughly **13 months** from start to launch |
| **Genre** | Third-person 3D roguelike survival / survivors-like |
| **Steam rating** | "Very Positive" — ~94% positive across ~24,400 reviews |
| **Peak concurrents** | **117,336** — top 25 new releases of 2025 |
| **Sales** | 100k in 3 days · **1 million in 2 weeks** · ~1.3 million by Oct 6 |
| **Chart position** | Peaked at **#6 globally on Steam**, above *Borderlands 4*, *Marvel Rivals*, and *Call of Duty* |
| **Awards** | Nominated, Best Debut Indie — The Game Awards 2025 (**withdrawn by the developer**); Steam Awards 2025 "Sit Back and Relax" |

**The release-date story is worth knowing.** Megabonk was scheduled for September 4, 2025, then delayed to September 18 to avoid *Hollow Knight: Silksong*. Advised that other major releases also crowded that window, Vedinad's response was: *"I don't care - boom! Megabonk is out right now."* It topped the charts anyway.

**The identity question.** "Vedinad" is an anagram of **DaniDev** (Daniel William Sooman), creator of *Muck* and *Crab Game*, who stopped posting in January 2022. Asked directly whether they were DaniDev, Vedinad declined to answer. Notably, Vedinad **withdrew from The Game Awards' Best Debut Indie category**, stating that previous games under different studio names disqualified the entry — which is close to a confirmation. Palworld's John Buckley publicly called Vedinad "one of the game developers I respect the most."

> **Relevant lesson, not gossip:** this was not a first-time developer getting lucky. It was an experienced solo developer with a track record of viral multiplayer hits, applying that knowledge to a proven genre. Megabonk's success is partly a *marketing and virality* success, not purely a design one.

---

## 2. Core Mechanics

### 2.1 Structure of a run

This is the most directly applicable structure in our research set.

| Element | Value |
|---|---|
| **Maps** | 2 (Forest, Desert) |
| **Floors per map** | 3, procedurally generated |
| **Floor 1 duration** | 10 minutes |
| **Floor 2 duration** | 9 minutes |
| **Floor 3 duration** | 8 minutes |
| **Total run** | ~27 minutes + final boss |
| **Mini-boss spawns** | 7:00 and 2:00 remaining, every floor |
| **Swarm events** | 7:00 and 3:00 remaining |
| **Final boss** | Via portal on Floor 3, with a 10-minute limit |
| **Post-timer** | Infinite escalating waves of flying enemies |

**Why the multi-floor structure matters.** Vampire Survivors is one stage for 30 minutes. Megabonk breaks the same total duration into **three shorter, accelerating segments with a transition between each**. Each floor is *shorter* than the last (10 → 9 → 8), which compresses the pacing as player power grows. The portal transitions give the run natural chapter breaks — moments of relief, orientation, and anticipation that a single unbroken 30 minutes does not have.

> **This is probably the single best structural idea to steal for a 3D game.** In 3D, a player needs to learn the space. Three shorter floors means three distinct spaces instead of one map you have exhausted by minute twelve. For a *vertical urban* game — where each district could be its own silhouette and traversal puzzle — this maps almost perfectly.

### 2.2 Movement

Auto-attacking, like the genre, but with a real 3D movement kit:

- **Jumping**
- **Sliding**
- **Speed boosts**
- **Bunny-hopping** — originally an emergent exploit from the movement code, **later made official by the developer**

> Note that last point. A movement tech that players discovered and loved was *adopted rather than patched out*. Movement expressiveness turned out to be a significant part of why the game feels good, in a genre where movement is normally the only input. For our game — where movement is the entire pitch — this is a strong signal to build a deep, exploit-friendly movement model and then embrace what players find in it.

### 2.3 Progression in-run

- **Experience gems** from kills → level up → **randomized upgrade offers**
- **Weapons cap at Level 40**; **Books (passive tomes) cap at Level 99**
- Base upgrades grant **+2** to a stat
- **Anvil** item increases the number of stat rolls on an upgrade (up to 6 total), with effectiveness scaling off Luck
- **Slot expansion** is the meta-progression's main lever: **+2 weapon slots and +2 tome slots**, shared across all characters

### 2.4 Stats (the full dial list)

Damage · Projectile speed · Projectile count · Projectile size · Crit chance · Crit damage · Health regeneration · Overheal · Difficulty multiplier · XP gain · Gold gain · Pickup radius · Knockback *(non-functional at time of writing)* · Luck · Drop chance

Two mechanics here are worth copying outright:

**Overcrit.** Crit chance is **uncapped and rolls over**. At 101%, every hit crits and there is a 1% chance to crit *again*. Players push to 200%, 1390%, and beyond, with each full 100% adding a guaranteed additional crit layer. This is excellent late-game scaling design: it means a stat never becomes dead, and the numbers get absurd in a way the genre rewards.

**Overheal.** Healing beyond max HP is retained as a buffer, via regeneration or lifesteal. The *Chonkplate* item enables it with +75% overheal and 20% lifesteal. This converts survivability into an offensive resource and keeps healing stats relevant deep into a run.

**Difficulty multiplier as a player-chosen stat.** The player can voluntarily increase enemy damage, health, and count — which also **increases XP and progression rate**. Maximum is around 600–700%. A player-facing risk/reward dial, opted into rather than imposed.

### 2.5 Items, rarity, and chests

Rarity tiers: **Common (white) · Uncommon (blue) · Rare (purple) · Epic (red) · Legendary (yellow)**

- **Chests** start at **30 gold** and escalate in price per opening, **into the millions, infinitely**. This is a clean gold sink that never saturates.
- Free gold chests exist in limited supply; golden legendary chests are obtainable via Luck.
- The first elite killed on floor 1 is **guaranteed** to drop a chest — a deliberate early-run dopamine guarantee.
- **Pseudo-random chest keys**: three keys each with a 10% chance, checked in sequence — so the effective chance is 10% *per key*, not cumulative. A deliberately non-naive RNG implementation.
- **Microwave** clones an item, but only at matching rarity, consuming another item of that rarity. Uses per tier: White 3, Blue 2, Purple 2, Yellow 1.
- **Lamp of Transcendence** doubles the effect of stacked items — 5 stacks behave as 10. Multiplicative, not additive, which is how you get the genre's characteristic exponential blowups.

### 2.6 World interaction

- **Clay pots / silver pots** — XP or gold, scaling with stats; size variants affect drop quantity
- **Sanctuaries / altars** — captured over time for stat boosts; golden altars give only legendary boosts. *Wrench* reduces capture time by 4% plus a 7.5% bonus multiplier.
- **Enemy variety with map identity** — gold skeletons (high gold), silver skeletons (high XP), flying mobs, poison mobs (Desert), Chankham "steroid pig" (slows), zombies (Forest, fast)
- **Elites** marked with a crown

### 2.7 Bosses

- **Mini-bosses** at 7:00 and 2:00 per floor, drop free chests
- **Final bosses** have **three stages with invulnerability phases**. During stage 1 the player **loses 3 weapons and all books** (keeping their primary), with equipment progressively returned in stages 2 and 3. A sufficiently strong build can skip stages entirely by one-shotting.
- **Secret bosses** — Bush (Forest), Bandit (Desert) — drop free chests
- Lifesteal does not function during boss invulnerability

> **The boss-strips-your-build mechanic is a genuinely interesting idea.** It is the only moment in the genre where the game takes your power away and asks whether you can still function. It is also, per the criticism section, one of the more contentious designs in the game.

---

## 3. Design Philosophy (derived)

1. **The third dimension is content, not decoration.** Verticality and 3D terrain are consistently the most-praised feature. The map is something you *use*, not a plane you slide around on.
2. **Movement should be deep enough to be exploited.** Bunny-hopping was adopted, not patched. Movement mastery is a skill ceiling in a genre that normally has none.
3. **Never cap a scaling stat.** Overcrit and overheal both let stats keep mattering forever. Dead stats are dead upgrade offers.
4. **Let the player choose their own difficulty, and pay them for it.** The difficulty multiplier trades danger for progression speed.
5. **Segment the run.** Three accelerating floors with transitions, rather than one long stage.
6. **Sink gold infinitely.** Escalating chest prices mean gold never becomes worthless.
7. **Guarantee the first reward.** The first elite always drops a chest. Hook early, then randomize.
8. **Ship it.** Thirteen months, solo, into a crowded window, and it won anyway.

---

## 4. Why It Is Fun (what players actually say)

- **The 3D terrain and verticality are the differentiator.** TheGamer's Harry Alston called it "one of my favourite games of the year," specifically citing the 3D terrain and challenging gameplay. GamesHub gave 4/5 praising the refreshing 3D approach. Reviewers who had genre fatigue found this one novel *because* of the dimension.
- **Build-crafting is described as "satisfying" and the loop as "addictive."** Rogueliker's Mike Holmes called it "excellent... and a true trend setter."
- **Tension.** Lords of Gaming (8.5/10) specifically highlighted tension and the soundtrack. The 3D space creates genuine spatial danger — being cornered, losing sight of a threat, misjudging a drop — that a top-down 2D game cannot produce.
- **The aesthetic and humour.** GamesRadar+'s Ali Jones enjoyed the "skateboard-riding skeleton flinging bones at hordes." The game's deliberately memey, low-fi, shitpost-adjacent tone made it enormously clippable and drove viral spread.
- **Movement feels good on its own.** Sliding, bunny-hopping, and speed boosts give players something to be good at beyond build selection.

---

## 5. What Makes It Stand Out

**It is the 3D survivors-like that landed.** Others tried. This is the one that broke through, and the reason cited most often is that the 3D space is genuinely used rather than being a top-down game with 3D models.

**Verticality creates a second axis of threat and relief.** Elevation is both escape and exposure. This is the mechanic closest to our own pitch.

**Solo development at scale.** Thirteen months, one person, Unity, a million copies. Alongside Vampire Survivors, this is the second data point in this research set proving the genre's value lives in systems design, not production budget.

**Virality as a design input.** The memey tone, the absurd numbers, the "bonk" verb — this is a game engineered to produce clips. That is not separate from its success; it *is* a large part of its success.

---

## 6. Concrete Tuning Numbers

| Dial | Value |
|---|---|
| **Floors** | 3 per map, procedurally generated |
| **Floor durations** | 10 / 9 / 8 minutes (accelerating) |
| **Total run** | ~27 min + 10 min final boss window |
| **Mini-boss cadence** | 7:00 and 2:00 remaining, per floor |
| **Swarm cadence** | 7:00 and 3:00 remaining |
| **Weapon level cap** | 40 |
| **Book (passive) level cap** | 99 |
| **Base upgrade value** | +2 to a stat |
| **Anvil max stat rolls** | 6 |
| **Meta slot expansion** | +2 weapons, +2 tomes (shared across characters) |
| **Characters** | 20 unlockable |
| **Items** | 70+ |
| **Quests** | 200+ |
| **Meta currency** | **Silver**, from challenges and specific pots |
| **Chest base price** | 30 gold, escalating infinitely |
| **Chest key RNG** | 3 keys × 10% each, checked sequentially |
| **Crit** | Uncapped, rolls over past 100% |
| **Difficulty multiplier** | Player-selected, up to ~600–700% |
| **Chonkplate** | +75% overheal, 20% lifesteal |
| **Microwave clones per tier** | White 3 / Blue 2 / Purple 2 / Yellow 1 |
| **Rarity tiers** | 5 (white / blue / purple / red / yellow) |

---

## 7. Failure Modes and Criticism

**Megabonk's criticism is the most valuable section in this entire research set**, because it is a list of mistakes made by a game in our exact space, one year before we start.

### 7.1 Build diversity collapses at high level — the dominant complaint

> *"If you're chasing high records, you have absolutely NO other options besides 2 characters and specific items. The game forces you to play the meta playstyle."*

At the top end, viable builds narrow to a handful. The Archer (Robinetta), whose damage scales infinitely off gold, is meta-dominant. Players report there is "pretty much one way to play the game and that's it." The advertised 20 characters and 70+ items do not translate into 20 viable strategies.

**The underlying design problem:** when one scaling vector is *unbounded* and others are bounded, the unbounded one wins at every skill ceiling. Overcrit and gold-scaling damage are both fun and both the reason diversity dies.

### 7.2 RNG dependency

> *"The game makes you a prisoner of the RNG (better restart if you don't get what you need after a while)."*

Players report save-scumming behaviour — restarting runs that do not offer key items early. If the run's outcome is decided by minute five's offers, the remaining twenty-two minutes are a formality. Contributing factors: no reroll economy to speak of, no banish, no way to steer offers toward a build.

> Vampire Survivors mitigates this with rerolls/skips/banish purchased with gold. **Megabonk's relative lack of offer-steering is a concrete, fixable difference.**

### 7.3 Meta-progression is thin

> *"There's no sense of character progression in the game... the closest thing you have is additional skill slots. But these are limited to 2 additional weapons and 2 additional tomes and are shared among all characters."*

Silver buys unlocks, but there is no equivalent of Vampire Survivors' stacking PowerUps. A player who fails a run gets content access, not power. This weakens the "every run is productive" guarantee that makes the genre tolerable to lose at.

### 7.4 Enemy stacking and 3D collision problems — **read this one twice**

> *"Enemies piling on top of one another is a problem. The bosses are so big they immediately get shoved to the top of a stack making them extremely hard to hit."*

**This is the 3D horde problem made concrete.** In a 2D survivors-like, enemies crowd on a plane and the worst case is a wall of bodies. In 3D with physics collision, hundreds of pathing entities converging on one point **climb each other**, producing a pile. Large enemies get displaced upward off the top of the pile and out of the player's effective attack range.

> **We will hit this exact bug.** Our game has *more* verticality than Megabonk, which means more opportunity for entities to resolve collisions vertically. This needs to be a named technical risk from day one — see the synthesis doc. Candidate approaches (to be evaluated, not assumed): non-physical horde agents with soft separation rather than rigid-body collision, flow-field navigation with density pressure, explicit crowd-density caps within a radius, and vertical-displacement clamping for pathing agents.

### 7.5 Map variety

IGN praised the weapon variety but criticised having **only two maps**. In 3D, map exhaustion is faster and more noticeable than in 2D — players learn a space's geometry, and once learned, the spatial challenge is gone. Procedural floor generation mitigated this but did not solve it.

> **Direct implication for us:** an urban environment is an advantage here. Districts, building layouts, rooftop routes, and verticality profiles give us more axes of variation than a forest or a desert.

### 7.6 Difficulty spikes and boss design

Reported difficulty spikes, and specific frustration with the final boss's build-stripping stages. Taking away the player's accumulated power in a genre whose entire pleasure is accumulated power is a high-risk design. It reads as clever on paper and as a punishment in practice — particularly because lifesteal stops working during invulnerability, which can invalidate a survivability-focused build outright.

### 7.7 Tone as a liability

The "memey" humour that drove virality also **alienated part of the audience** — some found it distracting rather than charming. More seriously:

> *"The dev and parts of the community treat valid criticism as a joke. When players point out legitimate balance flaws or clunky mechanics, joking about it doesn't fix anything."*

A shitpost tone drives clips and sales, but it becomes a liability when the community needs the developer to take a balance problem seriously. Steam discussions include threads about community toxicity. **The tone you launch with is the tone you must receive criticism in.**

### 7.8 Unfinished mechanics

**Knockback is non-functional.** Base **Luck is 0% by default** and is suspected by the community to be bugged or disabled. Shipping stats that do not work, in a game whose upgrade offers include those stats, actively degrades every level-up decision.

### The lessons, stated plainly

1. **Unbounded scaling vectors destroy build diversity.** Either bound them all, or make several unbounded in different directions.
2. **Give the player offer-steering tools** — reroll, banish, lock. Without them, RNG dependency becomes restart-scumming.
3. **Meta-progression must grant power, not just access.** Otherwise losing runs feels wasted.
4. **3D horde collision is a real, shipped, unsolved bug.** Design the crowd system around it from the start.
5. **More maps than you think you need.** 3D spaces are learned and exhausted fast.
6. **Do not take the player's build away.** The genre's pleasure is accumulation.
7. **Ship no dead stats.** A non-functional stat poisons the upgrade offer pool.
8. **Choose your tone deliberately.** It determines your virality *and* your ability to have a serious conversation with your community.

---

## 8. Meta-Progression and Retention

| Layer | Mechanism |
|---|---|
| **Currency** | **Silver**, earned from challenges and specific pots |
| **Unlocks** | 20 characters, items, and content |
| **Permanent power** | **+2 weapon slots, +2 tome slots** — shared across all characters |
| **Objectives** | **200+ quests** |
| **In-run gold sink** | Chests from 30 gold escalating infinitely |
| **Difficulty opt-in** | Player-set multiplier up to ~600–700%, paying out in XP/progression |

**What works:** 200+ quests is a very large objective surface that keeps directing players at new content. The infinite chest price curve is a clean sink. The difficulty multiplier is a genuinely good self-balancing retention tool — mastered players raise it for both challenge and faster progression.

**What does not:** the permanent power ceiling is low (four extra slots, total, shared). Compare to Vampire Survivors' deep stacking PowerUps and Golden Eggs. Megabonk's answer to "I lost, what did I gain?" is weaker than the genre leader's, and players noticed.

---

## 9. Technical Profile

**Engine:** Unity. **Platforms:** Windows and Linux at launch. **Team:** one person. **Timeline:** ~13 months (August 2024 → September 18, 2025).

**What we can and cannot conclude.** Vedinad has not published a technical breakdown, so the specific approach to horde simulation — whether stock Unity GameObjects, DOTS/ECS, or custom batching — is not publicly documented. What the *shipped behaviour* tells us:

- Entity counts are high enough to fill a 3D scene with hordes at playable framerates on consumer hardware, on Unity, built by one developer in about a year. **The problem is tractable at indie scale.**
- Enemies use **physical collision that resolves vertically** — this is directly evidenced by the reported enemy-stacking and boss-displacement bug. Whatever the crowd system is, it permits agents to be pushed on top of each other.
- Maps are **procedurally generated per floor**, but drawn from only **two map themes**, which suggests a "hand-authored pieces, procedurally assembled" model rather than fully generative terrain. This matches Risk of Rain 2's stated approach and is the pragmatic small-team answer.

**The single most useful technical takeaway:** the enemy stacking bug is a shipped, publicly-complained-about failure of 3D crowd physics in exactly our genre and dimension. It should be treated as a known hazard with a designed mitigation, not discovered during production.

---

## 10. Carry Forward / Leave Behind

### ✅ Carry forward

| What | Why |
|---|---|
| **Multi-floor run with accelerating durations** | 10/9/8 compresses pacing as power grows and gives the run chapters. Ideal for a district-based urban map. |
| **Portal transitions between floors** | Natural breath points, anticipation, and a fresh space to learn. |
| **Deep, exploitable movement (slide, bunnyhop, boosts)** | Movement mastery as a skill ceiling. Central to our pitch. |
| **Adopting emergent movement tech** | When players find something fun in our movement model, keep it. |
| **Uncapped rollover crit (overcrit)** | Stats that never go dead. |
| **Overheal as an offensive resource** | Keeps survivability stats relevant late. |
| **Player-selected difficulty multiplier paying out in progression** | Self-balancing endgame. Directly addresses Vampire Survivors' post-mastery collapse. |
| **Infinitely escalating gold sink** | Gold never becomes worthless. |
| **Guaranteed first elite chest** | Guarantee the first hook, randomize after. |
| **Multiplicative stack amplifiers (Lamp of Transcendence)** | Where the genre's satisfying exponential blowups come from. |
| **Distinct enemy identities per region** | Gives each district mechanical character, not just a skin. |
| **Large quest/objective surface (200+)** | Directs players into unexplored content. |
| **Pseudo-random rather than naive RNG** | Fewer bad-luck streaks; feels fairer. |

### ❌ Leave behind

| What | Why |
|---|---|
| **A single unbounded dominant scaling vector** | Kills build diversity at the ceiling. The #1 complaint. |
| **No offer-steering (reroll / banish / lock)** | Produces restart-scumming. Add these from the start. |
| **Access-only meta-progression** | Losing runs must grant power, not just unlocks. |
| **Rigid-body horde collision** | Enemy stacking and boss displacement. Needs a crowd-specific solution. |
| **Only two environments** | 3D spaces exhaust faster. Districts give us cheap variety — use them. |
| **Build-stripping boss phases** | Takes away the exact thing the genre is about. |
| **Shipping non-functional stats** | Knockback and Luck poison the upgrade offer pool. |
| **Dismissive response to balance criticism** | Tone is a strategy, including for how you take feedback. |

### 🔑 The most important single takeaway

Megabonk proves **the pitch works**: a 3D survivors-like with verticality, made small, can top the Steam charts. It also proves **where the hard parts are**: build diversity at the ceiling, 3D crowd collision, map variety, and meta-progression depth. We are not taking a risk on the concept. We are taking on a known set of solvable problems with a published list of what goes wrong.

---

## Sources

- [Megabonk — Wikipedia](https://en.wikipedia.org/wiki/Megabonk)
- [EXPLAINING THE MECHANICS OF THIS GAME — Steam Community Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3588811651)
- [Out-of-nowhere roguelike hit Megabonk has sold 1 million copies in 2 weeks — GamesRadar+](https://www.gamesradar.com/games/roguelike/out-of-nowhere-roguelike-hit-megabonk-has-sold-1-million-copies-in-2-weeks-solo-creator-says-ill-be-eating-spaghetti-with-extra-sauce-tonight/)
- [Megabonk: The 3D Vampire Survivors-like Taking Over Steam — Outlook Respawn](https://respawn.outlookindia.com/amp/story/gaming/gaming-guides/megabonk-the-3d-vampire-survivors-like-taking-over-steam)
- [Megabonk Becomes a Mega-Hit on Steam — ixbt.games](https://ixbt.games/en/news/2025/10/02/megabonk-stala-megaxitom-steam-prodan-pervyi-million-kopii-za-2-nedeli.html)
- [Megabonk Beginner's Guide — KeenGamer](https://www.keengamer.com/articles/guides/megabonk-beginners-guide-how-to-play-build-survive-your-first-run/)
- [Megabonk Boss Guide — ScreenRant](https://screenrant.com/megabonk-boss-guide-locations-how-to-beat/)
- [Megabonk Maps Guide – Forest & Desert Tiers and Bosses](https://megabonk.org/guides/maps/)
- [This game has too many problems. And the biggest problem is balance. — Steam Discussions](https://steamcommunity.com/app/3405340/discussions/0/596289460456593145/)
- [Great game but serious balance flaws — Steam Discussions](https://steamcommunity.com/app/3405340/discussions/0/600791249529605888/)
- [Problems I have with this game and why I even care — Steam Discussions](https://steamcommunity.com/app/3405340/discussions/0/686370212389411116/)
- [Genuine positive/negative feedback of the game — Steam Discussions](https://steamcommunity.com/app/3405340/discussions/0/805722145474768708/)
