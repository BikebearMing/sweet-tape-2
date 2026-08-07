/* Sweet Tape — the footer's arrival.
 *
 * The hero's move, at the other end of the page: every letter waits below its
 * own mask and slides up into place in a shuffled order. Duration, ease and the
 * hidden figure are imported from Hero/reveal rather than copied, so the two
 * cannot drift — the menu's rows do the same.
 *
 * What is different is the cue. The hero is the first thing on the page and
 * plays off the preloader's gate; this is the last, and nobody has seen it when
 * it mounts. So the timeline is built PAUSED and a ScrollTrigger plays it the
 * once, when the section's top comes up the viewport. Once, and forward only:
 * scrolling back down past a footer that has already written itself must not
 * make it write itself again.
 *
 * ScrollTrigger rather than the hand-rolled ratchet the hero's cardboard copy
 * uses, because this is a different job: that one SCRUBS a playhead against
 * scroll position and needs the position, this one just needs to know when the
 * box is in view. Lenis scrolls the window for real, so the plugin's own
 * listeners see it with no proxy in between.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const FOOTER_REVEAL = {
  /* Where the section has to be for it to go: its top edge four fifths of the
     way down the viewport. Late enough that the reader is looking at it, early
     enough that the headline is standing by the time it is fully on screen. */
  START: "top 80%",

  /* The nav row goes first — it is the top of the section and it is what the
     reader meets. Tighter than the headline's stagger for the reason the
     hero's corner mark is tighter than its title: twenty-six small letters at
     the title's pace would still be arriving long after the title had landed.*/
  LINKS_STAGGER: 0.014,

  /* The dots, once the words they belong to are up. Each is a full stop and it
     is placed after the sentence, not with it. The overshoot is the menu's
     arrow disc exactly — same mark, same size, same swing. */
  DOTS_AT: 0.3,
  DOTS_STAGGER: 0.05,
  DOTS_DURATION: 0.5,
  DOTS_EASE: "back.out(2.2)",

  /* The headline, overlapping the row rather than following it: one cascade
     down the section, not two things that happen in turn. */
  HEADLINE_AT: 0.24,
};

/* Fisher–Yates, the hero's. The shuffle is the effect: reveal the same letters
   left to right and it reads as a wipe, which is a different thing. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initFooterReveal(root: HTMLElement): () => void {
  const linkChars = Array.from(
    root.querySelectorAll<HTMLElement>(".footer-link .char"),
  );
  const dots = Array.from(
    root.querySelectorAll<HTMLElement>(".footer-link-dot"),
  );
  const headChars = Array.from(
    root.querySelectorAll<HTMLElement>(".footer-headline .char"),
  );
  if (!linkChars.length && !headChars.length) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent set here, leaving every letter parked a full
   * height low. With the attribute on, the computed transform is `none` and
   * GSAP owns the whole value.
   *
   * Nothing is painted in between: the attribute and the fromTos below happen
   * in the same task, and a fromTo renders its `from` immediately even on a
   * paused timeline. */
  root.dataset.reveal = "live";

  /* Thirty letters flying in from nowhere is exactly what the setting is asking
     about. The attribute alone has already put them where they belong, and the
     dots are only ever parked by a tween that now never runs — so with this on,
     the footer is simply there. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so the second mount
     costs nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  /* Shuffled across the whole row, not within each link: the four are one line
     of type read left to right, and shuffling them link by link would finish
     OUR FAMILY before ABOUT had started — a wipe across the row, which is the
     thing the shuffle exists to avoid. */
  if (linkChars.length) {
    tl.fromTo(
      shuffle(linkChars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: FOOTER_REVEAL.LINKS_STAGGER,
        ease: REVEAL.EASE,
      },
      0,
    );
  }

  /* In document order, left to right — these are four marks, not thirty
     letters, and there is nothing to break up. */
  if (dots.length) {
    tl.fromTo(
      dots,
      { scale: 0 },
      {
        scale: 1,
        duration: FOOTER_REVEAL.DOTS_DURATION,
        stagger: FOOTER_REVEAL.DOTS_STAGGER,
        ease: FOOTER_REVEAL.DOTS_EASE,
      },
      FOOTER_REVEAL.DOTS_AT,
    );
  }

  /* Shuffled across both lines rather than within each, same as the hero's
     corner mark: STICK and BY YOU are one heading, and shuffling them
     separately would have the first line home before the second began. */
  if (headChars.length) {
    tl.fromTo(
      shuffle(headChars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      FOOTER_REVEAL.HEADLINE_AT,
    );
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: FOOTER_REVEAL.START,
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-arrival must leave the footer readable — and the dots
       drawn, since theirs is a scale from nothing rather than a slide. Back to
       the stylesheet, which with the attribute still set is home rather than
       hidden. */
    gsap.set([...linkChars, ...headChars], { clearProps: "transform" });
    if (dots.length) gsap.set(dots, { clearProps: "transform" });
  };
}
