/* Sweet Tape — THE SIBLINGS arriving: three labels resolving, the name written.
 *
 * OFF THE SCROLL AND NOT OFF THE COVER, which is the opposite call to the
 * contact page's and the product page's opening screen, and for the opposite
 * reason: this is the third section of a long page and nobody has seen it when
 * it mounts. A ScrollTrigger is right exactly here — the failure it causes is
 * when the start is ALREADY behind the scroll at build time, which is the first
 * screenful, not the third section.
 *
 * NOTHING HERE IS NEW. The name takes the site's headline voice — every letter
 * under its own mask, sliding up in a shuffled order, at the hero's duration,
 * ease and hidden figure. The three cards take the news index's card entrance,
 * imported whole: parked at nothing, a little low and out of focus, resolving in
 * place. They are pictures rather than type, and that file argues at length why
 * pictures do not get the letter treatment — three rectangles doing it would be
 * three arrivals competing with each other.
 *
 * THE CARDS GO FIRST AND THE NAME FOLLOWS, which is the order they are read in:
 * the row is what the section is, and the name underneath says what the row was.
 * Read left to right rather than shuffled, because that is the order they are
 * going to be looked at anyway and three objects assembling out of order reads
 * as broken rather than as arriving.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { INDEX_REVEAL } from "../NewsIndex/reveal";
import { REVEAL } from "../Hero/reveal";

export const SIBLINGS_REVEAL = {
  /* Where the section has to be for it to go: its top edge three quarters of
     the way down the window. Earlier than the news index's 80% because this
     section opens on 134px of empty green above the cards — by the time its top
     edge is at four fifths there is already a card and a half in shot. */
  START: "top 75%",

  /* The beat between the last card landing and the name starting. Long enough
     that the two read as cause and effect rather than as one event; the row is
     what is being named, so it has to be there first. */
  TITLE_GAP: 0.18,

  /* Between letters, in shuffled order. Twelve characters set at 70px — the
     closing key visual's pace, not the hero's: at 0.025 a block this small is
     still assembling itself long after the cards have settled. */
  STAGGER: 0.03,
};

/* Fisher–Yates, the hero's. The shuffle IS the effect for TYPE: reveal the same
   letters left to right and it reads as a wipe. It is used on the name and never
   on the cards — see the note at the top. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initSiblingsReveal(root: HTMLElement): () => void {
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".siblings-title .char"),
  );
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>(".siblings-card"),
  );
  if (!chars.length && !cards.length) return () => {};

  /* Hand both over from the stylesheet.
   *
   * global.css holds the letters under their masks until this attribute lands,
   * and setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would then
   * ADD to the yPercent below, leaving every letter parked a full height low.
   *
   * THE CARDS ARE HELD BY THE SAME ATTRIBUTE and released by the same line. They
   * are parked at nothing rather than under a mask, for the reason the index's
   * cards are: an entrance that begins by blurring something the reader can
   * already see is a page correcting itself.
   *
   * Nothing paints in between: the attribute and both fromTos happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* Twelve letters flying in from nowhere and three labels resolving out of a
     blur are exactly what the setting is asking about. The attribute alone has
     already put both where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({ paused: true });

  /* In document order, left to right — see the note at the top. */
  if (cards.length) {
    tl.fromTo(
      cards,
      {
        autoAlpha: 0,
        yPercent: INDEX_REVEAL.RISE,
        filter: `blur(${INDEX_REVEAL.BLUR}px)`,
      },
      {
        autoAlpha: 1,
        yPercent: 0,
        filter: "blur(0px)",
        duration: INDEX_REVEAL.DURATION,
        stagger: INDEX_REVEAL.CARD_STAGGER,
        ease: INDEX_REVEAL.CARD_EASE,
        /* The filter comes off the elements entirely, not down to zero — a
           declared filter keeps each card on its own compositor layer for the
           rest of the page's life, and these are three 430px pictures. */
        onComplete: () => gsap.set(cards, { clearProps: "filter" }),
      },
      0,
    );
  }

  if (chars.length) {
    /* After the last card has landed: its own start is the stagger paid out
       across all three, and the move itself is one card's duration. Derived
       rather than typed, so re-pacing the row moves the name with it. */
    const rowSpan =
      Math.max(cards.length - 1, 0) * INDEX_REVEAL.CARD_STAGGER +
      INDEX_REVEAL.DURATION;

    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: SIBLINGS_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      rowSpan + SIBLINGS_REVEAL.TITLE_GAP,
    );
  }

  const st = ScrollTrigger.create({
    trigger: root,
    start: SIBLINGS_REVEAL.START,
    once: true,
    onEnter: () => tl.play(),
  });

  return () => {
    st.kill();
    tl.kill();
    /* A teardown mid-arrival must leave the section readable — the name standing
       and the three labels in focus. Back to the stylesheet, which with the
       attribute still set is home rather than hidden. */
    if (chars.length) gsap.set(chars, { clearProps: "transform" });
    if (cards.length) {
      gsap.set(cards, { clearProps: "transform,opacity,visibility,filter" });
    }
  };
}
