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

/* THE ARRANGEMENT IS THREE PLACES, AND IT STAYS THREE PLACES.
 *
 * One card raised and square in the MIDDLE with one either side of it, lower
 * and leaning away — and THE SIBLINGS in the gap that raising the middle one
 * opens up. That is the drawing, and it is a fact about the composition rather
 * than about how many variants a tape happens to sell.
 *
 * SO A SHORTER RANGE FILLS IT FROM THE LEFT AND LEAVES THE REST EMPTY. Two
 * labels take the left place and the middle one; the right stands empty. The
 * raised card is still in the middle of the screen, the name is still under it,
 * and nothing about the section has to be re-composed for a tape that has two
 * of something instead of three. See .siblings-space in global.css, which is
 * what holds the empty place open.
 *
 * A ROW OF ONE IS THE EXCEPTION and takes the middle place on its own, centred.
 * A lone card pushed into the left-hand slot is not a row with a gap in it — it
 * is one object sitting off to one side of a screen with its name in the middle
 * of the empty half, which is a composition nobody drew. */
const SLOTS = 3;

/* WHICH PLACE IS RAISED, and how far each one leans, in degrees — by PLACE and
 * not by card, which is the whole point of the two constants: the middle is up
 * and square and the outer two are put down off it, whether or not there is
 * anything standing in all three.
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
const RAISED = 1;
const TILT = [-4.414, 0, 3.578];

export default function Siblings({ tape }: { tape: Tape }) {
  const faces = siblingFacesOf(tape);

  /* WHICH PLACE EACH LABEL STANDS IN. Filled from the left, so two labels are
     the left place and the middle one — see SLOTS. A lone label is the middle
     place on its own, which is the one case that is not a row. */
  const lone = faces.length === 1;
  const slotOf = (i: number) => (lone ? RAISED : i);

  /* And the places left standing empty on the right of them. None when the
     range fills the row, and none for a lone label — it is centred rather than
     placed, so there is nothing to hold open beside it. */
  const empties = lone ? 0 : SLOTS - faces.length;

  return (
    <Stage style={siblingsVars(tape.sections)}>
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
                "--sib-raised": slotOf(i) === RAISED ? 1 : 0,
                "--sib-tilt": `${TILT[slotOf(i)] ?? 0}deg`,
              } as CSSProperties
            }
          >
            <img className="siblings-face" src={face.src} alt={face.alt} />
          </div>
        ))}

        {/* The places nobody is standing in. They draw nothing and are dealt
            nothing — see .siblings-space in global.css. Keyed by index because
            an empty place has no identity beyond where it is, which is the same
            call the cards above make and for a stronger reason. */}
        {Array.from({ length: empties }, (_, i) => (
          <div className="siblings-space" key={`space-${i}`} aria-hidden="true" />
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
