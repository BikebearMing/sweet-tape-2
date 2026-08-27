/* Sweet Tape — the masthead arriving.
 *
 * TWO ARRIVALS, NOT ONE, and that is the correction this file exists to record.
 * Both pieces used to drop in together on a single tween — one object coming
 * down out of the top edge — which was tidy and was wrong, because the two are
 * not one object and the home page had already said so.
 *
 *   THE CLAIM does not come down. It is the hero's corner mark, and the hero's
 *   corner mark is PRINTED: the perforation is ruled down its left edge, and
 *   then the copy is written against it a letter at a time, each one rising out
 *   from under its own mask in a shuffled order. That is the site's voice for
 *   small type in a corner, it is what the front page does two hundred pixels
 *   from this spot, and a block of it sliding down from off screen instead read
 *   as a different site.
 *
 *   THE BADGE does. It is the one piece of the masthead with no counterpart on
 *   the home page — the hero sets its copy inside a line of type, where it needs
 *   no entrance of its own because the words around it are already arriving —
 *   so out here on its own it has to get onto the page somehow, and a drop is
 *   what was asked for.
 *
 * NOTHING HERE IS NEW. Every figure the claim moves on is imported from
 * Hero/reveal.ts rather than copied: it is not the same animation as the home
 * page's, it is the same animation. Retune the corner there and this follows.
 *
 * The two are on the hero's own clock as well — the badge at 0.45 and the claim
 * at the hero corner's 0.55 — so the top of a product page and the top of the
 * front page open on the same rhythm.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { CORNER, REVEAL } from "@/components/Hero/reveal";

export const TOP_BAND = {
  /* The badge, after the page is uncovered. Ahead of the claim's 0.55 and of
     the menu tab's 0.7: it is in the middle of the window, which is where the
     eye already is when the cover comes off, and the corners are where it goes
     next. */
  DELAY: 0.45,

  /* Where the badge waits: its own height and a good margin, clear above the
     top edge, so it is genuinely off the page rather than peeping over it. The
     stylesheet parks it at the same figure and the two have to agree — see the
     Preloader section of global.css, where the park hangs off the same
     attribute the gate clears. */
  HIDDEN: -260,

  DURATION: 0.85,

  /* It bounced first, and bounce.out was too harsh — a literal ball-drop, three
     hits and a settle, which on a badge this size reads as something going
     wrong rather than as something landing. back.out is one spring past the
     mark and back. The menu tab lands on the same curve at a shade more
     overshoot (1.9), so the two things that drop onto this band share a
     character. The number is what to turn, not the curve: below about 1 the
     overshoot stops reading at all and this becomes a slide. */
  EASE: "back.out(1.4)",
};

/* Fisher–Yates, the hero's and the footer's. The shuffle IS the effect: reveal
   the same letters left to right and it reads as a wipe, which is a different
   thing entirely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The masthead's arrival. Returns a teardown.
 *
 * Both halves are parked by the stylesheet from the first byte and taken over
 * by an inline transform HERE, at mount — the claim's letters before the
 * attribute that releases them, the badge before the sweep that releases it.
 * Neither hand-over leaves a gap for a frame to land in, which is the whole
 * arrangement and the reason both parks are written before anything is tweened
 * rather than inside the gate's callback. The menu tab arrives the same way.
 *
 * @param root the <div class="top-band">
 */
export function initTopBand(root: HTMLElement): () => void {
  const mark = root.querySelector<HTMLElement>(".top-mark");
  const perf = root.querySelector<HTMLElement>(".top-perf");
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));

  /* PARKED INLINE FIRST, AND THE ATTRIBUTE SECOND — the hero's manoeuvre
   * exactly, and Hero/reveal.ts carries the long version of the argument.
   *
   * global.css holds these letters under their masks until data-reveal lands.
   * The attribute used to go first, because GSAP reads the computed transform
   * as its starting point and a percentage translate coming from CSS is
   * reported as resolved px — 130% on top of a CSS 130% renders at 260%. `y: 0`
   * writes that px half explicitly instead of inheriting it, so this set means
   * HIDDEN whether the stylesheet's park is still applied or already lifted.
   *
   * Which is what lets it run BEFORE the hand-off. An inline transform outranks
   * the rule, so the attribute below lifts a park that is no longer holding
   * anything, and there is no instant — paint or no paint — in which the claim
   * is standing before it has been written. */
  if (chars.length) gsap.set(chars, { y: 0, yPercent: REVEAL.HIDDEN });
  root.dataset.reveal = "live";

  /* Nothing to animate, so the park above is handed straight back. The badge's
     hold and the perforation's are both inside a no-preference media query, so
     with this asked for neither was lifted in the first place; the letters are
     the only thing here that was, and clearing the inline transform under a
     live attribute stands them up. A badge springing down the middle of the
     screen is close to the top of the list of things that setting exists to
     stop. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    return () => {};
  }

  /* THE CLAIM — the hero's corner mark exactly: the line ruled down the edge,
     then the writing set against it. Built as one paused timeline so the two
     halves are one gesture rather than two things that start together. */
  const printed = gsap.timeline({ paused: true });

  if (perf) {
    /* clip-path and not a scale, the same call the hero makes: the dots are a
       repeating background, so a scaled column would start as a dozen of them
       crushed into a sliver and spread out. Clipping leaves them at their own
       size and uncovers them. */
    printed.fromTo(
      perf,
      { clipPath: "inset(0% 0% 100% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: CORNER.PERF_DURATION,
        ease: CORNER.PERF_EASE,
      },
      0,
    );
  }

  if (chars.length) {
    /* Shuffled across BOTH lines, not within each: it is two lines of one mark,
       and shuffling them separately would have the first finished before the
       second had started — a wipe down the block, which is the thing the
       shuffle exists to avoid. */
    printed.fromTo(
      shuffle(chars),
      /* `y: 0` for the reason the park above carries it — the `from` pose has
         to mean HIDDEN and not "HIDDEN on top of whatever CSS had". The letters
         are already sitting there, so this render changes nothing. */
      { y: 0, yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: CORNER.STAGGER,
        ease: REVEAL.EASE,
      },
      CORNER.TEXT_AT,
    );
  }

  /* THE BADGE — its own tween, its own clock, its own idea of what arriving
   * means. Nothing about it belongs in the timeline above.
   *
   * AND ITS PARK IS TAKEN OVER HERE, AT MOUNT, rather than at the gate. This is
   * the one piece of the masthead whose stylesheet hold hangs off data-loading
   * instead of data-reveal, so it is the SWEEP that lifts it — and release()
   * clears the attribute one statement before it announces itself. Left to be
   * parked inside the callback, the badge spends that gap held up by nothing at
   * all, and any frame that lands in it is a logo standing in the middle of the
   * band a moment before it drops in from above.
   *
   * Held from here instead, it is parked by the stylesheet up to this line and
   * by an inline transform from this line on, with no gap between the two — the
   * sweep then lifts a rule that is no longer holding anything. `y: 0` for the
   * reason the letters' park carries it: the value means what it says whether
   * the CSS park is still applied or already gone.
   *
   * After the reduced-motion return above, deliberately — that park is inside a
   * no-preference media query, so a reader who asked for less motion never had
   * the badge lifted and must not be handed one hanging off the top edge. */
  if (mark) gsap.set(mark, { y: 0, yPercent: TOP_BAND.HIDDEN });

  let drop: gsap.core.Tween | null = null;
  let startPrint: gsap.core.Tween | null = null;

  const unsubscribe = whenRevealed(() => {
    /* The beat is the tween's own `delay` and NOT a delayedCall around it, and
       the difference is a visible jump. A fromTo renders its `from` the moment
       it is created, delay and all, so the badge stays exactly where the set
       above put it. Created half a second later inside a delayedCall, it would
       stand on the page for that half second and then be snatched up to
       start. */
    if (mark) {
      drop = gsap.fromTo(
        mark,
        { y: 0, yPercent: TOP_BAND.HIDDEN },
        {
          yPercent: 0,
          duration: TOP_BAND.DURATION,
          delay: TOP_BAND.DELAY,
          ease: TOP_BAND.EASE,
        },
      );
    }

    /* The claim has no such trap — it was built paused above, so its `from` was
       rendered at mount and its letters have been under their masks all along.
       A delayedCall is the honest way to say when it starts, since a paused
       tween's own `delay` is ambiguous about what it is measured from. The beat
       is the hero corner's own, imported rather than chosen. */
    startPrint = gsap.delayedCall(CORNER.DELAY, () => printed.play());
  });

  return () => {
    unsubscribe();
    startPrint?.kill();
    drop?.kill();
    printed.kill();
    /* A teardown mid-arrival leaves the copy readable, the dots drawn, and the
       only way back to the front page on the page rather than off the top of
       the screen. */
    gsap.set(chars, { clearProps: "transform" });
    if (mark) gsap.set(mark, { clearProps: "transform" });
    if (perf) gsap.set(perf, { clipPath: "inset(0% 0% 0% 0%)" });
  };
}
