/* Sweet Tape — "click me!", written onto the roll the pointer has settled on.
 *
 * The arrow is ruled in off the roll's shoulder with the note written above it,
 * both in that tape's own ink; leaving the roll takes both away, and the next
 * roll is drawn from nothing. It stands OUTSIDE the label rather than across it,
 * on whichever shoulder has room — see CUE_SIDE in PickYourPlayer/index.tsx.
 * Markup in PickYourPlayer/ClickMe.tsx.
 *
 * THE PEN IS HANDNOTE'S, NOT A SECOND ONE. park, write, typeset, type and the
 * DRAW timings all come from HandNote/hand.ts, so this note and the ones on the
 * rest of the site type the same way. What this file owns is the
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

import { DRAW, park, type, typeset, write } from "@/components/HandNote/hand";

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

type Cue = {
  /* The .pick-cue box: what fades, and what carries --cue-ink. */
  el: HTMLElement;
  /* Null for good on a roll whose markup is missing a piece, and under reduced
     motion, where the cue simply appears. */
  tl: gsap.core.Timeline | null;
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
  /* NOTHING IS BUILT WHERE NOTHING CAN CALL IT. fan.ts reveals a cue on hover
     where there is one, and on the first TAP of a roll where there is not
     (768 up) — so the cues are built for both. What is left out is the phone:
     under 768 fan.ts binds neither path, so `show` could never be called and
     building six timelines for it would be waste. The media list mirrors
     fan.ts's pair of conditions; keep them in step. */
  if (!window.matchMedia("(hover: hover), (min-width: 744px)").matches) {
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
    if (el) cues.set(roll, { el, tl: null, held: null });
  }

  /* The cue that is showing, or on its way to showing. Written the moment the
     pointer settles, which is also the moment the last one is told to go. */
  let current: Cue | null = null;

  function build(cue: Cue) {
    const mount = cue.el.querySelector<HTMLElement>(".pick-cue-ink");
    const arrow = Array.from(
      cue.el.querySelectorAll<SVGPathElement>(".pick-cue-stroke"),
    );
    /* Reduced motion leaves the markup as it is — arrow drawn, words standing —
       and reveal() just shows it. */
    if (!mount || !arrow.length || reduced) return;

    arrow.forEach(park);
    cue.tl = gsap.timeline({ paused: true });

    /* THE ARROW FIRST, at a constant pen speed, then the lift, then the words —
       the ruled margin's own order in hand.ts. */
    const drawn = write(cue.tl, arrow, 0, DRAW.RULE * CUE.PACE);
    type(cue.tl, typeset(mount), drawn + DRAW.LIFT * CUE.PACE, CUE.PACE);
  }

  function reveal(cue: Cue) {
    gsap.killTweensOf(cue.el);
    cue.held?.kill();
    cue.held = null;

    if (reduced) {
      gsap.set(cue.el, { autoAlpha: 1 });
      return;
    }
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

  for (const cue of cues.values()) build(cue);

  return {
    show(roll) {
      const next = roll ? cues.get(roll) ?? null : null;
      if (next === current) return;
      if (current) hide(current);
      current = next;
      if (next) reveal(next);
    },
    stop() {
      current = null;
      for (const cue of cues.values()) {
        gsap.killTweensOf(cue.el);
        cue.held?.kill();
        cue.tl?.kill();
        gsap.set(cue.el, { clearProps: "opacity,visibility" });
        /* Back to plain text, so a rebuild splits the words and not the spans. */
        cue.el
          .querySelectorAll<HTMLElement>(".hand-line")
          .forEach((line) => (line.textContent = line.textContent));
      }
    },
  };
}
