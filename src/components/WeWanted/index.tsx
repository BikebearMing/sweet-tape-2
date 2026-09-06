import type { CSSProperties } from "react";

import Mark, { type MarkKind } from "./Mark";
import { getAbout } from "@/data/about";

import Stage from "./Stage";
import { START_OFFSET } from "./crawl";

/* WE WANTED TO BE. — /about's last section, and where the green comes back.
 *
 * The two screens above this one are lime — a curtain falling over the belt, and
 * the sheet of paper it reveals — and this is the page returning to the dark
 * green it opened on, which is what closes it. It is also the last thing said
 * and the plainest: the aisle, the answer, what the answer was for, and then the
 * four words we wanted to be while we did it.
 *
 * ONE SENTENCE BENT ROUND A WAVE, CRAWLING RIGHT TO LEFT, and four boxes popping
 * up under it one at a time as it goes. The section is held still while a couple
 * of screens of scroll are spent on it, and every one of those frames is drawn
 * from the scroll position and nothing else — see ./crawl.ts, which is the whole
 * of the movement.
 *
 * THE SENTENCE STARTS HALF OFF THE RIGHT EDGE. What you arrive on is WE WANTED
 * and a promise; the crawl is what brings BE. into the frame, so the line is
 * FINISHED by scrolling rather than read at a glance. That is the one thing this
 * section does, and everything below is in service of it.
 *
 * IT IS THE HOME PAGE'S BAND, WITHOUT THE TAPE. Same mechanism exactly — an SVG
 * path, a <textPath> riding it, and one number (startOffset) doing all the
 * moving, so the BROWSER does the bending and nothing here has to place a
 * glyph. What is different is the clock and the tape: the band loops for ever at
 * a speed the wheel leans on, and this is scrubbed, so it goes exactly as far as
 * you scroll it and no further. And there is no stroked band under the type —
 * the words are printed on the section's own green rather than on a length of
 * tape. See components/WaveBand, which argues the shared parts at length.
 *
 * THE BOXES ARE SUPER POWERS' CARDS, RESTATED SMALL. Same object: a rounded
 * square, a number in the corner of the ceiling, a drawing, and a claim across
 * the floor. What is new is the FILL — a two-tone card with the site's own
 * concave edge between the halves (--edge-bite in :root, the footer's arc and
 * the pinning section's brow) — and the fact that there are four of them on a
 * dark sheet rather than three in a window. See the About block in global.css.
 *
 * THEY POP RATHER THAN ARRIVE. Scale from nothing, climbing a little as they
 * come, and overshooting once before they settle — one after another, timed off
 * the sentence's crawl rather than off a clock of their own. The overshoot is an
 * ease on a scrubbed tween, which means the bounce happens under the reader's
 * hand: scroll back up and they un-pop, in order, exactly as far as you go.
 *
 * Server-rendered like every other section on this site. Stage is the hair-thin
 * client wrapper that owns the ref and hands the section to crawl.ts; nothing
 * below this line is a client component.
 */

/* WHAT THE BRAND WANTED TO BE — the four claims, and the section's own copy.
 *
 * OFF THE RECORD NOW — src/globals/About.ts, the We wanted tab. What follows is
 * the shape of the four fields there and why each one is what it is.
 *
 * THE LABEL IS AN ARRAY BECAUSE THE BREAK IS A DRAWING. EASY TO CHOOSE is two
 * lines on this box and MORE HUMAN is two lines on that one, and where a phrase
 * this size turns is a decision made by looking at it — not something inferred
 * from a box width at render time. Every headline on this site is stored the
 * same way.
 *
 * `y` IS WHERE THE BOX SITS DOWN THE SCREEN, in vh, from the top of the stage.
 * The x is NOT here and cannot be: the four are one row at a fixed pitch — the
 * measurement the design gives is 390 between one box and the next — so a box's
 * horizontal place is its POSITION IN THIS LIST times that pitch, and the
 * stylesheet works it out from --n. Typing four x values would be four chances
 * to break a row that is defined by being evenly spaced. The vertical scatter is
 * the opposite: it is hand-placed, it is the whole reason the row does not read
 * as a row, and there is no rule that would generate it.
 *
 * The numbers ARE the order and are printed as such. Written out rather than
 * struck off the index so that a box can be reordered without its number
 * changing meaning — 01 is CLEARER whatever position it ends up in.
 *
 * THE KEY IS ITS OWN FIELD AND IS NOT THE WORDS. It reaches the markup as
 * [data-box] and the stylesheet's four palettes are keyed on it, so rewording a
 * claim leaves the box the colour it was drawn in. There are four because there
 * are four palettes.
 */

/* THE WAVE, AND ITS GEOMETRY IS THE DESIGN'S OWN DRAWING, MEASURED.
 *
 * public/assets/"We wanted to be.svg" is the sentence as the designer bent it —
 * outlined glyphs, 1641x309. Reading each glyph's baseline off that file gives:
 * a crest about a fifth of the way in, a trough at four fifths, a swing of
 * +/-67 units against a 174-unit cap height, one full cycle per ~1900 units.
 * Scaled to this band's type (cap ~155 viewBox units at font-size 222) that is
 * ONE CYCLE PER 1700 VIEWBOX UNITS, SWINGING +/-60, CREST AT x=320 — a tighter,
 * far shallower undulation than the single broad hump this section carried
 * before: the line rises early, dips through a trough in the right half, and is
 * rising again as it leaves the frame, which is the drawing.
 *
 * The frame IS 0..1600 — see the viewBox below — so those x figures are screen
 * positions. Centreline y=280, the box's middle; control points sit +/-120 off
 * it because a quadratic reaches halfway to its control point.
 *
 * GENERATED RATHER THAN WRITTEN OUT, which is the opposite of the call the old
 * twelve-segment path made, and the arithmetic is why: the runway still has to
 * reach from about -8600 to past 10000 (the sentence is longer than the screen
 * and starts with most of itself off the right edge, so the curve must exist
 * where the words are before they arrive), and at half-cycles of 850 that is
 * 22 segments of identical arithmetic. The three constants ARE the shape;
 * re-measure the design file and they are the only figures to touch. */
const WAVE_SWING = 60;
const WAVE_CENTER = 280;
const WAVE_HALF = 850; /* node to node — half of the 1700-unit wavelength */
/* Nodes at 320 +/- 425 + k*850 put the crest at x=320, as measured. Ten half
   cycles of runway before the frame, eleven after. */
const WAVE_FIRST_NODE = 320 - WAVE_HALF / 2 - 10 * WAVE_HALF;
const WAVE = [
  `M ${WAVE_FIRST_NODE},${WAVE_CENTER}`,
  ...Array.from({ length: 22 }, (_, i) => {
    const x0 = WAVE_FIRST_NODE + i * WAVE_HALF;
    /* Even segments rise (the crest's own segment is i=10); odd ones dip. */
    const cy = WAVE_CENTER + (i % 2 === 0 ? -2 : 2) * WAVE_SWING;
    return `Q ${x0 + WAVE_HALF / 2},${cy} ${x0 + WAVE_HALF},${WAVE_CENTER}`;
  }),
].join(" ");

export default async function WeWanted() {
  const {
    wanted: { sentence, boxes },
  } = await getAbout();

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE SECTION IS STILL A SECTION. The boxes are held
          at no size at all by global.css until crawl.ts sets data-reveal — the
          same hand-off the letters make everywhere else on this site — so a page
          where the script never runs would be one sentence on an empty green
          screen. Shown outright here, exactly as the reduced-motion rule does.

          The sentence needs no escape: its resting offset is in the markup
          below, and with no script it simply never crawls. */}
      <noscript>
        <style>{`.we-wanted .wanted-box { transform: none }`}</style>
      </noscript>

      {/* THE SENTENCE, AND IT IS THE SECTION'S HEADING.
       *
       * A heading with an <svg> inside it rather than an aria-label on a
       * decorative graphic: SVG <text> is real text, so what a screen reader
       * announces here is the sentence itself, once, from the same characters
       * the reader sees bent round the wave. Nothing is written twice and there
       * is no second copy to keep in step.
       *
       * THE VIEWBOX IS THE FRAME. 1600 wide against a box that is 100vw wide,
       * so path-x 0 is the left edge of the screen and 1600 is the right edge,
       * exactly — which is what lets crawl.ts talk about where the full stop
       * parks in units it can measure the type in. preserveAspectRatio is left
       * at its default: the CSS gives the box the viewBox's own aspect, so
       * there is nothing to fit and nothing to crop.
       *
       * ITS DEPTH IS THE WAVE'S BUSINESS AND NOT THE TYPE'S. 560 is the swing
       * (+/-140 either side of the centreline) plus the room a capital needs at
       * both extremes — an svg clips at its own viewBox, so a box any shallower
       * shaves the tops off the crest and the tails off the trough. The three
       * figures move together: the swing in WAVE, this depth, and the matching
       * aspect-ratio in global.css. */}
      <h2 className="wanted-band">
        <svg viewBox="0 0 1600 560" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="wanted-path" d={WAVE} fill="none" />
          </defs>
          {/* startOffset here is the PRE-HYDRATION frame and nothing more: an
              approximation of the arc length that puts the sentence's opening
              word where the design has it, so the section reads before the font
              has resolved. crawl.ts measures the true anchor on this path, in
              the font that actually loaded, and takes over. See START_OFFSET,
              which is deliberately a constant and deliberately approximate. */}
          <text className="wanted-text" dy="0.35em">
            <textPath href="#wanted-path" startOffset={START_OFFSET}>
              {sentence}
            </textPath>
          </text>
        </svg>
      </h2>

      {/* THE FOUR BOXES. A list, and unlike SUPER POWERS' stack this one really
          is: four claims of equal weight with nothing between them, and no pads
          to announce as empty items. */}
      <ul className="wanted-boxes">
        {boxes.map((box, i) => (
          <li
            className="wanted-box"
            key={box.id}
            data-box={box.id}
            /* --n is the box's place in the row and the stylesheet multiplies
               it by the pitch; --y is the hand-placed drop. Both as custom
               properties for the reason the pinning section's props use them:
               they are DATA about an arrangement, not rules about behaviour,
               and the stylesheet is where the arrangement is assembled. */
            style={{ "--n": i, "--y": box.y } as CSSProperties}
          >
            {/* THE DEEP HALF OF THE CARD, WITH A BITE OUT OF ITS TOP EDGE.
                An element rather than a pseudo-element on the box, because it
                needs a pseudo-element of its own for the bitten crown and the
                box's ::before is spoken for. See .wanted-box-fill. */}
            <span className="wanted-box-fill" aria-hidden="true" />

            {/* The order printed on the ceiling. aria-hidden: it is a list, the
                order is already announced, and "01" read out before every claim
                is four pieces of furniture in the way of four words. */}
            <span className="wanted-box-num" aria-hidden="true">
              {box.num}
            </span>

            <Mark kind={box.mark} />

            {/* The claim across the floor, ARCHED — the drawing bows the word
                up through the middle, so each line rides a shallow quadratic
                exactly the way the sentence overhead rides its wave: an SVG
                path, a textPath, and the browser doing the bending. SVG <text>
                is real text, so a screen reader gets the claim from the same
                characters the eye does — the heading above makes the same
                argument.

                ONE ARC FOR EVERY LINE, and it is self-adjusting: the crest of
                a quadratic is its flattest stretch, so a short line centred on
                it barely bends while RECOGNISABLE, which spans the whole card,
                takes the full bow — which is the drawing, where only the long
                words visibly arch.

                Two lines where the design breaks them — see BOXES. The path id
                carries the box's key and the line's index because ids are
                document-global and there are four cards of this. */}
            <p className="wanted-box-label">
              {box.label.map((line, j) => (
                <svg className="line" viewBox="0 0 100 20" key={j} focusable="false">
                  {/* A VALLEY, NOT A CREST — the word follows the floor's own
                      dip, ends high and middle low, the same curve the deep
                      half above it is cut with. */}
                  <path
                    id={`wanted-arc-${box.id}-${j}`}
                    d="M0,6 Q50,20 100,6"
                    fill="none"
                  />
                  <text>
                    <textPath
                      href={`#wanted-arc-${box.id}-${j}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {line}
                    </textPath>
                  </text>
                </svg>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </Stage>
  );
}
