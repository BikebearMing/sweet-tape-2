/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { letters } from "@/components/letters";
import { siblingFacesOf, type Tape, siblingsVars } from "@/data/tapes";
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

/* THE GRADES ARE NOT HERE ANY MORE, and that is the change worth recording.
 *
 * This file held the range — NORMAL, STRONG, XTRA STRONG — as three constants,
 * on the argument that three grades of one tape is a fact about the RANGE and
 * so belongs to the section rather than to a tape. It said, in as many words,
 * that a tape breaking the pattern was the moment it moved into the tape.
 *
 * EVERY TAPE BREAKS THE PATTERN. The OPP roll has three variants, the cloth two,
 * the double-sided tissue one, the low-noise one. Three was a fact about the
 * mock the section was drawn from, and the ids underneath it were worse than
 * wrong: `faces` was KEYED by them, so a label uploaded under any name a person
 * would actually type matched nothing and drew nothing, silently.
 *
 * So the row is the tape's list and its LENGTH IS THE NUMBER OF CARDS. What is
 * printed on each is in the artwork, where the design already drew it. See
 * `faces` and siblingFacesOf in src/data/tape-types.ts.
 */

/* WHERE THE MIDDLE OF THE ROW IS, as an index — and it is allowed to fall
 * BETWEEN two cards, which is the whole of how a row of two works.
 *
 * The arrangement is one card raised and square with the rest put down off it
 * either side. At three that is the middle card, exactly as it always was; at
 * one it is the only card. At TWO there is no middle card, and the honest answer is
 * not to promote one of the pair — it is to say the middle of the row is the
 * empty half-step between them, leave that place empty, and let the name stand
 * in it. What comes out is the three-card composition with the middle card
 * lifted out: same width, same two leans, name in the same place. See
 * --sib-hole on .siblings-fan, which opens the gap. */
const centreOf = (count: number) => (count - 1) / 2;

/* AND HOW FAR EACH ONE LEANS, in degrees. The two figures are the design's own
 * and the RULE is the design's own too, stated instead of enumerated: the card
 * at the middle stands square and the ones either side are put down off it. At
 * three that is exactly the list this used to hold, [-4.414, 0, 3.578]; at two
 * the middle falls between the pair, so one leans each way and neither stands
 * square.
 *
 * Here rather than in global.css because a stylesheet rule would have to count
 * to the first and the last child of .siblings-row — and the last child of that
 * row is THE SIBLINGS, not a card. It reaches the page as --sib-tilt, which the
 * stylesheet rests on and reveal.ts animates into.
 *
 * reveal.ts READS THE FIRST CARD'S LEAN to size the wheel it deals on, and a
 * row of one leaves that card square — which it already handles: see
 * PIVOT_MIN_TILT and PIVOT_FALLBACK, written for exactly this case before there
 * was one. */
const TILT_BEFORE = -4.414;
const TILT_AFTER = 3.578;
const tiltAt = (i: number, centre: number) =>
  i === centre ? 0 : i < centre ? TILT_BEFORE : TILT_AFTER;

export default function Siblings({ tape }: { tape: Tape }) {
  const faces = siblingFacesOf(tape);
  const centre = centreOf(faces.length);

  /* WHETHER THE ROW HAS A MIDDLE CARD OR A MIDDLE GAP. An even row has no card
     at its centre, so the stylesheet opens the place one would have stood in and
     the name goes there — see --sib-hole on .siblings-fan. Nothing about an odd
     row changes: this is 0 and the gap is the gap. */
  const hole = Number.isInteger(centre) ? 0 : 1;

  return (
    <Stage
      style={
        {
          ...siblingsVars(tape.sections),
          "--sib-hole": hole,
        } as CSSProperties
      }
    >
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
        {/* THE FAN — the three cards and nothing else, in a box of their own.
            It is what reveal.ts turns to deal them: the row's arrangement IS an
            arc, and swinging this box about a point far below the page brings
            each card into the middle of the screen the way a hand of cards is
            fanned. The name is deliberately OUTSIDE it — it belongs in the
            middle whatever the cards are doing, and a name carried round on the
            fan would lean with them. */}
        <div className="siblings-fan">
        {faces.map((face, i) => (
          /* One card. The variant's name is the ALT and not a caption, because
             on the page it is printed around the bottom of the label inside the
             picture — so the readable version is the picture's description,
             which is what alt is for. A caption would be the same words said
             twice to anyone using a screen reader. It comes off the media
             record, which is the only place that name is written down as text.

             --sib-raised and --sib-tilt are the arrangement, set here rather
             than by an :nth-child in the stylesheet: which card is up and which
             way it leans are facts about this list, and a selector counting to
             two would go quietly wrong the day the list did — which, now that
             the list is the tape's rather than this file's, it does per tape.

             KEYED BY POSITION, and it is the honest key: a row is an ORDER of
             pictures with nothing else on it, so the only identity a card has is
             where it stands. There is no id left to prefer. */
          <div
            className="siblings-card"
            key={i}
            style={
              {
                "--sib-raised": i === centre ? 1 : 0,
                "--sib-tilt": `${tiltAt(i, centre)}deg`,
              } as CSSProperties
            }
          >
            <img className="siblings-face" src={face.src} alt={face.alt} />
          </div>
        ))}
        </div>

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
