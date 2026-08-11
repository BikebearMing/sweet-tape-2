import type { CSSProperties } from "react";

import { NOTE_COPY } from "./copy";

/* Sweet Tape — the hand-written note.
 *
 * A margin ruled in two strokes with the copy written beside it. Server-rendered
 * markup only; components/HandNote/hand.ts draws it.
 *
 * It appears TWICE on the page and knows nothing about either place. The hero
 * writes it in the board's lime, on the dark green above the taped-down lemon
 * painting; the pinning section writes it in the giant ink, under TO CREATE's
 * photograph. Everything that differs between them — where it sits, how big it
 * is, what colour the pen is — is CSS on the instance, which is why this takes
 * a className and a style rather than a pile of props: the stylesheet is
 * already where --hand-w and --hand-ink are set, and a second mechanism for
 * saying the same things would be a second place to look.
 *
 * `decorative` is the one thing that is not CSS, and it is not a style choice.
 * The two notes carry the SAME sentence, so the second one to appear must not
 * put it into the accessibility tree again — a reader would meet the same words
 * twice with nothing to say why.
 */
type Props = {
  className?: string;
  style?: CSSProperties;
  /** Leave the copy out of the a11y tree — for a repeat of a note already read. */
  decorative?: boolean;
};

/* The ruled margin, drawn rather than ruled: a long stroke down the left and a
 * shorter one across the top, crossing near the corner with both ends run past
 * the crossing — which is what a corner looks like when a hand made it and not
 * a border property.
 *
 * The viewBox is the wrapper's box at ten units to the vw (global.css sizes
 * .hand-note at 32vw, so 320 units across), which is what lets the numbers here
 * and the numbers in the stylesheet be read against each other: the copy starts
 * 6.2vw from the left, and the down-stroke stands at x = 46..59.
 *
 * Both strokes are cubics with a real bow in them, off-axis on purpose — a
 * straight line drawn stroke-first reads as a loading bar. They are two paths
 * rather than one so the pen visibly lifts between them.
 *
 * The bow is what a shoulder and a wrist do: the top stroke sags through the
 * middle and picks up at the end, and the down-stroke pulls away from the
 * margin before coming back across it, so the two lines are arcs of two
 * different joints rather than one shape used twice. Around five units of
 * deviation off the chord — enough to see at a glance without the corner
 * starting to look drawn by someone in a hurry.
 *
 * overflow is visible in the stylesheet, because the round caps sit half a
 * stroke outside the box at both ends.
 */
function Rule() {
  return (
    <svg
      className="hand-rule"
      viewBox="0 0 320 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Across the top, rising to the right, starting well left of the
          down-stroke and sagging through the middle. */}
      <path className="hand-stroke" d="M 10 68 C 105 63 210 49 305 30" />
      {/* And down the margin, starting above the crossing and leaning right as
          it falls, the way a hand pulling toward itself does — away from the
          margin at first, then back across it. */}
      <path className="hand-stroke" d="M 46 32 C 43 86 50 142 59 196" />
    </svg>
  );
}

export default function HandNote({ className, style, decorative }: Props) {
  return (
    <div
      className={className ? `hand-note ${className}` : "hand-note"}
      style={style}
      aria-hidden={decorative || undefined}
    >
      {/* The written copy exists only as SVG strokes, which carry no text.
          aria-label is not honoured on a div, so the readable version is a real
          (hidden) text node — the same call the kicker and the corner mark make
          in Hero/index.tsx. Dropped entirely on a decorative copy rather than
          left inside an aria-hidden wrapper, so there is no hidden text sitting
          in the markup pretending to be read. */}
      {!decorative && <span className="sr-only">{NOTE_COPY}</span>}

      <Rule />

      {/* hand.ts appends Vara's SVG here. Empty by design, and it stays empty
          without JS: the note is decoration and the copy above it is not. */}
      <div className="hand-ink" aria-hidden="true" />
    </div>
  );
}
