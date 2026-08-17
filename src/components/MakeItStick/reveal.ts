/* Sweet Tape — LET'S MAKE IT STICK writing itself.
 *
 * The section had no text entrance at all: the heading was three block spans of
 * plain text, so the one line the page closes on was simply already standing
 * when you arrived, next to a strip of tape being carefully laid down in front
 * of you. It is the key visual, and it was the only headline on the site that
 * did not arrive.
 *
 * This is the footer's reveal, and deliberately not a new one — every letter
 * waits below its own mask and slides up in a shuffled order, at the hero's
 * duration, ease and hidden figure, all imported rather than copied so the four
 * places this happens cannot drift apart. The section's sub-line is NOT part of
 * it: body copy has its own entrance now (components/bodyReveal.ts), and the
 * two are separately cued on purpose — see STICK_REVEAL.START.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const STICK_REVEAL = {
  /* Where the section has to be for it to go: its top edge three quarters of
     the way down the viewport. Earlier than the footer's 80% because this
     section opens on 135px of empty lime — by the time the heading itself is
     properly in shot the trigger is long past, and a headline that writes
     itself before it is looked at has not been seen to arrive. */
  START: "top 75%",

  /* Tighter than the hero's 0.025. Three short lines, seventeen letters, and
     they are set at 145px: at the hero's pace a block this small is still
     assembling itself after the tape has finished going on. */
  STAGGER: 0.02,
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

export function initStickReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".stick-headline .char"),
  );
  if (!chars.length) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent below, leaving every letter parked a full height
   * low. With the attribute on, the computed transform is `none` and GSAP owns
   * the whole value.
   *
   * Nothing paints in between: the attribute and the fromTo happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* Seventeen letters flying in from nowhere is exactly what the setting is
     asking about. The attribute alone has already put them where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so the second mount
     costs nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* Shuffled across all three lines rather than within each, the same call the
     footer's headline and the hero's corner mark make: LET'S MAKE IT STICK! is
     one line of type set over three rows, and shuffling them row by row would
     have LET'S home before MAKE IT had started — a wipe down the block, which
     is the thing the shuffle exists to avoid. */
  const tween = gsap.fromTo(
    shuffle(chars),
    { yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: STICK_REVEAL.STAGGER,
      ease: REVEAL.EASE,
      paused: true,
    },
  );

  const st = ScrollTrigger.create({
    trigger: root,
    start: STICK_REVEAL.START,
    once: true,
    onEnter: () => tween.play(),
  });

  return () => {
    st.kill();
    tween.kill();
    /* A teardown mid-arrival must leave the line readable. Back to the
       stylesheet, which with the attribute still set is home rather than
       hidden. */
    gsap.set(chars, { clearProps: "transform" });
  };
}
