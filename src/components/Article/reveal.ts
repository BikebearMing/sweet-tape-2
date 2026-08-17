/* Sweet Tape — the story arriving: the chip turns, the headline writes itself,
 * the sheet's own heading follows it.
 *
 * PLAYED OFF THE COVER AND NOT OFF THE SCROLL, which is the rule every opening
 * screen on this site follows and the reason none of them uses a ScrollTrigger:
 * a trigger whose start is already behind the scroll fires the moment it is
 * created, and on the first screenful of a page that moment is under a sheet of
 * paper. whenRevealed is the cue instead, on a cold load and on a route change
 * alike (Preloader/gate.ts). WhatsRolling/reveal.ts and PickYourPlayer/reveal.ts
 * make the same call at length.
 *
 * NOTHING HERE IS NEW. The letters are the hero's — same duration, same ease,
 * same hidden figure, same shuffle — and the chip's turn is the news index's
 * title card's, imported whole rather than re-chosen: it is the same object,
 * one page further in, and a second set of numbers for it would be a second
 * thing to keep in step. What is this page's is the ORDER, which is below.
 *
 * THE DECK IS A SECOND BEAT AND NOT PART OF THE FIRST. The page's headline is
 * on the lime and the deck is on the sheet of paper laid over it — two objects,
 * and shuffling one pool of letters across both would read as the two of them
 * being one block of type that happens to have a card in the middle of it. So
 * the deck waits for the headline to land and then writes itself, which is also
 * the order a reader takes them in.
 *
 * THE COPY UNDER IT IS NOT HERE AT ALL. That is the shared body reveal — a line
 * at a time, out of a floor that is not drawn, on its own trigger further down
 * the page (components/bodyReveal.ts). Two entrances, two voices, and the split
 * between them is the site's oldest rule about text.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { REVEAL } from "../Hero/reveal";
import { NOTE, TAG } from "../WhatsRolling/reveal";

export const ARTICLE_REVEAL = {
  /* Between letters, in shuffled order. Tighter than the title card's 0.04 and
     looser than the hero's 0.025, and the reason is the count: this headline is
     a story title an editor wrote — sixty or eighty characters over four lines,
     where WHAT'S ROLLING is thirteen. At the title card's pace a headline that
     long is still assembling itself three seconds in, which is a reader waiting
     to be allowed to read. */
  STAGGER: 0.018,

  /* THE DECK'S OWN PACE, and it is quicker again for the same reason turned
     round: it is a short line set at a third the size, low on the screen, and it
     is the second thing to arrive rather than the thing being waited for. */
  DECK_STAGGER: 0.025,

  /* The beat between the headline landing and the deck starting. The same
     length as the pen's wait before the note (NOTE.GAP, imported below) — not
     because they are the same gesture but because they are the same PAUSE, and
     a page with two different ideas of how long a beat is has a stutter in it. */
  DECK_GAP: NOTE.GAP,
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

/* How long a block of letters takes, start to finish: its stagger paid out
   across however many there are, plus one letter's own move. Computed off the
   count rather than written down, so re-setting the copy — a longer title, a
   deck of two lines — moves whatever waits on it instead of leaving a
   hand-copied constant behind. WhatsRolling/reveal.ts derives its note's cue the
   same way and says why the SHUFFLE does not affect the total. */
function spanOf(count: number, stagger: number): number {
  return Math.max(count - 1, 0) * stagger + REVEAL.DURATION;
}

export function initArticleReveal(root: HTMLElement): () => void {
  const title = Array.from(
    root.querySelectorAll<HTMLElement>(".article-title .char"),
  );
  const deck = Array.from(
    root.querySelectorAll<HTMLElement>(".article-deck .char"),
  );
  const chip = root.querySelector<HTMLElement>(".article-chip");
  if (!title.length && !deck.length && !chip) return () => {};

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tweens' numbers mean what they say: GSAP
   * reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent below, leaving every letter parked a full height
   * low. With the attribute on, the computed transform is `none` and GSAP owns
   * the whole value.
   *
   * IT LIFTS THE CHIP'S PARK TOO, and that one is not a transform: the chip is
   * held at opacity 0 by the same attribute, because a turn that begins from a
   * standing chip is a chip that jumps to edge-on and then turns. Nothing paints
   * in between either way — the attribute and every fromTo happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* WHEN THE PEN MAY TOUCH DOWN, published for the note beside the headline to
   * wait on — the title card's arrangement exactly, and its note is the long
   * version: HandNote is a component with three other homes and no business
   * importing this page's timings, so the figure travels as an inherited custom
   * property and neither file names the other.
   *
   * Measured off the HEADLINE and not the deck. The note annotates the headline
   * — it is written beside it, in the same field of lime — and the deck is a
   * screen further down under a different arrival. */
  root.style.setProperty(
    "--hand-delay",
    `${REVEAL.DELAY + spanOf(title.length, ARTICLE_REVEAL.STAGGER) + NOTE.GAP}`,
  );

  /* A headline flying in from nowhere and a chip turning over are exactly what
     the setting is asking about. The attribute alone has already put all three
     blocks where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const letters = (chars: HTMLElement[], stagger: number) =>
    chars.length
      ? gsap.fromTo(
          shuffle(chars),
          { yPercent: REVEAL.HIDDEN },
          {
            yPercent: 0,
            duration: REVEAL.DURATION,
            stagger,
            ease: REVEAL.EASE,
            paused: true,
          },
        )
      : null;

  const head = letters(title, ARTICLE_REVEAL.STAGGER);
  const sub = letters(deck, ARTICLE_REVEAL.DECK_STAGGER);

  /* The chip's turn, imported whole from the title card — see the note at the
     top of this file, and TAG in WhatsRolling/reveal.ts for what every one of
     these numbers is doing and why it is a rotateY and not a flip. */
  const flip = chip
    ? gsap.fromTo(
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
        },
      )
    : null;

  /* delayedCalls rather than the tweens' own delays, for the reason the hero
     gives: these are measured from the REVEAL, and a paused tween's `delay` is
     ambiguous about what it is measured from. REVEAL.DELAY is the hero's and the
     title card's, so every page on this site opens on one beat. */
  const starts: gsap.core.Tween[] = [];

  const unsubscribe = whenRevealed(() => {
    if (head) starts.push(gsap.delayedCall(REVEAL.DELAY, () => head.play()));
    if (flip) starts.push(gsap.delayedCall(TAG.DELAY, () => flip.play()));
    if (sub) {
      starts.push(
        gsap.delayedCall(
          REVEAL.DELAY +
            spanOf(title.length, ARTICLE_REVEAL.STAGGER) +
            ARTICLE_REVEAL.DECK_GAP,
          () => sub.play(),
        ),
      );
    }
  });

  return () => {
    unsubscribe();
    starts.forEach((s) => s.kill());
    head?.kill();
    sub?.kill();
    flip?.kill();
    /* A teardown mid-arrival must leave the page readable — both headings
       standing and the chip face on. Back to the stylesheet, which with the
       attribute still set is home rather than hidden. */
    if (title.length) gsap.set(title, { clearProps: "transform" });
    if (deck.length) gsap.set(deck, { clearProps: "transform" });
    if (chip) gsap.set(chip, { clearProps: "transform,opacity,visibility" });
  };
}
