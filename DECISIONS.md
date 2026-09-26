# Tablet optimisation — decisions log

Non-obvious choices made during the overnight tablet pass, with alternatives
considered. ⚠️ = review this one first.

## Breakpoint architecture

- **Tablet tier is `(min-width: 768px) and (max-width: 1279px)`**, written as
  a "— the tablet" block per section, mirroring the existing "— the phone"
  convention. Alternative considered: a global rem-based root scale — rejected
  because the site has zero rem usage and retrofitting it would touch every
  desktop rule.
- **Floors use `max(px, vw)`, not `clamp()`**: the file already has this exact
  pattern documented (global.css:13823) on five rules; `clamp()` appears
  nowhere. Ceilings are unnecessary inside a bounded tier.

## Smooth scroll

- **Lenis stays `syncTouch: false`** (native touch scroll). iPadOS Safari's
  own momentum + rubber-banding beats synthetic touch smoothing, ScrollTrigger
  already updates off the Lenis scroll event, and the pinned sections were
  built against native scroll on phones. Alternative (syncTouch: true)
  rejected: it fights rubber-banding on iPadOS and risks pin jitter.

## Touch interactions

- **/products picking: first tap picks, second tap navigates.** Alternative
  (tap always navigates, as today) rejected — the recolour + cue moment is the
  section's whole reason to exist and tablets never saw it.
- ⚠️ **The pick cue still reads "click me!" on tablets.** The cue artwork is
  server-rendered; re-wording per input needs a markup fork. Left as-is —
  colloquially fine, but flag if you want a "tap me!" variant.
- **3D roll pointer-leans stay desktop-only.** A lean tied to taps reads as a
  glitch (it snaps toward the last touch and freezes — that exact bug existed
  in Hero/idle.ts). The ambient float keeps the rolls alive on tablet.
  Alternative (deviceorientation tilt) rejected: permission prompt on iOS
  kills the magic.
- **Menu thumbnails always visible on touch** rather than revealed on press —
  a press reveal dies with the navigation tap; always-on reads as designed.

## WebGL

- **stickyNote DPR cap 3 → 2 on coarse pointers only.** Desktop keeps 3 (it
  was raised for label legibility on close inspection). ⚠️ Could not measure
  real-device frame rates headlessly; if an older iPad still drops frames on
  the home page (4 WebGL contexts), the next lever is capping the hero tape
  canvas at DPR 1.5 on coarse pointers.

## Blocked / needs my input

(nothing yet)
