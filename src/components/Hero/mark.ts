/* Sweet Tape — the badge dropping into the kicker.
 *
 * The mark hangs in the gap between WE'RE and HERE TO, and it arrives by
 * falling into it from above the top edge of the page. One property, one tween:
 * it is a thing being dropped, and the ease is what lands it.
 *
 * Third of the four arrivals, and the order is the whole point of the numbers
 * here — the roll comes up under the sweep (ROLL, entrance.ts), the type rises
 * at 0.3 (REVEAL.DELAY), this drops at 0.45, the corner mark writes itself at
 * 0.55 (CORNER.DELAY) and the menu tab lands at 0.7 (MENU_TAB.DELAY). It goes
 * between the type and the corner deliberately: the kicker has to be STANDING
 * for the badge to land in the middle of it, and 0.15 behind the type is enough
 * for the two halves to have arrived without leaving the slot looking empty.
 *
 * Nothing parks this in the stylesheet, unlike the letters and the menu tab.
 * The badge is a complete, correct first paint exactly where it belongs — a
 * park would be the stylesheet hiding something JS then has to give back, and
 * with no JS at all (or reduced motion) the mark should simply be there. The
 * only window in which the unparked state is on screen is before hydration,
 * and the preloader's cover is over the whole page for all of it.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

export const MARK = {
  /* After the page is uncovered. See the running order at the top of the file. */
  DELAY: 0.45,

  /* Where it waits: clear above the viewport's top edge, as a percentage of its
     own height rather than in vw, so the park holds whatever the badge is sized
     to. It resting a little over 2vw from the top of the page and standing
     about 7vw tall, 170% of itself is a comfortable clearance — the number only
     has to be enough, and past that it costs nothing but travel.

     The travel IS the gesture, though, and it is worth knowing what it buys:
     back.out's overshoot is a fraction of the distance covered, so a longer
     fall dips further past the slot before it settles. At this figure that dip
     is around a quarter of the badge's height. Shorten the park and the landing
     firms up; lengthen it and the bounce grows. */
  HIDDEN: -170,

  /* The site's drop, one notch softer than the menu tab's back.out(1.9) —
     the tab is a short fall and can crack, where this one comes the height of
     the screen and wants to read as weight arriving rather than as a snap. */
  DURATION: 0.85,
  EASE: "back.out(1.6)",
};

export function initHeroMark(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>(".hero-mark");
  if (!el) return () => {};

  /* Something falling in from off the screen is precisely what the setting is
     asking about, and the badge is already in its slot — there is nothing to
     put back. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Built paused and played on the gate, like the roll's. The fromTo renders
     its `from` the moment this runs, which lifts the badge out of frame in the
     same task Stage.tsx mounts everything else — before any of it is painted,
     and long before the cover clears.

     yPercent, not y: the park is a proportion of the badge, so it holds at any
     --hero-mark-w without a second number to keep in step.

     Nothing else may write `transform` on this element — the stylesheet centres
     it with margins precisely so that this tween can own the property outright.
     See the note on .hero-mark in global.css for what happens when the centring
     is put somewhere GSAP folds in. */
  const tween = gsap.fromTo(
    el,
    { yPercent: MARK.HIDDEN },
    {
      yPercent: 0,
      duration: MARK.DURATION,
      ease: MARK.EASE,
      paused: true,
    },
  );

  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(MARK.DELAY, () => tween.play());
  });

  return () => {
    unsubscribe();
    start?.kill();
    tween.kill();
    // A teardown mid-fall must never leave the badge off the top of the page.
    gsap.set(el, { clearProps: "transform" });
  };
}
