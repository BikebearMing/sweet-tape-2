# Tablet optimisation — morning report

Branch `tablet-optimisation`, 13 commits on top of `f94c75b` (master).
992 insertions, 85 deletions across 17 files — the bulk in global.css as
"— the tablet" blocks mirroring the house "— the phone" convention.
**Nothing is merged; master and the live site are untouched.**

The tier: **744–1279px** (portrait recompositions add `orientation:
portrait`). It began as 768–1279 per the brief; the floor moved to 744 after
the owner's iPad mini (744px portrait) surfaced mid-review — see Decisions.

## Per-section changes

**Reading & target floors everywhere** (`b3f0938`) — house-style
`max(px, vw)` floors, never `clamp()`: corner marks, chips/tags/subheads,
slider subtext, news index dates/counts/titles, article share buttons
(≥44px), 404 CTA, about conveyor captions, footer legal, menu sound toggle
(≥44px), sticky-note tokens, top band. Every floor releases below 1280px so
desktop never feels it.

**Portrait recomposition of the pinned scenes** (`7d267ce`, `6e83a77`,
`d75836c`) — the site draws in vw, so a portrait frame twice as tall as the
drawing left pinned scenes swimming in dead air:

- Giant staircase: the phone's documented move at ×1.8 — props survive via
  a `--gp-scale` multiplier instead of being flattened to one width.
- Slider stage: the screen term capped at 95vw via `min()` in the base rule
  — self-scoping, no media query needed; the section ends where the drawing
  does.
- Super powers: card cap 26.667vw → 40vw, names at 9.3vw under a measured
  width budget (the stage grid crushes the card stack if the row overflows
  100vw — the budget is written in the block).
- About: conveyor pill 13.567vw → 17vw, WE WANTED band to 145%.

**Touch equivalents for every hover interaction** (`3e8c381`, `8c222bf`) —
all gated to the tier so phones keep today's behaviour bug-for-bug:

- /products: first tap picks a roll up, second tap navigates.
- Hero roll: tap pokes, springs back on a 350ms settle.
- Next-up cards grow on press, release on pointerup/cancel.
- About CTA disc swap and EXPLORE ripple on `:active` under `(hover: none)`;
  `:hover` originals wrapped in `(hover: hover)` so a tap's sticky synthetic
  hover can't park them mid-state. `:focus-visible` twins unconditional.
- Menu link previews always visible on wide touch screens.

**Pointer-lean bug fixes** (`7c8ec77`, `58be4d0`) — three 3D leans (hero
idle, hero note, reason roll) froze toward the last tap on touch; now gated
`(hover: hover), (max-width: 743px)`. The phone half of that list is
deliberate: it keeps the phone's shipped stale-lean bug per the brief. Drop
the `(max-width: 743px)` term in those three files to fix phones too.
Sticky-note DPR capped 3 → 2 on `(hover: none) and (min-width: 744px)`.

**Tier floor 768 → 744** (`66bc52e`) — one token across 46 media queries
and 10 script gates; verified live that 743/744 flips phone/tablet cleanly.

## Lighthouse (tablet profile: 820×1180 @2x, LH 12.8.2, production builds)

| page          | before (master) | after (branch) |
|---------------|-----------------|----------------|
| home          | perf 29 · a11y 98 | perf 29 · a11y 98 |
| /products/opp | perf 29 · a11y 94 | perf 29 · a11y 94 |

One home run scored a11y 94: `target-size` flagged a 104×104px footer ball
— the Matter.js pile lands differently every load and had settled two rolls
overlapping. Re-run passed at 98; zero diff to the footer in this branch.
Perf 29 is the site's WebGL weight, identical both sides — this pass adds
no runtime dependencies and no new work on the hot path.

## Screenshots

`tablet-screenshots/{before,after}/<page>/<WxH>/f##.png` — full-page
filmstrips, one frame per screen, human scroll pace. 8 tablet viewports ×
7 pages plus 390×844 and 1440×900 reference tiers (in both sets to prove
phone and desktop unchanged), the iPad mini pair (744×1133, 1133×744) on
home, and `_interactions/` proof shots (menu open, roll picked, rotation
survival). Provenance notes — including which frames were re-shot after the
database outage — in `tablet-screenshots/NOTE.md`.

## Owner decisions taken this morning (2026-09-26)

- "click me!" cue on touch: **leave as is.**
- /products/opp "placeholder note": **owner writing real copy in the CMS.**
- Real-iPad frame rates: **owner testing on device.** If an older iPad
  drops frames, next lever is hero tape canvas DPR 1.5 on coarse pointers.

## Incident: the database outage (now resolved, separate from this branch)

Mid-after-sweep, Neon's free-plan monthly compute quota ran out and took
dev AND the live site down (shared project). Short-term: owner linked a
card. Same day the database moved to the VPS (Dokploy-managed Postgres 18,
no public port, nightly 3am dumps kept 14 days, restore instructions in
`/home/deploy/backup-db.sh` on the VPS). Local dev reaches it through
`scripts/db-tunnel.sh`. Neon is safe to downgrade. The tablet screenshots'
two-sitting provenance is the only mark this left on the branch.

## Regression guarantees

- **Desktop (≥1280px)**: every floor and block releases at 1280; 1440×900
  before/after filmstrips match. No `!important` anywhere in the pass.
- **Phones (≤743px)**: tablet rules can't reach below 744; 390×844
  before/after filmstrips match; the three lean gates keep the phone's
  shipped listener by explicit exemption.
- **Landscape tablets**: the slider stage is capped at 82vw in the tier —
  a 4:3 screen otherwise carries 93vw of stage (vs a laptop's 80) under a
  drawing that ends near 75vw, which is the bare field the owner kept
  catching. Desktop 1440×900 re-measured unchanged after the cap (1159px).
- Clean `next build` (Turbopack) and `tsc --noEmit` at the branch tip.

## What's left

Nothing blocking. Review the filmstrips, test on your iPad
(`http://192.168.0.9:3000` on your Wi-Fi hits the dev server), write the
CMS note, then merge when satisfied.
