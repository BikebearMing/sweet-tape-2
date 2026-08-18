/* Sweet Tape — the product page arriving.
 *
 * TWO ENTRANCES THAT ALREADY EXIST, on one screen, and neither of them is new
 * work: the word marks come up exactly the way the slider's do when that
 * section is scrolled to, and the roll bounces in exactly the way the home
 * page's does when the cover sweeps off it. This file is where they meet.
 *
 *   sweep starts   |------------- roll rises and grows -------------|
 *   page handed over    |- THE rises -|
 *                          |- RELIABLE rises -|
 *
 * WHY THE TWO ARE ON DIFFERENT SIGNALS, which is the one thing to understand
 * before touching any number here. Preloader/gate.ts publishes two moments and
 * they mean different things: the paper is MOVING, and the page is YOURS. The
 * roll wants the first — it has to be already on its way up as the sheets pass
 * over it, so it emerges mid-bounce rather than being uncovered at a standstill
 * and only then starting. The type wants the second: it is at the top of the
 * screen, it is the last thing the sweep uncovers, and letters that came up
 * behind paper are letters nobody watched arrive.
 *
 * That is not a rule invented here — it is precisely the split the home page
 * makes between Hero/entrance.ts (the roll, whenSweeping) and the hero's title
 * (whenRevealed), and this page is the same two objects in the same order.
 *
 * ON A ROUTE CHANGE IT ALL HAPPENS AGAIN, for free and by design. The cover is
 * also the site's page transition, so the gate closes and reopens on every
 * navigation, and this component remounts with the route — which re-parks and
 * re-subscribes. A visitor stepping from one tape's page to the next gets the
 * entrance each time, which is right: it is a different product each time.
 *
 * PARKED IN SCRIPT, NOT IN THE STYLESHEET, and this section is the exception to
 * how the rest of the site does it. The hero's headline, the row at /products
 * and the footer all park their letters in CSS and carry a <noscript> block to
 * lift the hold — because those are TEXT, split into spans, and a mask written
 * in CSS is the only thing that can hold them before hydration. These letters
 * are not text: they are images sized by an aspect-ratio and a generated
 * per-letter unit, and how far one has to travel to clear its own box is its
 * measured height (dipTo). That number does not exist until layout has run, so
 * there is nothing a stylesheet could park them AT. A page with no scripting
 * therefore shows the drawing complete and still, which is the correct failure.
 */
import gsap from "gsap";

import { whenRevealed, whenSweeping } from "@/components/Preloader/gate";
import {
  WORD,
  addRise,
  dipTo,
  maskAt,
  maskDip,
  shiftAt,
  shiftDip,
} from "@/components/wordDip";

/* WHEN EACH MARK COMES UP, counted from the moment the page is handed over.
 *
 * These are the slider's ENTER.TOP_AT and ENTER.BOTTOM_AT verbatim, and the
 * 0.16 between them is the whole of the relationship: THE goes first and the
 * tape's word trails it, which is the order they are read in and the order they
 * take on a selection. Level them and the two marks read as one block sliding
 * up rather than as a phrase being written.
 *
 * They are copied rather than imported because they are this section's timing
 * against ITS OWN trigger — the slider counts from an intersection and this
 * counts from the cover lifting. The durations, eases and staggers, which are
 * the gesture rather than the timing, are shared; see components/wordDip.ts.
 */
export const ENTER = {
  TOP_AT: 0.1, // THE
  BOTTOM_AT: 0.26, // RELIABLE, trailing it as it does on a selection
};

/* The roll. Hero/entrance.ts's ROLL, to the number, and the long-form reasoning
 * for every one of these lives in that file — it is worth reading before
 * changing any of them. In short:
 *
 * It comes up into frame and grows into its own size on ONE tween, so the two
 * are the same gesture rather than two that finish together — scale alone reads
 * as a pop-up, the lift alone reads as a slide, and the pair reads as weight
 * being set down and bouncing once.
 *
 * back.out is heavily front-loaded and reaches full size at 0.4 of its duration
 * whatever the overshoot: about 0.52s after the sweep mark, against an
 * uncovering that finishes roughly 0.2s after it. So the roll is a little over
 * half way up as the last of the paper leaves it and arrives a third of a
 * second later, in the open.
 *
 * The one number that is NOT the hero's is the travel. 13vw there is against a
 * 27.2vw box; the same fraction of this page's 30.625vw roll is 14.6vw, and it
 * is written as that fraction rather than as the hero's literal figure so the
 * two rolls fall the same distance RELATIVE TO THEMSELVES. A shared absolute
 * would make the bigger roll travel visibly less far. */
export const ROLL = {
  DELAY: 0,
  FROM_Y: "14.6vw",
  FROM_SCALE: 0.82,
  DURATION: 1.3,
  EASE: "back.out(1.5)",
};

export function initProductIntro(root: HTMLElement): () => void {
  const qa = <T extends Element>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));

  /* The images, not their wrappers, on both marks — THE's letters ARE images
     and carry their own masks, and the tape's word moves the image inside
     .glyph's overflow box while the wrapper holds its place on the arc. One
     element cannot carry both. */
  const letters = qa<HTMLImageElement>(".top-title img");
  const glyphs = qa<HTMLImageElement>(".bottom-title .glyph img");
  /* THE INNER BOX, NOT `.pi-roll` ITSELF, and the distinction is load-bearing.
     `.pi-roll` spends its own transform on the journey down to the origin
     section (roll.ts), and the two moves overlap in time — a visitor who starts
     scrolling while the roll is still bouncing in would have one silently
     overwrite the other. One element, one transform; see the note in the
     markup. */
  const roll = root.querySelector<HTMLElement>(".pi-roll-in");

  /* Type sliding up from under a floor, and an object bouncing into frame, are
     both exactly what the setting is asking about. Nothing is parked and
     nothing is played: the page is the finished drawing from its first frame,
     which is where all of this was going to end up anyway. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* PARKED NOW, PLAYED LATER, and the gap between the two is what makes it
     seamless — the same argument Hero/entrance.ts makes at length. Everything
     here is behind an opaque cover at mount, so parking costs nothing and
     guarantees that the first painted frame of the drawing is already the
     parked one. Park any later — when the gate opens, when the tween starts —
     and there is a window, however short, in which the letters stand up and are
     then snatched back down. That window is a jump, and it is visible. */
  letters.forEach((el) => maskDip(el, dipTo(el)));
  glyphs.forEach((el) => shiftDip(el, dipTo(el)));

  /* A paused fromTo still renders its `from` at once, which is what parks the
     box. On the BOX and never on the image inside it, because the canvas the
     3D roll appends is a sibling of that image — bouncing the picture would
     leave the roll standing still. */
  const bounce = roll
    ? gsap.fromTo(
        roll,
        { y: ROLL.FROM_Y, scale: ROLL.FROM_SCALE },
        {
          y: 0,
          scale: 1,
          duration: ROLL.DURATION,
          ease: ROLL.EASE,
          paused: true,
        }
      )
    : null;

  let start: gsap.core.Tween | null = null;
  let rise: gsap.core.Timeline | null = null;

  /* The paper is moving. */
  const stopSweep = whenSweeping(() => {
    if (!bounce) return;
    start = gsap.delayedCall(ROLL.DELAY, () => bounce.play());
  });

  /* The page is yours. */
  const stopReveal = whenRevealed(() => {
    rise = gsap.timeline();
    if (letters.length)
      addRise(rise, letters, ENTER.TOP_AT, WORD.STAGGER, maskDip, maskAt);
    if (glyphs.length)
      addRise(rise, glyphs, ENTER.BOTTOM_AT, WORD.BOTTOM_STAGGER, shiftDip, shiftAt);
  });

  /* Teardown. Everything with a lifetime longer than one frame is released, and
     the DOM is put back the way the stylesheet had it — a teardown mid-entrance
     must not leave a letter parked under its mask or the roll standing at 82%
     of its size, because the mount that replaces this one may never play. */
  return () => {
    stopSweep();
    stopReveal();
    start?.kill();
    rise?.kill();
    bounce?.kill();
    letters.forEach((el) => maskDip(el, 0));
    glyphs.forEach((el) => gsap.set(el, { clearProps: "transform" }));
    if (roll) gsap.set(roll, { clearProps: "transform" });
  };
}
