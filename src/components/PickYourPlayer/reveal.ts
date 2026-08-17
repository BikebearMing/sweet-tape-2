/* Sweet Tape — PICK YOUR PLAYER writing itself.
 *
 * The site's headline voice, and deliberately not a fourth version of it: every
 * letter waits below its own mask and slides up in a shuffled order, at the
 * hero's duration, ease, delay and hidden figure. Those are imported rather than
 * copied, so the five places this happens — the hero's title and corner mark,
 * the menu's labels, the footer's sign-off, the closing key visual and now this
 * — cannot drift apart.
 *
 * PLAYED OFF THE PRELOADER AND NOT OFF A SCROLLTRIGGER, which is the one thing
 * here that is not the closing key visual's copy of this. That section is deep
 * in a page and has to wait to be scrolled to; this headline is the first thing
 * on its page, above the fold and under the cover, so it takes the hero's cue
 * instead — see whenRevealed. A ScrollTrigger at the top of the document fires
 * on creation, which would spend the whole reveal behind the preloader's sheet
 * and hand the reader a headline that had already arrived.
 *
 * The two lines of small print below the rolls are NOT part of this: body copy
 * has its own entrance (components/bodyReveal.ts), on its own scroll cue, and
 * the two are separately timed on purpose.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { REVEAL } from "../Hero/reveal";

export const PICK_REVEAL = {
  /* Between letters, in shuffled order. Looser than the hero's 0.025 and the
     key visual's 0.02: this is sixteen characters set on two short lines with
     nothing else on the screen yet, and at the tighter pace the whole headline
     is over in a third of a second — which on a page whose rolls are still
     being dealt out underneath reads as the type having been missed rather than
     as it having arrived. */
  STAGGER: 0.035,
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
 * Builds the headline's letter reveal and plays it as the cover clears.
 *
 * @param root the <section class="pick-player">
 * @returns the teardown, which leaves the headline readable
 */
export function initPickReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".pick-title .char"),
  );
  if (!chars.length) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say: GSAP
   * reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent below, leaving every letter parked a full height
   * low. With the attribute on, the computed transform is `none` and GSAP owns
   * the whole value.
   *
   * Nothing paints in between: the attribute and the fromTo happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* THE SECOND ATTRIBUTE, and it is a hand-off to recolour.ts rather than to
   * the stylesheet — nothing in global.css reads it.
   *
   * The dip that recolours this headline drives these very letters on this very
   * property, and two tweens on one transform is a letter jittering between two
   * ideas of where it should be. So the dip waits for this, and until it lands
   * a colour change simply happens — which cannot be seen anyway, since until
   * then the letters are under their masks.
   *
   * Set HERE, before the reduced-motion return, because on that path the
   * headline is already home: there is no entrance to collide with and the dip
   * should be free from the start. The animated path sets it again when the
   * tween finishes. */
  root.dataset.arrived = "";

  /* Sixteen letters flying in from nowhere is exactly what the setting is
     asking about. The attribute alone has already put them where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Not arrived after all — there is a tween coming, and it owns the letters
     until it is done. */
  delete root.dataset.arrived;

  const tween = gsap.fromTo(
    shuffle(chars),
    { yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: PICK_REVEAL.STAGGER,
      ease: REVEAL.EASE,
      /* Built parked, played once the page is uncovered. Paused costs the
         letters nothing: a fromTo renders its `from` immediately either way,
         which is what keeps them under their masks with nothing painted in
         between (see the attribute above). */
      paused: true,

      /* The letters are GSAP's no longer, so the recolour's dip may have them.
         See data-arrived above. */
      onComplete: () => {
        root.dataset.arrived = "";
      },
    },
  );

  /* The delay is a delayedCall rather than the tween's own, for the reason the
     hero gives: it is measured from the REVEAL, and a paused tween's `delay` is
     ambiguous about what it is measured from. The same beat the hero's title
     takes, so the two pages open on the same rhythm. */
  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(REVEAL.DELAY, () => tween.play());
  });

  return () => {
    unsubscribe();
    start?.kill();
    tween.kill();
    /* A teardown mid-arrival must leave the line readable. Back to the
       stylesheet, which with the attribute still set is home rather than
       hidden. */
    gsap.set(chars, { clearProps: "transform" });
    /* And nothing is holding the letters any more, so whatever mounts next may
       have them from its first frame. */
    root.dataset.arrived = "";
  };
}
