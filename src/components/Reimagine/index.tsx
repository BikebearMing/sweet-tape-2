/* eslint-disable @next/next/no-img-element */
import { letters } from "@/components/letters";
import Peel from "@/components/Peel";
import { getAbout } from "@/data/about";
import Props from "./props";
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
 * AND THEN THE SHEET IS DRESSED. Six strips of tape holding it down at the
 * edges and two product photographs pinned to it, all of them arriving AFTER the
 * paper has opened and staggered across each other — see ./props.tsx, which says
 * what they are, and REIMAGINE.PROPS in ./unfold.ts, which says when. They are a
 * fourth beat and not a fourth version of the third: the tape rolls down the way
 * the strip in the sentence does, and the photographs come up off the paper and
 * settle, because one is a thing being stuck on and the other is a thing being
 * put down.
 *
 * THE HEART AND THE SQUIGGLE ARE STILL TO COME, and the slot for them is open
 * rather than missing: MARKS in ./props.tsx is an empty list the markup already
 * maps over, with both boxes already measured in global.css. A rule under the
 * last line is the one thing in the design that has nothing standing for it.
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

/* AND THE PHONE'S OWN TURN, which is the other marker in the copy below.
 *
 * THE STATEMENT IS BROKEN TWICE, and the two sets of breaks are not nested. The
 * five lines are the design's at 1440. At 390 the type is 50px on a sheet a
 * third the width, and the same sentence wants eight — but not eight made by
 * splitting the five, which is what a per-line wrap would give: AN comes off the
 * end of the first line and goes to the head of the second, EXPRESSIVE and AND
 * come together out of two different lines. Some of the desktop's breaks survive
 * on the phone, some are suppressed, and four new ones appear inside lines.
 *
 * SO BOTH ARE WRITTEN DOWN, and neither is inferred from a measure. That is this
 * site's rule for display type and it is worth restating here because the
 * alternative looks so reasonable: give the block a width and let it wrap. The
 * measure that produces exactly these eight lines is a four per cent window —
 * wide enough for EXPRESSIVE AND, narrow enough to turn before TO REIMAGINE AN —
 * so where this statement breaks would be decided by how a font happened to
 * load, on a phone, under a reader. It is a drawing. It is typed.
 *
 * HOW IT WORKS is one element per turn (.reimagine-turn) and one per word, and
 * the stylesheet decides which of the two sets is live: above the breakpoint the
 * turns are display: none and .line lays the row out, and below it .line is
 * display: contents and the turns are what break. Neither set is markup the
 * other has to route around.
 *
 * A SLASH BECAUSE THE COPY HAS NO SLASH IN IT, exactly as GAP is a pipe. Both
 * are stripped for SPOKEN below. */
const TURN = "/";

/* THE LINES COME OFF THE RECORD — src/globals/About.ts, the Statement tab, one
 * row per line with both markers typed into the copy. Read the slashes and
 * ignore the line ends and you have the phone's eight; read the line ends and
 * ignore the slashes and you have the desktop's five. A line that ends with a
 * slash is one both agree on. */

/** The sentence as it is READ — the lines joined, with the tape's hole and the
    phone's turns taken back out. Screen readers get this and never the
    fragments. */
function spokenOf(lines: string[]): string {
  return lines.join(" ").replace(/[|/]/g, "").replace(/\s+/g, " ").trim();
}

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

/* ONE WORD, ONE BOX.
 *
 * IT IS WHAT LETS THE PHONE BREAK THE STATEMENT SOMEWHERE ELSE. .line is a flex
 * row and its letter clips are flex items, so a row lays out on one line however
 * long it gets — right for breaks that are drawn, and no use at all when a
 * SECOND set of breaks has to be drawn on the same markup. Boxed, the words are
 * the units both arrangements are made of: above the breakpoint the row is a
 * row, and below it .line is display: contents and every word in the statement
 * becomes a sibling of every other, turning where a Turn says.
 *
 * EVERY WORD CARRIES ITS OWN TRAILING SPACE, the last on a line included, and
 * that is the one thing here that has to be got right. The desktop's rows are
 * ranged left, so a space hanging off the end of one is invisible; the phone
 * NEEDS it, because a word that ended a line at 1440 sits in the middle of one
 * at 390 — AN closes the first line there and opens the second here. Left off,
 * AN and EVERYDAY butt together.
 *
 * An NBSP for letters()' reason: a plain space between two flex items is
 * dropped. */
function Word({ text }: { text: string }) {
  return <span className="reimagine-word">{letters(`${text} `)}</span>;
}

/* WHERE THE PHONE TURNS — an empty box that takes a whole flex line to itself, so
 * everything after it starts on the next one. Nothing above the breakpoint,
 * where it is display: none and .line does the breaking.
 *
 * A REAL ELEMENT AND NOT A ::before ON THE WORD AFTER IT, which is the obvious
 * saving and does not work: a pseudo-element is not a flex item, so it cannot
 * take a line. */
function Turn() {
  return <span className="reimagine-turn" aria-hidden="true" />;
}

export default async function Reimagine() {
  const { statement } = await getAbout();
  const spoken = spokenOf(statement);

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
        <h2 className="reimagine-copy" aria-label={spoken}>
          {statement.map((line, i) => (
            <span className="line" aria-hidden="true" key={i}>
              {line
                .split(" ")
                .filter(Boolean)
                .map((token, j) => {
                  if (token === TURN) return <Turn key={j} />;
                  if (token !== GAP) return <Word key={j} text={token} />;

                  return (
                    <span className="reimagine-word" key={j}>
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
                     * IN em AND NOT IN vw OR IN --rei-u, matching .reimagine-gap
                     * .reimagine-tape in global.css, which sizes the same strip
                     * and has to agree with this to the pixel. 1.545 x 0.489em is
                     * 9.658 x 3.058 units at the copy's own 6.25, so this is the
                     * same strip it has always been at the design width.
                     *
                     * IT WAS IN --rei-u AND THE ARGUMENT FOR THAT IS WORTH KEEPING
                     * BECAUSE IT IS HALF RIGHT. The section's unit is capped so
                     * the drawing fits the screen the pin holds still, and a strip
                     * measured against the WINDOW would keep its full size on a
                     * sheet that had shrunk under it and lie across the words
                     * either side of the hole. True — and the unit it should have
                     * been measured against all along is the SENTENCE, not the
                     * paper. The tape is set INTO this line: what it must not
                     * overlap is the G of SOMETHING and the M of MORE, and that is
                     * a fact about the type. A phone sets this statement larger on
                     * the same paper (see the About phone block), which is exactly
                     * the case --rei-u cannot see — it would hold the strip at the
                     * size it had while the letters grew past it.
                     *
                     * AND THE SPACES ARE GONE FROM THE PROBLEM WITH THEM, which is
                     * worth writing down because the next figure typed here may
                     * bring them back. Peel splits this prop on whitespace to get
                     * its two lengths (see components/Peel), so a calc() with
                     * spaces in it arrives as four fragments and neither dimension
                     * survives. Two bare lengths cannot trip on it; a calc() can,
                     * and CSS demands the spaces only around + and -.
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
                          box="1.545em 0.489em"
                          back="peel-back-kraft"
                        />
                      </span>

                      {/* THE WORD SPACE AFTER THE TAPE AND NOT BEFORE MORE,
                          which is the same call Word makes, made here by hand
                          because a hole is not a word. The phone turns
                          immediately after the tape, so a space carried on the
                          far side of it would open the next line by a word
                          space and MORE would sit indented under SOMETHING.
                          Above the breakpoint it is the same characters in the
                          same order it always was. */}
                      {letters(" ")}
                    </span>
                  );
                })}
            </span>
          ))}
        </h2>
      </div>

      {/* AND EVERYTHING ELSE ON THE PAPER — which is a SIBLING of the sheet and
          not a child of it, and that is the one surprising thing about this
          section's markup.

          IT IS DRAWN IN THE SHEET'S BOX EITHER WAY. .reimagine-props is given
          the same box by the stylesheet, restated without the centring
          transform, so a prop's --px and --py are still measured from the
          paper's own top left corner and the whole layer still scales with the
          drawing. Nothing about where the props sit changes.

          WHAT CHANGES IS WHAT THE CLEAR STRIPS CAN SEE. Three of the six are OPP
          film, whose artwork is a set of highlights meant to be SCREENED onto
          whatever it is lying on (see props.tsx), and the design has all three
          half off the paper on the lime and the green — which is where the
          screen has anything to do. .reimagine-sheet is centred with a transform
          and a transform makes a stacking context, and a stacking context is an
          isolated group: a strip inside it blends with the paper and with
          nothing else, so off the paper its backdrop is transparent and it
          arrives as the flat grey slab the blending was supposed to dissolve.
          Out here its backdrop is the section's two grounds AND the sheet, and
          the film reads as film over both.

          After the sheet in source, so the props still paint over the paper and
          over the type where they overlap it. */}
      <Props />
    </Stage>
  );
}
