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

/* THE ARRANGEMENT IS THREE PLACES, AND A SHORTER RANGE TAKES THE FIRST OF THEM
 * AND STANDS IN THE MIDDLE OF THE SCREEN.
 *
 * One card raised and square with one either side of it, lower and leaning away
 * — and THE SIBLINGS in the gap that raising it opens up. That is the drawing,
 * and the PLACES are a fact about the composition rather than about how many
 * variants a tape happens to sell: two labels are still the raised one and one
 * leaning away from it, not two equals side by side.
 *
 * WHAT IS NOT A FACT ABOUT THE COMPOSITION IS THE WIDTH OF THE ROW. A range of
 * two used to hold the third place open with an empty box, so the raised card
 * stayed at the middle of the SCREEN and the name stayed under it. That reads
 * as it sounds: a pair of labels pushed a couple of hundred pixels to the left
 * of a section whose right-hand third is bare, with the name centred under the
 * emptiness rather than under the cards. The section is not three places wide;
 * it is however wide the range is, standing in the middle.
 *
 * SO THE ROW IS AS LONG AS THE LIST AND IT IS CENTRED. Two labels are centred
 * as a pair — the leaning one left of the middle, the raised one right of it,
 * the name under the seam. One is the raised place on its own. Three is the
 * drawing untouched, because at three the two readings are the same picture.
 *
 * A LONE CARD TAKES THE MIDDLE PLACE and not the left one, which is the only
 * thing here that has to be said in code rather than left to the flex: the
 * places carry the size and the lean, and a single label wants the raised,
 * square one. */

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

/* THE COLOUR OPTIONS, for the two tapes that sell in more than one — a dark
 * pill across the foot of every card, shown on hover (tap, on the phone), with
 * the range's swatches in it. The mock draws the same pair on every variant of
 * the tape, so the list is per TAPE and not per face.
 *
 * IN CODE AND NOT THE CMS, the STORY_ROLL call (TapeSlider/strips.ts): these
 * are facts about the range's artwork read off the design, not copy anyone
 * edits. Keyed by tape id; a tape not in this table has no colours to show and
 * the section renders exactly as it always did — no pill, no note, no
 * listener.
 *
 * The OPP pair is sampled off the mock (2026-09-28): the muted green is the
 * clear film, the amber is the brown. THE CLOTH PAIR IS A STAND-IN — the mock
 * only draws OPP's, and cloth's real swatches want the user's own values. */
const SIB_COLOURS: Record<string, string[]> = {
  opp: ["#4f774e", "#ce8900"],
  cloth: ["#1d1d1b", "#8a8d86"],
};

export default function Siblings({ tape }: { tape: Tape }) {
  const faces = siblingFacesOf(tape);
  const colours = SIB_COLOURS[tape.id];

  /* WHICH PLACE EACH LABEL STANDS IN. Filled from the left, so two labels are
     the leaning place and the raised one. A lone label is the raised place on
     its own — see the note above, which is where that exception is argued. */
  const lone = faces.length === 1;
  const slotOf = (i: number) => (lone ? RAISED : i);

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

      {/* data-pair, and it is the one thing about the row's LENGTH the stylesheet
          has to be told. Everything else about a short row falls out of the flex
          — the cards are as many as there are and they centre — but where the
          name stands does not: at three it goes in the gap the raised card opens
          between the two beside it, and at two there is no such gap to go in.
          See --sib-title-top in global.css, which is where that is argued and
          where both figures are kept. */}
      <div className="siblings-row" data-pair={faces.length === 2 || undefined}>
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
            data-colours={colours ? "" : undefined}
            style={
              {
                "--sib-raised": slotOf(i) === RAISED ? 1 : 0,
                "--sib-tilt": `${TILT[slotOf(i)] ?? 0}deg`,
              } as CSSProperties
            }
          >
            <img className="siblings-face" src={face.src} alt={face.alt} />

            {/* The colour pill. In the markup whether or not it is showing —
                the hover (or the phone's tap, see reveal.ts) only lifts it,
                so there is nothing to mount and the artwork above shrinks to
                meet it on the same transition. Sized entirely in per cent of
                the card, like the face's inset, so both card sizes and the
                phone's 72vw wear it in proportion. */}
            {colours && (
              <span className="sib-colours">
                <span className="sib-colours-chip">COLOURS</span>
                {colours.map((c) => (
                  <i className="sib-dot" style={{ background: c }} key={c} aria-hidden="true" />
                ))}
              </span>
            )}
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

        {/* The aside in the margin — "hover to explore the colours." with an
            arrow swept down toward the cards, top right of the row, as the
            mock draws it. Only when there are colours to explore. The verb is
            two spans and the stylesheet shows the honest one per pointer:
            "hover" where there is a hover, "tap" on the phone. */}
        {colours && (
          <p className="sib-hint">
            <svg className="sib-hint-arrow" viewBox="0 0 120 72" aria-hidden="true">
              <path
                /* The head sits on the sweep's own end tangent. The curve arrives
                 at the tip travelling 45° down-left, and the first cut of this
                 head was drawn for a flat leftward arrival — so one leg lay
                 along the shaft and the other stuck out past the tip, reading
                 as a kink rather than a point (final round: "why is the arrow
                 head like that"). These two legs trail the tip at ±30° off the
                 tangent. */
              d="M116 10 C 76 16, 40 26, 10 56 M23 53 10 56 13 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sib-hint-text">
              <span className="sib-hint-hover">hover</span>
              <span className="sib-hint-tap">tap</span> to explore
              <br />
              the colours.
            </span>
          </p>
        )}
      </div>
    </Stage>
  );
}
