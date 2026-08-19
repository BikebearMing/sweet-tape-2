/* Sweet Tape — the six rolls, scattered and picked up one at a time.
 *
 * Adapted from Made With GSAP's effect025, which fans a row of overlapping
 * testimonial cards. The mechanism is theirs and worth stating plainly, because
 * it is not the obvious one: the row is divided into as many equal PORTIONS as
 * there are objects, and the pointer's portion — not the element under the
 * pointer — is what selects. A card that has been scaled up and straightened is
 * no longer where it was, so hit-testing the elements themselves means the thing
 * you just lifted moves out from under the cursor and drops again, and the row
 * flickers between two states down every seam. Portions are fixed to the ROW,
 * and the row never moves.
 *
 * WHAT IS DIFFERENT HERE, and it is most of it:
 *
 *   The objects are printed circles, not cards, and they lap each other by a
 *   sliver rather than by half. So the push on the neighbours is a fraction of
 *   the reference's — it exists to clear the lap and let the picked roll be seen
 *   whole, not to open a gap in a deck.
 *
 *   The picked roll comes to the FRONT. The reference leaves z-index to a
 *   fixed, deliberately jumbled set of CSS values, which is right for a wall of
 *   quotes and wrong for a product row: these are six things you are choosing
 *   between, and the one being looked at cannot be behind its neighbour. The
 *   stacking is plain left-to-right (each roll laps the one before it, as the
 *   design draws it) and the active one is lifted clear of all of them.
 *
 *   Nothing binds without a hover. The reference listens for mousemove
 *   unconditionally; on a touch screen a tap synthesises one, so a roll lifts,
 *   stays lifted, and can never be put down again because there is no
 *   mouseleave coming. `(hover: hover)` is the whole fix — the scatter and the
 *   deal still run, the picking does not.
 *
 * THE SCATTER IS THE REST POSE, not a starting position: every roll is put down
 * a little off square and a little turned, and a roll that has been picked up
 * and released is scattered AGAIN, to a new angle. That is what keeps the row
 * from settling into an arrangement — it is six things dropped on a table, and
 * they are never twice in the same place. It is also why the values are drawn
 * fresh in restPose() rather than measured once and kept.
 *
 * NOTHING ARRIVES HERE, and that is a decision rather than an omission. The
 * rolls did have an entrance for a while — dealt out left to right as the cover
 * cleared, fading up into the scatter — and it was taken off. The type on this
 * page already arrives twice over, the headline letter by letter and the small
 * print line by line, and a row of six large objects dropping in underneath
 * turned the top of the page into a queue of things happening. The rolls are
 * simply already on the table, and the first movement on this page is the
 * reader's own.
 *
 * What that buys beyond the look of it: the pointer is bound the moment this
 * runs. With an entrance it could not be — a hover part-way through the deal
 * would put a second tween on the same transform — so the row used to be inert
 * for the length of the drop, at the very top of the page, which is exactly
 * where a reader's hand already is.
 */
import gsap from "gsap";

export const PICK_FAN = {
  /* THE SCATTER, each as a full spread — a roll lands somewhere in ±half of
     these. Percentages of the roll's own box, so they hold at every width.

     Smaller than the reference's ±10/±10/±20 in every axis, and the rotation is
     why. These are circles with type printed around the rim: past about ten
     degrees the reader stops seeing a roll put down at an angle and starts
     seeing a word mark that is crooked, which is a different and much worse
     impression. The row is also nearly a full viewport wide against the
     reference's much tighter deck, so the same displacement in vw reads as
     twice as much drift. */
  SCATTER_X: 7,
  SCATTER_Y: 9,
  SCATTER_R: 11,

  /* The pick: square on, and up off the sheet. 1.18 rather than the reference's
     1.1 because a circle has no corners to announce a size change with — the
     same ratio reads as less on a disc than on a card. */
  LIFT: 1.18,

  /* And OFF THE LINE as well as bigger — the picked roll rises out of the row
     rather than only swelling in place. A percentage of the roll's own box, so
     it holds at every width like the scatter does; negative is up.

     7 of an 18.7vw roll is a little over a vw, which is deliberately less than
     the eye first wants: the row stands on a drawn rise with a dashed guide
     ruled through it (see .pick-guide in global.css), and a roll that clears
     that line altogether stops reading as one of six on a shelf and starts
     reading as a thing floating above them.

     It rides the same tween as the scale, so the elastic below carries BOTH —
     the roll overshoots its height and its size together and rocks back as one
     movement. Splitting them into two tweens would give a lift that arrives and
     a swell that arrives after it, which is two things happening to one roll. */
  RISE: -7,

  /* How far the roll NEXT to the picked one slides away, as a percentage of its
     own width; the one beyond it gets half of that, and so on out to the ends
     (the 1/n fall-off is the reference's, and it is what makes the row bow away
     from the pick rather than shunt sideways).

     The rolls lap by about a seventh of their width (--pick-lap in global.css),
     so 30 clears the neighbour off the picked roll with a little daylight to
     spare. The reference uses 80 and needs to: its cards lap by HALF, and
     anything less would leave the picked one still buried. */
  PUSH: 30,

  /* The reference's elastic settle, kept. It is the whole character of the
     effect — the roll overshoots square and rocks back, which is what a thing
     picked up and put down does, and a power ease in its place reads as a
     menu item highlighting. */
  DURATION: 0.8,
  EASE: "elastic.out(1, 0.75)",
};

/** One roll, in the three boxes this file drives it through. */
type Roll = {
  /** The place in the row. Never transformed — it carries the stacking. */
  card: HTMLElement;
  /** The scatter, the straightening and the lift. */
  tilt: HTMLElement;
  /** The artwork, and the only thing the push moves. */
  face: HTMLElement;
};

/* Where a roll lands when it is put down. Drawn fresh every time — see the
   note at the top about why this is not measured once and kept. */
function restPose() {
  return {
    xPercent: (Math.random() - 0.5) * PICK_FAN.SCATTER_X,
    yPercent: (Math.random() - 0.5) * PICK_FAN.SCATTER_Y,
    rotation: (Math.random() - 0.5) * PICK_FAN.SCATTER_R,
  };
}

/**
 * Starts the row's scatter and its picking.
 *
 * @param root the <section class="pick-player">
 * @param onPick told which roll is being looked at, or null when the row is
 *   left. This file does not know or care what happens with that — the page's
 *   colour change is recolour.ts's business, and keeping the two apart is what
 *   lets either be turned off without the other noticing.
 * @returns the teardown, which leaves the row square and readable
 */
export function initPickFan(
  root: HTMLElement,
  onPick: (roll: HTMLElement | null) => void = () => {},
): () => void {
  const row = root.querySelector<HTMLElement>(".pick-fan");
  if (!row) return () => {};

  const cards = Array.from(root.querySelectorAll<HTMLElement>(".pick-roll"));
  const rolls = cards
    .map((card) => ({
      card,
      tilt: card.querySelector<HTMLElement>(".pick-roll-tilt"),
      face: card.querySelector<HTMLElement>(".pick-roll-face"),
    }))
    .filter((r): r is Roll => !!r.tilt && !!r.face);

  /* All or nothing. A half-built row would scatter some rolls and leave others
     square, which looks like a rendering fault rather than a missing element. */
  if (!rolls.length || rolls.length !== cards.length) return () => {};

  /* Six rolls twitching under the cursor is exactly what the setting is asking
     about, and the row with nothing running is the row the design draws: square,
     evenly lapped, in order. There is nothing to park and nothing to release —
     unlike the type on this page, the rest pose here IS the stylesheet's. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const count = rolls.length;

  /* Which portion of the row the pointer is in, 1-based. 0 is none — the row
     has not been entered, or has been left. The reference's convention, kept
     because the guard it buys is real: "no portion" and "the first portion" are
     genuinely different states and a 0-based index cannot tell them apart. */
  let picked = 0;

  /* Lifted clear of every card. The stylesheet stacks the row left to right at
     calc(--i + 2) — the +2 clears the rise and the guide behind it — so one
     above the last of those is above all of them. The two numbers have to
     agree; see .pick-roll in global.css.

     It cannot collide with anything outside the row, whatever it is set to:
     .pick-stage is a stacking context of its own (isolation: isolate), which is
     what keeps this conversation away from the footer's z-index.

     Written to the card and not the tilt: z-index needs a positioned element,
     and the card is the one that never moves. */
  const TOP = count + 2;

  function pickUp(i: number) {
    rolls[i].card.style.zIndex = String(TOP);

    /* The card and not the tilt: the tape's palette is on the element the
       markup put it on, and the tilt is a box this file invented to move. */
    onPick(rolls[i].card);

    gsap.to(rolls[i].tilt, {
      /* Square on, and up. The scatter is undone rather than added to — this is
         the one roll in the row that is being looked at straight — and the rise
         then replaces its random y outright rather than being added to it, so
         every picked roll comes up to the SAME height whatever it was scattered
         to. A roll that rose by a fixed amount from wherever it happened to lie
         would leave the six picks at six different heights. */
      xPercent: 0,
      yPercent: PICK_FAN.RISE,
      rotation: 0,
      scale: PICK_FAN.LIFT,
      duration: PICK_FAN.DURATION,
      ease: PICK_FAN.EASE,
    });

    /* Everything else bows away from it, and the picked roll's own artwork is
       centred in case it was pushed while its neighbour was up. Negative on the
       left of the pick and positive on the right, because (j - i) carries the
       side in its sign — the whole direction of this move is that subtraction,
       which is worth knowing before changing it. */
    rolls.forEach(({ face }, j) => {
      gsap.to(face, {
        xPercent: j === i ? 0 : PICK_FAN.PUSH / (j - i),
        duration: PICK_FAN.DURATION,
        ease: PICK_FAN.EASE,
      });
    });
  }

  /* Put back down — at a NEW angle, which is the scatter's whole point. The
     stacking goes back to the stylesheet's rather than to a number, so the row's
     order is stated in exactly one place. */
  function putDown(i: number) {
    rolls[i].card.style.zIndex = "";
    gsap.to(rolls[i].tilt, {
      ...restPose(),
      scale: 1,
      duration: PICK_FAN.DURATION,
      ease: PICK_FAN.EASE,
    });
  }

  /* An arrow bound to a const rather than a hoisted `function` like the two
     above, and the difference is not style: a function declaration is hoisted
     over the null check on `row` at the top of this file, so TypeScript will not
     carry that check into it. This form is defined after the check and keeps
     it. */
  const onMove = (e: MouseEvent) => {
    /* Measured per move rather than cached at bind time, which is the one place
       this departs from the reference for correctness rather than for design:
       it caches clientWidth once, so the portions are wrong for the rest of the
       session after a resize — and every length on this site is in vw, so a
       resize moves this row every time. Six elements' worth of layout read on a
       pointer move is not a cost worth caching against. */
    const box = row.getBoundingClientRect();
    if (box.width <= 0) return;

    /* Ceil, so 0 stays "outside" and the first portion is 1. */
    const active = Math.ceil(((e.clientX - box.left) / box.width) * count);
    if (active === picked || active < 1 || active > count) return;

    if (picked !== 0) putDown(picked - 1);
    picked = active;
    pickUp(picked - 1);
  };

  function onLeave() {
    if (picked !== 0) putDown(picked - 1);
    picked = 0;
    onPick(null);

    /* Every roll's artwork back to the middle of its own box. One tween over
       the whole set: they are returning to the same place, and there is nothing
       to stagger. */
    gsap.to(
      rolls.map((r) => r.face),
      { xPercent: 0, duration: PICK_FAN.DURATION, ease: PICK_FAN.EASE },
    );
  }

  /* Put down, one at a time — a single gsap.set over the whole row would give
     all six the SAME random pose, which is a row leaning as one and not a row
     scattered.

     This is the section's only unconditional write, and it happens on mount
     rather than at the preloader's hand-off. It can: the rolls are square and
     in order until it lands, which is a row that would be perfectly happy to be
     seen — so there is nothing to hide behind the cover and no gate to wait
     for. The type on this page is the opposite case and is held (reveal.ts). */
  const tilts = rolls.map((r) => r.tilt);
  tilts.forEach((tilt) => gsap.set(tilt, restPose()));

  /* Bound straight away, with no entrance to wait out. The only condition is
     the pointer itself: on a touch screen a tap synthesises a mousemove and
     never sends the mouseleave that would put the roll back down, so the row
     would keep whichever roll was last touched lifted for good. */
  const ac = new AbortController();
  if (window.matchMedia("(hover: hover)").matches) {
    row.addEventListener("mousemove", onMove, {
      signal: ac.signal,
      passive: true,
    });
    row.addEventListener("mouseleave", onLeave, { signal: ac.signal });
  }

  return () => {
    ac.abort();
    /* Kill by target, not by handle: the picks are fire-and-forget tweens with
       no reference kept, and a teardown mid-pick would otherwise leave one
       running against an element React is about to re-scatter. */
    gsap.killTweensOf(tilts);
    gsap.killTweensOf(rolls.map((r) => r.face));
    /* Square and readable, and the stacking back to the stylesheet's. A
       StrictMode remount must not leave a roll at 1.12 with nothing left
       running to put it down. */
    gsap.set(tilts, { clearProps: "transform" });
    gsap.set(
      rolls.map((r) => r.face),
      { clearProps: "transform" },
    );
    rolls.forEach(({ card }) => {
      card.style.zIndex = "";
    });
  };
}
