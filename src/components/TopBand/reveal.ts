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
 * Both halves are parked by the stylesheet until the gate clears, and handed
 * over in the task that clears it: whenRevealed fires synchronously there, and
 * a fromTo renders its `from` immediately even when paused or delayed, so the
 * computed transform is `none` by the time GSAP reads it and there is no frame
 * in which either piece is anywhere unintended. The menu tab arrives the same
 * way.
 *
 * @param root the <div class="top-band">
 */
export function initTopBand(root: HTMLElement): () => void {
  const mark = root.querySelector<HTMLElement>(".top-mark");
  const perf = root.querySelector<HTMLElement>(".top-perf");
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the timeline's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent below, leaving every letter parked a full height
   * low. With the attribute on, the computed transform is `none` and GSAP owns
   * the whole value.
   *
   * Before the reduced-motion return, because on that path it is the whole
   * arrival: the attribute alone puts the copy where it belongs. Nothing paints
   * in between either way — the attribute and the timeline's immediate render
   * happen in the same task. */
  root.dataset.reveal = "live";

  /* Nothing to undo. The badge's park and the perforation's are both inside a
     no-preference media query, so with this asked for neither was lifted in the
     first place, and the attribute above has already stood the letters up. A
     badge springing down the middle of the screen is close to the top of the
     list of things that setting exists to stop. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      { yPercent: REVEAL.HIDDEN },
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
     means. Nothing about it belongs in the timeline above. */
  let drop: gsap.core.Tween | null = null;
  let startPrint: gsap.core.Tween | null = null;

  const unsubscribe = whenRevealed(() => {
    /* The beat is the tween's own `delay` and NOT a delayedCall around it, and
       the difference is a visible jump. The stylesheet's park is keyed on the
       attribute this gate has just cleared, so from this instant nothing is
       holding the badge up but GSAP — and a fromTo renders its `from` the
       moment it is created, delay and all. Created now, the badge is already
       back above the edge before the frame is painted. Created half a second
       later inside a delayedCall, it stands on the page for that half second
       and is then snatched up to start. */
    if (mark) {
      drop = gsap.fromTo(
        mark,
        { yPercent: TOP_BAND.HIDDEN },
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
