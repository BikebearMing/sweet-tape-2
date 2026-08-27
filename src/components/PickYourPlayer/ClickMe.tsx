/* CLICK ME — the cue that appears on the roll being looked at.
 *
 * An arrow drawn into the top-left of the roll with a note written over it, in
 * that tape's own ink. One per roll, server-rendered inside the <li> and hidden
 * until the pointer settles on it; PickYourPlayer/cue.ts draws it.
 *
 * THE FILE IS ClickMe.tsx AND THE DRAWING IS cue.ts, which is the section's own
 * pattern (Stage/fan, Stage/recolour) with one wrinkle: the two cannot both be
 * called "cue", because a case-insensitive filesystem cannot tell Cue.tsx from
 * cue.ts and TypeScript refuses the pair outright. So the markup is named for
 * what it says and the drawing for what it is; the class names and the custom
 * properties are all --cue / .pick-cue.
 *
 * IT IS A HANDNOTE IN EVERYTHING BUT ITS RELEASE, and the pen is literally that
 * component's — cue.ts sets the copy with HandNote/hand.ts's own setCopy and
 * writes it with its own timing. What is different is the two ends of it: the
 * ruled margin is an ARROW here, because the note is pointing at something
 * rather than sitting beside it, and the release is a hover rather than a
 * scroll. See the note at the top of hand.ts on why the drawing is shared and
 * the trigger is not.
 *
 * THE ARROW IS IN THE MARKUP AND THE WRITING IS NOT, which is the same split
 * HandNote makes and for the same reason: the arrow is three fixed strokes and
 * belongs in a viewBox this stylesheet can be read against, and the copy is
 * built at runtime out of a folder of drawn glyphs.
 *
 * DECORATION, ALL OF IT. The roll is already a link with the tape's name on it
 * (see the <a> in index.tsx), so "click me!" is a gesture and not information —
 * it is out of the accessibility tree entirely and takes no pointer events, so
 * it can lie over the artwork without ever being what a click lands on.
 */

/* THE ARROW, drawn in the same hand as the note over it: a bowed shaft down to
 * the roll's shoulder and two short strokes off the tip, all three with a real
 * curve in them. Round caps and one weight, which is what makes the arrow and
 * the writing read as one pen rather than as a mark and a caption.
 *
 * THE VIEWBOX IS THE CUE'S BOX at 200 units to its width — .pick-cue is
 * --cue-w wide and 0.92 of that tall, so 200 x 184 is that box exactly and the
 * numbers here and the figures in global.css can be read against each other.
 *
 * WHERE THE TIP LANDS IS THE WHOLE POINT. It is at (162, 153) — 81% across the
 * cue and 83% down it — and the stylesheet hangs the cue so that corner just off
 * the roll's shoulder: the arrowhead finishes a sliver OUTSIDE the circle,
 * pointing at the label rather than drawn across it. See .pick-cue in
 * global.css, where that offset and the daylight it leaves are worked out.
 *
 * ON EITHER SHOULDER, from one set of paths. Half the row has no room above it
 * on the left — the rolls under PLAYER, and the first in the line, which has the
 * page's edge there — so those carry the same cue mirrored. The mirroring is
 * scaleX(-1) on this svg and nothing else, which is why the viewBox is the cue's
 * whole box rather than a box around the strokes: flip it and the tip lands on
 * the opposite shoulder at exactly the same offset.
 *
 * THREE PATHS AND NOT ONE, so the pen visibly lifts twice: the shaft is drawn,
 * then the head is put on it in two strokes. One path with the barbs folded into
 * it would draw the arrow as a single continuous scribble, which is not how a
 * hand makes an arrowhead.
 *
 * overflow is visible in the stylesheet, because the round caps sit half a
 * stroke outside the box at every end.
 */
function Arrow() {
  return (
    <svg
      className="pick-cue-arrow"
      viewBox="0 0 200 184"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* The shaft: out from under the last line of writing, falling away to the
          left before it swings right — a hand pulling toward the thing it is
          pointing at, not a ruled diagonal. */}
      <path className="pick-cue-stroke" d="M 28 88 C 50 124 88 144 158 152" />
      {/* And the head, upper barb then lower, both bowed. They are struck at
          about thirty degrees either side of the shaft's own direction at the
          tip, which is what makes the head sit ON the arrow rather than across
          it. */}
      <path className="pick-cue-stroke" d="M 162 153 C 151 147 140 138 130 128" />
      <path className="pick-cue-stroke" d="M 162 153 C 151 158 140 165 122 169" />
    </svg>
  );
}

/** Which shoulder of the roll the cue hangs off. */
export type CueSide = "left" | "right";

export default function ClickMe({ side }: { side: CueSide }) {
  return (
    /* The side travels as an attribute rather than a class, because it is a
       state of one thing and not a second kind of thing — the stylesheet reads
       it with [data-side] and every other figure in .pick-cue is shared. */
    <div className="pick-cue" data-side={side} aria-hidden="true">
      <Arrow />
      {/* cue.ts sets "click me!" into here as one svg. Empty by design, and it
          stays empty without JS — which costs nothing, because without JS there
          is no hover to reveal it either (the row's picking is fan.ts's). */}
      <div className="pick-cue-ink" />
    </div>
  );
}
