import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "@/components/Hero/reveal";
import { BODY_REVEAL } from "@/components/bodyReveal";
import { screenH } from "@/components/viewport";
import { mountRoll } from "./roll";

/* THE ANSWER ARRIVING — a sheet of lime falling over the belt's held green, and
 * the four beats that play once it has landed.
 *
 * TWO CLOCKS, AND THE SPLIT BETWEEN THEM IS THE DESIGN OF THIS FILE.
 *
 * THE CURTAIN IS SCRUBBED. It is the reader covering the old screen with the new
 * one: their wheel is what brings it down, it stops when they stop and it goes
 * back up if they scroll back. Anything else would be the page deciding to
 * change subject while somebody was still reading the last one.
 *
 * EVERYTHING AFTER IT IS PLAYED. The sentence writing itself, the line spreading
 * open, the mark dropping in and the roll rising are a SEQUENCE — an order of
 * events with a rhythm — and a rhythm cannot survive being scrubbed: under a
 * scrub the beats between them are however long the reader's wheel says they
 * are, and a bounce becomes a shape that only appears if you happen to scroll at
 * the right speed. So the curtain hands over to a paused timeline and that
 * timeline runs on its own. It is the call components/Reimagine makes for its
 * unfold and components/Hero makes for its headline; this section is the first
 * to make BOTH calls, one after the other, which is why they are argued here.
 *
 * WHERE THE HANDOVER HAPPENS is a trigger of its own rather than the curtain's
 * onComplete, and that is worth a line: under a scrub the tween's end is reached
 * whenever the scrubbing catches up, which is some fraction of a second after
 * the reader actually got there and is not a position on the page. A start of
 * its own is a position on the page — see PLAY_AT — and it can be set EARLY on
 * purpose, so the sentence is already coming as the last of the lime lands
 * rather than after a pause on a blank sheet.
 *
 * NOTHING HERE PINS ANYTHING. The stage is stuck to the top of the window by the
 * stylesheet (position: sticky) and the section is lifted back over the belt by
 * a negative margin, so the overlap is a layout rather than a second pinned
 * spacer stacked on the conveyor's. See .reason in global.css, which is where
 * the two screens of lift are counted out against the belt's tail — and
 * RUN.HOLD in Conveyor/belt.ts, which is the other end of that appointment.
 */

/* THE FALL.
 *
 * ONE SCREEN OF SCROLL, WHICH IS EXACTLY THE BELT'S HELD TAIL. The curtain runs
 * from the section's top reaching the top of the window to one screen past it,
 * and both ends are fixed by the same arithmetic: the section is lifted two
 * screens back over the conveyor, whose own run ends 1.04 screens after the mark
 * has finished growing. So the sweep begins on the frame the mark comes to rest
 * and finishes with a frame to spare before the belt unpins. It is not a taste
 * and it cannot be tuned on its own — see the note at .reason's margin-top.
 *
 * EASE, and an inOut one, for the same reason the belt has one: a sheet the size
 * of the window that starts and stops dead is a rectangle being repositioned. It
 * leaves from nothing, covers the middle of the screen quickest — which is where
 * the arc is deepest and the thing worth watching — and settles.
 *
 * SCRUB IS SMALL. The catch-up buys the fraction of a second of coasting at each
 * end and nothing else; anything bigger and the sheet is still falling when the
 * sentence underneath it has started to write. */
export const FALL = {
  END: "+=100%",
  EASE: "power2.inOut",
  SCRUB: 0.5,
} as const;

/* WHERE THE SEQUENCE TAKES OVER, as a share of one screen past the section's
   top — so 0.82 is 82% of the way through the fall. EARLY ON PURPOSE: the last
   fifth of the sweep is the arc's shallow ends closing into the bottom corners,
   which is the least interesting part of it, and having the sentence already
   under way there is what stops the section reading as two things that happened
   in turn. */
const PLAY_AT = 0.82;

/* THE SEQUENCE, IN THE ORDER THE BEATS FALL. Every figure is seconds on the
 * played timeline's own clock, and every one of the four is placed against the
 * one before it rather than at an absolute time — so moving the sentence moves
 * everything after it.
 *
 * TITLE is the site's headline entrance, shuffled: the hero's constants,
 * imported rather than copied, at a stagger of the hero's own. Twenty-three
 * letters at 0.025 apart is a little over half a second of arrival, which is a
 * sentence appearing rather than a wipe across one.
 *
 * SPREAD is the line making room for the mark, and it is the beat the whole
 * composition turns on. It starts LATE — after the last letter has landed —
 * because a gap that opened while the letters were still coming would read as
 * the line settling into its layout, where the point is that the line was
 * finished and then moved. inOut, because it is two words being pushed apart
 * and neither of them is being thrown.
 *
 * MARK is the bounce the section was asked for, and it is a back.out rather than
 * an elastic: back overshoots ONCE and settles, where elastic wobbles, and a
 * logo that wobbles reads as a sticker with a spring behind it. 1.9 is a firm
 * overshoot — about 15% past full size — which is what makes it land rather than
 * grow. It starts BEFORE the spread has finished, by MARK.LAP, so the mark is
 * already dropping as the words are still parting: two moves reading as one
 * beat, which is what the site does everywhere the order is not the point.
 *
 * COPY is the words inside the mark, and it is the site's LINE reveal — the one
 * for copy that is read rather than looked at. It waits until the blob has
 * actually stopped moving: three lines of type rising out of a shape that is
 * still overshooting is two animations in the same twenty pixels.
 *
 * ROLL runs across the whole of it, from zero, which is the one instruction
 * here that came in as a sentence rather than a number: the tape rises and grows
 * while everything else is happening. A back.out again so the two bounces agree,
 * and a longer duration than any single beat above so it is still settling as
 * the last of them lands — it is the biggest object on the screen and the last
 * thing to come to rest. */
/* THE CHIP, WHICH GOES FIRST AND IS THE ONE BEAT THAT IS NOT A REVEAL. There is
   no mask on it and nothing for it to come out of — it is a small finished
   object, held at nothing by the stylesheet and simply turned on. A short rise
   with it so it arrives rather than appears; well under the sentence's, because
   a label that travels as far as a headline is a label pretending to be one. */
const CHIP = { DURATION: 0.45, EASE: "power2.out", FROM_Y: 1.6 };

/* THE PARK IS THIS SECTION'S OWN AND NOT THE HERO'S, which is the one figure in
   here that is a bug fix rather than a beat. A letter is parked at a percentage
   of its own BOX, and this section's boxes are smaller than the letters in them —
   145 of line on a 190 face — so half-leading is negative and the capital stands
   proud of the box at both ends. At the hero's 130 the tops of every letter were
   still showing along the floor of their masks, for the whole of the curtain's
   fall. 155 is that figure with the overshoot paid for. global.css parks them at
   the same number and the two have to agree — see .reason .char. */
const TITLE = { HIDDEN: 155, STAGGER: REVEAL.STAGGER };

const SPREAD = { AT: 0.15, DURATION: 0.55, EASE: "power2.inOut" };

const MARK = { LAP: 0.28, DURATION: 0.7, EASE: "back.out(1.9)" };

/* And the same correction for the words on the mark, which are set even tighter
   — 25.62 on a 35.474 face. 135 against the shared rule's 110. */
const COPY = { HIDDEN: 135, LAG: 0.05, STAGGER: BODY_REVEAL.STAGGER };

/* HOW MUCH QUICKER THE WHOLE SEQUENCE RUNS BACKWARDS when the reader scrolls up
   out of the section — see the handover at the foot of this file, which is where
   the argument for reversing at all is made. */
const REPLAY = { BACK: 1.6 };

const ROLL = {
  AT: 0,
  DURATION: 1.4,
  EASE: "back.out(1.4)",
  /* Where it comes up FROM, as a share of its own height, and how small it
     starts. Both are modest: this is a heavy object arriving, not a bubble. */
  FROM_Y: 26,
  FROM_SCALE: 0.72,
  /* AND HOW LONG IT TAKES TO BE THERE AT ALL. Short against the move — under a
     fifth of it — so the roll is solid almost at once and the rest of the
     entrance is the rise, not a dissolve. It exists because the stylesheet parks
     the roll at nothing so the curtain has an empty stage to reveal (see
     .reason-roll-in), and something has to give it back. A fade rather than a
     scale from zero, which is what the MARK does: two things popping out of
     nothing in the same three seconds is one trick used twice. */
  FADE: 0.25,
};

/* Fisher–Yates, the hero's and Reimagine's. The shuffle IS the effect — reveal
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

export function initReason(root: HTMLElement): () => void {
  const rollBox = root.querySelector<HTMLElement>(".reason-roll-in");
  const card = rollBox?.querySelector<HTMLImageElement>("img") ?? null;

  /* THE ROLL IS MOUNTED WHATEVER ELSE HAPPENS, including under reduced motion
     and before any of the movement below is built. It is not an animation — it
     is the object the section is about, standing in its slot — and a reader who
     has asked for less motion is not asking to be shown a photograph of it
     instead. See ./roll.ts, which is inert once it has put the roll down. */
  const dropRoll = rollBox ? mountRoll(rollBox, card) : () => {};

  const chip = root.querySelector<HTMLElement>(".reason-kicker");
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".char"));
  const rises = Array.from(root.querySelectorAll<HTMLElement>(".body-rise"));
  const mark = root.querySelector<HTMLElement>(".reason-mark");

  /* A screen of lime falling over the window, a sentence flying up out of its
     masks and a tape roll bouncing into place are exactly what this setting is
     asking about. What is LEFT is where the section ends up — the curtain down,
     the sentence written, the mark landed and the words on it — which is what
     the stylesheet's own media query already draws, so there is nothing to do
     here but hand the roll over and stay out of the way. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return dropRoll;

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* THE CUSTOM PROPERTIES ARE WRITTEN AS STRINGS OFF PLAIN OBJECTS rather than
     tweened as properties — the way Conveyor/belt.ts drives --x, Peel drives
     --peel and the preloader drives its mark. GSAP would have to parse a custom
     property's current value out of the computed style on every invalidation to
     tween it in place; a number in a closure is already the number.

     THREE OF THEM AND THEY ARE ON DIFFERENT ELEMENTS ON PURPOSE. --reason-fall
     and --reason-space go on the SECTION, because the stylesheet reads them from
     boxes that are not the ones being animated — the sheet is a child of the
     stage and the gap is a flex item inside a line — and inheritance is cheaper
     than a query per frame. --reason-open goes on the mark itself because that
     is the only element that will ever read it. */
  const fall = { v: 0 };
  const space = { v: 0 };
  const open = { v: 0 };

  const writeFall = () =>
    root.style.setProperty("--reason-fall", String(fall.v));
  const writeSpace = () =>
    root.style.setProperty("--reason-space", String(space.v));
  const writeOpen = () =>
    mark?.style.setProperty("--reason-open", String(open.v));

  /* THE FIRST WRITE IS WHAT TAKES THE SECTION OFF THE PAGE, and it happens now
     rather than on the first frame of a tween. The stylesheet's rest pose is the
     FINISHED composition — it has to be, so that a page with no script on it is
     the answer to the page rather than a blank screen — so something has to undo
     it the moment there IS a script. This is that, and it is the same handover
     Reimagine's tape makes at --peel. */
  writeFall();
  writeSpace();
  writeOpen();

  /* And the letters, handed over from the stylesheet before any tween is built.
     global.css parks them with a percentage translate; GSAP reads that as
     resolved px and would ADD its own yPercent to it, leaving every letter a
     full height low. With the attribute on, the computed transform is `none` and
     GSAP owns the whole value. The same two lines are in Reimagine, Hero and the
     belt above, each with the bug they were written for. */
  root.dataset.reveal = "live";

  /* ---------------------------------------------------------------- the fall */

  const curtain = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: FALL.END,
      scrub: FALL.SCRUB,
      /* BETWEEN THE BELT'S 3 AND WE WANTED'S 1. A refresh reverts every pin,
         measures the page and puts them back in priority order, adding each
         one's spacing to whatever is measured after it. This section has no pin
         of its own, but it is positioned by one: its start is the conveyor's pin
         spacer minus two screens, so it has to be measured AFTER that spacer
         exists and BEFORE anything further down the page — TO REIMAGINE
         directly under it, at the default — goes looking for its own. */
      refreshPriority: 2,
    },
  });

  curtain.fromTo(
    fall,
    { v: 0 },
    { v: 1, duration: 1, ease: FALL.EASE, onUpdate: writeFall },
  );

  /* -------------------------------------------------------------- the sequence */

  const tl = gsap.timeline({ paused: true });

  if (chip) {
    /* autoAlpha and not opacity: the stylesheet's park is an opacity, and
       autoAlpha writes visibility with it — so the chip is out of the
       accessibility tree and out of hit-testing while it is held, rather than
       being an invisible target sitting over the sentence. */
    tl.fromTo(
      chip,
      { autoAlpha: 0, yPercent: CHIP.FROM_Y * 10 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: CHIP.DURATION,
        ease: CHIP.EASE,
      },
      0,
    );
  }

  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: TITLE.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: TITLE.STAGGER,
        ease: REVEAL.EASE,
      },
      0,
    );
  }

  /* WHERE THE SENTENCE IS FINISHED, read off the tween rather than typed: its
     own duration plus the stagger across however many letters the copy turned
     out to have. A sum that is right only for one length of one string is a sum
     waiting for the copy to be edited — see the bug Reimagine records at TAPE,
     which is this mistake made once already. */
  const written = chars.length
    ? REVEAL.DURATION + TITLE.STAGGER * (chars.length - 1)
    : 0;

  const spreadAt = written + SPREAD.AT;

  tl.fromTo(
    space,
    { v: 0 },
    {
      v: 1,
      duration: SPREAD.DURATION,
      ease: SPREAD.EASE,
      onUpdate: writeSpace,
    },
    spreadAt,
  );

  const markAt = spreadAt + SPREAD.DURATION - MARK.LAP;

  if (mark) {
    tl.fromTo(
      open,
      { v: 0 },
      { v: 1, duration: MARK.DURATION, ease: MARK.EASE, onUpdate: writeOpen },
      markAt,
    );
  }

  if (rises.length) {
    tl.fromTo(
      rises,
      { yPercent: COPY.HIDDEN },
      {
        yPercent: 0,
        duration: BODY_REVEAL.DURATION,
        stagger: COPY.STAGGER,
        ease: BODY_REVEAL.EASE,
      },
      markAt + MARK.DURATION + COPY.LAG,
    );
  }

  if (rollBox) {
    tl.fromTo(
      rollBox,
      { yPercent: ROLL.FROM_Y, scale: ROLL.FROM_SCALE },
      {
        yPercent: 0,
        scale: 1,
        duration: ROLL.DURATION,
        ease: ROLL.EASE,
      },
      ROLL.AT,
    );
    /* ITS OWN TWEEN AND NOT A PROPERTY OF THE ONE ABOVE, because the two run at
       different lengths: the rise takes ROLL.DURATION and the fade is over in a
       fifth of that. Folded into the fromTo it would be a roll dissolving into
       place for a second and a half. */
    tl.fromTo(
      rollBox,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: ROLL.FADE, ease: "none" },
      ROLL.AT,
    );
  }

  /* THE HANDOVER, AND IT GOES BOTH WAYS.
   *
   * ITS OWN POSITION ON THE PAGE rather than the curtain's onComplete — see the
   * note at the top of the file.
   *
   * AND IT IS NOT `once`, WHICH IS THE ONE PLACE THIS SECTION BREAKS THE SITE'S
   * RULE. Every other reveal here is forward-only, on the argument that copy
   * which has written itself must not unwrite when the reader scrolls back. That
   * argument holds for a section that scrolls away and is gone. It does not hold
   * for this one, because THE CURTAIN IS SCRUBBED: scroll back up and the lime
   * sheet lifts off the window under the reader's own wheel, taking the section
   * back off the page — and a forward-only sequence would leave the finished
   * composition parked behind it, so that scrolling down again re-revealed a
   * sentence that was already written, a mark already landed and a roll already
   * standing. The reveal would happen exactly once and every approach after it
   * would be the curtain sliding over a finished page.
   *
   * So the sequence follows the curtain. Down the page it plays; back up past
   * the same line it reverses, and the two clocks arrive at the same rest pose
   * at the same end of the scroll.
   *
   * QUICKER GOING BACK. The forward order is a rhythm and is worth its three and
   * a quarter seconds; the reverse is a tidy-up, mostly happening behind a sheet
   * that is already lifting off it, and at 1:1 it is still unwinding long after
   * the reader has gone. BACK is that ratio, and it is reset on every play so a
   * reader who turns round mid-reverse gets the beat at its own pace again.
   *
   * A FUNCTION START, so the screen it is a share of is measured at refresh
   * rather than baked in at build: a window resized between hydration and the
   * reader arriving would otherwise put the handover at the old screen's
   * height.
   *
   * AND IT IS screenH(), NOT innerHeight, which is the one line of this that is
   * about a phone. innerHeight is whatever the address bar happens to be doing
   * at the instant a refresh runs — so the same rotation could hand this a
   * screen 80px taller than the one the layout is drawn against, and the
   * curtain would start its fall at a different place on the page depending on
   * which way the reader had last flicked. screenH() is the SMALL viewport,
   * held for the session; see components/viewport.ts, and every other engine on
   * this site that turns the window's height into a scroll position. */
  const play = ScrollTrigger.create({
    trigger: root,
    start: () => `top top-=${Math.round(screenH() * PLAY_AT)}`,
    refreshPriority: 2,
    onEnter: () => {
      tl.timeScale(1);
      tl.play();
    },
    onLeaveBack: () => {
      tl.timeScale(REPLAY.BACK);
      tl.reverse();
    },
  });

  if (process.env.NODE_ENV !== "production") {
    /* Console handle for tuning, the same convention as window.hero,
       window.reimagine and window.conveyor. reason.tl.progress(0.5) holds the
       sequence half-assembled without scrolling to it; reason.tl.play(0) runs it
       again from the top. */
    Object.assign(window, { reason: { FALL, tl, curtain, play } });
  }

  return () => {
    dropRoll();
    play.kill();
    tl.kill();
    curtain.scrollTrigger?.kill();
    curtain.kill();
    delete root.dataset.reveal;
    /* Back to the pose the stylesheet describes, so a teardown mid-fall leaves
       the finished composition rather than a section stopped wherever the reader
       happened to be. */
    /* The chip is the one thing GSAP wrote INLINE rather than through a custom
       property, so clearing it takes a clearProps: an inline opacity of 1 would
       otherwise out-specify the stylesheet's park and survive the teardown. */
    if (chip) gsap.set(chip, { clearProps: "all" });
    if (rollBox) gsap.set(rollBox, { clearProps: "all" });
    root.style.removeProperty("--reason-fall");
    root.style.removeProperty("--reason-space");
    mark?.style.removeProperty("--reason-open");
  };
}
