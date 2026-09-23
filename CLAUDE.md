# Thriver — Project Conventions

## What this project is

A 3D bullet heaven survivors-like set in a vertical urban environment. Currently **design research plus a throwaway Q1 grey box** ([`prototype/greybox/`](prototype/greybox/README.md), browser, Three.js). **No production engine has been chosen.** The grey box is not an engine decision and does not answer Q2/Q8.

**Pitch:** A 3D bullet heaven survivors-like that takes place in an urban environment with lots of verticality where you collect weapons, skills, and perk items to overcome large amounts of enemies.

## Before proposing anything

Read [`docs/research/00-synthesis.md`](docs/research/00-synthesis.md) first. It contains the design pillars, the conflicts between our inspirations, and the open questions. Most design suggestions will already be addressed — or explicitly blocked — there.

## Document conventions

**Research documents** (`docs/research/`):
- Every game doc uses the same ten sections so they stay comparable. Do not reorder or drop sections.
- Cite sources. When the public record is thin, **say so explicitly** rather than filling gaps with plausible-sounding guesses. Several sections in the Prototype and Crackdown docs do this deliberately.
- These are living documents. Update them when new research changes a conclusion.

**The design document** (`docs/design/design-doc.md`):
- Mark unwritten sections `UNFILLED`.
- Mark unresolved questions as `> **OPEN:**` blockquote callouts, and keep §13's register in sync.
- **Do not invent design decisions.** Research findings and synthesised proposals must be labelled as such. If it is not marked as a decision, it is not one.
- §14 lists what is explicitly undecided. Keep it honest.

## Known hazards

`docs/design/design-doc.md` §12 lists structural genre hazards drawn from all five reference games. Check proposals against it — most of the obvious ideas in this genre have a documented failure mode attached.

## The blocking question

**Q1: traversal is an escape tool; a bullet heaven requires encirclement.** This is unresolved and it blocks essentially everything else. It is to be answered by a grey-box prototype, not by argument. Do not let design work run ahead of it.
