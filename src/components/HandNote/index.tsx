import type { CSSProperties } from "react";

import { NOTE_LINES } from "./copy";

/* Sweet Tape — the hand-written note.
 *
 * A corner ruled in two thin lines with the copy typed inside it in Nothing You
 * Could Do. Server-rendered markup only; components/HandNote/hand.ts draws the
 * lines out and types the copy.
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
 * The board's two notes carry the SAME sentence, so the second one to appear
 * must not put it into the accessibility tree again — a reader would meet the
 * same words twice with nothing to say why.
 *
 * `lines` is the other. The home page's two copies say what the brand is; the
 * news page's says what the page is for, which is a different sentence in the
 * same hand — so the copy is an argument with the board's as its default rather
 * than a constant this component reaches for. The BREAKS come with it: they are
 * part of the drawing, not wrapping (see copy.ts), so a caller passing new words
 * is choosing where they fall.
 */
type Props = {
  className?: string;
  style?: CSSProperties;
  /** Leave the copy out of the a11y tree — for a repeat of a note already read. */
  decorative?: boolean;
  /** The written lines, break by break. Defaults to the board's own sentence. */
  lines?: string[];
};

export default function HandNote({
  className,
  style,
  decorative,
  lines = NOTE_LINES,
}: Props) {
  return (
    <div
      className={className ? `hand-note ${className}` : "hand-note"}
      style={style}
      aria-hidden={decorative || undefined}
    >
      {/* The visible copy is split into one span per character to be typed, so
          assistive tech gets the sentence from here instead. Dropped entirely on
          a decorative copy rather than left inside an aria-hidden wrapper. */}
      {!decorative && <span className="sr-only">{lines.join(" ")}</span>}

      {/* Real text, so without JS the note simply stands. hand.ts splits each
          line into characters and types them out. */}
      <div className="hand-ink" aria-hidden="true">
        {/* The ruled corner, wrapped around the copy so it fits whatever the
            copy is, each line bowed the way a hand pulls it: the top sags
            through the middle and picks up at the end, the margin bows away
            from the words and comes back. Stretched to its box (the stroke
            stays one weight — see global.css); hand.ts draws them out. */}
        <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M 0 3 C 30 8 65 8 100 1" />
        </svg>
        <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
          <path d="M 6 0 C 2 33 3 70 6 100" />
        </svg>
        {lines.map((line, i) => (
          <span className="hand-line" key={i}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
