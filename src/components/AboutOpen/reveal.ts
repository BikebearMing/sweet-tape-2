/* Sweet Tape — /about's opening headline writing itself.
 *
 * The site's one text entrance, on the page's first screen: every letter waits
 * below its own mask and slides up into place in a shuffled order. Duration,
 * ease and the hidden figure are imported from Hero/reveal rather than copied,
 * so the places this happens cannot drift apart.
 *
 * THE CUE IS THE HERO'S, because the situation is the hero's. This is the first
 * thing on the route and it is above the fold, so there is nothing to wait for
 * but the cover: whenRevealed fires as the transition's sheets clear the page,
 * or on the spot when nothing is holding it. A scroll trigger here would be a
 * trigger that has already fired by the time it is built.
 *
 * WHICH MEANS IT PLAYS ON EVERY ARRIVAL, not once per document. The coloured
 * stack is the site's page transition as well as its preloader, so the gate
 * closes and opens again on each route change — and this component remounts with
 * the route, which is what re-subscribes it. See Preloader/gate.ts, which is
 * explicit that the one-shot subscription is the caller's job to renew.
 *
 * No ScrollTrigger and no splitting at runtime. The copy is already one box per
 * letter because the arc in global.css places each one individually, so React
 * emits the structure on the server — no unsplit flash, and nothing here has to
 * rewrite a heading on mount.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount replays rather than stacking two tweens on the same letters.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

import { REVEAL } from "../Hero/reveal";

export const ABOUT_REVEAL = {
  /* Slower per letter than the hero's 0.025, and slower again since the kicker
     joined the pool: thirty-one characters rather than fifteen. The stagger is
     what turns a pool of letters into ONE move, and the figure that reads as a
     move rather than a flicker goes up with the count. */
  STAGGER: 0.045,

  /* AND THE RISE ITSELF IS SLOWER THAN THE HERO'S 0.6, which is the one place
     this section departs from Hero/reveal's numbers rather than importing them.
     The hero's letters arrive over a busy screen — a roll bouncing in, a note
     being written, a badge dropping — and a quick rise is right in company like
     that. This screen has nothing else happening on it: two lines of type and a
     shut box. At the hero's pace the only thing on the page is over before the
     reader has settled, and the section reads as having been skipped.

     The ease and the hidden figure are still the hero's, and still imported. */
  DURATION: 0.85,

  /* After the page is uncovered, not after mount — the beat is the hero's, and
     for the hero's reason: enough that the reveal is not racing hydration. */
  DELAY: 0.3,
};

/* Fisher–Yates. The shuffle is the effect: reveal the same letters left to
   right and it reads as a wipe, which is a different thing entirely. Local, as
   it is in every other section that does this. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initAboutReveal(root: HTMLElement): () => void {
  /* Scoped to .title, which is the headline and nothing else. ONE SHARED BELIEF
     is not split to letters — it is ordinary type — so this collects the two
     lines of the h1 and stops. */
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".title .char"));
  if (!chars.length) return () => {};

  /* PARKED INLINE FIRST, AND THE ATTRIBUTE SECOND. Hero/reveal.ts carries the
   * long version of this and it is the same manoeuvre here.
   *
   * global.css holds these letters under their masks until data-reveal lands.
   * The attribute used to go first, because GSAP reads the computed transform
   * as its starting point and a percentage translate coming from CSS is
   * reported as resolved px — 130% on top of a CSS 130% renders at 260%. `y: 0`
   * writes that px half explicitly rather than inheriting it, so this set means
   * HIDDEN whether the stylesheet's park is still applied or already lifted.
   *
   * Which is what lets it run BEFORE the hand-off. An inline transform outranks
   * the rule, so the attribute below lifts a park that is no longer holding
   * anything, and there is no instant — paint or no paint, and whatever throws
   * further down — in which the headline is standing before its entrance. */
  gsap.set(chars, { y: 0, yPercent: REVEAL.HIDDEN });
  root.dataset.reveal = "live";

  /* Fifteen letters flying in from nowhere is exactly what the setting is
     asking about. What is wanted is the headline standing, so the park above is
     handed back — under a live attribute the stylesheet's home for these
     letters is where they belong rather than where they started. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(chars, { clearProps: "transform" });
    return () => {};
  }

  /* ONE POOL ACROSS BOTH LINES rather than one per line. Shuffling them
     separately would have THREE finished before GENERATION had started — a wipe
     down the block, which is the thing the shuffle exists to avoid.

     No will-change: force3D promotes each letter for the duration of the tween
     and lets it go afterwards, which is the same win without leaving fifteen
     permanent layers behind. */
  const tween = gsap.fromTo(
    shuffle(chars),
    /* `y: 0` for the reason the park above carries it — the `from` pose means
       HIDDEN and not "HIDDEN on top of whatever CSS had". The letters are
       already sitting there, so this render changes nothing. */
    { y: 0, yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: ABOUT_REVEAL.DURATION,
      stagger: ABOUT_REVEAL.STAGGER,
      ease: REVEAL.EASE,
      /* Built parked, played once the page is uncovered — this is the first
         thing on the route and it must not be spent behind the transition's
         sheets. Paused costs the letters nothing: they were put under their
         masks by the set above, and a fromTo renders its `from` immediately
         either way. */
      paused: true,
    },
  );

  /* The delay is here rather than on the tween, measured from the reveal rather
     than from mount — a delayedCall is unambiguous about that where a paused
     tween's own `delay` is not. */
  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(ABOUT_REVEAL.DELAY, () => tween.play());
  });

  return () => {
    unsubscribe();
    start?.kill();
    tween.kill();
    /* Back to the stylesheet — which, with the attribute still set, is home
       rather than hidden. A teardown mid-flight leaves the headline readable.

       transform only: the arc lives on .clip, not on .char, so there is nothing
       of the curve in what is being cleared here. */
    gsap.set(chars, { clearProps: "transform" });
  };
}
