# Key visual — "card turn" animation (archived 2026-08-03)

The original key-visual swap in `src/components/TapeSlider/engine.ts`: a 3D turn
about the punch hole (rotationY out to edge-on, src swap at the zero-width
moment, open back out from the opposite edge), with a pendulum swing off the peg
that settles after the card has squared up.

Archived when trying out the clock-sweep swap (outgoing card sweeps 12 → 3
clockwise while scaling to 0; incoming card plays that in reverse; both
simultaneously). To restore, put each block below back where noted.

---

## 1. Constants (in `initTapeSlider`, replaces the `CARD_AT`/`CARD_SWAP`/`CARD_SWEEP` block)

```ts
const CARD_AT = 0.1; // turns almost on the click, ahead of the colour
const CARD_TURN = 0.9;
const CARD_DEPTH = 70; // px it withdraws at the edge-on moment
const CARD_TILT = 15; // deg it swings off the peg
const CARD_SETTLE = 1.5; // swing outlasts the turn's half by this much
```

## 2. `addCard` (replaces the clock-sweep version; also delete the `cardGhost`
##    declaration next to the other timeline handles and the `cardGhost` cleanup
##    line in the teardown — the turn animates the one `card` element only)

```ts
// Fastest where it is thinnest — power2.in into the edge, power2.out away
// from it — so the least time is spent edge-on.
function addCard(tl: gsap.core.Timeline, index: number, at: number) {
  const src = card && cardOf(rolls[index]);
  if (!card || !src) return null;

  const sub = gsap.timeline();
  const half = CARD_TURN / 2;

  sub.to(card, { rotationY: 90, z: -CARD_DEPTH, duration: half, ease: "power2.in" }, 0);
  sub.to(card, { rotation: -CARD_TILT, duration: half, ease: "power2.in" }, 0);

  sub.call(
    () => {
      card.src = src;
      // Jump to the opposite edge-on angle rather than carrying on to 180,
      // where the card faces away and its artwork would read mirrored. Same
      // zero-width silhouette, so the jump is invisible.
      gsap.set(card, { rotationY: -90 });
    },
    undefined,
    half
  );

  sub.to(
    card,
    {
      rotationY: 0,
      z: 0,
      duration: half,
      ease: "power2.out",
      // Start values must be read after the callback above, or this tweens
      // from 90 back to 0 and undoes the turn.
      immediateRender: false,
    },
    half
  );

  // The swing outlasts the turn, so the card is still settling after it has
  // squared up. That trailing motion is what reads as hanging on a peg.
  sub.to(
    card,
    {
      rotation: 0,
      duration: half * CARD_SETTLE,
      ease: "back.out(2.2)",
      immediateRender: false,
    },
    half
  );

  tl.add(sub, at);
  return sub;
}
```

## 3. Reduced-motion branch (inside `goTo`, the `if (reduced)` block)

```ts
if (card && cardOf(rolls[index])) {
  card.src = cardOf(rolls[index]);
  gsap.set(card, { rotationY: 0, rotation: 0, z: 0 });
}
```

## 4. Timeline sketch line (file header comment)

```
 *   0.10  |------- card turns -------|
```

## 5. CSS for `.key-visual img` in `src/styles/tape-slider.css` — restore BOTH
##    the comment and the `transform-origin` (the clock sweep moved it to
##    `50% 50%`; the turn pivots on the punch hole)

```css
/* The hang tag. It turns over on the axis of its own punch hole: the slot
   centre measures 48.25% / 17.3% of the artwork on all four cards, so one
   origin serves the whole set. rotationY uses the x for the turn, rotation
   uses both for the pendulum settle afterwards. */
```

```css
transform-origin: 48.25% 17.3%;
```

Related, unchanged by the swap: the `perspective: 900px` on `.key-visual` and
`backface-visibility: hidden` on the img exist for this turn (the clock sweep
is 2D and doesn't need them); the showcase pair's `addShowcase` still does its
own edge-on flip and was never coupled to this code.
