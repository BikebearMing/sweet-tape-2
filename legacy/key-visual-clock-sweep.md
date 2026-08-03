# Key visual — "clock sweep" animation (archived 2026-08-03)

The short-lived 2D experiment between the card turn and the 3D GLB flip: the
outgoing card swept 12 → 3 clockwise about its centre while scaling to 0 on a
throwaway clone, and the incoming card played the journey in reverse a beat
later, its rotation ringing down on an elastic ease. Scrapped in favour of the
3D roll (`tape3d.ts`); the predecessor "card turn" is archived in
`key-visual-card-turn.md`.

## Constants (in `initTapeSlider`)

```ts
const CARD_AT = 0.1; // swaps almost on the click, ahead of the colour
const CARD_SWAP = 0.7;
const CARD_SWEEP = 90; // deg of clock travel: 12 o'clock round to 3 o'clock
const CARD_LAG = 0.15; // incoming card starts this beat after the outgoing
const CARD_SETTLE = 1.6; // rotation outlasts the scale by this much
const CARD_BOUNCE = "elastic.out(1.4, 0.55)"; // wobbles either side of 12, decaying
```

## `addCard` (plus `let cardGhost: HTMLImageElement | null = null;` beside the
## timeline handles, `cardGhost?.remove(); cardGhost = null;` in the teardown,
## and `gsap.set(card, { rotation: 0, scale: 1 })` in the reduced-motion branch)

```ts
function addCard(tl: gsap.core.Timeline, index: number, at: number) {
  const src = card && cardOf(rolls[index]);
  if (!card || !src) return null;

  cardGhost?.remove();
  const ghost = card.cloneNode(false) as HTMLImageElement;
  ghost.style.position = "absolute";
  ghost.style.top = "0";
  ghost.style.left = "0";
  card.parentElement!.appendChild(ghost);
  cardGhost = ghost;

  card.src = src;
  gsap.set(card, { rotation: CARD_SWEEP, scale: 0 });

  const sub = gsap.timeline();

  sub.to(ghost, { rotation: CARD_SWEEP, scale: 0, duration: CARD_SWAP, ease: "power2.in" }, 0);
  sub.to(card, { scale: 1, duration: CARD_SWAP, ease: "power2.out" }, CARD_LAG);
  sub.to(
    card,
    { rotation: 0, duration: CARD_SWAP * CARD_SETTLE, ease: CARD_BOUNCE },
    CARD_LAG
  );

  sub.call(
    () => {
      ghost.remove();
      if (cardGhost === ghost) cardGhost = null;
    },
    undefined,
    CARD_SWAP
  );

  tl.add(sub, at);
  return sub;
}
```

CSS at the time: `transform-origin: 50% 50%` on `.key-visual img` (centre
pivot), no perspective needed.
