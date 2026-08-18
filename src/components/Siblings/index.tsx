/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { letters } from "@/components/letters";
import { siblingFaceOf, type Tape } from "@/data/tapes";
import Stage from "./Stage";

/* THE SIBLINGS — the product page's third section.
 *
 * The same tape in its three grades, laid out as three printed labels on the
 * dark green the section above closes on. No seam between them and no second
 * ground: this is one continuous surface with the origin story, which is why
 * the background here is #0d470c again rather than a colour of its own.
 *
 * THE MIDDLE ONE IS BIGGER AND HIGHER, and the two beside it sit lower. That is
 * the whole composition — three objects put down by hand rather than a row of
 * equals — and it is why the sizes and the drop are named properties in
 * global.css rather than one card rule repeated three times.
 *
 * THE NAME SITS IN THE GAP THE ARRANGEMENT MAKES. Raising the middle card opens
 * a space under it between the two beside it, and THE SIBLINGS goes there. It
 * is placed against the row rather than following it in flow, because what it
 * is aligned to is the middle card's bottom edge — not the tallest thing in the
 * row, which is one of the other two.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref and hands the section to reveal.ts; nothing below
 * this line is a client component.
 */

/* Section-level copy, so it is a named constant rather than a string buried in
   the markup — the same call the slider, the origin section and the footer all
   make. */
const HEADING = "THE SIBLINGS";

/* THE THREE GRADES, and they are the same three for every tape — this is a
 * range, not a per-tape list, so it belongs to the section rather than to
 * src/data/tapes.ts. A tape that ever breaks the pattern is the moment this
 * moves into the tape.
 *
 * `id` is the artwork key and `label` is what is printed; they are separate
 * because one is a filename and the other is copy, and a slug derived from
 * "XTRA STRONG" is a guess nobody can check. See `faces` in src/data/tapes.ts,
 * which is keyed by these ids.
 *
 * THE SECOND HALF OF EACH LABEL IS IN THE ARTWORK and not here. The design sets
 * "STRONG · BROWN" around the bottom of the printed label, where BROWN is the
 * tape's colour rather than the grade — so it belongs to the tape's own export,
 * and repeating it here would be a second place a colour name lives.
 */
const SIBLINGS = [
  { id: "normal", label: "NORMAL" },
  { id: "strong", label: "STRONG" },
  { id: "xtra", label: "XTRA STRONG" },
] as const;

/* WHICH ONE IS RAISED — the middle, by index rather than by id, because it is a
   fact about the ARRANGEMENT and not about the grade. Re-order SIBLINGS and the
   centre card is still the centre card. */
const RAISED = 1;

export default function Siblings({ tape }: { tape: Tape }) {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT NEITHER THE NAME NOR THE CARDS ARRIVE. The letters
          are parked under their masks by global.css and the three cards are held
          at nothing by the same attribute, both released by the section's own
          script — so a page where reveal.ts never runs is an empty green band.
          The stylesheet's hold is lifted here instead, which costs nothing when
          scripting is on: the contents are not even parsed. Every other section
          on this site carries the same escape. */}
      <noscript>
        <style>{`.siblings-section .char { transform: none }
          .siblings-section .siblings-card { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <div className="siblings-row">
        {SIBLINGS.map((sibling, i) => (
          /* One card. The grade's name is the ALT and not a caption, because on
             the page it is printed around the bottom of the label inside the
             picture — so the readable version is the picture's description,
             which is what alt is for. A caption would be the same words said
             twice to anyone using a screen reader.

             --sib-raised is the arrangement, set here rather than by an
             :nth-child in the stylesheet: which card is up is a fact about this
             list, and a selector counting to two would go quietly wrong the day
             the list did. */
          <div
            className="siblings-card"
            key={sibling.id}
            style={{ "--sib-raised": i === RAISED ? 1 : 0 } as CSSProperties}
          >
            <img
              className="siblings-face"
              src={siblingFaceOf(tape, sibling.id)}
              alt={`${tape.label}, ${sibling.label} grade`}
            />
          </div>
        ))}

        {/* The name, in the gap the raised card leaves. Split to letters for the
            reveal, which is the hero's and the footer's — each waits below its
            own mask and slides up in a shuffled order (reveal.ts).

            aria-label rather than a second hidden copy of the words: it is
            honoured on a heading, so the line is announced whole and the row of
            letter boxes is never read out a fragment at a time. */}
        <h2 className="siblings-title" aria-label={HEADING}>
          <span className="line" aria-hidden="true">
            {letters(HEADING)}
          </span>
        </h2>
      </div>
    </Stage>
  );
}
