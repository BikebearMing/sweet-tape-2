/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CSSProperties } from "react";

import Arrow from "@/components/Arrow";
import HandNote from "@/components/HandNote";
import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";

import { getAbout } from "@/data/about";

import Stage from "./Stage";

/* THE WAY OUT OF /about — the page's last screen, and its only forward door.
 *
 * Everything above this is the story: the aisle, the answer to it, what the
 * answer was for, and the four words we wanted to be while we did it. The story
 * ends and the reader is left on a green sheet with nowhere to go, which is what
 * this is for. One belief said small, one claim said as loudly as this site says
 * anything, the slider's EXPLORE sticker under it pointing at the tapes (a
 * white pill until the final round) — and the tapes themselves, standing in a
 * crate of fruit at the foot of the screen.
 *
 * THREE LAYERS, DRAWN BACK TO FRONT: a green curtain across the whole sheet, the
 * copy printed on it, and the crate hung off the bottom edge in front of both.
 * The curtain is the only one that MOVES — it drifts inside the sheet as the
 * section crosses the window while everything measured against the sheet's edges
 * stays exactly where it was put. See ./parallax.ts, which argues why the crate
 * is not part of that.
 *
 * THE CRATE HANGS OUT OF THE SECTION and is cropped by it rather than made to
 * fit: the artwork is a third taller than the room left under the pill, so its
 * bottom third is off the sheet and what the reader sees is fruit running past
 * the bottom edge. Sized to fit, it would be a photograph of a crate with air
 * around it in the middle of a green screen. The opening screen's jack-in-the-box
 * is cropped the same way and for the same reason — see .about-open's overflow.
 *
 * WHERE THE ARTWORK STARTS IS THE ONE FIGURE THAT HAD TO BE DERIVED. The file is
 * 2304 x 3143 with the top 878 rows fully transparent — the black band above the
 * OPP tape in the export — so the tape's top edge is 27.9% of the way down the
 * FILE, and the box is placed by the file while what has to land in the right
 * place is the tape. --cta-front-top in global.css is that arithmetic and says
 * so; it is also the figure to move if the artwork is ever re-exported with the
 * empty band trimmed off.
 *
 * THE COPY ARRIVES IN THE SITE'S TWO VOICES, and which one each piece takes is
 * not a choice made here — it is what the piece IS. The claim is a headline, so
 * it splits to letters and goes up in a shuffled scatter; the line above it is
 * running copy, so it rises a line at a time out of a floor that is not drawn.
 * letters() and bodyCopy() emit the two structures on the server, ./reveal.ts
 * plays the first and components/bodyReveal.ts plays the second. Nothing here
 * splits anything on mount and there is never a frame of unsplit text.
 *
 * Server-rendered like every other section on this site. Stage is the hair-thin
 * client wrapper that owns the ref and starts the three things that run in the
 * section; nothing below this line is a client component.
 */

/* WHERE THE DOOR OPENS, AND EVERYTHING THIS SECTION SAYS, are on the record —
   src/globals/About.ts, the Call to action tab. The story ends on what the tape
   is FOR, so the way on from it defaults to the tapes: /products is the row of
   six, which is the next thing a reader who has read this far would want, and
   it is what the crate under the pill is a picture of. */

export default async function AboutCta() {
  const {
    cta: { kicker, headline, href },
  } = await getAbout();

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE SECTION IS STILL A SECTION. The letters are
          parked under their masks and the pill at nothing by global.css until
          ./reveal.ts sets data-reveal — the hand-off every section on this site
          makes — so a page where the script never runs would be a curtain with a
          crate on it and no way off the page. Shown outright here, exactly as
          the reduced-motion rules do.

          The small line needs no escape of its own: the body-copy park is lifted
          by the same kind of attribute, and this covers it. */}
      <noscript>
        <style>
          {`.about-cta .char, .about-cta .body-rise { transform: none }
            .about-cta .explore-button { opacity: 1; transform: none }`}
        </style>
      </noscript>

      {/* THE PHOTOGRAPH, AND IT IS A SHEET LAID ON THE SECTION'S GREEN RATHER
          THAN THE SECTION ITSELF. Three things need that. The crate hangs out of
          the bottom and has to be cropped by the same edge the curtain is, so
          the two belong in one box; that box's bottom edge is an ARC, which is
          what the dark green in the two bottom corners of the drawing is — the
          page's own sheet, seen past the curve; and the curtain drifts inside
          it, which needs a box with an edge to be cropped by. See --cta-arc and
          --cta-drift in global.css. */}
      <div className="about-cta-sheet arc-cut">
        {/* THE CURTAIN. An element rather than a background-image, and the
            parallax is the whole reason: a background can be positioned but it
            cannot be given a transform of its own, and the drift has to be a
            transform — anything else is a repaint of the whole sheet on every
            frame. Cut taller than the sheet by --cta-drift and centred in it, so
            there is picture above and below the crop to move into. */}
        <img
          className="about-cta-bg"
          src="/assets/cta-bg.webp"
          alt=""
          loading="lazy"
          decoding="async"
        />

      </div>

      {/* THE COPY, AND IT IS A BOX OF ITS OWN so that it PAINTS OVER the sheet:
          the sheet is positioned and this is not, and positioned boxes paint
          over in-flow ones whatever order they are written in. One wrapper with
          one `position: relative` on it settles that for all three. */}
      <div className="about-cta-copy">
        {/* THE BELIEF. Inter Tight against the claim's condensed Futura — it is
            the one line on this screen that is read rather than looked at, so it
            is set in the face the rest of the site reads in, and it arrives in
            the entrance that face's copy always takes: a line at a time, out of
            a floor that is not drawn. .body-copy is the opt-in that
            components/bodyReveal.ts scans for; the words inside are bodyCopy()'s
            boxes. */}
        <p className="about-cta-kicker body-copy">{bodyCopy(kicker)}</p>

        {/* THE CLAIM, AND IT IS AN h2 RATHER THAN AN h1. The opening screen owns
            this page's h1; this is the last of several sections under it, and a
            second h1 at the foot of a page would tell a screen reader the
            document starts again here.

            THE LINES ARE SPANS AND NOT A WRAP. Where a headline this size turns
            is a decision made by looking at it — every headline on this site is
            stored the same way, and at this leading a browser's own break would
            put two words on one line and one on the next.

            aria-label CARRIES THE READABLE SENTENCE and the letters are taken
            out of the tree with it: what is under this heading is one box per
            character, and a screen reader handed those spells the claim out. The
            opening screen's headline and the hero's are labelled the same way. */}
        <h2 className="about-cta-title" aria-label={headline.join(" ")}>
          {headline.map((line) => (
            <span
              className="line"
              key={line}
              aria-hidden="true"
              /* How long the row is. Nothing in this section bends type, so
                 --letters is not load-bearing here the way it is under the arc
                 on the opening screen — it is set because the row of .clip boxes
                 is the site's shared structure, and a rule that wants the count
                 should never have to count. */
              style={{ "--letters": line.length } as CSSProperties}
            >
              {letters(line)}
            </span>
          ))}
        </h2>

        {/* THE STICKER — the slider's circle EXPLORE button, asked here by the
            final round (2026-09-29) in place of the white pill (the pill's
            markup is in git, and its CSS still serves the 404 page). Same
            structure as TapeSlider/Explore.tsx: the clip holds the label, the
            badge hangs outside it so the disc is never cut by the mask. Not a
            copy of that component, because this one's href and label are the
            record's own — the shared part is the CSS, scoped to both stages.

            Still a real anchor, still arriving as an OBJECT: reveal.ts pops it
            whole the way it popped the pill. */}
        <Link className="explore-button" href={href}>
          <span className="explore-clip">
            {/* EXPLORE, typed like the slider's and not the record's label
                (final round: "just change the text to EXPLORE") — the sticker
                reads the same wherever it is stuck. The label field still
                writes the 404's pill. */}
            <span className="button-text">EXPLORE</span>
          </span>
          <span className="arrow">
            <Arrow />
          </span>
        </Link>
      </div>

      {/* THE NOTE, at the side of the sticker — the final round's mock puts the
          hand in the empty left of the curtain, level with the door out. New
          words in the same hand (the breaks are the drawing's own, see
          HandNote/index.tsx), written in the page's lime like the belt's.
          Placement and the phone's display:none are .cta-note in global.css,
          with the other instances. After the copy in tree order so it paints
          over the curtain, and before the crate, which it is nowhere near. */}
      <HandNote
        className="cta-note"
        lines={[
          "we've believed that",
          "even the simplest",
          "products deserve",
          "thoughtful design.",
        ]}
      />

      {/* THE CRATE, IN FRONT OF EVERYTHING — including the pill, whose lower
          edge the tapes now overlap. It used to live inside the sheet, which is
          a stacking context (the arc mask makes one), so nothing in there could
          paint over the copy; this twin box is the same geometry and the same
          arc crop (same classes), placed after the copy so tree order does the
          stacking. pointer-events are off on the whole box — the crate is
          decoration and the pill under it has to stay clickable.

          alt="" and out of the tree: it is the same six tapes the pill already
          names and links to, photographed. Lazy like the curtain — the last
          section of the route. */}
      <div className="about-cta-sheet about-cta-frontbox arc-cut" aria-hidden="true">
        <img
          className="about-cta-front"
          src="/assets/front-cta.webp"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
    </Stage>
  );
}
