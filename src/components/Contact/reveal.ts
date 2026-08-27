/* Sweet Tape — the contact page arriving: the chip turns, the line writes
 * itself and the paper is laid down.
 *
 * THE NOTE IS NOT IN ANY OF IT. It is already stuck to the board when the cover
 * lifts, fluttering from the first frame — the one object on the page that is
 * not put there by this file. It was given the paper's blur-up while the two
 * were one gesture, and the gesture was wrong: a note that arrives is a note
 * being placed, and this one is meant to have been there all along.
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
 * ALMOST NOTHING HERE IS NEW. The letters are the hero's — same duration, same
 * ease, same hidden figure, same shuffle. The chip's turn is the news index's
 * title card's, imported whole. The paper resolves out of a blur: parked at
 * nothing, a little low and out of focus, arriving in place. It is a rectangle
 * rather than type, and rectangles do not get the letter treatment — nine of
 * them doing it at once is nine arrivals competing, which is the argument
 * NewsIndex/reveal.ts makes about its wall.
 *
 * THAT BLUR-UP WAS THE INDEX'S AND IS NOW THIS PAGE'S. It was imported from
 * NewsIndex/reveal.ts while the two were one entrance; the index's cards have
 * since gone over to a bounce, and a back ease is the one curve a blur cannot
 * take — it overshoots, and a blur past its target is a negative radius. So the
 * numbers moved here, to the only file still using them. See BLOCK_BLUR below.
 *
 * What is this page's besides is the ORDER, which is below.
 *
 * THE ORDER IS THE ORDER THE THING WAS MADE IN. The label goes on, the line is
 * written, and the paper is laid over it — so the screen assembles the way a
 * hand would have assembled it. The later beats overlap what they follow rather
 * than queueing behind it: waiting for each move to finish before starting the
 * next put the last of it near three seconds out, which is a page being watched
 * rather than a page arriving.
 *
 * THE FORM IS NOT IN ANY OF IT, and that is deliberate. Five fields and a button
 * sliding in one after another is a page assembling itself in front of somebody
 * who came here to type. The paper arrives carrying them.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { REVEAL } from "../Hero/reveal";
import { TAG } from "../WhatsRolling/reveal";

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

  /* THE PAPER ARRIVING — parked at nothing, a little low and out of focus,
     resolving in place. It is the entrance the news index's cards used to wear,
     and these four numbers were imported from that file rather than written
     here.

     THEY MOVED HERE WHEN THE CARDS STOPPED USING THEM. The wall now bounces up on
     a back ease instead, and a back ease is the one curve this entrance cannot
     take: it overshoots whatever it is given, and a blur carried past its target
     is a negative radius, which is not a value. So the two entrances parted
     company and this one kept the numbers it was built on.

     The blur is small, and not only for the frame rate: past about 14 the sheet
     stops being an out-of-focus sheet and becomes a coloured smudge, which has
     nothing to resolve INTO. What sells it is the last third of the move, where
     the type on the paper comes back. The rise is a percentage of the block's
     own height — a tenth is enough to give the focus somewhere to arrive from;
     more and it is a slide with a blur on it, which is the entrance every other
     section on this site already has. */
  BLOCK_BLUR: 10,
  BLOCK_RISE: 6,
  BLOCK_DURATION: 0.62,
  /* .out and not .inOut, the site's arrival curve: the move is quickest at the
     start, so most of its length is spent on the part worth watching — the last
     of the blur coming off. */
  BLOCK_EASE: "power2.out",
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
  if (!title.length && !sheetChars.length && !chip) return () => {};

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
   * further down — in which any of this is standing before its entrance.
   *
   * TWO OF THE PARKS ARE NOT TRANSFORMS — the chip and the paper are both held
   * at opacity 0. They are parked at nothing rather than under a mask for the
   * reason the index's cards are: an entrance that begins by blurring something
   * the reader can already see is a page correcting itself. autoAlpha is an
   * absolute value with no CSS half to be added to, so neither needs a `y: 0`
   * of its own — only the same place in the order. The note is not among them:
   * it is stuck to the board before the cover lifts and is never held at all. */
  const masked = [...title, ...sheetChars];
  if (masked.length) gsap.set(masked, { y: 0, yPercent: REVEAL.HIDDEN });
  if (chip) gsap.set(chip, { autoAlpha: 0 });
  if (sheet) gsap.set(sheet, { autoAlpha: 0 });
  root.dataset.reveal = "live";

  /* Nineteen letters flying in from nowhere, a chip turning over and a sheet of
     paper resolving out of a blur are exactly what the setting is asking about.
     What is wanted is all three standing, so the parks above are handed straight
     back — under a live attribute the stylesheet's home for them is where they
     belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (masked.length) gsap.set(masked, { clearProps: "transform" });
    for (const el of [chip, sheet]) {
      if (el) gsap.set(el, { clearProps: "opacity,visibility" });
    }
    return () => {};
  }

  const letters = (chars: HTMLElement[], stagger: number) =>
    chars.length
      ? gsap.fromTo(
          shuffle(chars),
          /* `y: 0` for the reason the park above carries it — the `from` pose
             means HIDDEN and not "HIDDEN on top of whatever CSS had". */
          { y: 0, yPercent: REVEAL.HIDDEN },
          {
            yPercent: 0,
            duration: REVEAL.DURATION,
            stagger,
            ease: REVEAL.EASE,
            /* Built parked and played on the cue. Paused costs the letters
               nothing: they were put under their masks by the set above, and a
               fromTo renders its `from` immediately either way. */
            paused: true,
          },
        )
      : null;

  /* The paper arriving — parked at nothing, a tenth of its own height low and
     out of focus, resolving in place. CONTACT_REVEAL above argues every one of
     these numbers, including why the filter is cleared at the end rather than
     left at blur(0px): a declared filter keeps the element on its own compositor
     layer for the rest of the page's life, and this is a 1076px sheet. */
  const block = (el: HTMLElement | null) =>
    el
      ? gsap.fromTo(
          el,
          {
            autoAlpha: 0,
            yPercent: CONTACT_REVEAL.BLOCK_RISE,
            filter: `blur(${CONTACT_REVEAL.BLOCK_BLUR}px)`,
          },
          {
            autoAlpha: 1,
            yPercent: 0,
            filter: "blur(0px)",
            duration: CONTACT_REVEAL.BLOCK_DURATION,
            ease: CONTACT_REVEAL.BLOCK_EASE,
            paused: true,
            onComplete: () => gsap.set(el, { clearProps: "filter" }),
          },
        )
      : null;

  const head = letters(title, CONTACT_REVEAL.STAGGER);
  const sub = letters(sheetChars, CONTACT_REVEAL.SHEET_STAGGER);
  const paper = block(sheet);

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
  /* The paper is down, so what is written on it may be written. The heading
     needs the blur off before its letters start, or they slide up through a
     sheet that is still resolving. */
  const landed = sheetAt + CONTACT_REVEAL.BLOCK_DURATION;

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
  });

  return () => {
    unsubscribe();
    starts.forEach((s) => s.kill());
    [head, sub, paper, flip].forEach((t) => t?.kill());
    /* A teardown mid-arrival must leave the page readable — both headings
       standing, the chip face on, and the paper in focus and visible. Back to
       the stylesheet, which with the attribute still set is home rather than
       hidden. */
    if (title.length) gsap.set(title, { clearProps: "transform" });
    if (sheetChars.length) gsap.set(sheetChars, { clearProps: "transform" });
    if (chip) gsap.set(chip, { clearProps: "transform,opacity,visibility" });
    if (sheet) {
      gsap.set(sheet, { clearProps: "transform,opacity,visibility,filter" });
    }
  };
}
