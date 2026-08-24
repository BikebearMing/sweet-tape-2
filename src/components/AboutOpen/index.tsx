import type { CSSProperties } from "react";

import HandNote from "@/components/HandNote";
import { letters } from "@/components/letters";

import Stage from "./Stage";

/* THE OPENING SCREEN of /about — the page's first statement and the box it
 * comes out of.
 *
 * It opens on the origin story's own sheet rather than on the lime every other
 * route opens on, and WE WANTED TO BE. below it is the page's SECOND screen
 * rather than its first. Both of those are arrangement, and the arrangement is
 * load-bearing: the section under this one is pinned, and where a pin begins is
 * decided by how much page is above it.
 *
 * THREE THINGS ON IT. The statement — THREE GENERATION / ONE SHARED BELIEF —
 * the hand-written note down in the bottom right corner, and
 * the jack-in-the-box, which is three flat images stacked in one wrapper: the
 * back of the box, the hand coming out of it, and the front of the box printed
 * over the hand so the hand reads as being INSIDE it. The order in the markup is
 * the order they stack, and it is the only reason the illusion works — front is
 * first here and is meant to end up on top; behind and hand sit under it.
 *
 * WHAT IT IS NOT is a hero. The masthead is already up there — (frontend)/layout
 * .tsx prints it on every route but the home page. The section turns it lime for
 * the length of the page; see `body:has(.about-open)` in global.css, which is
 * where that hand-off lives.
 *
 * BOTH CLASS NAMES ARE ON THE SECTION ON PURPOSE. .about-open is the site-wide
 * hook — the sheet, the grain, and the masthead's ink all hang off it, and
 * global.css names it in three places — while .about-hero is where this screen's
 * own layout is written. Dropping either one takes something with it.
 *
 * THE HEADLINE IS ON THE SITE'S ARC, WHICH IS NOT A CURVE OF ITS OWN. letters()
 * splits each line to .clip/.char boxes carrying --i, the row carries --letters,
 * and global.css drops and tilts each letter off the two — the home page's
 * headline and CREATIVE in the tape slider are the same object, and the note at
 * .hero-section .warped-text is where the mechanism is argued. Two things follow
 * from using it rather than bending type on an SVG path: the letters keep the x
 * the row gives them, so the KERNING IS THE FONT'S and no gaps open that were
 * never in the setting; and the copy stays real DOM text, which is what the
 * site's reveals collect when one is added here.
 *
 * ARCED THE SAME WAY UP AS THE HERO'S — the middle of each line sits below its
 * own two ends, which is what opens the middle of the block for the roll held up
 * in front of it. The sign is argued in the About block in global.css.
 *
 * THE ARC IS A STATIC TRANSFORM AND THE ENTRANCE IS NOT. Two elements, two
 * transforms: .clip holds the letter's place on the curve and masks it, .char is
 * the only thing that moves — the division of labour the hero's headline and
 * CREATIVE in the slider both use, because one element cannot carry both. So the
 * words are BENT in the first frame, server-rendered, and they RISE when the
 * cover clears. See ./reveal.ts for the entrance and ./Stage.tsx for the one
 * client boundary it needs.
 */

/* THE STATEMENT, and it is two lines rather than one string with a break in it.
 * Where a headline this size turns is a decision made by looking at it, not
 * something inferred from a box width at render time — every headline on this
 * site is stored the same way, and each line has to be its own row for the arc
 * to have anything to measure --letters against. */
const HEADLINE = ["THREE", "GENERATION"];

/* THE LINE UNDER IT, AND IT IS TWO HALVES BECAUSE THE GAP IS THE POINT. What
 * opens between them as the reader scrolls is where the roll comes up, so the
 * two words cannot be one text node with a space in it — the space has to be a
 * box that something else can be measured against and pushed through.
 *
 * The hero's kicker is the same object: WE'RE / HERE TO with the brand mark
 * dropping into the gap. What is different is which way the gap is filled — the
 * badge falls into the hero's from above the page, and this one is prised OPEN
 * from underneath by the hand. See ./spaceOut.ts. */
const KICKER = ["ONE SHARED", "BELIEF"];

/* THE NOTE'S OWN WORDS, in this section rather than in HandNote/copy.ts — which
 * holds the BOARD's sentence and is the component's default, not a place every
 * note's copy is kept. The note takes its lines as an argument precisely so that
 * the only thing which knows what an instance says is the instance; the news
 * page's is passed in the same way.
 *
 * FOUR EXPLICIT LINES AND THE BREAKS ARE THE DRAWING, the same call the headline
 * above makes and for the same reason: a hand-written note has a shape, and
 * nothing here wraps. See HandNote/copy.ts, where the argument is made at
 * length.
 *
 * THE APOSTROPHE IS THE TYPOGRAPHIC ONE and it is drawn rather than exported —
 * see TICK in HandNote/glyphs.ts, which exists for this word. Written with the
 * typewriter apostrophe it still writes; written as "we have" it would need no
 * drawing at all, and it is not what the note says. */
const NOTE = [
  "we\u2019ve believed that",
  "even the simplest",
  "products deserve",
  "thoughtful design.",
];

export default function AboutOpen() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE HEADLINE IS STILL A HEADLINE. The letters are
          parked under their masks by global.css and released by reveal.ts
          setting data-reveal; a mask with no script to lift it is a headline
          that never arrives. This lifts it for good. WE WANTED TO BE. carries
          the same escape, and the hero's is the original. */}
      <noscript>
        <style>{`.about-hero .char { transform: none }`}</style>
      </noscript>

      <div className="title">
        {/* .warped-text carries the arc's two numbers for both lines; the lines
            themselves override them, because a five-letter word and a
            ten-letter word bent by the same amount are two different curves.
            See the About block in global.css. */}
        <div className="warped-text">
          {/* ONE HEADING, TWO LINES — splitting it across two <h1>s would put
              THREE and GENERATION in the outline as separate headings. The
              aria-label is what gets announced: the letters below are one span
              each, and a screen reader handed those spells the word out. The
              home page's headline is built exactly this way. */}
          <h1 className="h1" aria-label={HEADLINE.join(" ")}>
            {HEADLINE.map((line) => (
              <span
                className="line"
                key={line}
                /* The hook the arc's per-line tuning hangs off, which is the
                   tape slider's [data-word] restated — the values are taste and
                   belong in the stylesheet beside the rest of the drawing. */
                data-line={line.toLowerCase()}
                /* How long the row is. With --i on each letter it is everything
                   the curve needs, so the copy can change length without a
                   number changing in the stylesheet. */
                style={{ "--letters": line.length } as CSSProperties}
              >
                {letters(line)}
              </span>
            ))}
          </h1>
        </div>

        {/* aria-label carries the readable phrase, and the halves are taken
            out of the tree with it: a row of block-level letter boxes is
            otherwise liable to be announced a fragment at a time, and the gap
            between the two is a drawing rather than a pause in the sentence.
            The h1 above is labelled the same way. */}
        <h2 className="h4 space-out" aria-label={KICKER.join(" ")}>
          {KICKER.map((half) => (
            <span className="half" key={half} aria-hidden="true">
              {letters(half)}
            </span>
          ))}
        </h2>
      </div>

      {/* THE NOTE, in the empty bottom-right corner of the sheet — a margin
          ruled in two strokes with four lines written beside it, all of it drawn
          rather than set (components/HandNote/hand.ts). It is the page's own
          aside: the headline states the claim and this says what has been
          believed all through it, in a hand rather than in the brand's type.

          NOTHING TO SHOW IN THE MARKUP but the ruled corner. The letterforms are
          built at runtime out of the drawn alphabet in HandNote/glyphs.ts, which
          is why this is the one thing on the screen with no content in the
          server's HTML — the readable sentence is inside it as a hidden text
          node, so the words survive with or without any of that.

          A SIBLING OF THE BOX AND NOT A CHILD, because .jack-in-box collapses to
          nothing and the note is placed against the SHEET. Where it sits is
          .about-note in global.css, which is the only thing about it this file
          does not say. */}
      <HandNote className="about-note" lines={NOTE} />

      <div className="jack-in-box">
        <div className="wrapper">
          <img id="front" src="/assets/box-front.png" alt="" />
          <img id="behind" src="/assets/box-behind.png" alt="" />
          <img id="hand" src="/assets/hand.png" alt="" />
        </div>
      </div>
    </Stage>
  );
}
