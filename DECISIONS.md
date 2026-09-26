# Tablet optimisation — decisions log

Non-obvious choices made during the overnight tablet pass, with alternatives
considered. ⚠️ = review this one first.

## Breakpoint architecture

- **Tablet tier is `(min-width: 768px) and (max-width: 1279px)`**, written as
  a "— the tablet" block per section, mirroring the existing "— the phone"
  convention. Portrait-specific recomposition adds `and (orientation:
  portrait)`. Alternative considered: a global rem-based root scale — rejected
  because the site has zero rem usage and retrofitting it would touch every
  desktop rule.
- **Floors use `max(px, vw)`, not `clamp()`**: the file already has this exact
  pattern documented (global.css, the `.contact-input` reading-floor note) on
  five rules; `clamp()` appears nowhere. Ceilings are unnecessary inside a
  bounded tier. Every floor releases below 1280px so desktop never feels it.
- **The slider stage cap is a `min()` on the base rule, not a media query** —
  `min(var(--screen), 95vw)` only ever binds on a screen taller than 95vw,
  which IS the portrait-tablet condition; landscape, desktop and the phone's
  own 212vw height override are untouched by construction.

## Portrait recompositions (the dead-air class)

The site draws in vw, so every composition is identical at any width — but
pinned scenes centred in a `--screen-lg` stage show at half their desktop
presence in a frame twice as tall relative to the drawing. Fixes scale the
DRAWING, never the mechanics; every pin measures its own layout on refresh.

- **Giant pinning: the phone's documented move (×2.4) at ×1.8** — every
  staircase figure, the heading set separately to the width it fills. Unlike
  the phone, the prop scatter survives (×1.8 via `--gp-scale` multiplying the
  inline `--pw`) instead of being flattened to one width.
- **Super powers: card cap raised 26.667vw → 40vw at portrait.** The names
  ride beside it at 9.3vw under a measured budget — SUPER lays out at 2.26×
  its font size, POWERS at 3.0×; run the row over 100vw and the stage grid
  crushes the auto track, which clips the card stack to a sliver (this
  actually happened at 13vw and is why the sum is written in the block).
- **About: `--pill-h` 13.567vw → 17vw; the WE WANTED band to 145% width.**
  One token each; belt.ts and crawl.ts measure the laid-out result.
- **⚠️ Left alone on purpose**: the Reason curtain (a one-viewport wipe,
  identical in proportion to desktop), the giant→MakeItStick and reel→NextUp
  seams (one breather screen each, matching desktop's proportional pacing),
  and the /products six-across row — at 768+ the rolls are 144px+, BIGGER
  than the phone's own 3+3 gives a phone (117px), and tap-to-pick now lifts
  a roll for inspection; the sixth roll occasionally grazing the edge is the
  random scatter and happens at 1440 too.

## Touch interactions (all gated ≥768px so phones keep today's behaviour)

- **/products picking: first tap picks, second tap navigates.** The tap path
  binds capture-phase on the row and prevents the link only when the tapped
  roll is down. Alternative (tap always navigates) rejected — the recolour +
  cue moment is the section's whole reason to exist.
- ⚠️ **The pick cue still reads "click me!" on tablets.** Server-rendered
  artwork; re-wording per input needs a markup fork. Colloquially fine.
- **Hero poke on tap**: same bulge machinery, sprung back on a 350ms settle.
- **NextUp grow on press**, released by pointerup/cancel.
- **About CTA disc swap and EXPLORE ripple on `:active`** under
  `(hover: none)`; the existing `:hover` rules are wrapped in
  `(hover: hover)` so a tap's sticky synthetic hover can't park them
  mid-state. `:focus-visible` twins stay unconditional.
- **Menu link previews always open on wide touch screens** — a press reveal
  dies with the navigating tap. The phone (<768) keeps its no-preview call.
- **3D roll pointer-leans stay hover-only on tablets.** Reason/roll.ts was
  the one lean bound on touch and it froze toward the last tap; Hero idle.ts
  and note.ts had the same class of bug (no gate, no reset). All three are
  now gated `(hover: hover), (max-width: 767px)` — tablets get the fix, the
  float and the scroll-driven wind remain their life there. ⚠️ The phone
  branch deliberately KEEPS the stale-lean listener it has today, because
  the brief says mobile must behave exactly as it does now — bug included.
  Drop the `(max-width: 767px)` half of those three media lists whenever
  you want phones fixed too. Alternative (deviceorientation tilt) rejected:
  permission prompt on iOS kills the magic.

## WebGL

- **stickyNote DPR cap 3 → 2 on `(hover: none) and (min-width: 768px)`.**
  Desktop keeps 3 (raised for label legibility); phones keep 3 — the gate is
  width-and-input so mobile rendering is bit-identical. ⚠️ Could not measure
  real-device frame rates headlessly; if an older iPad still drops frames on
  the home page (4 WebGL contexts), the next lever is capping the hero tape
  canvas at DPR 1.5 on coarse pointers.

## Smooth scroll

- **Lenis stays `syncTouch: false`** (native touch scroll). iPadOS momentum
  and rubber-banding beat synthetic smoothing; ScrollTrigger already updates
  off the Lenis scroll event; the pins were built against native scroll on
  phones. Alternative (syncTouch: true) rejected: fights rubber-banding.
- **Viewport/orientation handling needed no work** — viewport.ts already pins
  `--screen`/`--screen-lg`, ignores height-only resizes on touch and listens
  to orientationchange. Verified live: rotating 820×1180 ↔ 1180×820 swaps the
  portrait tier in and out with no reload, no horizontal overflow, no errors.

## Content flags for the morning

- ⚠️ **The product page's reel note literally says "placeholder note"** (CMS
  copy, visible on /products/opp — readable now that notes have floors).
- The article's first screen shows the cream sheet with the copy revealing on
  first scroll — that is the design's own pacing (desktop frames the sheet
  edge at the fold; a portrait screen sees more of it). Not changed.
- The contact sticky note lapping "TOGETHER"'s tail is the design (identical
  at 1440); left alone.
- The footer's tape rolls piling over STICK BY YOU is the ball-pit at rest,
  identical at 1440; left alone.

## Process

- Before/after filmstrips live in `tablet-screenshots/{before,after}/` —
  gitignored (1.2GB+), reviewed on disk.
- Lighthouse runs against production builds of master and the branch in a
  disposable worktree on port 3100, tablet emulation (820×1180 @2x, mobile
  simulated throttling), never against `next dev`.

## Blocked / needs my input

(nothing blocked — the ⚠️ items above are review requests, not blockers)
