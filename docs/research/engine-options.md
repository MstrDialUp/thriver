# Engine Options — Preliminary Report

> **Why this document exists:** Q8 (engine and tooling) is open, and the design doc says it **follows the Q2 entity-budget spike, not the other way round** (design doc §11). This report doesn't choose an engine. It sets out what the decisions so far ask of an engine, what each candidate offers against that, and **which engines the Q2 spike should test**. It is a research proposal, not a decision.
>
> **Status:** Preliminary. Written 2026-09-23; revised the same day with Rich's second round of answers (browser, entity count, hardware).
> **Not a game doc:** the ten-section structure used by the other research documents is for the reference games. This one has its own structure.
>
> **Inputs from Rich (2026-09-23):**
> - **Team:** solo for now, possibly more people later. Comfortable picking up Unity, Unreal, or something else such as Godot.
> - **Platforms:** Windows (Steam), Linux and Steam Deck, and the browser.
> - **Criteria:** judge engines on their own merits. How well they suit AI-assisted development is **not** a factor.
>
> **Second round (Rich, 2026-09-23):**
> - **The browser build is a reduced version**, mainly for feel and sandboxing, possibly a "Lite" version posted on itch.io. **It doesn't have to use the production engine** and may drift from the main game once an engine is chosen. See §7.
> - **Enemy count:** "absurd toward the end," with no number yet. See §8.
> - **Hardware:** development on a Linux desktop (Ryzen 5 3600, RTX 2070). **The Steam Deck is important**, and Rich has one to test on. See §9.
> - **Reading suggested by Rich:** [*HOWTO: drawing a metric ton of bullets in Godot*](https://worldeater-dev.itch.io/bittersweet-birthday/devlog/210789/howto-drawing-a-metric-ton-of-bullets-in-godot). See §10.

---

## 1. Summary

- **The browser no longer constrains the engine.** Rich has set the browser build as a reduced "Lite" version that can drift from production (§7). So the production engine only has to serve **Windows, Linux and Steam Deck**, and **Unreal is back in the running**.
- **Shortlist for the Q2 spike: Godot and Unity first, Unreal third if both fall short.** All three reach the native platforms. Godot and Unity lead on fit for one developer, simple art and Steam Deck, and Unity has the strongest genre track record. Unreal has the most mature crowd framework (Mass), but it's the heaviest for one developer, and its flagship rendering is wasted on our art direction. Its turn comes if the other two can't reach the entity target.
- **"Absurd" needs a working number, and the genre gives us one.** Vampire Survivors caps at **500** enemies on screen and Megabonk at **550** alive at once. This report proposes spike targets of **550 as the floor, 2,000 as the goal and 5,000 as the stretch** (§8). These are proposals, not decisions.
- **The Steam Deck is the performance floor** (Rich: it's important, and he has one to test on). Its GPU sits around a GTX 1050, far below the dev desktop's RTX 2070. The CPUs are closer: the Deck has 4 Zen 2 cores in a 15 W budget shared with the GPU, against the desktop's 6-core Ryzen 5 3600, the same architecture. **The spike's targets are measured on the Deck** (§9).
- **The bullet-hell article's lessons apply in any engine**, and the grey box already uses most of them (§10).
- **The web-native route (Three.js and similar) now fits the Lite build, not production.** Vampire Survivors took that route for its full game and left it for performance reasons. The grey box is throwaway by decision (design doc §11), but a Lite build could reasonably continue its lineage.
- **Bevy is a wildcard, not a candidate.** Its data model is the best fit for a horde, but it is pre-1.0 with no production editor, and our city core is hand-authored.

---

## 2. What the design asks of an engine

Each requirement is traced back to a decision or direction in [`../design/design-doc.md`](../design/design-doc.md). Nothing here is new design.

| # | Requirement | Source | Why it matters for the engine |
|---|---|---|---|
| **R1** | **A dense 3D horde**: hundreds to low thousands of agents, with flow-field navigation, soft separation, climbers on walls, flyers, and bosses with right of way | §8, §11 (Q2, Q3) | The dominant technical risk. Needs data-oriented simulation (ECS or equivalent) and instanced rendering. Standard per-object actors won't scale. |
| **R2** | **Bullet-heaven projectiles and effects** at late-run scale | Pillar 7 | Large numbers of short-lived entities and GPU particles. Same data-oriented need as R1. |
| **R3** | **One huge, bounded map per run**: an authored core plus outskirts assembled from set pieces at run start | §9 (Q7, Q10) | Runtime level assembly, instancing of repeated buildings, possibly streaming. The authored core needs a **level editor**. |
| **R4** | **A custom movement kit**: dash, slide, double jump, wall jump, wall run, glide, grapple | §6 | Every engine needs a custom kinematic controller for this. What matters is fast, reliable physics queries (ray and shape casts), not a built-in character controller. |
| **R5** | **Third-person free camera** that copes with walls and interiors | §6 | Camera collision and occlusion handling. Custom work in any engine. |
| **R6** | **Windows, Linux, Steam Deck.** The Deck must run well. The browser is a separate Lite build | Rich, 2026-09-23 (§7, §9) | The Steam Deck is the performance floor. The browser no longer rules engines in or out (§4). |
| **R7** | **One developer now, maybe a team later** | Rich, 2026-09-23 | Favours mature docs, a large community, and a standard toolchain new hires already know. |
| **R8** | **Readable, simplified art** | Research proposal (§9) | We don't need high-end rendering. Engines that assume it (Nanite, Lumen) are overhead, not an advantage. |
| **R9** | **No mid-production engine switch** | Crackdown hazard (§11) | Pick once, after the spike, and prototype the hard case (R1) first. |

**R1 is what decides it.** R4 and R5 are custom work everywhere, R8 mildly counts against Unreal, and R6 and R7 narrow the field. Among the engines that survive, the choice comes down to which one runs the horde best on a Steam Deck.

---

## 3. What the grey box tells us (and what it doesn't)

The grey box is throwaway and explicitly doesn't answer Q2 or Q8 (design doc §11). It does give us three things:

- **The shape of the per-frame work.** In the grey box, **separation (the tiered overlap rule) is the dominant cost**, ahead of the flow field and movement ([README, performance notes](../../prototype/greybox/README.md#performance-notes)). That's the part of the simulation the spike should stress.
- **A rough order of magnitude, as an upper bound.** 600 enemies crowded onto a stationary player cost about 8 ms of simulation per frame in the browser. 1,500 cost about 12–20 ms. These were measured headless with software rendering, so they don't carry over to any native engine. They do show that **the browser gives out somewhere around 1,000–2,000 agents** with the current algorithm, which sets the rough ceiling for a Lite build (§7). These numbers already include the article's main techniques (§10), so they aren't a naive baseline.
- **Playtest counts.** Playtest 1 runs reached **4,000–5,200 kills** in about 10 real minutes, with thousands of relocations (the D toggle). That's the grey box's throughput at clock speed 2–3, not a target, but it's the only real number we have for how many enemies a run cycles through.

**What carries over to any engine:** the algorithms (flow field, spatial-hash separation, tiered right of way, credit director) and the tuning numbers. **What doesn't:** the code and the performance figures.

---

## 4. Platform fit

*The browser column is kept for reference. Since the second round it no longer decides anything, because the Lite build doesn't have to use the production engine (§7).*

| | Windows | Linux / Steam Deck | Browser | Notes |
|---|---|---|---|---|
| **Godot 4.7** | ✅ | ✅ native | ⚠️ **GDScript and C++ only.** C# can't export to the web | Single-threaded web builds since 4.3, so no special server headers needed |
| **Unity 6** | ✅ | ✅ native; Linux editor supported | ⚠️ WebGL2 works; WebGPU is experimental; **Burst doesn't compile for the web** | DOTS horde code falls back to slower managed code in the browser |
| **Unreal 5** | ✅ | ✅ | ❌ **No first-party web export** (moved to a community plugin) | Steam Deck works, but Lumen/Nanite are heavy there |
| **Bevy 0.19** | ✅ | ✅ | ✅ WebGL2; WebGPU experimental | Pre-1.0; no production editor |
| **Three.js (web-native)** | ⚠️ via Electron/NW.js/Tauri | ⚠️ same | ✅ native | WebGPU renderer production-ready since r171 |

Sources: Godot C# web status — [Godot issue #70796](https://github.com/godotengine/godot/issues/70796), [draft PR #118976](https://github.com/godotengine/godot/pull/118976), [Godot forum](https://forum.godotengine.org/t/is-there-an-update-on-exporting-c-projects-to-web/128821); Godot single-threaded web — [Web Export in 4.3](https://godotengine.org/article/progress-report-web-export-in-4-3/); Unity WebGPU — [Unity manual](https://docs.unity3d.com/6000.3/Documentation/Manual/WebGPU-limitations.html); Burst on web — [Unity discussions](https://discussions.unity.com/t/burst-for-webgl/849368); Unreal web — [Wikipedia, UE4 HTML5](https://en.wikipedia.org/wiki/Unreal_Engine_4); Unreal on Steam Deck — [Steam Deck HQ](https://steamdeckhq.com/news/unreal-engine-5-can-run-on-the-steam-deck/); Bevy — [Bevy news](https://bevy.org/news/), [Bevy + WebGPU](https://bevy.org/news/bevy-webgpu/); Three.js — [utsubo, 2026](https://www.utsubo.com/blog/threejs-2026-what-changed).

---

## 5. Candidates

### 5.1 Godot 4.7

**Current state.** 4.7 stable was released **June 18, 2026** ([GitHub release](https://github.com/godotengine/godot/releases/tag/4.7-stable), [release page](https://godotengine.org/releases/4.7/)). Jolt physics has been built into the engine since 4.4 ([godot-jolt releases](https://github.com/godot-jolt/godot-jolt/releases)). MIT licence: no fees, no royalties, no revenue thresholds.

**Genre evidence.** Strong in 2D, **thin in 3D.** *Brotato* (solo developer, Godot) has sold **over 10 million copies** and shipped on every major platform ([Wikipedia](https://en.wikipedia.org/wiki/Brotato)). *Halls of Torment* (Chasing Carrots, Godot) is a horde survival game on Windows and Linux ([Godot showcase](https://godotengine.org/showcase/halls-of-torment/), [Wikipedia](https://en.wikipedia.org/wiki/Halls_of_Torment)). Both are 2D or 2D-presented. **We found no shipped 3D survivors-like in Godot at Megabonk's density.** The public record on Godot's ceiling for a 3D horde is thin, and this report doesn't try to fill that gap.

**How the horde would be built.** There's no built-in ECS. The likely architecture is a horde simulation in **GDExtension (C++ or Rust)** over flat arrays, rendered through **MultiMesh** (instanced drawing), with GDScript for game logic. That's essentially a small custom ECS, which the vampire-survivors research already lists as one option ("Godot + custom ECS", [`vampire-survivors.md`](vampire-survivors.md) §9). GDScript alone is unlikely to carry a thousand-agent 3D horde; that's the part the spike has to measure.

**Pros**
- Reaches all the native targets, and the web too with GDScript/GDExtension, which would make a Lite build from the same project possible.
- No licence cost or revenue share, and no exposure to licence changes (Unity's Runtime Fee episode is the cautionary tale in this market).
- Lightweight editor and fast iteration; runs well on Linux, where Rich develops.
- Proven for solo survivors-like developers (Brotato).
- Simplified art (R8) plays to its strengths. It doesn't need Unreal-class rendering.

**Cons**
- **No proven 3D horde at our density.** The biggest unknown on the shortlist.
- **The horde would be a custom ECS in C++/Rust.** That's more engine-level code for a solo developer than Unity's or Unreal's built-in frameworks.
- **C# can't export to the web.** *No longer a constraint on production* since the Lite build can be separate (§7), so C# is back on the table for Godot.
- Smaller asset store and plugin ecosystem than Unity's. Third-person camera, crowd and navigation tooling would mostly be built in-house.

### 5.2 Unity 6

**Current state.** Unity cancelled the Runtime Fee in September 2024 and went back to seat-based pricing ([Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee)). **Unity Personal is free up to $200,000 in revenue**; above that, Pro is a paid seat ([Unity pricing updates](https://unity.com/products/pricing-updates)). No royalties. The engine is mid-transition: the March 2026 roadmap moves scripting to **CoreCLR** (Unity 6.7 LTS is the last Mono-based version, full CoreCLR in 6.8) and brings Entities closer to GameObjects step by step ([Unity discussions, March 2026](https://discussions.unity.com/t/coreclr-scripting-and-ecs-status-update-march-2026/1711852), [ECS for All roadmap](https://unity.com/roadmap/2700-ecs-for-all)).

**Genre evidence.** The strongest of any engine. **Megabonk** (3D, verticality, hordes, solo developer, 13 months), **Risk of Rain 2** (3D, a small team with no prior 3D experience) and **Vampire Survivors** after its port are all Unity ([`megabonk.md`](megabonk.md) §9, [`risk-of-rain-2.md`](risk-of-rain-2.md) §9, [`vampire-survivors.md`](vampire-survivors.md) §9). Megabonk's horde architecture isn't public, so we don't know whether it used DOTS.

**How the horde would be built.** Two paths. **ECS (Entities + Burst + Jobs)** is the engine's answer to R1 and has official support. **GameObjects plus Jobs/Burst for the horde loop, with GPU instancing** is simpler and may be enough. The spike should test the simpler path first.

**Pros**
- **Direct precedent**: our closest reference game shipped on it, solo, in about a year.
- A first-party data-oriented stack (ECS, Burst, Jobs) aimed squarely at R1.
- The biggest asset store and community. Camera, character-controller and tooling packages exist to evaluate.
- C# is the most common skill among indie hires (R7).
- Reaches all four platforms.

**Cons**
- **The fast horde path doesn't run fast on the web.** Burst doesn't compile for the web, so Jobs run as managed code there, and Entities Graphics has historically not supported the web ([Unity discussions](https://discussions.unity.com/t/webgl-or-unity-web-platform-with-ecs-dots-and-netcode-for-entities/1620856)). *Since the second round this matters much less, because the Lite build can be separate (§7).*
- **The engine is in transition** (CoreCLR, ECS–GameObject unification). Starting now means starting before those land, and probably migrating mid-project. That's a smaller version of the Crackdown hazard.
- **Licence risk is historical, not current.** The Runtime Fee was cancelled, but it showed the terms can change. Pro and Enterprise prices rose 5% in January 2026 ([Unity pricing updates](https://unity.com/products/pricing-updates)).
- Heavier editor than Godot's.

### 5.3 Unreal Engine 5

**Current state.** Free until **$1 million** in lifetime gross revenue, then a **5% royalty** ([Unreal licensing](https://www.unrealengine.com/license)). UE 5.8 was released in June 2026. **Mass Entity** is Unreal's built-in ECS, used for Epic's own crowd and traffic systems, and there are credible reports of 10,000 simulated crowd agents at 60 fps with proper LOD ([Epic talk](https://dev.epicgames.com/community/learning/talks-and-demos/37Oz/large-numbers-of-entities-with-mass-in-unreal-engine-5), [community guide](https://dev.epicgames.com/community/learning/tutorials/zqZZ/unreal-engine-epic-for-indies-designing-scalable-crowds-with-mass-ai-a-comprehensive-ue-guide)). Those are ambient crowds, not combat hordes. Mass's public documentation is mostly talks and community tutorials.

**Genre evidence.** We found no survivors-like in our reference set built on Unreal. Not researched further for this report.

**Pros**
- **Mass Entity is the most mature built-in crowd framework** of the candidates, and it was built for city crowds and traffic, close to our setting.
- Strong physics, navigation, and a proven third-person template.
- Best native rendering, with the most headroom if art direction ever grows.
- The industry standard for hires if the team grows.

**Cons**
- **No first-party browser export.** It was moved out to a community plugin. *Since the second round this doesn't rule Unreal out, because the Lite build can be separate (§7).* It does mean the Lite build can never share code with an Unreal production build.
- Heavy for one developer: C++ build times, large editor, large projects. Blueprints help with gameplay, but the horde would be C++.
- Its flagship features (Nanite, Lumen) are **heavy on Steam Deck** ([Steam Deck HQ](https://steamdeckhq.com/news/unreal-engine-5-can-run-on-the-steam-deck/)). Our art direction (R8) doesn't need them, so we'd be paying for rendering we switch off.
- 5% royalty above $1M. Irrelevant until the game succeeds, then a real cost.

### 5.4 Bevy 0.19 (wildcard)

Rust, **ECS all the way down**, MIT/Apache licensed. 0.19 was released June 19, 2026; releases come roughly every 3–5 months and break APIs between versions ([Bevy news](https://bevy.org/news/)). Web via WebGL2, with WebGPU experimental ([Bevy + WebGPU](https://bevy.org/news/bevy-webgpu/)).

- **Pros:** the best data model for R1 of any candidate; reaches all four platforms; no licence cost.
- **Cons:** pre-1.0 with breaking changes every release; **no production-ready editor**, which is a serious problem for a hand-authored city core (R3); small 3D ecosystem; a Rust hiring pool.
- **Verdict:** not a spike candidate. Worth another look if a 1.0 with an editor ships before the decision.

### 5.5 Web-native: Three.js or similar

Keep the game in the browser and wrap it in Electron, NW.js or Tauri for Steam. Three.js's WebGPU renderer (compute shaders, better instancing) has been production-ready since r171 ([utsubo, 2026](https://www.utsubo.com/blog/threejs-2026-what-changed)). Babylon.js and PlayCanvas are similar options and weren't researched for this report.

- **Pros:** the browser target is free; the team already knows the stack from the grey box; no licence cost; WebGPU compute could move the horde simulation onto the GPU.
- **Cons:** **Vampire Survivors took exactly this route (Phaser + Electron) and ported to Unity for performance**, and it was 2D ([GamingOnLinux](https://www.gamingonlinux.com/2023/07/vampire-survivors-switching-to-new-game-engine-on-august-17/), [`vampire-survivors.md`](vampire-survivors.md) §9). JavaScript's single main thread is the main limit, and the grey box's own numbers put the browser ceiling at roughly 1,000–2,000 agents with the current algorithm. It's a framework, not an engine: no editor for the authored city core, no built-in navigation or ECS, and every tool would be hand-built. Console ports would be very hard if they ever came up.
- **Verdict for production:** a fallback. The grey box being in Three.js is **not** evidence for this route. It was chosen for accessibility and is throwaway by decision (design doc §11).
- **Verdict for the Lite build:** a natural fit. It's already the browser's own technology, and the grey box shows the kit and a horde of about a thousand run there (§7).

### 5.6 Not considered in depth

Stride, Flax, O3DE, and a bespoke engine. None has a survivors-like precedent in our research, and none beats the shortlist on any requirement in §2. A bespoke engine goes against the research's clearest lesson: the genre's value is in systems design, not technology (synthesis §7).

---

## 6. Comparison

Qualitative and preliminary. **R1 can't be scored until the spike runs**, which is the point of the spike.

| | Godot | Unity | Unreal | Bevy | Web-native |
|---|---|---|---|---|---|
| **R1 horde (expected)** | ❓ custom ECS in GDExtension; unproven in 3D | 🟢 ECS/Burst; genre precedent | 🟢 Mass; crowd precedent | 🟢 native ECS | 🔴 browser ceiling |
| **R3 map authoring** | 🟢 editor | 🟢 editor | 🟢 editor | 🔴 no editor | 🔴 no editor |
| **R6 browser** *(no longer decides; §7)* | 🟡 GDScript/C++ only | 🟡 horde slower on web | 🔴 none | 🟢 | 🟢 |
| **R6 Linux / Deck** | 🟢 | 🟢 | 🟡 heavy | 🟢 | 🟡 wrapper |
| **R7 solo now, team later** | 🟢 / 🟡 | 🟢 / 🟢 | 🟡 / 🟢 | 🔴 / 🔴 | 🟡 / 🟡 |
| **R8 simple art fit** | 🟢 | 🟢 | 🟡 overhead | 🟢 | 🟢 |
| **Licence** | Free (MIT) | Free under $200k, then paid seats | 5% over $1M | Free (MIT/Apache) | Free |
| **Genre precedent** | 2D (Brotato, Halls of Torment) | **3D** (Megabonk, RoR2) | None found | None found | 2D, then left (VS) |

---

## 7. The browser: a separate Lite build

> **Rich, 2026-09-23:** the browser build is **reduced**, mainly **for feel and sandboxing**, possibly a **"Lite" version on itch.io**. It's fine for it to **drift from actual development once an engine is chosen** instead of being tied to the engine.

**What this settles for the engine choice:** the production engine only needs Windows, Linux and Steam Deck. The browser column in §4 no longer decides anything, and Unreal is a candidate again.

**Why this is the right shape, per the research:** no engine runs its fastest horde code in the browser. Unity loses Burst there, Godot loses C# and practically loses threads, and the web-native route hits the ceiling the grey box has already found (about 1,000–2,000 agents, §3). A browser build of this game was always going to run fewer enemies than the desktop build. Treating it as its own Lite product accepts that instead of fighting it.

**What it leaves open (not blocking):**
- **What the Lite build is built in.** If the engine is Godot, it could come from the same project (GDScript/GDExtension export to the web). If it's Unity, it could be a reduced web export. If it's Unreal, it has to be separate. The grey box's Three.js lineage is always an option, since it already runs the kit and a horde in the browser.
- **The cost of drift.** A Lite build that drifts is a second codebase to maintain, or a snapshot that goes stale. That's acceptable for feel and sandboxing, but worth remembering if the Lite build ever becomes a marketing demo that has to look like the current game.

---

## 8. How many enemies is "absurd"?

> **Rich, 2026-09-23:** the enemy count should be **absurd toward the end**. There's no number for "absurd" yet.

**What the genre caps at.** Both of the references that publish a number cap enemies alive at once at around 500:

| Game | Cap on enemies alive at once | Source |
|---|---|---|
| **Vampire Survivors** | **500** on screen, whatever the Curse and Charm values | [Vampire Survivors Wiki — Curse](https://vampire.survivors.wiki/w/Curse) |
| **Megabonk** | **550** during normal play. Final Swarm: 400 ghosts, dropping to 300 after two minutes | [megabonkinfo.org — Difficulty](https://www.megabonkinfo.org/player-stats/difficulty) (community wiki) |
| **Grey box** | 600 by default (`maxEnemies`), slider to 2,500 | [`config.js`](../../prototype/greybox/src/config.js) |

Both are community wikis, not developer statements, so treat the numbers as well-attested but unofficial. Note what they imply: **the genre's "absurd" is about 500 alive at once**, recycled fast. Runs rack up kill counts far higher than that through turnover, not through simultaneous count. Playtest 1's 4,000–5,000 kills in ten real minutes (§3) come from the same turnover.

**Proposed spike targets** *(research proposal, not a decision)*:

| Level | Enemies alive at once | Meaning |
|---|---|---|
| **Floor** | **550** | Megabonk parity. Below this, we're not a 3D bullet heaven at genre standard. |
| **Goal** | **2,000** | About four times the genre cap. A reasonable reading of "absurd" that sets us apart. |
| **Stretch** | **5,000** | Ten times the genre. Probably only reachable with simulation LOD (below). |

**Two points that make the number less scary:**

- **Perceived density isn't simulated density.** What has to be absurd is what the player *sees*. Far-away enemies can update less often, drop separation, or be drawn as cheap impostors, and the credit director (design doc §8) can spend late budget on fewer, stronger enemies instead of more. Playtest 1's "Schrödinger spawning" idea, placing enemies where the player is about to look ([README, playtest log](../../prototype/greybox/README.md#playtest-log)), is the same idea from the design side.
- **The feel of the number can be tested now, in the grey box, without an engine.** Its `maxEnemies` slider already goes to 2,500. A few runs at 550, 1,000 and 2,000 would show which count *reads* as absurd from a third-person camera in a city, where buildings hide much of the horde. The browser may drop frames at the top end, but that doesn't matter for judging the look. **This is the cheapest way to turn "absurd" into a number**, and it keeps the question with the grey box, where the design doc wants it.

---

## 9. Hardware: the Steam Deck is the floor

> **Rich, 2026-09-23:** the development machine is a **Linux gaming desktop with a Ryzen 5 3600 and an RTX 2070**. **The Steam Deck is important**, and Rich **has one to test on**.

**The two machines:**

| | Desktop (dev) | Steam Deck (floor) |
|---|---|---|
| **CPU** | Ryzen 5 3600: **6 cores / 12 threads, Zen 2, 3.6–4.2 GHz, 65 W** for the CPU alone ([TechSpot](https://www.techspot.com/specs/cpu/206160-amd-ryzen-5-3600.html), [WikiChip](https://en.wikichip.org/wiki/amd/ryzen_5/3600)) | **4 cores / 8 threads, Zen 2, 2.4–3.5 GHz**, sharing **3–15 W** with the GPU ([Wikipedia](https://en.wikipedia.org/wiki/Steam_Deck)) |
| **GPU** | RTX 2070 | RDNA 2, 8 CUs, **1–1.6 TFLOPS**, around a **GTX 1050** ([WePC](https://www.wepc.com/gpu/faq/what-gpu-is-equivalent-to-steam-deck/)) |

**What the comparison says:**

- **The GPUs are far apart. The CPUs are closer, and they're the same architecture.** Both are Zen 2, so code that runs well per core on the desktop behaves the same way per core on the Deck. The Deck has two fewer cores, lower clocks, and a power budget it shares with the GPU, so under a full load it can't hold its top clock on both at once. How big the gap is for our horde code depends on how well it uses threads. It has to be measured, not estimated.
- **The horde is mostly CPU work**, so the CPU gap matters more than the GPU gap for R1. The GPU gap matters for projectiles, effects and drawing thousands of instances, which is another reason the simple art direction (R8) matters.
- **An enemy count measured on the desktop will overstate the Deck's.** Every spike number that counts is a Deck number.

**Consequences for the report:**

- **The Deck is the performance floor, and the spike's targets (§8) are measured on it.** The desktop numbers are recorded, but for comparison only.
- **It weakens Unreal further.** Its flagship rendering (Lumen, Nanite) is heavy on the Deck (§5.3), and a solo developer would spend time switching it off. It strengthens Godot and Unity, whose lighter default rendering suits the Deck.
- **A cheap stand-in during development:** because both CPUs are Zen 2, pinning the game to four cores on the desktop (for example `taskset -c 0-3` on Linux) gives a rough idea of Deck CPU headroom between Deck tests. It doesn't reproduce the Deck's shared power budget or its GPU, so it's a proxy for quick checks, **not a substitute** for measuring on the Deck.
- **Frame-rate target:** this report proposes **60 fps on the Deck** as the target, and recording the counts held at **30 and 45 fps** too, so the trade-off is visible. That's a proposal, not a decision.

---

## 10. Lessons from "a metric ton of bullets"

Source: [*HOWTO: drawing a metric ton of bullets in Godot*](https://worldeater-dev.itch.io/bittersweet-birthday/devlog/210789/howto-drawing-a-metric-ton-of-bullets-in-godot) (worldeater-dev, *Bittersweet Birthday* devlog), suggested by Rich.

**What it is.** A Godot 3, **2D** bullet hell. A naive build, with each bullet as its own node (area, sprite, animation player, collision shape), took about **230 ms per physics step** with thousands of bullets. The fix: bullets become plain data in an array, collision shapes are registered directly with the physics server, and all bullets are drawn in one custom draw call. The author doesn't give an "after" timing. A commenter reports **2,500+ bullets at 240 fps on an integrated GPU**, which we haven't verified. Another commenter notes that the approach needed restructuring for Godot 4.

**The lessons, which hold in any engine:**

| # | Lesson | Unity / Unreal equivalent | Grey box already does it? |
|---|---|---|---|
| 1 | **Enemies and bullets are data, not scene objects.** No node, GameObject or Actor per entity. | ECS entities, or plain arrays driven by Jobs · Mass fragments | ✅ Plain arrays |
| 2 | **Draw in batches**: one draw per mesh type, not one per entity | GPU instancing / BatchRendererGroup · instanced static meshes | ✅ One `InstancedMesh` per enemy type and for bullets |
| 3 | **Keep the horde out of the general physics engine**, or use it only at the lowest level | Custom spatial queries; physics only for the player | ✅ Custom collision and a flow field. Matches the Q3 direction (non-physical agents) |
| 4 | **Only test the pairs that matter.** Bullets never check bullets, so the work is O(n), not O(n²) | Same | ✅ for bullets. ⚠️ Separation *is* pairwise (enemy against nearby enemy), and it's the grey box's biggest cost |
| 5 | **Pool and preallocate**, so a wave spawning doesn't cause allocation spikes | Object pools; ECS chunks | ✅ Fixed-size arrays |
| 6 | **Bookkeeping has to stay in sync** (array index ↔ physics shape index). Data-oriented code trades safety for speed, and a mismatch shows up as ghost collisions | Same | — |
| 7 | **Low-level APIs change more between engine versions** than high-level ones (the Godot 3 → 4 rework) | Unity's ECS and CoreCLR transition (§5.2) | — |

**What that tells us.** The article's techniques are **necessary but not sufficient** for us. The grey box already uses lessons 1–5 and still gives out at about 1,500 agents in the browser (§3). Bullets are the easy case: they fly straight and never check each other. **Our remaining cost is what bullets don't have: pathing and enemy-to-enemy separation** (lesson 4's exception). That's exactly where the engines differ: Burst, Mass, or native GDExtension code compiled close to the metal, plus multithreading. It's what the spike should stress.

**Worth carrying into the spike:** a **separation budget**. Cap how many neighbours each agent checks, run separation at a lower rate for agents far from the player, and skip it entirely for fodder that's allowed to overlap under the tiered rule (design doc §8). That turns the one pairwise cost into something close to O(n).

---

## 11. Proposed Q2 spike

A proposal for how to turn this report into an answer. It follows the design doc: **prototype the hard case first, then commit** (§11, Crackdown hazard).

**Step 0, in the grey box (no engine needed):** turn "absurd" into a number by playing at 550, 1,000 and 2,000 enemies (§8).

**Scope: the horde, nothing else.** A flat block of grey boxes of the city, a stand-in player moving on a script, and the horde. No movement kit, no weapons, no progression. Those carry over from the grey box as tuning numbers, not code.

**Build it in Godot and Unity first**, the same test in each:

- Agents with a **flow field**, **spatial-hash soft separation with tiered right of way** and a separation budget (§10), **wall climbers** and **flyers** (the grey box's algorithms).
- **Instanced rendering** of simple meshes, plus a stress load of projectiles.
- A counter that ramps the agent count until the frame budget breaks.
- Godot: the horde in GDExtension (C++) with MultiMesh, with a GDScript or C# baseline for comparison. Unity: the simpler path first (plain arrays + Jobs/Burst + instancing), then ECS if needed.

**Add Unreal (Mass) only if** neither Godot nor Unity reaches the **goal (2,000)** on the Steam Deck.

**Measure on:**

- **The Steam Deck**: the floor, and the machine the targets in §8 are measured on (§9).
- **Rich's desktop (Ryzen 5 3600, RTX 2070)**: for comparison, and for quick checks between Deck runs with the four-core proxy (§9).
- *Not the browser:* the Lite build is separate (§7).

**Record for each engine:** the counts held at 60, 45 and 30 fps on each machine, measured against the floor, goal and stretch in §8; the implementation effort; and the pain points. That's the input Q8 needs.

---

## 12. Open questions raised by this report

- ~~**The browser target.**~~ **Answered (Rich, 2026-09-23):** a reduced Lite build, not tied to the production engine (§7).
- **What "absurd" is in numbers.** Not known yet (Rich). Proposed: test 550 / 1,000 / 2,000 in the grey box (§8), with spike targets of 550 / 2,000 / 5,000.
- ~~**How important the Steam Deck is.**~~ **Answered (Rich, 2026-09-23):** important. It's the floor, and Rich has one to test on (§9).
- **The frame-rate target on the Deck.** Proposed: 60 fps, recording 45 and 30 as well (§9).
- **Consoles.** Out of scope for now (Rich, 2026-09-23). If that changes, Unity and Unreal have the clearest console paths, and Godot's go through third-party porting. Brotato shows it's possible.

---

## Sources

- [Unity is Canceling the Runtime Fee — Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee)
- [Unity Pricing Changes — Unity](https://unity.com/products/pricing-updates)
- [CoreCLR, Scripting, and ECS Status Update — March 2026 — Unity Discussions](https://discussions.unity.com/t/coreclr-scripting-and-ecs-status-update-march-2026/1711852)
- [Roadmap: ECS for All — Unity](https://unity.com/roadmap/2700-ecs-for-all)
- [Limitations of the WebGPU graphics API — Unity manual](https://docs.unity3d.com/6000.3/Documentation/Manual/WebGPU-limitations.html)
- [Burst for WebGL — Unity Discussions](https://discussions.unity.com/t/burst-for-webgl/849368)
- [WebGL or Unity Web platform with ECS DOTS — Unity Discussions](https://discussions.unity.com/t/webgl-or-unity-web-platform-with-ecs-dots-and-netcode-for-entities/1620856)
- [Unreal Engine licensing](https://www.unrealengine.com/license)
- [Unreal Engine 4 — Wikipedia](https://en.wikipedia.org/wiki/Unreal_Engine_4) (HTML5 export moved to a community plugin)
- [Large Numbers of Entities with Mass in Unreal Engine 5 — Epic](https://dev.epicgames.com/community/learning/talks-and-demos/37Oz/large-numbers-of-entities-with-mass-in-unreal-engine-5)
- [Designing Scalable Crowds with Mass AI — Epic community tutorial](https://dev.epicgames.com/community/learning/tutorials/zqZZ/unreal-engine-epic-for-indies-designing-scalable-crowds-with-mass-ai-a-comprehensive-ue-guide)
- [Unreal Engine 5 Can Run on the Steam Deck — Steam Deck HQ](https://steamdeckhq.com/news/unreal-engine-5-can-run-on-the-steam-deck/)
- [Godot 4.7 release page](https://godotengine.org/releases/4.7/) and [4.7-stable on GitHub](https://github.com/godotengine/godot/releases/tag/4.7-stable)
- [Web Export in 4.3 — Godot](https://godotengine.org/article/progress-report-web-export-in-4-3/)
- [Readd support for web exports with C# — Godot issue #70796](https://github.com/godotengine/godot/issues/70796) and [draft PR #118976](https://github.com/godotengine/godot/pull/118976)
- [Is there an update on exporting C# projects to Web — Godot Forum](https://forum.godotengine.org/t/is-there-an-update-on-exporting-c-projects-to-web/128821)
- [godot-jolt releases](https://github.com/godot-jolt/godot-jolt/releases)
- [Brotato — Wikipedia](https://en.wikipedia.org/wiki/Brotato)
- [Halls of Torment — Godot showcase](https://godotengine.org/showcase/halls-of-torment/) and [Wikipedia](https://en.wikipedia.org/wiki/Halls_of_Torment)
- [Bevy News](https://bevy.org/news/) and [Bevy + WebGPU](https://bevy.org/news/bevy-webgpu/)
- [What's New in Three.js (2026) — utsubo](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [HOWTO: drawing a metric ton of bullets in Godot — worldeater-dev](https://worldeater-dev.itch.io/bittersweet-birthday/devlog/210789/howto-drawing-a-metric-ton-of-bullets-in-godot)
- [Curse — Vampire Survivors Wiki](https://vampire.survivors.wiki/w/Curse) (500-enemy cap)
- [Difficulty — megabonkinfo.org](https://www.megabonkinfo.org/player-stats/difficulty) (550-enemy cap)
- [Steam Deck — Wikipedia](https://en.wikipedia.org/wiki/Steam_Deck)
- [AMD Ryzen 5 3600 specs — TechSpot](https://www.techspot.com/specs/cpu/206160-amd-ryzen-5-3600.html) and [WikiChip](https://en.wikichip.org/wiki/amd/ryzen_5/3600)
- [What GPU is equivalent to the Steam Deck — WePC](https://www.wepc.com/gpu/faq/what-gpu-is-equivalent-to-steam-deck/)
- [Vampire Survivors switching to new game engine — GamingOnLinux](https://www.gamingonlinux.com/2023/07/vampire-survivors-switching-to-new-game-engine-on-august-17/)
- Internal: [`../../prototype/greybox/README.md`](../../prototype/greybox/README.md) (performance notes, playtest log), [`00-synthesis.md`](00-synthesis.md), [`megabonk.md`](megabonk.md), [`risk-of-rain-2.md`](risk-of-rain-2.md), [`vampire-survivors.md`](vampire-survivors.md)
