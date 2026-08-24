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
 * THE ROLLS ARE DROPPED ONTO THE LINE as the cover clears — see PICK_DROP.
 * Each one blinks into being a little above where it is going to stand, swells
 * out of nothing with a shade of overshoot, then falls onto the row and bounces
 * there the way a ball put down too hard does. Left to right, a beat apart, so
 * the row is DEALT rather than switched on.
 *
 * IT IS TIMED TO LAND WITH THE HEADLINE AND NOT AFTER IT, which is the whole of
 * how it stays out of the way of the rest of the page. There was an entrance
 * here once before and it was taken off for exactly the reason a careless one
 * fails: the type on this page already arrives twice over — the headline letter
 * by letter (reveal.ts) and the small print line by line (bodyReveal.ts) — and
 * six large objects dropping in AFTERWARDS turns the top of the page into a
 * queue of things happening. So this one is dealt off the same cue as the
 * headline, a hair behind it, at a length that puts the last roll on the line at
 * about the moment the last letter comes up under its mask. One arrival, two
 * voices, not two arrivals. Retune either and check the other: the numbers that
 * have to agree are PICK_DROP's total against REVEAL.DELAY + REVEAL.DURATION +
 * PICK_REVEAL.STAGGER × the letter count.
 *
 * The small print is deliberately NOT in that reckoning — it is scroll-cued and
 * below the row, and it arrives when the reader gets to it.
 *
 * AND THE ROW IS LIVE THE MOMENT IT STARTS FALLING. The reason the old entrance
 * left the row inert was that a hover part-way through the deal would put a
 * second tween on the same transform. It does not have to: a pick during the
 * fall simply KILLS that roll's drop and lifts it from wherever it had got to
 * (see pickUp). One roll, one tween, always — and no dead half-second at the
 * top of the page, which is exactly where a reader's hand already is.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

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

/* THE ENTRANCE — the six rolls dropped onto the line, left to right.
 *
 * Two tweens per roll on the SAME element and deliberately not one, which is
 * the opposite call to the pick above (where the lift and the swell share a
 * tween because they are one movement). Here they are two movements with two
 * different physics: a thing appearing, and a thing falling. They want two
 * curves, they run on two transform components, and GSAP is perfectly happy to
 * hold both at once on one target.
 *
 * NOTHING FADES. Not opacity, not a filter — the roll's artwork carries a hard
 * drop shadow (see .pick-roll-face in global.css) and fading a shadow that is
 * meant to be cast on a sheet reads as a print fault. It arrives at size 0 and
 * grows, which needs no second property and stays on the compositor.
 */
export const PICK_DROP = {
  /* How far above its resting place a roll starts, as a percentage of its own
     box — so it holds at every width, like the scatter and the lift do.

     Read it as the drop's HEIGHT rather than as a hiding place: the fall is
     short and quick, not a descent from off-screen. A third of a roll is about
     6vw, which keeps every one of them clear of the headline writing itself
     above — a roll that starts higher crosses the type on the way down and the
     two moves start reading as one collision. */
  FROM: -34,

  /* The pop. back.out is the overshoot — the roll swells a hair past full size
     and settles back — which is the bounce on the SCALE, and it is a different
     bounce from the one the floor gives it a moment later.

     Short: it is done before the fall is half over, so what the reader sees is
     a roll that is already itself by the time it lands rather than one still
     growing while it bounces. */
  POP_DURATION: 0.42,
  POP_EASE: "back.out(2.2)",

  /* The fall. bounce.out IS gravity and the bounce in one curve, which is why
     there is no second tween here doing the hops by hand: its first phase is a
     quadratic accelerating toward the floor — a thing dropped — and what
     follows is three decaying hops that land it exactly on its mark. */
  FALL_DURATION: 0.95,
  FALL_EASE: "bounce.out",

  /* The fall starts a beat after the pop, so a roll is seen to ARRIVE and then
     seen to drop, rather than doing both from the same frame. Small enough that
     it is felt as weight rather than counted as a pause. */
  FALL_OFFSET: 0.08,

  /* Between rolls, left to right — a deal, not a switch. Six of these is a
     third of a second across the whole row, which is under the length of one
     roll's own fall: the row is always MID-drop somewhere rather than passing a
     baton down the line. */
  STAGGER: 0.06,

  /* After the cover clears. Behind the headline's own delay (REVEAL.DELAY,
     0.3) — the type is the first thing to move on this page and the rolls come
     up under it — but not by much, because the whole point is that the two land
     together. See the note at the top of this file for the arithmetic. */
  DELAY: 0.15,
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
    /* THE ROW IS LIVE WHILE IT IS STILL FALLING, and this one line is what
       makes that safe. A roll picked mid-drop has its entrance killed outright
       — both of its tweens, the one running and the one still sitting on the
       stagger — and the lift below then starts from wherever it had got to,
       which is a legal place to start from because GSAP reads the element's
       current transform. Two tweens on one transform is the one thing this file
       must never have.

       Behind `landed` rather than run every time: once the row is down there is
       no entrance left to kill, and this is on the pointer's path. */
    if (!landed) gsap.killTweensOf(rolls[i].tilt);

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

  /* WHERE THE SIX ARE GOING, drawn one at a time — a single restPose() shared
     across the row would give all six the SAME random offset and turn, which is
     a row leaning as one and not a row scattered.

     Kept rather than written straight to the elements, because the entrance
     below needs them twice over: once to park each roll above its own place,
     and once as the mark its fall has to land on. From here on a roll is only
     ever re-scattered on release (putDown), which draws a fresh one. */
  const tilts = rolls.map((r) => r.tilt);
  const poses = rolls.map(() => restPose());

  /* PARKED, NOT HIDDEN — held at nothing above where it is going to stand,
     which is a state the entrance owns from here on. Written in the same task
     as the mount, and the cover is over the page in both of the ways this
     component can arrive (a cold load, and a route change — Preloader/
     transition.ts closes the gate before the router is told anything), so there
     is no frame in which a full-size row is seen and then taken away.

     Nothing in global.css knows about this pose, which is the point: with no
     script the row is square, evenly lapped and in order, exactly as the design
     draws it. The parking is JavaScript's, so it cannot strand a page that
     never runs any. */
  rolls.forEach(({ tilt }, i) =>
    gsap.set(tilt, {
      ...poses[i],
      yPercent: poses[i].yPercent + PICK_DROP.FROM,
      scale: 0,
    }),
  );

  /* Built parked and played off the preloader. One timeline over the whole row
     rather than a tween with a stagger, and that is not a style choice: a
     stagger is ONE tween instance covering six targets, so killing the drop for
     the roll under the cursor would kill it for the other five as well. Six
     rolls' worth of separate tweens is what lets pickUp take exactly one. */
  let landed = false;
  const drop = gsap.timeline({
    paused: true,
    onComplete: () => {
      landed = true;
    },
  });

  rolls.forEach(({ tilt }, i) => {
    const at = i * PICK_DROP.STAGGER;
    drop
      .to(
        tilt,
        {
          scale: 1,
          duration: PICK_DROP.POP_DURATION,
          ease: PICK_DROP.POP_EASE,
        },
        at,
      )
      .to(
        tilt,
        {
          /* Back to the pose it was scattered to, and not to square — the drop
             delivers the roll to the rest position rather than to a tidy row
             that then has to be untidied. Its angle was set at the park and is
             never tweened: it falls at the angle it is going to lie at, which
             is a thing dropped rather than a thing steering itself down. */
          yPercent: poses[i].yPercent,
          duration: PICK_DROP.FALL_DURATION,
          ease: PICK_DROP.FALL_EASE,
        },
        at + PICK_DROP.FALL_OFFSET,
      );
  });

  const ac = new AbortController();
  const hoverable = window.matchMedia("(hover: hover)").matches;

  /* Bound at the instant the first roll starts falling, and not a frame before.
     That window is the one place killTweensOf in pickUp would do damage rather
     than good: a pointer move arriving before the timeline has played would
     kill an entrance that has not started, and the roll would be left at the
     size it was parked at, which is none.

     Nothing is lost by waiting. The preloader's sheet is still over this row
     when the gate opens and for a moment after — it is torn down at the end of
     the sweep, not at the hand-off — so a real pointer cannot reach a roll
     until well after the drop is under way whatever this file binds.

     A delayedCall rather than the timeline's own delay, for the reason
     reveal.ts gives about the headline's: it is measured from the REVEAL, and a
     paused timeline's delay is ambiguous about what it is measured from. */
  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(PICK_DROP.DELAY, () => {
      drop.play();
      if (!hoverable) return;
      /* The pointer's own condition, unchanged: on a touch screen a tap
         synthesises a mousemove and never sends the mouseleave that would put
         the roll back down, so the row would keep whichever roll was last
         touched lifted for good. The drop still runs there — it is not a
         hover effect. */
      row.addEventListener("mousemove", onMove, {
        signal: ac.signal,
        passive: true,
      });
      row.addEventListener("mouseleave", onLeave, { signal: ac.signal });
    });
  });

  return () => {
    unsubscribe();
    start?.kill();
    drop.kill();
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
