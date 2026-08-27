/* Sweet Tape — "click me!", written onto the roll the pointer has settled on.
 *
 * The arrow is ruled in off the roll's shoulder with the note written above it,
 * both in that tape's own ink; leaving the roll takes both away, and the next
 * roll is drawn from nothing. It stands OUTSIDE the label rather than across it,
 * on whichever shoulder has room — see CUE_SIDE in PickYourPlayer/index.tsx.
 * Markup in PickYourPlayer/ClickMe.tsx.
 *
 * THE PEN IS HANDNOTE'S, NOT A SECOND ONE. setCopy, park, write and the DRAW
 * timings all come from HandNote/hand.ts — the same setting, the same masks, the
 * same alphabet — so this note and the four on the rest of the site are one hand
 * and a re-export of the glyphs corrects all five. What this file owns is the
 * two things that are genuinely different about a cue: the ruled margin is an
 * ARROW, and the release is a HOVER.
 *
 * WHICH MAKES THE UNWRITING THE ONE REAL DEPARTURE. hand.ts is blunt that a
 * sentence unwriting itself when the reader looks away is a party trick, and it
 * is right about a note on a board — that note is copy, and copy that erases
 * itself was never read. A cue is not copy. It belongs to one roll, it is only
 * true while that roll is the one being looked at, and six of them left standing
 * would be a row shouting at itself. So it goes, and it goes by FADING rather
 * than by unwriting: the pen never runs backwards, the mark is simply taken off
 * the page and the timeline put back to nothing for next time.
 *
 * IT WAITS FOR THE PAGE TO BECOME THE TAPE. The cue is drawn in the tape's ink
 * — the same value its small print is set in — which is a colour chosen to read
 * on that tape's own sheet and not on the one before it. recolour.ts spends a
 * settle and half a sheet getting there (PICK_WASH.SETTLE + SHEET), so this
 * holds for DELAY before the pen touches down. Sweeping the row therefore costs
 * nothing: the cue for a roll passed through is never started, exactly as the
 * wash for it is never started.
 *
 * Nothing here binds a listener. fan.ts knows which roll the pointer is on and
 * says so through one callback; Stage.tsx hands that callback to this and to
 * recolour.ts both. See the note there.
 */
import gsap from "gsap";

import { loadGlyphs, type Glyph } from "@/components/HandNote/glyphs";
import { DRAW, park, setCopy, unpark, write } from "@/components/HandNote/hand";

/* WHAT IT SAYS, and it says it on two lines.
 *
 * ON TWO LINES BECAUSE OF THE HEADLINE. The cue stands clear of the roll, which
 * means it stands ABOVE the row — and there are only 3.2vw between PLAYER's line
 * box and the top of the rolls. Set on one line "click me!" is about five times
 * as wide as it is tall, so it wants a cue of about 14vw, and a cue that wide is
 * one that cannot be moved out from under the type on either shoulder: at that
 * size four of the six collide whichever way they are flipped. Broken, the block
 * is half as wide and twice as tall, an 8.2vw cue carries it, and three-and-three
 * is enough to fit the whole row (CUE_SIDE in PickYourPlayer/index.tsx).
 *
 * It reads better broken anyway, which is the argument that would have won on
 * its own: two short lines is what somebody actually scribbles beside an arrow.
 * The breaks are the drawing, exactly as they are in HandNote/copy.ts — nothing
 * wraps these. */
const LINES = ["click", "me!"];

const CUE = {
  /* THE HOLD BEFORE THE PEN TOUCHES DOWN, in seconds — see the note above. It
     is PICK_WASH.SETTLE plus about half of PICK_WASH.SHEET, which is the moment
     the incoming sheet has crossed the top-left of the row and the ink this is
     drawn in is standing on the colour it was chosen for. Reading those two
     figures off recolour.ts and adding them would tie the cue to a module it
     otherwise knows nothing about, for a number that wants to be tuned by eye. */
  DELAY: 0.42,

  /* How fast the pen moves, as a MULTIPLE of the durations in DRAW — the same
     dial every note on the site has as --hand-draw, written here rather than in
     the stylesheet because this note is not a HandNote and has no such property
     to read.

     WELL UNDER 1, and for the reason the pinning section's note is: a cue lives
     in the gap between a reader arriving on a roll and clicking it, which is
     about a second. A gesture longer than the window it plays in is a gesture
     nobody sees the end of. */
  PACE: 0.5,

  /* On and off. Short enough on the way in to be under the first stroke — the
     arrow should look drawn, not faded up and then drawn — and short on the way
     out because the reader has already moved on. */
  FADE_IN: 0.12,
  FADE_OUT: 0.16,
};

/* The pen, when the stylesheet has not named one — see --cue-ink in global.css,
   which points it at the tape's own --ink. The hero's dark green, because a cue
   in no colour at all is a cue nobody can see. */
const INK = "#013900";

type Cue = {
  /* The .pick-cue box: what fades, and what carries --cue-ink. */
  el: HTMLElement;
  /* Built once, on the glyphs arriving. Null until then, and null for good on a
     roll whose markup is missing a piece. */
  tl: gsap.core.Timeline | null;
  /* The svg this build put in the mount, so the teardown takes down its own
     work — the alphabet arrives asynchronously and a build can land after the
     section has gone. */
  drawn: SVGSVGElement | null;
  /* The wait between the pointer settling and the pen touching down. Kept so it
     can be killed: a cue left in its hold would write itself onto a roll the
     pointer has already left. */
  held: gsap.core.Tween | null;
};

/** What this module hands back to whoever is doing the picking. */
export type PickCue = {
  /**
   * Draw the cue on a roll, or take away whichever one is showing.
   *
   * @param roll a `.pick-roll`, or null when the row has been left
   */
  show: (roll: HTMLElement | null) => void;
  stop: () => void;
};

/**
 * Wires the row's cues up.
 *
 * @param root the <section class="pick-player">
 */
export function initPickCue(root: HTMLElement): PickCue {
  /* NOTHING IS BUILT WHERE THERE IS NO POINTER. fan.ts asks the same question
     before it binds its listeners — on a touch screen a tap synthesises a
     mousemove and never sends the mouseleave — so `show` could never be called
     here anyway. Asking it too is what stops the phone fetching the alphabet and
     building six svgs that nothing can ever reveal. */
  if (!window.matchMedia("(hover: hover)").matches) {
    return { show: () => {}, stop: () => {} };
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Keyed by the ROLL and not by the cue, because the roll is what arrives:
     fan.ts hands over the .pick-roll it is lifting and knows nothing about what
     is hanging off it. */
  const cues = new Map<HTMLElement, Cue>();

  for (const roll of root.querySelectorAll<HTMLElement>(".pick-roll")) {
    const el = roll.querySelector<HTMLElement>(".pick-cue");
    /* A roll with no cue is simply a roll that does not carry one. It still
       lifts and still recolours the page — unlike the row's own halves, these
       are independent of each other. */
    if (el) cues.set(roll, { el, tl: null, drawn: null, held: null });
  }

  let stopped = false;
  /* The cue that is showing, or on its way to showing. Written the moment the
     pointer settles, which is also the moment the last one is told to go. */
  let current: Cue | null = null;

  function build(cue: Cue, glyphs: Map<string, Glyph>) {
    const mount = cue.el.querySelector<HTMLElement>(".pick-cue-ink");
    const arrow = Array.from(
      cue.el.querySelectorAll<SVGPathElement>(".pick-cue-stroke"),
    );
    if (!mount || !arrow.length) return;

    /* The pen, off the cue itself — the same custom property the stylesheet
       already paints the arrow's strokes with, so the arrow and the writing
       cannot disagree about what colour this tape is. Trimmed because a custom
       property keeps the whitespace it was written with, which is not a
       colour. */
    const ink =
      getComputedStyle(cue.el).getPropertyValue("--cue-ink").trim() || INK;

    const { svg, pen } = setCopy(mount, LINES, glyphs, ink);
    cue.drawn = svg;
    if (!pen.length) return;
    const letters = pen.flat();

    if (reduced) {
      /* Standing, in ink, the moment it is asked for. The cue is a gesture and
         the drawing is the flourish; this is the page with the flourishes turned
         off, and a cue that appears is still a cue. */
      arrow.forEach(unpark);
      letters.forEach(unpark);
      return;
    }

    arrow.forEach(park);
    letters.forEach(park);

    cue.tl = gsap.timeline({ paused: true });

    /* THE ARROW FIRST, at a constant pen speed, then the lift, then the note
       over it — which is the ruled margin's own order in hand.ts and the same
       gesture: something is drawn for the writing to sit against, the pen comes
       off the page, and the words follow. */
    let cursor = write(cue.tl, arrow, 0, DRAW.RULE * CUE.PACE) + DRAW.LIFT * CUE.PACE;

    /* And the copy, a letter at a time with each one starting before the last
       has finished. The cursor walks the whole block so the line break costs
       nothing — a hand does not pause at the end of a line, it is already moving
       when it gets there. Spaces are counted off the COPY rather than off the
       glyphs, so a space and a character with no export are the same beat. */
    let g = 0;
    for (const line of LINES) {
      for (const ch of line.toLowerCase()) {
        if (ch === " " || !glyphs.get(ch)) {
          cursor += DRAW.PER * DRAW.SPACE * CUE.PACE;
          continue;
        }
        write(cue.tl, pen[g++], cursor, DRAW.PER * CUE.PACE);
        cursor += DRAW.PER * (1 - DRAW.OVERLAP) * CUE.PACE;
      }
    }
  }

  function reveal(cue: Cue) {
    gsap.killTweensOf(cue.el);
    cue.held?.kill();
    cue.held = null;

    if (reduced) {
      gsap.set(cue.el, { autoAlpha: 1 });
      return;
    }
    /* Nothing to play yet — the alphabet is still in flight. `current` already
       points here, so the build will reveal it when it lands. */
    if (!cue.tl) return;

    /* Back to nothing before the hold, not after it: a cue re-entered while its
       own fade-out was still running must not show the tail of the last
       drawing for the length of the wait. */
    cue.tl.pause(0);
    gsap.set(cue.el, { autoAlpha: 0 });

    /* A delayedCall rather than the timeline's own `delay`, which on a paused
       timeline is ambiguous about what it is measured from. This one is measured
       from HERE — the moment the pointer settled — which is the only thing it
       could mean. hand.ts's own hold is built the same way. */
    cue.held = gsap.delayedCall(CUE.DELAY, () => {
      cue.held = null;
      gsap.to(cue.el, { autoAlpha: 1, duration: CUE.FADE_IN, ease: "none" });
      cue.tl?.play(0);
    });
  }

  function hide(cue: Cue) {
    gsap.killTweensOf(cue.el);
    cue.held?.kill();
    cue.held = null;

    if (reduced) {
      gsap.set(cue.el, { autoAlpha: 0 });
      return;
    }
    /* Faded off rather than unwritten — see the note at the top. The timeline
       goes back to nothing only once it can no longer be seen doing it, which is
       what lets the next hover on this roll draw the arrow from the start. */
    gsap.to(cue.el, {
      autoAlpha: 0,
      duration: CUE.FADE_OUT,
      ease: "none",
      onComplete: () => cue.tl?.pause(0),
    });
  }

  /* THE ALPHABET, then the drawing — and one round of requests for the whole
     row, because glyphs.ts caches by document and all six cues spell the same
     two words. The cue the pointer is already on is revealed as soon as it can
     be: a reader whose hand was on a roll before this resolved would otherwise
     have to leave it and come back. */
  loadGlyphs(LINES).then((glyphs) => {
    if (stopped) return;
    for (const cue of cues.values()) build(cue, glyphs);
    if (current) reveal(current);
  });

  return {
    show(roll) {
      const next = roll ? cues.get(roll) ?? null : null;
      if (next === current) return;
      if (current) hide(current);
      current = next;
      if (next) reveal(next);
    },
    stop() {
      stopped = true;
      current = null;
      for (const cue of cues.values()) {
        gsap.killTweensOf(cue.el);
        cue.held?.kill();
        cue.tl?.kill();
        gsap.set(cue.el, { clearProps: "opacity,visibility" });
        /* THIS build's svg rather than whatever the mount currently holds: a
           build that lands after a teardown writes into a detached mount and is
           dropped at the next collection, and must not be able to reach into a
           live cue and clear it. */
        cue.drawn?.remove();
        cue.drawn = null;
      }
    },
  };
}
