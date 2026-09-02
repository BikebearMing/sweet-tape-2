/* eslint-disable @next/next/no-img-element */
import { letters } from "@/components/letters";
import { getAbout } from "@/data/about";

import Stage from "./Stage";

/* THAT'S WHY SWEET TAPE EXISTS. — /about's answer to the belt, and the moment
 * the page turns over.
 *
 * IT ARRIVES BEHIND A CURTAIN RATHER THAN BY SCROLLING UP INTO VIEW, and that
 * is the whole reason this is its own section instead of another screen in the
 * run. The belt ends with the mark grown until there is nothing on the window
 * but one flat field of dark green; a section that then scrolled in from the
 * bottom would slide that field away and admit that it was only ever a shape on
 * a page. So the green is not slid away — it is COVERED. A sheet of lime falls
 * from the top of the window on a single wide arc, and what is underneath it
 * when it lands is this. See ./arrive.ts, which owns the fall and the beats
 * after it, and .reason in global.css, which is where the section is lifted
 * back over the belt so that the two overlap at all.
 *
 * THE COMPOSITION IS THREE THINGS AND THEY ARRIVE IN THAT ORDER.
 *
 *   THE SENTENCE, split to letters and shuffled up out of its masks, which is
 *   the site's headline entrance and is set here at the largest type on the
 *   site — 190px against the hero's own.
 *
 *   THE MARK, INTO A HOLE THE SENTENCE OPENS FOR IT. SWEET and TAPE are written
 *   with a gap between them that is a plain word space until the letters have
 *   landed and then SPREADS, and the mark drops into the space it made. That
 *   ordering is the point of the beat: a logo that simply faded in on top of a
 *   finished line would be a sticker, where this is the line making room. The
 *   mark is WIDER than the hole it lands in and overlaps the words either side
 *   — components/Reimagine's strip of tape is set into its sentence exactly this
 *   way, and for the same reason: a thing that fits its gap exactly reads as
 *   having been allowed for, and a thing that overlaps reads as having been put
 *   there.
 *
 *   AND THE ROLL, which is the real 3D one — the object the whole site is
 *   about, standing in front of its own name. It is the slider's viewer and the
 *   product page's roll: one GLB, the same lighting, at this section's angle.
 *   See ./roll.ts. The flat photograph in the markup is what holds the slot
 *   until three.js and the model land, and IS the roll if either never does.
 *
 * SERVER-RENDERED but for Stage, the hair-thin client wrapper that owns the ref;
 * nothing below that line is a client component.
 */

/* THE SENTENCE, ON THE THREE LINES THE DESIGN BREAKS IT ON, and the middle one
 * split at the hole the mark drops into.
 *
 * Three strings and not one sentence wrapped by the browser, for the reason
 * every headline on this site is stored this way: where a line of display type
 * this size turns is a drawing, and a measure that decided it for us would
 * re-break the block at the first window that is not 1440 wide — under a
 * reader, mid reveal, with every letter under a mask measured against the old
 * line. See LINES in components/Reimagine, which makes the argument at length.
 *
 * The middle line is a PAIR because the gap between its two halves is a moving
 * part rather than a space: see .reason-gap in global.css.
 *
 * AND EVERY LINE IS A LIST OF WORDS RATHER THAN A STRING, WHICH IS WHAT LETS A
 * PHONE BREAK THEM AGAIN. The three above are the breaks the design draws at
 * 1440 and they stay exactly that; what changes at 390 is that there is not
 * enough width for them. SWEET, its gap and TAPE at a type size a phone can read
 * measure well past the sheet, and a flex row cannot break — its boxes are flex
 * items and they lay out on one line however long it gets, which is right for a
 * headline whose breaks are set by design and is the whole problem here.
 *
 * SO THE WORDS ARE BOXED and the phone's block turns wrapping on: the line
 * breaks BETWEEN two words exactly where the unsplit copy would have broken, and
 * nowhere else. Nothing changes at any width where the line already fits, which
 * is every width above the breakpoint. words() in components/letters is the same
 * idea for copy that never had set breaks at all; this is that idea kept on a
 * leash, because these breaks ARE set — the phone is only allowed to add more.
 *
 * THE GAP TRAVELS WITH TAPE and not with SWEET, which is the one grouping worth
 * saying out loud. It is the hole the mark drops into, the mark is wider than
 * it, and the two overlap the word after it — so a break between the gap and
 * TAPE would leave the logo alone on a line and the word it is set into on the
 * next one. Bound to TAPE, the pair wraps as one object and the phone reads
 * SWEET over the mark-and-TAPE, which is what the design draws.
 *
 * ALL OF THAT COPY COMES OFF THE RECORD — src/globals/About.ts, the Reason tab.
 * Two words on the first line, two on the second and one on the third, because
 * the arrangement above is what the four boxes and the hole are made of; a third
 * word typed into either pair has nowhere to be drawn.
 *
 * What is written inside the mark is three lines for the same kind of reason and
 * a stronger one: they are set inside a blob whose shape they have to fit. */

/* THE MARK, AND IT IS THE WHOLE MARK THIS TIME.
 *
 * The belt above shows the same blob as a SILHOUETTE — no words on it, in the
 * pills' own green, one more shape lying on the conveyor that only gives itself
 * away to somebody already looking for it. This is that shape with the brand
 * finally written on it, which is what the section is for: the thing that was
 * hiding in the aisle, named.
 *
 * fill="currentColor" so the blob is the sentence's ink and the two are one
 * colour by construction rather than by two hex values that have to be kept in
 * agreement. The STROKE is not: it is the lime of the sheet, drawn so the blob
 * reads as a hole cut in the paper rather than as a shape sitting on it, and it
 * is the sheet's colour on purpose.
 *
 * aria-hidden because the heading's own aria-label is what is announced — this
 * is the brand's mark set into the brand's name, and reading it out would be
 * saying "Sweet Tape" twice with "good things stick" in the middle of it. */
function Mark({ lines }: { lines: string[] }) {
  return (
    <span className="reason-mark">
      <svg
        className="reason-blob"
        viewBox="0 0 187 124"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M82.0264 3.11535C110.022 -2.29367 136.744 2.96497 154.485 15.531C155.993 16.5957 157.859 17.0117 159.653 16.663L159.654 16.6629L169.639 14.7346C172.902 14.1048 175.794 16.8184 175.484 20.0647L175.444 20.3809L172.66 37.9492L172.66 37.9502L172.003 42.0818C171.542 44.996 172.117 47.9865 173.629 50.523L175.77 54.1118L175.771 54.1117L184.869 69.3808C186.625 72.3272 184.937 76.1333 181.572 76.7832L171.589 78.7104C169.792 79.0598 168.218 80.137 167.213 81.6911C155.398 99.9705 132.544 114.81 104.548 120.219C76.5469 125.629 49.8297 120.37 32.0885 107.804L31.8021 107.611C30.3479 106.689 28.6033 106.345 26.9213 106.672L26.9204 106.672L16.9362 108.6C13.5682 109.25 10.5941 106.337 11.13 102.954L13.9141 85.3853L13.914 85.3843L14.5711 81.2537L14.6458 80.7061C14.9572 77.9667 14.3631 75.1897 12.9454 72.8115L12.9453 72.8106L10.8041 69.2228L1.70631 53.9537C-0.0495127 51.0072 1.63715 47.2012 5.0024 46.5513L14.9856 44.6231L15.3194 44.5498C16.9766 44.1381 18.42 43.1005 19.3627 41.6434C31.177 23.3642 54.0302 8.5246 82.0264 3.11535Z"
          fill="currentColor"
          stroke="var(--reason-sheet)"
          strokeWidth="2"
        />
      </svg>

      {/* THE WORDS ON IT, in the site's LINE reveal rather than its letter one.
          Three words of five characters inside a shape 187px across is not a
          headline, it is a stamp — and the site already has the entrance for
          copy that is read rather than looked at. .body-clip and .body-rise are
          components/body.tsx's own two boxes; the breaks are marked up here
          instead of measured because these three lines are drawn to fit a blob
          and are not free to rewrap. */}
      <span className="reason-mark-copy" aria-hidden="true">
        {lines.map((line) => (
          <span className="body-clip" key={line}>
            <span className="body-rise">{line}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

export default async function Reason() {
  const {
    reason: { kicker, top, middle, bottom, mark },
  } = await getAbout();

  /** The sentence as it is READ, with the hole taken back out. Screen readers
      get this and never the four fragments or the row of letter boxes. */
  const spoken = [...top, ...middle, bottom].join(" ");

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE SECTION IS THE FINISHED COMPOSITION. Every one
          of the six things this file parks is parked BY THE STYLESHEET, so a
          page where nothing runs would hold the curtain above the window, the
          chip and the roll at nothing, the letters under their masks, the mark
          at nothing and the words inside it under theirs — a blank screen where
          the answer to the whole page should be. This releases all six at once,
          and costs nothing when scripting is on: the contents of a noscript
          element are not even parsed. The reduced-motion rules in global.css say
          the same six things. Every other section on this site carries the same
          escape. */}
      <noscript>
        <style>{`.reason-sheet { translate: none }
          .reason .char { transform: none }
          .reason .body-rise { transform: none }
          .reason-mark { scale: 1 }
          .reason-kicker, .reason-roll-in { opacity: 1 }`}</style>
      </noscript>

      {/* THE STAGE — one screen, stuck to the top of the window for as long as
          the section is passing it, and the box everything here is measured
          against. It is what holds still while the curtain comes down; see
          .reason-stage in global.css, where the sticky and the section's lift
          back over the belt are argued together. */}
      <div className="reason-stage">
        {/* THE CURTAIN. A sheet of lime taller than the stage by its own arc,
            parked above the top edge and driven down by ./arrive.ts.

            AND THE COMPOSITION IS INSIDE IT, which is the one piece of nesting in
            this section that is load-bearing. The two were siblings first, and
            everything about the fall was right except the thing it was for: the
            chip, the roll and every letter that had already landed were on screen
            THROUGH the sheet, printed on the belt's dark green above the arc and
            below it. A curtain has to be the only thing that can be seen until it
            has passed. So the composition is a child of the sheet and is clipped
            by it, and .reason-wrapper cancels the sheet's own travel so that being
            carried does not mean being moved — see the pair of translates in
            global.css, which have to be read together. */}
        <div className="reason-sheet arc-cut" aria-hidden="true">
          <div className="reason-wrapper">
            <p className="subhead reason-kicker">{kicker}</p>

            {/* aria-label so the block is announced as the one sentence it is:
              what is inside it is four rows of letter boxes and a logo, and
              neither is something to read out. */}
            <h2 className="reason-title" aria-label={spoken}>
              <span className="line" aria-hidden="true">
                {/* The word space rides with the word BEFORE it rather than
                    sitting between the two boxes, so the desktop's row is the
                    same run of letter boxes it has always been — and when the
                    phone breaks here the space goes up with THAT'S, where a
                    reader cannot see it, instead of opening the second line. */}
                <span className="reason-word">{letters(`${top[0]} `)}</span>
                <span className="reason-word">{letters(top[1])}</span>
              </span>

              <span className="line" aria-hidden="true">
                <span className="reason-word">{letters(middle[0])}</span>
                {/* THE HOLE THE MARK DROPS INTO, and the one element on this page
                  whose WIDTH is animated. It rests at the width the design
                  draws — so a page with no script has the mark sitting in its
                  space rather than jammed between two words — and the timeline
                  starts it at a plain word space and spreads it open. See
                  --reason-space in global.css. */}
                {/* BOXED WITH TAPE AND NOT ON ITS OWN — see the note at the
                  head of this file. The hole and the word it is set into wrap
                  as one object, so a phone can never leave the mark stranded
                  on a line by itself. */}
                <span className="reason-word">
                  <span className="reason-gap">
                    <Mark lines={mark} />
                  </span>
                  {letters(middle[1])}
                </span>
              </span>

              <span className="line" aria-hidden="true">
                <span className="reason-word">{letters(bottom)}</span>
              </span>
            </h2>

            {/* THE ROLL, OVER ITS OWN NAME. Two boxes, and they cannot be merged
              for the reason ProductIntro's pair cannot: .reason-roll is where
              the page PUTS the roll — the negative margin that sets it into the
              bottom of the sentence rather than under it — and .reason-roll-in
              is what the entrance moves. A margin and a transform on one
              element would have the arrival quietly overwrite the placement.

              The <img> is the slot's occupant until three.js and the GLB land,
              hidden from first paint once scripts are running exactly as the
              slider's key visual is: letting the flat artwork paint first only
              flashes a picture the 3D roll is about to replace. If the chunk
              never arrives it stays, and IS the roll. */}
            <div className="reason-roll">
              <div className="reason-roll-in">
                <img
                  src="/assets/opp-tape-inner-product.webp"
                  alt="A roll of Sweet Tape"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
