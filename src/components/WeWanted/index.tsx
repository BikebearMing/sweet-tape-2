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

/* THE WAVE, AND IT IS THE HOME PAGE'S CURVE AT TWICE THE WAVELENGTH.
 *
 * The band's own geometry is one full cycle per 1600 units, which is one cycle
 * per screen — a valley AND a peak in the frame at once, which is right for a
 * length of tape crossing the page and wrong for a sentence you are meant to
 * read. This is one cycle per 3200, so what stands in the frame is a single
 * broad hump: the line rises through the middle of the screen and falls away at
 * both ends, which is the shape the design draws.
 *
 * The numbers, in viewBox units: centreline y=280, swinging +/-140 (control
 * points +/-280 — a quadratic reaches halfway to its control point), a node on
 * the centreline every 1600. The crest sits at x=800, dead centre of the frame,
 * because the frame IS 0..1600 — see the viewBox below, which is why this file
 * can talk about screen edges in path coordinates at all.
 *
 * THE SWING IS THE ONE FIGURE TO REACH FOR, and it was 90 before this. It is
 * what decides how hard the line falls away at the two ends of the screen —
 * raise it and the sentence dives off both edges, drop it and the whole thing
 * flattens towards a rule. It is bounded by the viewBox: the caps at the crest
 * and the descenders at the trough both have to stay inside the box, or the svg
 * clips the tops off its own type. At 140 against a box 560 deep and type set at
 * 222, there are 60 units of air at each extreme.
 *
 * IT RUNS FROM -8000 TO 9600, far past the frame at both ends, and that is
 * runway rather than decoration: the sentence is longer than the screen and
 * starts with half of itself off the right edge, so the curve has to exist
 * where the words are before they arrive. Glyphs enter the frame already bent,
 * exactly as the band's do.
 *
 * Written out rather than generated. Twelve segments is not enough arithmetic to
 * be worth a loop, and a path you can read is a path whose shape you can check
 * against the drawing. */
const WAVE = [
  "M -8000,280",
  "Q -7200,560 -6400,280",
  "Q -5600,0 -4800,280",
  "Q -4000,560 -3200,280",
  "Q -2400,0 -1600,280",
  "Q -800,560 0,280",
  /* The one in the frame: the crest at (800,140). */
  "Q 800,0 1600,280",
  "Q 2400,560 3200,280",
  "Q 4000,0 4800,280",
  "Q 5600,560 6400,280",
  "Q 7200,0 8000,280",
  "Q 8800,560 9600,280",
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

            {/* The claim across the floor. Two lines where the design breaks it
                on two — see BOXES — and the lines are spans rather than a wrap,
                so a box whose label is set larger tomorrow breaks where it was
                drawn to break rather than where it happens to fit. */}
            <p className="wanted-box-label">
              {box.label.map((line, j) => (
                <span className="line" key={j}>
                  {line}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </Stage>
  );
}
