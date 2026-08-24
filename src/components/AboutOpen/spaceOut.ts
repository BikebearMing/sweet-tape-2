/* Sweet Tape — /about's opening screen prising itself open.
 *
 * ONE SCRUBBED TIMELINE AND THAT IS THE WHOLE FILE. ONE SHARED and BELIEF start
 * as an ordinary phrase with an ordinary space in it; a little scroll pulls them
 * apart to 361px and the hand comes up through the gap holding the roll. It is
 * scrubbed rather than played, so the words open exactly as far as the reader
 * scrolls and no further — the point of the move is that the hand looks like it
 * is DOING the opening, and that only reads if the two are on the same clock and
 * that clock is the reader's own hand.
 *
 * THE HAND IS AHEAD OF THE WORDS ON PURPOSE. It reaches its full height at 0.8
 * of the scrub while the gap is still opening under it — arriving with the words
 * would read as two things that happened to coincide, and arriving after them as
 * something climbing into a hole that was already there. Being early is what
 * makes it the cause.
 *
 * AND IT OVERSHOOTS. Up to -14vw and back down to -12vw, which is the last fifth
 * of the timeline: a thing shoved up through a slot goes slightly too far and
 * settles. Under a scrub that settle happens under the reader's hand rather than
 * on a clock — scroll back up and it un-bounces, in order, exactly as far as you
 * go. WE WANTED TO BE.'s boxes pop on the same principle.
 *
 * THE WORDS MOVE BY TRANSFORM, NOT BY GAP. Animating the flex gap would relay
 * the row on every frame of the scrub; translating each half moves nothing in
 * the layout and lands in exactly the same place. So the resting phrase in
 * global.css is the honest one — an ordinary centred line of type — and the
 * 361px is where the halves travel TO, not a property anything is set to.
 *
 * AND THE TWO HALVES DO NOT TRAVEL THE SAME DISTANCE. That is the one thing here
 * that is easy to get wrong, and it was wrong: the phrase has to be centred at
 * rest and the GAP has to be centred at the end, and those are only the same
 * arrangement when the two words are the same width. ONE SHARED is 154px of ink
 * against BELIEF's 81, so the left half has 37px further to go than the right
 * one. Split the distance evenly and you can have either the phrase centred or
 * the gap centred, never both — the first version of this centred the gap in CSS
 * and left the resting phrase sitting 37px to the left of the screen.
 *
 * SO THE TRAVEL IS MEASURED RATHER THAN CALCULATED. measure() reads where the
 * two inner edges actually sit with the transforms cleared, and each half is
 * moved from there to its own target. Nothing here has to be told what the words
 * are, how wide they set, or what the resting gap is — re-word the line or
 * re-set the type and the move still lands on 361px, centred.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { screenH } from "@/components/viewport";

export const SPACE_OUT = {
  /* THE GAP THE DESIGN MEASURES: 361px at the 1440 design width. In vw, so the
     arrangement is the same drawing at any window — every length on this site
     is. Where the halves START is not written here at all; it is measured. */
  GAP: 25.069, // 361 / 1440

  /* WHERE THE HAND GOES, in vw, measured as the y of #hand.
     REST is the figure in global.css and the two have to agree — it is the
     no-JS resting state as well as this timeline's first frame. */
  HAND: {
    REST: 22.222, // 320px at 1440 — img#hand's own transform
    UP: -14,
    SETTLE: -12,
  },

  /* HOW MUCH SCROLL THE WHOLE THING TAKES, in screens, and it has a CEILING —
     which is the thing to know before reaching for this to slow the move down.
     ------------------------------------------------------------------------
     The section is 72.222vw tall against a window that is usually shorter, and
     the box sits at the bottom of it. So every pixel of this scrub is also a
     pixel of the whole screen sliding UP, and the roll is climbing through a
     frame that is itself moving — it rises 493px on its own and the page takes
     away another pixel for every pixel scrolled.

     Which puts a hard limit on it: the roll's top clears the top of the window
     only while the scrub ends by about 345px, and 345 against a 900px window is
     0.38. Past that the move still completes correctly and completes OFF THE
     TOP — the one frame the whole thing was built for is spent above the fold.
     Tried at 0.5, which finished with the roll cut 105px into its own label.

     SO THIS IS NOT THE DIAL FOR "SLOWER". SCRUB below is: it changes how hard
     the move is tied to the wheel without asking for another inch of page. The
     only way past the ceiling is to stop the screen moving during the move —
     a pin — and this section cannot be pinned as it stands, because it is
     TALLER than the window and its own bottom 140px would never be reachable
     while it was held. */
  LENGTH: 0.38,

  /* THE PLAYHEAD'S LAG BEHIND THE WHEEL, in seconds, and it is the smoothness
     dial rather than the speed one. It does not change how much scroll the move
     takes — LENGTH does that — it changes how hard the move is tied to the
     wheel. At the site's 0.6 the words track the reader's fingers almost
     exactly, which is right for a long pinned crawl and too eager here: this is
     a short move with a heavy object in it, and a hand pushing a box open should
     have some weight behind it. More than double the site's figure, so the
     motion trails the wheel and keeps going for a beat after the reader has
     stopped — which is most of what reads as "slower" here, since LENGTH above
     cannot go far without throwing the payoff off the top of the screen. */
  SCRUB: 1.3,

  /* WHERE THE HAND TOPS OUT, as a fraction of the scrub. The remainder is the
     settle back to SETTLE. */
  PEAK: 0.8,

  /* The gap is still opening as the hand tops out — see the note above. */
  OPEN_FOR: 0.85,

  /* NOT LINEAR, WHICH IS WHAT A SCRUB DEFAULTS TO. Straight-mapped to scroll,
     the words start apart at full speed on the very first pixel and stop dead on
     the last — honest, and it reads as machinery. Easing at both ends gives the
     two halves somewhere to start from and somewhere to arrive at, so the line
     comes apart the way something being levered open does. The scrub still owns
     WHEN; this is only the shape of it. */
  OPEN_EASE: "power1.inOut",
};

/* vw as px, read at call time rather than closed over: ScrollTrigger's
   invalidateOnRefresh re-runs every function-based value on resize, so the
   whole move is re-measured against the new window instead of keeping the
   lengths it was built with. */
const vw = (n: number) => (window.innerWidth * n) / 100;

export function initSpaceOut(root: HTMLElement): () => void {
  const halves = Array.from(root.querySelectorAll<HTMLElement>(".h4 .half"));
  const hand = root.querySelector<HTMLElement>("#hand");
  if (halves.length !== 2 || !hand) return () => {};

  /* WHERE THE TWO INNER EDGES SIT WITH NOTHING APPLIED, and the centre of the
   * screen they are measured against.
   *
   * Transforms are cleared first, because a rect read off a half that is already
   * part-way through the scrub is a rect of where it has got to, not of where it
   * starts — and on a resize that is exactly the state this is called in.
   * offsetLeft would sidestep that, but it is measured against whichever ancestor
   * happens to be positioned, and this needs the same coordinates as the screen's
   * own centre. */
  let centre = 0;
  let restEdge: [number, number] = [0, 0];

  function measure() {
    gsap.set(halves, { x: 0 });
    const box = root.getBoundingClientRect();
    centre = box.left + box.width / 2;
    restEdge = [
      halves[0].getBoundingClientRect().right,
      halves[1].getBoundingClientRect().left,
    ];
  }

  /* Each half's own distance: from where its inner edge rests to where the open
     gap needs that edge to be. The two come out unequal whenever the two words
     are unequal, which is the point — see the note at the top. */
  const travel = (i: 0 | 1) => {
    const half = vw(SPACE_OUT.GAP) / 2;
    return (centre + (i === 0 ? -half : half)) - restEdge[i];
  };

  measure();

  /* Asked for less motion, the screen is simply its finished self: the words
     apart and the roll held up in the gap. It is an arrangement, not a story,
     and the reader is not missing anything by being handed it whole. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(halves[0], { x: travel(0) });
    gsap.set(halves[1], { x: travel(1) });
    gsap.set(hand, { xPercent: -50, x: 0, y: () => vw(SPACE_OUT.HAND.SETTLE) });
    return () => {};
  }

  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  tl.fromTo(
    halves[0],
    { x: 0 },
    { x: () => travel(0), duration: SPACE_OUT.OPEN_FOR, ease: SPACE_OUT.OPEN_EASE },
    0,
  );
  tl.fromTo(
    halves[1],
    { x: 0 },
    { x: () => travel(1), duration: SPACE_OUT.OPEN_FOR, ease: SPACE_OUT.OPEN_EASE },
    0,
  );

  /* xPercent rather than leaving the -50% in the CSS transform for GSAP to
     interpret. The centring and the rise are the same property, and stating both
     here is what stops the half-width pull being read as pixels and dropped —
     the hero's badge documents the same hazard from the other side. */
  tl.fromTo(
    hand,
    { xPercent: -50, x: 0, y: () => vw(SPACE_OUT.HAND.REST) },
    {
      y: () => vw(SPACE_OUT.HAND.UP),
      duration: SPACE_OUT.PEAK,
      /* Fast out of the box and slowing as it clears — a thing being pushed,
         not a thing being carried. */
      ease: "power2.out",
    },
    0,
  );
  tl.to(
    hand,
    {
      y: () => vw(SPACE_OUT.HAND.SETTLE),
      duration: 1 - SPACE_OUT.PEAK,
      ease: "power1.inOut",
    },
    SPACE_OUT.PEAK,
  );

  const st = ScrollTrigger.create({
    /* The section is the honest trigger and `top top` is scroll zero: this is
       the first thing on the route, so the move begins the moment the reader
       touches the wheel. */
    trigger: root,
    start: "top top",
    /* Re-read on every refresh, which includes every resize. */
    end: () => "+=" + Math.round(screenH() * SPACE_OUT.LENGTH),
    scrub: SPACE_OUT.SCRUB,
    /* Re-measure BEFORE the refresh re-reads the tweens' function values, so a
       resize re-solves the travel against the new window and the new type size
       rather than replaying distances measured at the old one. */
    onRefreshInit: measure,
    invalidateOnRefresh: true,
    animation: tl,
  });

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-scrub must leave the screen readable rather than frozen
       halfway through its own move. Back to the stylesheet: the words closed up
       into their phrase and the hand back in the box. */
    gsap.set([...halves, hand], { clearProps: "transform" });
  };
}
