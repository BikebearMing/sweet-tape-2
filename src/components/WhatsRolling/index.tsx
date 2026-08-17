import type { CSSProperties } from "react";

import HandNote from "@/components/HandNote";
import { letters } from "@/components/letters";
import Stage from "./Stage";

/* WHAT'S ROLLING — the news page's opening screen.
 *
 * A lime sheet with the page's name arced across it and a small tag hanging over
 * the top of the type. That is the whole section: no picture, no copy, no
 * furniture. It is a title card, and the reason it is one is that everything
 * below it is a list — the lead story and then nine cards — and a list needs a
 * held beat in front of it or the page opens mid-sentence.
 *
 * THE ARC IS THE HERO'S, and it is the same three declarations rather than a
 * second curve that looks similar: --letters on each row, --i on each letter
 * (letters() writes it), and --u computed from the pair. global.css has the long
 * version under Hero, and the rule for this headline sits beside it pointing at
 * the same explanation. Every letter keeps the x its row gives it and is only
 * dropped and tilted, which is what stops the arc opening gaps that were never
 * in the type.
 *
 * TWO LINES BY DESIGN, NOT BY WRAPPING — the same call the hero's headline, the
 * footer's sign-off and the closing key visual all make. Each line curves over
 * its OWN width (--u runs -1 to +1 within a row), so WHAT'S and ROLLING each get
 * a full arc rather than sharing one that would leave the short line nearly
 * straight.
 *
 * THE MASTHEAD IS NOT HERE. The badge in the top middle and the claim in the
 * corner belong to every route but the home page and are mounted once in the
 * layout — see components/TopBand. This section's top padding is measured to
 * clear the badge, which is the only relationship between them.
 *
 * Server-rendered. Stage is a hair-thin client wrapper that owns the ref and
 * hands the section to reveal.ts; nothing below this line is a client component.
 */

/* Section copy — the obvious CMS fields, so they are named constants rather than
   strings buried in the markup. Set in caps here rather than by text-transform,
   which is the site's convention: the copy reads in the markup exactly as it
   paints. */
const HEADING = ["WHAT’S", "ROLLING"];

/* The tag over the type. It says what the page IS, where the headline says what
   the page is about — which is why it is a chip and not a second line of the
   heading, and why it is the only thing here that is not a title.

   ONE WORD. It read NEWS & EVENTS, which is the route's full name and is a
   label's worth of words too many: a chip a centimetre wide under a headline
   fifteen vw tall is a stamp, and a stamp with a conjunction in it is a
   sentence. The events are IN the news here — the index below carries both —
   so the second half was saying something the page does not need said. */
const TAG = "NEWS";

/* The note, written by hand in the bottom right — the home page's, in this
   page's ink, saying what this page is for. Its own words rather than the
   board's: the hero's sentence is about what Sweet Tape makes, which is not
   what a reader has come to a news index to be told.

   THREE SHORT LINES, and the breaks are the drawing's rather than a wrap — see
   HandNote/copy.ts. Lower case throughout, because it is the one thing on this
   screen that is handwriting and not type. */
const NOTE = ["catch the latest", "update, events", "of sweettape"];

export default function WhatsRolling() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT NOTHING ON THIS SCREEN ARRIVES. Both entrances are
          parked by global.css and released by the section's own script — the
          headline's letters under their masks, the tag at nothing — so a page
          where it never runs is an empty lime sheet, which is the one section on
          the site that would be entirely blank. The stylesheet's hold is lifted
          here instead, which costs nothing when scripting is on: the contents are
          not even parsed. The hero, the closing key visual, the product page and
          the footer all carry the same escape.

          THE NOTE COMES BACK AS ITS RULED MARGIN AND NOTHING ELSE, which is the
          one thing here that is not a full recovery: its words are built at
          runtime by Vara and there is no runtime, so what is left is the corner
          and the hidden text node beside it. That text node is the point — the
          sentence survives for anything reading the page, and the drawing was
          always decoration. Showing the margin rather than hiding the lot is the
          honest end of it: a hand-ruled corner on a lime sheet is a mark on
          paper, where a blank space is a thing that failed. */}
      <noscript>
        <style>{`.whats-rolling .char { transform: none }
          .whats-rolling .rolling-tag,
          .whats-rolling .rolling-note { opacity: 1; visibility: visible }`}</style>
      </noscript>

      {/* THE TAG IS THE SITE'S CHIP — the slider's, which the pinning section
          and the lead story below both wear as well. It is not a new object: the
          shape, the corner and the perforation of dots down its left edge all
          come from the shared rule, and this page sets only the palette, the
          lean and where it stands. See .rolling-tag in global.css.

          Turned over into place rather than faded (TAG in reveal.ts) — the one
          thing about it that IS this page's.

          Out of the accessibility tree and not a heading: it is a label on the
          page, and the page is already named by the h1 under it — announced, it
          would read as a first heading saying nearly what the second says. */}
      <p className="rolling-tag" aria-hidden="true">
        {TAG}
      </p>

      {/* The page's one h1. Split to letters for the reveal, which is the
          hero's and the footer's — each waits below its own mask and slides up
          in a shuffled order.

          aria-label rather than a second hidden copy of the words: it is
          honoured on a heading, so the line is announced whole and the rows of
          letter boxes are never read out a fragment at a time. Every other
          headline on the site is marked up this way.

          The wrapper is what carries the arc's two knobs, exactly as the hero's
          .warped-text does — so the curve can be retuned without touching the
          heading, and the heading can be re-set without disturbing the curve. */}
      <div className="rolling-warp">
        <h1 className="rolling-title" aria-label={HEADING.join(" ")}>
          {HEADING.map((line) => (
            /* --letters is how long the row is; with --i on each letter it is
               everything the arc in global.css needs. */
            <span
              className="line"
              key={line}
              style={{ "--letters": line.length } as CSSProperties}
            >
              {letters(line)}
            </span>
          ))}
        </h1>
      </div>

      {/* And the note, beside ROLLING's last letters — a margin ruled in two
          strokes and the copy written next to it, all of it drawn rather than
          set (components/HandNote/hand.ts). The same object the home page's
          board carries twice, which is the whole point of it being a component:
          only the words, the pen and where it stands are this page's, and all
          three are said elsewhere — the words here, the other two in
          .rolling-note in global.css.

          AFTER THE HEADING IN THE MARKUP, so it paints over the G it tucks
          under. It is out of flow, so nothing above it moves to make room.

          Not decorative: this is the only sentence on the screen that says what
          the page is for, and it is the first copy a reader meets. */}
      <HandNote className="rolling-note" lines={NOTE} />
    </Stage>
  );
}
