# Tablet audit — SweetTape

Audited 2026-09-26 on branch `tablet-optimisation`, against the live dev build.
"Before" filmstrips: `tablet-screenshots/before/<page>/<viewport>/NN.png` — one
frame per viewport-height of a single top-to-bottom scroll, at 768×1024,
820×1180, 834×1194, 1024×1366, 1024×768, 1180×820, 1366×1024, 800×1280, plus
1440×900 (desktop reference) and 390×844 (mobile reference).

## How sizing works today

- **One stylesheet** (`src/styles/global.css`, 21k lines), 1,642 vw lengths,
  **zero `clamp()`**, one width breakpoint: `@media (max-width: 767px)`.
  House convention: every section ends with a "`<Section> — the phone`" block
  that overrides section-local custom properties (`--*-size`, `--*-scale`)
  re-derived against a 390 design width.
- **A 768–1279px viewport gets the raw desktop vw values.** At 768px, 1vw =
  7.68px, so every font-size below ~1.4vw lands under 11px.
- Five text rules already carry the house floor pattern `max(Npx, Nvw)`
  (`.article-para`, `.contact-input`, `.stick-sub`, `.article-share-label`,
  `.article-back`) — the rationale is written at global.css:13823. The tablet
  tier extends exactly this pattern.
- **Viewport height is already solved.** `--screen`/`--screen-lg` are
  registered lengths (100svh / 100lvh), pinned to px on touch by
  `src/components/viewport.ts`, which also ignores height-only resizes on
  touch and handles `orientationchange`. No work needed there.
- **Smooth scroll is already touch-safe.** Lenis 1.3 runs with
  `syncTouch: false` → native touch scroll with momentum; Lenis only smooths
  wheel/trackpad. ScrollTrigger updates off the Lenis scroll event either way.
  Kept as-is (see DECISIONS.md).
- JS breakpoints: only two, both `(max-width: 767px)` — `ProductReel/pin.ts:142`
  and `Siblings/reveal.ts:232`. Tablets take the desktop path in both.
- Input gating: `(hover: hover)` / `(pointer: fine)` guards in 7 JS modules;
  **zero** `@media (hover/pointer)` rules in CSS.

## Prioritised issues

### P0 — broken or illegible on every tablet viewport

1. **Unreadable base type between 768–1279px.** Worst offenders at 768px
   (desktop value → rendered size): `.conveyor-index` 0.694vw → 5.3px;
   `.footer-legal` 0.9vw → 6.9px; `--note-fs` (all hand-written notes,
   pick-cue ink) 0.9722vw → 7.5px; `.conveyor-note` → 7.5px; `.menu-sound` →
   8.1px; `.roll-it`, chips (`.tag .h6`, `.subhead`, `.rolling-tag`,
   `.story-chip`, `.article-chip`), `.index-tab-count`, `.index-kind`,
   `--date-month` 1.111vw → 8.5px; `.subtext .h5` → 8.6px;
   `--pow-copy-size` → ≤8.8px; `.corner-mark`, `.menu-tab-sheet`, `.top-note`
   1.389vw → 10.7px. Fix: px floors per the house `max()` pattern, scoped to a
   tablet tier so desktop ≥1280 is untouched.
2. **Touch devices lose every hover interaction with no replacement**
   (`/products` roll picking + page recolour + cue, hero letter poke, menu
   link thumbnails, About CTA disc swap, EXPLORE ripple, NextUp roll grow,
   3D-roll pointer leans). Each needs a deliberate touch equivalent — see
   the interaction plan below.
3. **Two genuine touch bugs**: `Hero/idle.ts` (no gate, no reset — after the
   hero finale the roll stays leaning toward the last touch point forever)
   and `Hero/note.ts` (sticky-note ruffle keeps the last touch point and
   re-applies it against scroll every frame). `Reason/roll.ts` is the only
   ungated lean (its siblings gate on hover).

### P1 — layout collisions / cramped composition (portrait tablet)

4. **Contact**: the pinned yellow sticky note overlaps the "LET'S STICK
   TOGETHER" headline at 768–834 portrait (before/contact/768x1024/00.png).
   The desktop places it beside the title; portrait needs it moved off the
   title line.
5. **Home / tape slider**: bottom-left copy block collides with the
   bottom-left nav disc; the left column chips are phone-small; the giant
   word behind the cards is clipped mid-letter (768x1024/02.png).
6. **Home / giant pinning**: at portrait the pan frame shows the headline cut
   at the left screen edge mid-scrub; small hand-note illegible
   (768x1024/06.png).
7. **Product page (SuperPowers / ProductReel / Siblings)**: desktop pinned
   compositions run at portrait aspect — frames sized off `screenH()` in a
   viewport that is taller than wide; copy at ≤8.8px inside the powers cards.
   Portrait needs recomposed sizing inside the same pinned scenes.
8. **Hand-written notes everywhere** (`--note-fs`): illegible at every
   tablet size.

### P2 — comfort / polish

9. **Tap targets**: `.menu-sound` (~8px text), footer social discs, slider
   step dots, article share links — several land under 44px between 768 and
   1024. Audit each in its tablet block.
10. **Masthead**: `--top-mark-w: 9vw` → 69px at 768 (fine), but `--top-inset:
    1.2vw` → 9px edge padding is tight; corner-mark type at 10.7px.
11. **stickyNote.ts renders at DPR cap 3** (every other canvas caps at 2) —
    wasteful on 2× tablets; four WebGL contexts live on the home page.
12. **Safe-area insets**: nothing uses `env(safe-area-inset-*)`; the fixed
    menu tab and sound button sit at the viewport edge. Low risk on iPad
    (insets are 0 in browser chrome except the home indicator), noted for
    completeness.

## Breakpoint strategy

- **Width tier**: `@media (min-width: 768px) and (max-width: 1279px)` —
  "the tablet" — placed per section between the desktop rules and the
  existing "— the phone" block, following the same custom-property-override
  convention. Portrait-specific recomposition uses
  `... and (orientation: portrait)` inside the tier. Landscape tablet rides
  the desktop composition plus the floors.
- **Sizing style**: `max(<px floor>, <existing vw>)` inside the tier (keeps
  scaling fluid — the vw term still governs above the floor). No `!important`,
  no hard px jumps. Desktop ≥1280 and phone ≤767 are untouched by
  construction.
- **Input tier**: `@media (hover: hover)` around hover-reveal rules;
  `@media (hover: none)` for touch alternatives. JS keeps its existing
  matchMedia guards; touch paths added beside them. Width never implies
  input capability: a 1366px iPad stays a touch device.

## Touch interaction plan

| Interaction | Desktop | Tablet equivalent |
|---|---|---|
| /products roll picking | hover lifts roll, recolours page, shows cue | first tap picks (lift + recolour + cue), second tap navigates |
| Hero "STICK BY YOU" poke | letters hop away from cursor | tap pokes the letters around the touch point, springs back |
| Menu link thumbnails | slot opens on hover | thumbs always visible on touch (slot open) |
| About CTA disc swap | disc slides across on hover | plays on press (`:active`) |
| EXPLORE sticker ripple | ripple on hover | ripple on press (`:active`) |
| NextUp roll grow | grows while pointer rests | grows on press, settles on release |
| 3D roll pointer leans (slider, product intro, about reason, hero idle) | roll leans toward cursor | rest pose + ambient float (leans read wrong when tied to taps; float keeps the object alive) |
| Custom cursor | `(pointer: fine)` only | correctly absent on touch — no change |
| Footer ball pit, LOGO peel game, slider orbit | already pointer/tap driven | no change needed |

## WebGL / perf plan

- Cap `stickyNote.ts` DPR at 2 on coarse pointers (aligns with every other
  renderer; its cap of 3 exists for close-up label text on desktop).
- Leave the existing DPR 2 caps and dirty-flag rendering as they are; no
  post-processing exists to trim. Real-device frame-rate on older iPads is
  unverifiable headlessly — flagged in DECISIONS.md.

## Regression guarantees

- Desktop ≥1280 (fine pointer): all tablet rules live inside
  `(max-width: 1279px)` or `(hover: none)` media — no desktop selector is
  edited except where a hover rule gains an `(hover: hover)` wrapper with
  identical declarations.
- Mobile ≤767: phone blocks come later in each section and keep overriding;
  the tablet tier's `min-width: 768px` bound cannot reach them.
- Verified by re-shooting 1440×900 and 390×844 after every section and
  comparing against `tablet-screenshots/before`.
