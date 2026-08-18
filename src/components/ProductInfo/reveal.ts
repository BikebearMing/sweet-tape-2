/* Sweet Tape — the origin story arriving: the story writes itself, the chip turns.
 *
 * OFF THE SCROLL AND NOT OFF THE COVER, which is the same call THE SIBLINGS
 * under it makes and the opposite one to the page's opening screen. This is the
 * second section of a long page and it is a full window below the fold when it
 * mounts — a ScrollTrigger is right exactly here. The failure a trigger causes
 * is when its start is ALREADY behind the scroll at build time, which is the
 * first screenful and not this.
 *
 * NOTHING HERE IS NEW. The story takes the site's type voice — every letter
 * under its own mask, sliding up in a shuffled order, at the hero's duration,
 * ease and hidden figure. The chip's turn is the title card's, imported whole
 * from WhatsRolling/reveal.ts, which is where every one of those numbers is
 * argued and why it is a rotateY rather than a forward flip. The story page and
 * the contact page take exactly the same pair.
 *
 * THE STORY GOES FIRST AND THE CHIP FOLLOWS, on the beat those two are already
 * on everywhere else they appear together (REVEAL.DELAY against TAG.DELAY). The
 * chip is a tenth of the type's size and says ORIGIN; opening on it would be the
 * section introducing itself with its own label.
 *
 * THE TAPE IS NOT IN ANY OF IT. Both strips are pressed on by press.ts on a cue
 * of their own — a hand arriving after the sentence is written, which is the
 * order the thing was made in and the reason that file exists.
 *
 * THE PACE IS THE ONE THING THAT IS THIS SECTION'S. This is a hundred and
 * seventy characters of display type rather than a headline of a dozen, so the
 * stagger is a third of the hero's — at 0.025 the last letters of the paragraph
 * would still be arriving two seconds after the reader got to it.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";
import { TAG } from "../WhatsRolling/reveal";

export const INFO_REVEAL = {
  /* Where the section has to be for it to go: its top edge seven tenths of the
     way down the window. Later than the siblings' 75% because this section
     opens on a deep band of padding above both columns — by three quarters
     there is nothing in shot but green. */
  START: "top 70%",

  /* Between letters, in shuffled order — see the note at the top. Around a
     hundred and seventy characters, so this is the one number to reach for if
     the block feels slow: it multiplies by every letter in the copy. */
  STAGGER: 0.008,

  /* The chip's beat behind the story's, and it is not a number of its own: it
     is the gap the title card and the story page already put between these two
     gestures, measured rather than re-typed so all three stay in step. */
  CHIP_GAP: TAG.DELAY - REVEAL.DELAY,
};

/* Fisher–Yates, the hero's. The shuffle IS the effect: reveal the same letters
   left to right and it reads as a wipe — which on a paragraph this size would be
   a bar of type sweeping across the column. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initInfoReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".info-story .char"),
  );
  const chip = root.querySelector<HTMLElement>(".subhead");
  if (!chars.length && !chip) return () => {};

  /* Hand both over from the stylesheet.
   *
   * global.css holds the letters under their masks until this attribute lands,
   * and setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would then
   * ADD to the yPercent below, leaving every letter parked a full height low.
   *
   * IT LIFTS THE CHIP'S PARK TOO, and that one is not a transform: the chip is
   * held at opacity 0 by the same attribute, because a turn that begins from a
   * standing chip is a chip that jumps to edge-on and then turns. Nothing paints
   * in between — the attribute and the fromTos happen in the same task, and a
   * fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* A paragraph flying in from nowhere and a chip turning over are exactly what
     the setting is asking about. The attribute alone has already put both where
     they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: INFO_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      0,
    );
  }

  if (chip) {
    tl.fromTo(
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
      },
      INFO_REVEAL.CHIP_GAP,
    );
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: INFO_REVEAL.START,
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-arrival must leave the section readable — the story
       standing and the chip face on. Back to the stylesheet, which with the
       attribute still set is home rather than hidden.

       THE CHIP'S OWN LEAN LIVES IN CSS and the turn writes over it, so the
       transform has to go rather than be zeroed: cleared, the rule's
       rotate(-1.6deg) is what the chip wears again. */
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    if (chip) gsap.set(chip, { clearProps: "transform,opacity,visibility" });
  };
}
