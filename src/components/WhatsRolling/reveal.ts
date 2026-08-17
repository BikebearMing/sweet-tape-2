/* Sweet Tape — WHAT'S ROLLING writing itself, and the tag turning over above it.
 *
 * The news page's opening screen, and the same two rules the product page's
 * opener follows: the site's one headline voice, and the preloader's cue rather
 * than a ScrollTrigger.
 *
 * PLAYED OFF THE COVER AND NOT OFF THE SCROLL. This headline is the first thing
 * on its page, above the fold and under the curtain, so a ScrollTrigger here
 * would fire the moment it was created — which is while the page is still behind
 * a sheet of paper — and hand the reader a headline that had already arrived.
 * whenRevealed is the cue instead, and it now covers a route change as well as a
 * cold load (Preloader/gate.ts). PickYourPlayer/reveal.ts makes the same call at
 * length.
 *
 * THE LETTERS ARE THE HERO'S, imported and not re-chosen — same duration, same
 * ease, same hidden figure, same shuffle. What is different is the pace and the
 * reason is the setting: this is thirteen characters at 15vw where the hero has
 * twenty-three at 20vw, so the stagger is opened up rather than the block being
 * over before it is looked at.
 *
 * THE TAG IS NOT A FOURTH VERSION OF THAT. It is one small object rather than a
 * line of type, so splitting it to letters would be a wipe across a chip two
 * centimetres wide; it turns over on its own axis instead — see TAG.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { REVEAL } from "../Hero/reveal";

export const NOTE = {
  /* The beat between the last letter of ROLLING landing and the pen touching
     down on the note beside it — see where this is published, at the bottom of
     initRollingReveal.

     THE NOTE GOES LAST, and that is the ordering the whole screen is built on:
     the tag turns, the headline writes itself, and only then does a hand come in
     and annotate what is already there. A note being written WHILE the words it
     annotates are still arriving is a reader being asked to read two things at
     once, and the handwriting loses — it is a third the size and in a colour
     chosen to be quiet.

     Short, because this is a beat and not a pause. Long enough that the last
     letter has visibly settled (the entrance eases out, so its final tenth is
     nearly still) and short enough that the note still belongs to the same
     arrival rather than turning up afterwards like an afterthought. */
  GAP: 0.2,
};

export const ROLLING_REVEAL = {
  /* Between letters, in shuffled order. Looser than the hero's 0.025 and looser
     again than the product page's 0.035: WHAT'S ROLLING is thirteen characters
     over two lines with nothing else on the screen, and at the hero's pace the
     whole headline is over in a third of a second — which on a page that opens
     on it reads as having been missed rather than as having arrived. */
  STAGGER: 0.04,
};

export const TAG = {
  /* AFTER THE HEADLINE HAS STARTED, not before it and not with it. The chip sits
     directly above the type and is a tenth its size; opening on it would be the
     page introducing itself with its own footnote. Behind REVEAL.DELAY by
     enough that the first letters are already standing. */
  DELAY: 0.62,

  /* THE TURN, AND IT IS AROUND THE Y AXIS — the chip swings on the vertical, the
     way a sign hung on two chains does when someone walks past it: the left edge
     comes towards you, the right edge goes away, and it settles face on.

     It used to be rotateX, pinned at the top edge, which is a different object —
     a paper tag hanging on a string and knocked forwards. Both are legitimate;
     this one suits where the chip actually sits. It is alone on the page's centre
     line above a headline fifteen vw tall, and a forward flip is a small
     downward move at the exact moment thirteen letters are arriving from below.
     Turning it sideways puts the gesture on an axis nothing else on the screen is
     using, so it reads as its own beat rather than as the quietest part of the
     headline's.

     -100 rather than -90, and this is the reason it is not exactly a quarter
     turn: at 90 the card is edge-on and the last third of the move is spent as a
     line one pixel wide, which reads as the tag appearing out of nothing rather
     than turning. Starting a shade PAST edge-on means the face is already
     catching the light on the first frame — the same instinct as the mark's
     IN_FROM in the preloader, where a peel with nothing to peel is just a fade. */
  FROM: -100,

  /* How far away the eye is, in px. This is the whole difference between a turn
     and a horizontal squash: with no perspective a rotateY is an affine scale and
     the near and far edges stay exactly as tall as each other. Short enough to
     be an obvious turn — the chip is small, and a distance of a thousand on an
     object this size is nearly orthographic.

     GSAP writes it as `perspective()` inside the element's OWN transform rather
     than as the parent's `perspective` property, which is what makes it
     self-contained: no wrapper, and nothing on the section to keep in step. */
  PERSPECTIVE: 420,

  /* Turned about its own middle, and on this axis that is the right pivot rather
     than the lazy one. The chip is centred on the page — it is the only thing on
     that line — so a hinge at either vertical edge would swing it left or right
     of centre on the way in and land it back, which is a small horizontal
     wobble under a headline that is doing nothing of the kind. Pivoting on the
     middle, the two halves trade places and the centre never moves. */
  ORIGIN: "50% 50%",

  /* Longer than a letter's 0.6 because it is one object doing the whole move on
     its own — there is no stagger here to turn a quick gesture into a long one.

     back.out for the overshoot, which is the site's arrival curve everywhere it
     is one object landing: the menu's tab, the menu's discs, the slider's rolls.
     Gentler than the tab's 1.9 — this is a paper chip settling, not something
     being pulled. */
  DURATION: 0.85,
  EASE: "back.out(1.4)",
};

/* Fisher–Yates, the hero's. The shuffle IS the effect: reveal the same letters
   left to right and it reads as a wipe, which is a different thing entirely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initRollingReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".rolling-title .char"),
  );
  const tag = root.querySelector<HTMLElement>(".rolling-tag");
  if (!chars.length && !tag) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say: GSAP
   * reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would then
   * ADD to the yPercent below, leaving every letter parked a full height low.
   * With the attribute on, the computed transform is `none` and GSAP owns the
   * whole value.
   *
   * IT LIFTS THE TAG'S PARK TOO, and that one is not a transform: the chip is
   * held at opacity 0 by the same attribute, because a flip that begins from a
   * standing chip is a chip that jumps to edge-on and then turns. Nothing paints
   * in between either way — the attribute and both fromTos happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* WHEN THE HEADLINE IS DONE, published for the note to wait on.
   *
   * The note follows the words, so something has to know when the words have
   * finished, and the headline is the only thing that does: the figure is its
   * own delay, plus the stagger paid out across however many letters there
   * ARE, plus one letter's duration. Computed off chars.length rather than
   * written down, so re-setting the copy — a shorter heading, a third line —
   * moves the note with it instead of leaving a hand-copied constant behind.
   *
   * The last letter to START is what fixes the end, not the last one in the
   * markup: the order is shuffled, so every letter is somebody's last. The
   * total is the same either way, which is exactly why this is arithmetic on
   * the tween's own numbers and not a question asked of the tween.
   *
   * ON THE SECTION AS A CUSTOM PROPERTY, and that is not indirection for its own
   * sake. HandNote is a component with two other homes and no business importing
   * this page's timings; it already reads its pen, its pace and its copy off the
   * element it finds, and this is the fourth of those. Custom properties inherit,
   * so the note reads it from here without either file naming the other.
   *
   * Measured from the note being READY rather than from this moment — hand.ts
   * counts from the instant its instance is built and seen, which on this page
   * is a fraction after the cover clears. So this is a floor: never before the
   * headline, occasionally a hair after. That is the right way round. */
  root.style.setProperty(
    "--hand-delay",
    `${
      REVEAL.DELAY +
      /* Clamped, because a headline with no letters in it reaches here: the
         guard above only returns when the tag is missing TOO, and a bare
         `length - 1` would then pay the stagger back and pull the note in. */
      Math.max(chars.length - 1, 0) * ROLLING_REVEAL.STAGGER +
      REVEAL.DURATION +
      NOTE.GAP
    }`,
  );

  /* Thirteen letters flying in from nowhere and a chip turning over are exactly
     what the setting is asking about. The attribute alone has already put both
     where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Both built parked and played off one cue, so the top of the page is a single
     cascade rather than two things that each start when their own code happens
     to run — the hero's title and corner mark are paired the same way. */
  const title = chars.length
    ? gsap.fromTo(
        shuffle(chars),
        { yPercent: REVEAL.HIDDEN },
        {
          yPercent: 0,
          duration: REVEAL.DURATION,
          stagger: ROLLING_REVEAL.STAGGER,
          ease: REVEAL.EASE,
          paused: true,
        },
      )
    : null;

  const flip = tag
    ? gsap.fromTo(
        tag,
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
        },
      )
    : null;

  /* The delays are delayedCalls rather than the tweens' own, for the reason the
     hero gives: they are measured from the REVEAL, and a paused tween's `delay`
     is ambiguous about what it is measured from. REVEAL.DELAY is the title's and
     is the hero's exactly, so this page and the front page open on one beat. */
  let startTitle: gsap.core.Tween | null = null;
  let startTag: gsap.core.Tween | null = null;

  const unsubscribe = whenRevealed(() => {
    if (title) {
      startTitle = gsap.delayedCall(REVEAL.DELAY, () => title.play());
    }
    if (flip) {
      startTag = gsap.delayedCall(TAG.DELAY, () => flip.play());
    }
  });

  return () => {
    unsubscribe();
    startTitle?.kill();
    startTag?.kill();
    title?.kill();
    flip?.kill();
    /* A teardown mid-arrival must leave the page readable — the headline
       standing and the chip face on. Back to the stylesheet, which with the
       attribute still set is home rather than hidden. */
    gsap.set(chars, { clearProps: "transform" });
    if (tag) gsap.set(tag, { clearProps: "transform,opacity,visibility" });
  };
}
