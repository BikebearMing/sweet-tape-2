/* eslint-disable @next/next/no-img-element */
import HandNote from "@/components/HandNote";
import Peel from "@/components/Peel";
import { letters } from "@/components/letters";
import { reelVars } from "@/data/tapes";
import type { Tape } from "@/data/tapes";
import Stage from "./Stage";

/* THE RUN — the product page's fourth section.
 *
 * A frame the page holds still and scrolls SIDEWAYS through. One element moves:
 * .reel-canvas, three windows wide, carrying the opening photograph and the
 * claim beside it, a strip of torn kraft, and the three shots that close the
 * run. Scroll position is the camera's position along that row.
 *
 * IT IS THE PINNING SECTION'S IDEA WITH THE STAIRCASE TAKEN OUT. The home page's
 * camera walks a path of measured stops — right, down, right, up — because its
 * three phrases sit at three heights and two of them are wider than the window
 * (see GiantPinning/pin.ts, which argues all of that at length). Nothing here
 * moves vertically and nothing here has stops: the camera runs from one end of
 * the row to the other at one speed, so this section's pin.ts is a single tween
 * and about a tenth of the size. Everything else — pinning .wrapper rather than
 * the section, measuring the travel rather than typing it, re-measuring on
 * resize — is the same, and deliberately so.
 *
 * THE ARRANGEMENT IS MEASURED OFF THE MOCK at the 1440 design width, and it is
 * all in global.css as --rx / --ry per piece, which is the same seam the home
 * page's canvas uses: move a piece there and the camera's travel changes with
 * it, because the camera has no copy of the coordinates. See the .product-reel
 * block for which figures came off the design and which were inferred.
 *
 * NOTHING HERE IS PER-SECTION COPY. The claim, the note and the four
 * photographs are the TAPE's — see `reel` in src/data/tapes.ts — so the same
 * component is every product's run, and a seventh tape is a seventh run with
 * nothing in this folder to touch.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref and hands the section to its drivers; nothing below
 * this line is a client component.
 */

/* THE KRAFT STRIP, and it is the site's own — the same file wherever a length of
   brown tape is drawn. Named here rather than written into the markup twice. */
const KRAFT = "/assets/long-tape.webp";

/* The box Peel measures its fold against, in the stylesheet's own words rather
   than a second copy of the figures. --reel-tape-w / --reel-tape-h are the
   artwork's size at the design width; passing them through means a numeric
   `from` below stays a fraction of the strip even if those are ever nudged.
   Neither contains a space, so Peel's split on whitespace still finds exactly
   two values. */
const KRAFT_BOX = "var(--reel-tape-w) var(--reel-tape-h)";

/* HOW FAR UP THE STRIP THE FOLD STARTS, as a fraction of its own length — where
 * it sits before the tape is pressed down.
 *
 * `from` is the lifted end and `to` is flat, so the same geometry that runs a
 * peel runs backwards and there is no second code path for a strip that sticks
 * DOWN rather than lifting. This is the origin section's arrangement exactly
 * (see ProductInfo, and press.ts for why neither of Peel's own drivers is this
 * gesture), and reveal.ts is the hand.
 *
 * HALF THE STRIP. Higher than the origin section's 0.34, and higher than this
 * started at: at 0.18 four fifths of the tape was already down before the press
 * ran, so what a reader saw was a strip settling the last inch rather than a
 * strip going on. A fold at the middle is a length of tape held up at one end
 * and smoothed down — which is the gesture, and there is room for it here
 * because these strips are 754px long. */
const KRAFT_LIFT = 0.5;

export default function ProductReel({ tape }: { tape: Tape }) {
  const { headline, note, shots } = tape.reel;

  /* The readable claim, for the label on the heading. The copy is stored broken
     into the lines the design breaks it into (see `reel` in src/data/tapes.ts),
     and a screen reader wants the sentence — so the breaks are joined back out
     here rather than announced as four separate headings. */
  const claim = headline.join(" ");

  return (
    <Stage style={reelVars(tape.sections)}>
      {/* WITHOUT JAVASCRIPT THE LETTERS AND THE LABEL DO NOT ARRIVE. Both are
          held by global.css — the letters under their masks, the label at
          nothing — and released by the section's own script.

          THE PHOTOGRAPHS ARE NOT AMONG THEM and are not held at all: they are
          on the page at full opacity from the first paint, because nothing
          about them is an entrance.
          The stylesheet's hold is lifted here instead, which costs nothing when
          scripting is on: the contents are not even parsed. Every other section
          on this site carries the same escape.

          THE CAMERA IS NOT PART OF THAT. Without JS the canvas is never
          transformed and the section is one window onto the left end of the
          row — the opening photograph and the claim, which is the frame the
          section is designed to be met on. The rest is off-screen and clipped,
          which is a shortened section rather than a broken one. */}
      <noscript>
        <style>{`.product-reel .char { transform: none }
          .product-reel .reel-badge { opacity: 1; visibility: visible }`}</style>
      </noscript>

      {/* THE FRAME — exactly one window, and what gets pinned. The section
          around it is this plus its tail; see the .product-reel block in
          global.css and the note by `frame` in pin.ts. */}
      <div className="wrapper">
        {/* THE ONE THING THAT MOVES. Everything inside is placed off --rx / --ry
            and overflows it freely — the box exists to be the offsetParent the
            camera measures against and a single element to put one transform
            on. Same arrangement as .giant-canvas on the home page. */}
        <div className="reel-canvas">
          {/* THE OPENER — on screen when the section takes over.

              NOTHING HAPPENS TO IT. No cue, so it does not arrive; no --pp, so
              it does not drift. The photographs in this section are simply
              THERE, and the only thing that moves in the whole row is the tape.
              It was worth trying the other way and it was worth taking back
              out — see LAYERS in pin.ts. */}
          <img
            className="reel-shot reel-shot--open"
            src={shots[0]}
            alt={`${tape.label} at work`}
          />

          {/* THE PRINTED LABEL, over the corner of the opener. The tape's own
              face — the same circle the slider hangs at the middle of its stage
              — rather than a second export of it. */}
          <img
            className="reel-badge"
            src={tape.card}
            alt={tape.label}
            data-reel-cue
          />

          {/* The aside beside the label, in the same hand the origin story's
              margin is written in. Its own copy and not `character`: both are on
              this page, and the same sentence twice in the same handwriting
              reads as a mistake. See components/HandNote, which says why
              placement is not its business — and which writes on a cue of its
              own, so there is no data-reel-cue on it. */}
          <HandNote className="reel-note" lines={note} />

          {/* THE CLAIM, in the lines the design breaks it into.

              One heading and not four: the four strings are one sentence, and
              aria-label carries it whole so the row of letter boxes is never
              read out a fragment at a time.

              ONE CUE FOR THE BLOCK AND NOT ONE PER LINE. The lines are stacked
              and share a left edge, so the camera reaches all four at the same
              moment and four cues would fire together — the same gesture, said
              four times. The home page's pinning section does cue per line, and
              has to: its phrases run a window and a half wide, so their far ends
              would write themselves off-screen. This claim is 566px wide at the
              design width, comfortably inside the frame, and the case does not
              arise. */}
          <h2 className="reel-claim" aria-label={claim} data-reel-cue>
            {headline.map((line, i) => (
              <span className="reel-line" key={i} aria-hidden="true">
                {letters(line)}
              </span>
            ))}
          </h2>

          {/* THE KRAFT between the claim and the three closing shots, and it is
              TWO STRIPS OF TAPE laid over each other rather than one sheet —
              the site's long-tape artwork at its own size, leaning. Not a
              divider: it is a strip of tape, put down twice by a hand, on the
              way to the shots of it at work.

              The wrapper paints nothing and is not decoration either; it is the
              footprint the two rotated strips occupy, which is what the camera
              measures. See .reel-kraft in global.css, which says why a rotated
              box cannot be measured directly. */}
          <div className="reel-kraft" aria-hidden="true" data-reel-cue>
            {[1, 2].map((n) => (
              /* TWO ELEMENTS PER STRIP, and the split is not incidental. The
                 outer one is WHERE THE TAPE IS — placed and leaning; the Peel
                 inside is WHAT THE TAPE DOES. They cannot be the same element:
                 .peel writes `rotate` itself for --peel-dir, and --peel-dir
                 turns the fold's axis while .peel-turn keeps the artwork
                 upright inside it — so pouring the lean into `direction` would
                 buy a fold off a different edge and no lean at all. */
              <span
                className={`reel-kraft-strip reel-kraft-strip--${n}`}
                key={n}
              >
                <Peel
                  className="reel-kraft-tape"
                  src={KRAFT}
                  /* Neither of Peel's own drivers is this gesture: "loop"
                     alternates for ever, so the tape would either rest flat and
                     periodically lift off by itself or rest curled and
                     occasionally press down; "scroll" scrubs both ways, so it
                     would come back off on the way up. This goes on once and
                     stays on, and the hand is reveal.ts — cued by the camera,
                     like everything else in this section. */
                  drive="manual"
                  box={KRAFT_BOX}
                  from={KRAFT_LIFT}
                  to={0}
                  /* ZERO, and it is stated rather than left out. The artwork is
                     drawn standing up, so the end that lifts is already the top
                     edge and the frame does not have to be turned to reach it —
                     but --peel-span is built out of sin/cos of this, and an
                     omitted one used to take the whole fold down with it. It has
                     a fallback now; saying 0deg here is still the honest way to
                     declare which edge peels. */
                  direction="0deg"

                  /* Brown packing tape, so the underside is the roll's own
                     colour rather than the board's paper — see BACKS in
                     components/Peel, where every one of those is the median of
                     its own file's opaque pixels. */
                  back="peel-back-kraft"
                />
              </span>
            ))}
          </div>

          {/* AND THE THREE THAT CLOSE THE RUN, in a row with the design's own
              gap between them. Indexed off the same array as the opener so the
              order in the data is the order on the page. */}
          {shots.slice(1).map((src, i) => (
            <img
              key={i}
              className={`reel-shot reel-shot--${i + 1}`}
              src={src}
              alt={`${tape.label} at work`}
            />
          ))}
        </div>
      </div>
    </Stage>
  );
}
