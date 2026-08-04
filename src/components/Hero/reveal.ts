/* Sweet Tape — the hero's split-text reveal.
 *
 * Every letter sits below its own mask and slides up into place, in a shuffled
 * order rather than left to right. Ported from an earlier project's
 * [data-split-text] helper; two things that were runtime work there are gone:
 *
 *   The DOM splitting. The copy is already one box per letter because the arc
 *   in hero.css places each one individually, so React emits the structure on
 *   the server — no unsplit flash, no rewriting the heading on mount.
 *
 *   ScrollTrigger. The hero is the first thing on the page, so this plays on
 *   load; GSAP core is already in the bundle for the tape, and nothing here
 *   asks for more.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount replays rather than stacking two tweens on the same letters.
 */
import gsap from "gsap";

/* The entrance. Straight from the original — a letter is quick on its own, and
   the stagger is what turns twenty-three of them into one move. */
export const REVEAL = {
  /* Where a letter waits, as a percentage of its own height. hero.css parks
     them at the same figure and the two have to agree — change both.

     Not 100. That would be exact only if the glyph filled its box, and
     capitals overshoot theirs (the same reason the slider's dip travels a
     shade past its box). The extra is invisible — it is all behind the mask —
     so it is set well clear rather than measured. */
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.025, // between letters, in shuffled order
  DELAY: 0.3, // after mount, so the reveal is not racing hydration
  EASE: "power3.out",
};

/* Fisher–Yates. The shuffle is the effect: reveal the same letters left to
   right and it reads as a wipe, which is a different thing entirely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initReveal(root: HTMLElement): () => void {
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
  if (!chars.length) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * hero.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent set here, leaving every letter parked a full
   * height low. With the attribute on, the computed transform is `none` and
   * GSAP owns the whole value.
   *
   * Nothing is painted in between: the attribute and the fromTo happen in the
   * same task, so the browser has no chance to show the letters home. */
  root.dataset.reveal = "live";

  /* Letters flying in from nowhere is exactly what the setting is asking
     about. The attribute alone has already put them where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* One pool across the whole section rather than one per heading, so the
     kicker and the headline interleave and the hero arrives as a single move.

     No will-change: force3D promotes each letter for the duration of the tween
     and lets it go afterwards, which is the same win without leaving
     twenty-three permanent layers behind. */
  const tween = gsap.fromTo(
    shuffle(chars),
    { yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: REVEAL.STAGGER,
      delay: REVEAL.DELAY,
      ease: REVEAL.EASE,
    }
  );

  return () => {
    tween.kill();
    // Back to the stylesheet — which, with the attribute still set, is home
    // rather than hidden. A teardown mid-flight leaves the copy readable.
    gsap.set(chars, { clearProps: "transform" });
  };
}
