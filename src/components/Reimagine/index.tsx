/* eslint-disable @next/next/no-img-element */
import { letters } from "@/components/letters";
import Peel from "@/components/Peel";
import Stage from "./Stage";

/* TO REIMAGINE AN EVERYDAY ESSENTIAL — /about's fourth section, and the one the
 * page has been building to.
 *
 * IT IS THE SECOND HALF OF THE SECTION ABOVE IT, and that is why it sits where
 * it sits. THAT'S WHY SWEET TAPE EXISTS. is not a sentence that finishes: read
 * the two screens in order and they are one line — that's why Sweet Tape exists,
 * TO REIMAGINE AN EVERYDAY ESSENTIAL AS SOMETHING MORE THOUGHTFUL, EXPRESSIVE
 * AND FULL OF HEART — with the roll standing in the break. The lime runs on
 * across the seam for the same reason: the curtain up there falls in this
 * section's exact colour, so what rides out of the window at the end of it and
 * what comes up behind it here are one unbroken ground. Neither the sentence nor
 * the sheet survives putting another section between them.
 *
 * AND IT IS WHERE THE LIME IS PUT AWAY. This section is not one colour and the
 * paper is lying across the join: the lime carries the top half of the sheet and
 * the page's dark green carries the bottom half, running on into WE WANTED TO
 * BE. without a boundary between them. The lime came down over the page as a
 * curtain two sections ago and it goes back off here, halfway down the last
 * thing printed on it. See --rei-split in global.css, which is measured off the
 * photograph rather than off the box it is in.
 *
 * A BALL OF PAPER ON THE HORIZON, WHICH OPENS, AND THE SCREEN IS HELD WHILE IT
 * DOES. That is the section: you scroll down onto a screen with nothing on it
 * but a screwed-up sheet sitting on the line where the lime meets the green, the
 * page stops, the sheet springs open, the statement is written across it and a
 * strip of tape is laid over the gap in the third line — and then the page lets
 * go. Everything the section has to say is on a piece of paper that was thrown
 * away and is being read anyway, which is the whole idea and the reason the
 * unfold is not decoration.
 *
 * THE PIN IS WHAT MAKES IT AN EVENT RATHER THAN SOMETHING THAT HAD HAPPENED.
 * Un-held, the flipbook ran while the reader was still on the section above and
 * what arrived was a sheet that had always been flat. ./unfold.ts argues the
 * hold and its length; global.css argues the stage it is hung on.
 *
 * THE UNFOLD IS SIX PHOTOGRAPHS PLAYED IN ORDER — a flipbook, not a model. See
 * ./unfold.ts, which argues the mechanism and the cuts.
 *
 * THE STRIP OF TAPE IS THE THIRD BEAT. It lands in the hole in the third line
 * once the statement is written, and it goes on the way tape goes on — rolled
 * down from one end rather than faded in. That is the site's own peel
 * (components/Peel), driven by this section's timeline exactly as the
 * preloader's mark is driven by its own: see TAPE in ./unfold.ts.
 *
 * THE SHEET IS STILL NOT FULLY DRESSED. The design also has strips of tape
 * holding it down at the corners, two product photographs pinned to it, a heart
 * and a squiggle drawn on it in pen, and a rule under the last line. None of
 * those are here yet: they arrive on the open sheet and the sheet has to open
 * first.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref; nothing below this line is a client component.
 */

/* THE STATEMENT, ON THE FIVE LINES THE DESIGN BREAKS IT ON.
 *
 * Five strings and not one sentence wrapped by the browser, for the reason every
 * headline on this site is stored this way: where a line of display type this
 * size turns is a drawing, and a measure that decides it for us would re-break
 * the block at the first window that is not 1440 wide — under a reader, mid
 * reveal, with every letter under a mask that was measured against the old
 * line.
 *
 * THE GAP IN LINE THREE IS PART OF THE COPY AND IS WRITTEN AS ONE. It is where
 * the strip of tape lies across the sentence, and it has to be a hole in the
 * TYPE rather than a piece of artwork parked on top of the words — tape laid
 * over a line that closes up behind it would cover a letter. Marked with the
 * pipe rather than with a wider run of spaces, because a space is something the
 * font decides the width of and this is a measurement. */
const GAP = "|";
const LINES = [
  "TO REIMAGINE AN",
  "EVERYDAY ESSENTIAL AS",
  `SOMETHING ${GAP} MORE`,
  "THOUGHTFUL, EXPRESSIVE",
  "AND FULL OF HEART.",
];

/** The sentence as it is READ — the lines joined, with the tape's hole taken
    back out. Screen readers get this and never the five fragments. */
const SPOKEN = LINES.join(" ").replace(` ${GAP} `, " ");

/* THE SIX STILLS, CRUMPLED FIRST. Document order IS play order — unfold.ts
 * takes them off the markup and plays them down the list, so the sequence is
 * stated once, here, and there is no second copy of it in the script.
 *
 * webp rather than the exports themselves: the six PNGs come to 4.5 MB, which
 * is a flipbook that arrives after the reader has scrolled past it. At the same
 * pixel dimensions this is 305 kB for the set, and the originals are left in
 * the folder beside them as the source they were made from.
 *
 * The alt text is on the LAST one, which is the sheet the section rests on and
 * the only one of the six that is ever seen for longer than a sixteenth of a
 * second; the other five are frames of its arrival and are announced as
 * nothing. */
const FRAMES = [6, 5, 4, 3, 2, 1];

export default function Reimagine() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE SECTION IS STILL A SECTION. The letters are
          parked under their masks by global.css and the sheet is parked on its
          first frame — a ball of paper with nothing beside it. Both are
          released here, which costs nothing when scripting is on: the contents
          of a noscript element are not even parsed. The reduced-motion rules in
          global.css say exactly the same two things. */}
      <noscript>
        <style>{`.reimagine .char { transform: none }
          .reimagine-paper { opacity: 0 }
          .reimagine-paper:last-of-type { opacity: 1 }`}</style>
      </noscript>

      {/* THE SHEET'S BOX, AND IT IS THE FLAT SHEET'S BOX AND NOT THE BALL'S.
          Every frame is drawn into this one box and fitted inside it, so the
          paper's size on screen is the photographer's rather than the
          stylesheet's: the ball is small in its own frame and the sheet fills
          its own, and playing them in place is what makes the paper open
          outward. The box is the last frame's shape because that is the one the
          section comes to rest on and the one the design measures — see
          .reimagine-sheet in global.css. */}
      <div className="reimagine-sheet">
        {FRAMES.map((n, i) => (
          <img
            className="reimagine-paper"
            key={n}
            src={`/assets/uncrumpled-paper/paper-${n}.webp`}
            alt={i === FRAMES.length - 1 ? "A sheet of graph paper, opened out" : ""}
            aria-hidden={i === FRAMES.length - 1 ? undefined : true}
            width={1536}
            height={1024}
            /* EAGER, ALL SIX, and it is the one thing about this markup that is
               not obvious. They are below the fold, so the default would defer
               every frame until the reader was nearly on them — and the unfold
               plays at sixty milliseconds a frame the moment they arrive. A
               flipbook whose frames are still in flight plays as a ball of
               paper that jumps to a flat sheet. 305 kB for the set is the price
               of it being a movement at all. */
            loading="eager"
            decoding="async"
          />
        ))}

        {/* THE STATEMENT, WRITTEN ON THE SHEET. Inside the sheet's box rather
            than positioned against the section, so the copy stays where it was
            drawn on the paper whatever the window does to the paper's size.

            aria-label so it is announced as one sentence: the five lines are a
            drawing, and the row of letter boxes under each of them is a reveal.
            Neither is something to read out. */}
        <h2 className="reimagine-copy" aria-label={SPOKEN}>
          {LINES.map((line, i) => (
            <span className="line" aria-hidden="true" key={i}>
              {line === `SOMETHING ${GAP} MORE` ? (
                <>
                  {letters("SOMETHING ")}
                  {/* THE HOLE IN THE SENTENCE, WITH THE STRIP OF TAPE IN IT.
                   *
                   * The hole is a flex item with a width and no content — its
                   * width is a measurement off the design, and it is what stops
                   * the line closing up under the tape. The strip is absolutely
                   * positioned inside it and is WIDER than it, which is the
                   * point: tape laid over a sentence overlaps the words either
                   * side of the gap, or it reads as a swatch dropped into a
                   * space left for it.
                   *
                   * A PEEL AND NOT AN IMAGE, because of how it arrives — rolled
                   * down from its left end once the statement is written. The
                   * site has one mechanism for that and this is it; the
                   * preloader's mark is the other thing driven this way. See
                   * TAPE in ./unfold.ts for the beat and the curve.
                   *
                   * from={0} is the fold at the near edge — nothing folded, the
                   * strip lying flat — and that is the pose --peel: 0 draws,
                   * which is what paints before any script runs and if none ever
                   * does. The rolled-up pose is the far end, to={1}: the
                   * timeline starts there and comes back.
                   *
                   * direction is 90deg — the RIGHT end is the one that lifts,
                   * which is what makes the strip lay down LEFT TO RIGHT, the
                   * direction the sentence under it is read. It reads
                   * backwards: the edge named is the edge the fold hinges
                   * from, so the stub left standing at --peel 1 is the OTHER
                   * end. At -90deg the strip unrolled right to left, against
                   * the reading, which is the tell. box is the artwork's own
                   * size as the stylesheet draws it — the design's 139.08 x
                   * 44.035 at the 1440 width — which the fold
                   * arithmetic needs whenever the frame is turned, and the
                   * height is the artwork's 428x173 aspect.
                   *
                   * IN --rei-u AND NOT IN vw, matching .reimagine-gap
                   * .reimagine-tape in global.css, which sizes the same strip
                   * and has to agree with this to the pixel. The section's unit
                   * is capped so that the drawing fits the screen the pin holds
                   * still; a strip still measured against the WINDOW would keep
                   * its full size on a sheet that had shrunk under it, and lie
                   * across the words either side of the hole.
                   *
                   * WRITTEN WITHOUT SPACES INSIDE THE calc(), WHICH IS LOAD
                   * BEARING. Peel splits this prop on whitespace to get its two
                   * lengths (see components/Peel), so a calc with spaces in it
                   * arrives as four fragments and neither dimension survives.
                   * CSS demands the spaces only around + and -; around * it
                   * forbids nothing, which is what makes this writable at all.
                   *
                   * back is the kraft underside, because this is the brown
                   * packing roll — the same pairing the pinning section's tapes
                   * make. */}
                  <span className="reimagine-gap">
                    <Peel
                      className="reimagine-tape"
                      src="/assets/tape top.webp"
                      drive="manual"
                      from={0}
                      to={1}
                      direction="90deg"
                      box="calc(9.658*var(--rei-u)) calc(3.058*var(--rei-u))"
                      back="peel-back-kraft"
                    />
                  </span>
                  {letters(" MORE")}
                </>
              ) : (
                letters(line)
              )}
            </span>
          ))}
        </h2>
      </div>
    </Stage>
  );
}
