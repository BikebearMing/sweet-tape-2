/* Sweet Tape — the contact page arriving: the chip turns, the line writes
 * itself, the paper is laid down and the note is stuck on it.
 *
 * PLAYED OFF THE COVER AND NOT OFF THE SCROLL, which is the rule every opening
 * screen on this site follows and the reason none of them uses a ScrollTrigger:
 * a trigger whose start is already behind the scroll fires the moment it is
 * created, and on the first screenful of a page that moment is under a sheet of
 * paper. whenRevealed is the cue instead, on a cold load and on a route change
 * alike (Preloader/gate.ts). Article/reveal.ts, WhatsRolling/reveal.ts and
 * PickYourPlayer/reveal.ts all make the same call at length.
 *
 * THE SHEET'S HEADING USED TO BE ON A TRIGGER AND THAT WAS A BUG, worth stating
 * because it is the exact failure the paragraph above describes. It was cued at
 * "top 70%", and the sheet's top edge sits about 536px down a page whose first
 * screen is 900 — already past 70% before anything scrolls, so the trigger fired
 * the instant it was built and the heading spent its entrance under the cover.
 * Nothing about it looked broken; the words were simply always already there.
 *
 * NOTHING HERE IS NEW. The letters are the hero's — same duration, same ease,
 * same hidden figure, same shuffle. The chip's turn is the news index's title
 * card's, imported whole. The paper and the note arrive on the news index's
 * card entrance, also imported whole: parked at nothing, a little low and out
 * of focus, resolving in place. They are rectangles rather than type, and that
 * file argues at length why rectangles do not get the letter treatment. What is
 * this page's is the ORDER, which is below.
 *
 * THE ORDER IS THE ORDER THE THING WAS MADE IN. The label goes on, the line is
 * written, the paper is laid over it, and the note is stuck to the paper last —
 * so the screen assembles the way a hand would have assembled it. The two later
 * beats overlap what they follow rather than queueing behind it: waiting for
 * each move to finish before starting the next put the last of it near three
 * seconds out, which is a page being watched rather than a page arriving.
 *
 * THE FORM IS NOT IN ANY OF IT, and that is deliberate. Five fields and a button
 * sliding in one after another is a page assembling itself in front of somebody
 * who came here to type. The paper arrives carrying them.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { INDEX_REVEAL } from "../NewsIndex/reveal";
import { REVEAL } from "../Hero/reveal";
import { NOTE, TAG } from "../WhatsRolling/reveal";

export const CONTACT_REVEAL = {
  /* Between letters, in shuffled order. Tighter than the hero's 0.025 — this is
     nineteen characters set at 190px, the largest type on the site, and at the
     hero's pace a block this size is still assembling itself well after the eye
     has read it. The closing key visual makes the same call at the same size. */
  STAGGER: 0.02,

  /* The sheet's heading has its own, quicker again: sixteen characters at a
     seventh the size, and it is a subhead on a piece of paper rather than the
     thing the page is about. */
  SHEET_STAGGER: 0.016,

  /* WHEN THE PAPER IS LAID DOWN, as a fraction of how long the headline takes.
     A fraction and not a delay, so re-setting the headline — a third line, a
     longer phrase — moves this with it instead of leaving a hand-copied number
     behind that is now early or late.

     0.6 puts the paper in while the last third of the line is still being
     written. It is a different object in a different place, so the two do not
     compete for the eye the way two blocks of type would — the footer overlaps
     its headline onto its nav row for the same reason, and its note says so. */
  SHEET_AT: 0.6,

  /* And the note goes on after the paper is down rather than with it, because
     that is the one ordering on this screen that is physically true: a note is
     stuck TO something. NOTE.GAP is the beat the title card and the story page
     both pause for — not because this is the same gesture, but because it is
     the same PAUSE, and a site with two ideas of how long a beat is stutters. */
  NOTE_GAP: NOTE.GAP,
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
   count rather than written down, so re-setting the copy moves whatever waits
   on it instead of leaving a hand-copied constant behind. Article/reveal.ts and
   WhatsRolling/reveal.ts derive their cues the same way, and the latter says why
   the SHUFFLE does not affect the total. */
function spanOf(count: number, stagger: number): number {
  return Math.max(count - 1, 0) * stagger + REVEAL.DURATION;
}

export function initContactReveal(root: HTMLElement): () => void {
  const title = Array.from(
    root.querySelectorAll<HTMLElement>(".contact-title .char"),
  );
  const sheetChars = Array.from(
    root.querySelectorAll<HTMLElement>(".contact-sheet-head .char"),
  );
  const chip = root.querySelector<HTMLElement>(".contact-chip");
  const sheet = root.querySelector<HTMLElement>(".contact-sheet");
  const note = root.querySelector<HTMLElement>(".contact-note");
  if (!title.length && !sheetChars.length && !chip) return () => {};

  /* Hand everything over from the stylesheet.
   *
   * global.css holds the letters under their masks until this attribute lands,
   * and setting it first is what makes the tweens' numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent below, leaving every letter parked a full height
   * low. With the attribute on, the computed transform is `none` and GSAP owns
   * the whole value.
   *
   * IT LIFTS THREE PARKS THAT ARE NOT TRANSFORMS TOO — the chip, the paper and
   * the note are all held at opacity 0 by the same attribute. They are parked at
   * nothing rather than under a mask for the reason the index's cards are: an
   * entrance that begins by blurring something the reader can already see is a
   * page correcting itself.
   *
   * Nothing paints in between: the attribute and every fromTo happen in the same
   * task, and a fromTo renders its `from` immediately even when paused. */
  root.dataset.reveal = "live";

  /* Nineteen letters flying in from nowhere, a chip turning over and two blocks
     resolving out of a blur are exactly what the setting is asking about. The
     attribute alone has already put all four where they belong. */
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
            /* Built parked and played on the cue. Paused costs the letters
               nothing: a fromTo renders its `from` immediately either way,
               which is what keeps them under their masks with nothing painted
               in between (see the attribute above). */
            paused: true,
          },
        )
      : null;

  /* The index's card entrance, imported whole rather than re-chosen — parked at
     nothing, a tenth of its own height low and out of focus, resolving in
     place. Its file argues every one of these numbers, including why the blur
     is small and why the filter is cleared at the end rather than left at
     blur(0px): a declared filter keeps the element on its own compositor layer
     for the rest of the page's life, and one of these two is a 1076px sheet. */
  const block = (el: HTMLElement | null) =>
    el
      ? gsap.fromTo(
          el,
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
            ease: INDEX_REVEAL.CARD_EASE,
            paused: true,
            onComplete: () => gsap.set(el, { clearProps: "filter" }),
          },
        )
      : null;

  const head = letters(title, CONTACT_REVEAL.STAGGER);
  const sub = letters(sheetChars, CONTACT_REVEAL.SHEET_STAGGER);
  const paper = block(sheet);
  const stuck = block(note);

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

  /* THE SCHEDULE, derived rather than typed. Only the headline's own cue is a
     constant; everything after it is measured off what it follows, so re-setting
     any of the copy moves the whole cascade rather than leaving the later beats
     where they were. */
  const headSpan = spanOf(title.length, CONTACT_REVEAL.STAGGER);
  const sheetAt = REVEAL.DELAY + CONTACT_REVEAL.SHEET_AT * headSpan;
  /* The paper is down, so what is written on it may be written and what is
     stuck to it may be stuck on. The heading needs the blur off before its
     letters start, or they slide up through a sheet that is still resolving. */
  const landed = sheetAt + INDEX_REVEAL.DURATION;

  /* delayedCalls rather than the tweens' own delays, for the reason the hero
     gives: these are measured from the REVEAL, and a paused tween's `delay` is
     ambiguous about what it is measured from. REVEAL.DELAY and TAG.DELAY are the
     hero's and the title card's, so every page on this site opens on one beat. */
  const starts: gsap.core.Tween[] = [];
  const at = (t: number, tween: gsap.core.Tween | null) => {
    if (tween) starts.push(gsap.delayedCall(t, () => tween.play()));
  };

  const unsubscribe = whenRevealed(() => {
    at(REVEAL.DELAY, head);
    at(TAG.DELAY, flip);
    at(sheetAt, paper);
    at(landed, sub);
    at(landed + CONTACT_REVEAL.NOTE_GAP, stuck);
  });

  return () => {
    unsubscribe();
    starts.forEach((s) => s.kill());
    [head, sub, paper, stuck, flip].forEach((t) => t?.kill());
    /* A teardown mid-arrival must leave the page readable — both headings
       standing, the chip face on, and the paper and the note in focus and
       visible. Back to the stylesheet, which with the attribute still set is
       home rather than hidden. */
    if (title.length) gsap.set(title, { clearProps: "transform" });
    if (sheetChars.length) gsap.set(sheetChars, { clearProps: "transform" });
    if (chip) gsap.set(chip, { clearProps: "transform,opacity,visibility" });
    for (const el of [sheet, note]) {
      if (el) {
        gsap.set(el, { clearProps: "transform,opacity,visibility,filter" });
      }
    }
  };
}
