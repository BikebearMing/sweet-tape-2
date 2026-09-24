/* Sweet Tape — the chip's turn, for the chips that had no entrance of their own.
 *
 * EVERY CHIP ON THE SITE ARRIVES THE SAME WAY: it swings in on its vertical
 * axis and settles face on. The move and every number in it are TAG, in
 * WhatsRolling/reveal.ts, which argues each one. Six sections already play it
 * from inside their own timelines, because there it is sequenced against a
 * headline — the news title card, the story page, contact, the origin story,
 * the next-up card and the home page's pinning section. This file is the same
 * tween for the ones that are not part of a sequence: the slider's subhead, the
 * product page's way back, and the lead story's HIGHLIGHT. They turn when they
 * are scrolled to, once.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { whenRevealed } from "@/components/Preloader/gate";
import { TAG } from "@/components/WhatsRolling/reveal";

/* Where the chip's top has to be for it to count as arrived. Well inside the
   window, so the turn is watched rather than caught finishing at the fold. */
const START = "top 88%";

/**
 * Turns `chip` in, once, when it is scrolled into view.
 *
 * @returns teardown — the chip goes back to the stylesheet's rest pose
 */
export function initChipFlip(chip: HTMLElement | null): () => void {
  /* The rest pose is the finished chip, so there is nothing to do but leave it. */
  if (!chip || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return () => {};

  gsap.registerPlugin(ScrollTrigger);

  const flip = gsap.fromTo(
    chip,
    {
      autoAlpha: 0,
      rotateY: TAG.FROM,
      transformPerspective: TAG.PERSPECTIVE,
      transformOrigin: TAG.ORIGIN,
    },
    {
      autoAlpha: 1,
      rotateY: 0,
      duration: TAG.DURATION,
      ease: TAG.EASE,
      paused: true,
      /* BACK TO THE STYLESHEET'S OWN TRANSFORM once it has landed. GSAP read the
         chip's lean and its centring off the computed matrix, which is px — so
         left inline, a translateX(-50%) would stop following the window, and
         the slider's repaint copy (.subhead--next) would no longer sit exactly
         on the real one. */
      onComplete: () => gsap.set(chip, { clearProps: "transform,transformOrigin" }),
    },
  );

  /* Not before the preloader has gone: a chip on the first screen is "in view"
     the moment this is built, and would turn behind the curtain. */
  let stopGate = () => {};
  const st = ScrollTrigger.create({
    trigger: chip,
    start: START,
    once: true,
    onEnter: () => {
      stopGate = whenRevealed(() => flip.play());
    },
  });

  return () => {
    stopGate();
    st.kill();
    flip.kill();
    gsap.set(chip, { clearProps: "transform,transformOrigin,opacity,visibility" });
  };
}
