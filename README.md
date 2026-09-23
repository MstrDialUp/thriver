# Thriver

A 3D bullet heaven survivors-like set in a vertical urban environment, where you collect weapons, skills, and perk items to overcome large amounts of enemies.

*Working title. Nothing here is built yet — this repository currently holds design research and a living design document.*

---

## Where to start

**[`docs/research/00-synthesis.md`](docs/research/00-synthesis.md)** — the argument. What we take from each inspiration, where those inspirations conflict, and the open questions that must be answered before content work begins.

**[`docs/design/design-doc.md`](docs/design/design-doc.md)** — the living design document. Currently seeded with the pitch, research-derived pillars, the first round of design decisions (see its §15 decision log), and open questions. Most sections are still unfilled.

---

## Repository layout

```
docs/
├── research/
│   ├── 00-synthesis.md        # Cross-cutting analysis — read first
│   ├── prototype-2009.md      # Urban power fantasy, traversal, chaos generation
│   ├── vampire-survivors.md   # The genre's structure, math, and dopamine pacing
│   ├── megabonk.md            # Proof the 3D pitch works, and what goes wrong
│   ├── crackdown-2007.md      # Verticality as a core mechanic; the orb economy
│   └── risk-of-rain-2.md      # The 2D→3D translation; scaling and director math
└── design/
    └── design-doc.md          # Living design document
```

## The inspirations

| Game | What we are taking |
|---|---|
| **Prototype (2009)** | The urban environment, chained traversal, overpowered weapons, chaos generation |
| **Vampire Survivors (2021)** | The 30-minute weak→god arc, reward cadence, weapon evolution, build scarcity |
| **Megabonk (2025)** | Proof that a 3D survivors-like with verticality works — and a published list of its mistakes |
| **Crackdown (2007)** | Verticality as *the* mechanic; collectibles that teach the movement system |
| **Risk of Rain 2 (2019)** | How to translate a horde roguelike into 3D; the genre's best scaling math |

## Research document structure

Each research document follows the same ten sections so they are directly comparable:

1. Snapshot · 2. Core mechanics · 3. Design philosophy · 4. Why it's fun · 5. What makes it stand out · 6. Concrete tuning numbers · 7. Failure modes & criticism · 8. Meta-progression & retention · 9. Technical profile · 10. Carry forward / leave behind

## Conventions

- Research documents cite their sources and state plainly where the public record is thin rather than filling gaps with plausible guesses.
- The design document marks unmade decisions as `UNFILLED` and unresolved questions as `> **OPEN:**` callouts. Nothing in it is a decision unless it says so.
