/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CSSProperties } from "react";

import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";

import Stage from "./Stage";

/* THE WAY OUT OF /about — the page's last screen, and its only forward door.
 *
 * Everything above this is the story: the aisle, the answer to it, what the
 * answer was for, and the four words we wanted to be while we did it. The story
 * ends and the reader is left on a green sheet with nowhere to go, which is what
 * this is for. One belief said small, one claim said as loudly as this site says
 * anything, a pill under it pointing at the tapes — and the tapes themselves,
 * standing in a crate of fruit at the foot of the screen.
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

/* WHERE THE DOOR OPENS. The story ends on what the tape is FOR, so the way on
   from it is the tapes: /products is the row of six, which is the next thing a
   reader who has read this far would want, and it is what the crate under the
   pill is a picture of. Named rather than typed into the markup because it is
   the one decision in this file that is not a measurement, and it should be the
   easiest thing here to find and change. */
const HREF = "/products";

/* The section's copy. In this file and not in a data module for the reason
   WeWanted gives about its four claims: this is a fact about the company, there
   is one of it, and it belongs to the page it is written on. The day it comes
   from the CMS this is the shape the field takes. */
const KICKER = "We believe the world is better with";
const HEADLINE = ["MORE COLOUR,", "MORE HEART, AND", "YES — BETTER TAPE."];
const LABEL = "UNROLL THE STORY";

/* THE CHEVRON, and it is drawn twice on purpose — see the pill below, which is
   two discs rather than one. A function rather than a copied block of markup,
   so the two are the same drawing and cannot drift apart.

   Drawn rather than shipped, so it inherits the disc's ink for free — the same
   call components/Arrow makes about the north-east arrow it draws for the menu
   and the news cards. That one is not this one: this points ALONG the reader's
   way forward, not out of the page. */
function Chevron() {
  return (
    <svg viewBox="0 0 12 12" fill="none" focusable="false">
      <path
        d="M4.2 1.6 8.6 6l-4.4 4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function AboutCta() {
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
            .about-cta-button { opacity: 1; transform: none }`}
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
          src="/assets/cta-bg.png"
          alt=""
          loading="lazy"
          decoding="async"
        />

        {/* THE CRATE. alt="" and out of the tree: it is the same six tapes the
            pill below already names and links to, photographed — a screen reader
            that announced it would be reading the section's own copy back a
            second time, in a worse form.

            LAZY, LIKE THE CURTAIN BEHIND IT. Both are on the last section of the
            route, several screens below the fold on any window; THE BELT'S
            photographs take the same pair of attributes. */}
        <img
          className="about-cta-front"
          src="/assets/front-cta.webp"
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
        <p className="about-cta-kicker body-copy">{bodyCopy(KICKER)}</p>

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
        <h2 className="about-cta-title" aria-label={HEADLINE.join(" ")}>
          {HEADLINE.map((line) => (
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

        {/* THE PILL. A real anchor, and the whole pill is it: the label and the
            disc are one target the size of the thing that looks clickable,
            rather than two words with a decoration beside them.

            NOT SPLIT TO LETTERS, and that is the one place this section departs
            from the voice above it. The pill arrives as an OBJECT — it pops into
            place whole, the way WE WANTED TO BE.'s cards do — and a label whose
            letters were also flying in would be a button assembling itself in
            mid-air. One gesture per thing.

            TWO DISCS, AND THE SECOND ONE IS THE HOVER. What the drawing shows
            is one lime circle at the right-hand end. Under the pointer that one
            leaves through the right end of the pill, another arrives from beyond
            the left, and it stops THERE rather than carrying on to where the
            first one was — the label is pushed across to make room for it. What
            settles is the pill read backwards: the same four measurements in the
            opposite order, so it is exactly as wide as it was.

            IT IS ONE CIRCLE GOING ROUND in the reader's head and two elements in
            the DOM, because a single element cannot be on both sides of a
            journey it has not made yet. Which one is which is a class rather
            than an order: .about-cta-next is the arriving one, and it is out of
            the layout entirely so that the resting one still gives the pill its
            right-hand end. Both journeys are the same distance, and it is the
            stylesheet that derives it — see --cta-swap.

            BOTH ARE aria-hidden. They repeat the label's meaning and nothing
            else — a reader who has just heard UNROLL THE STORY does not also
            need "link, arrow", let alone twice. */}
        <Link className="about-cta-button" href={HREF}>
          <span className="about-cta-label">{LABEL}</span>

          {/* The one on the drawing — a flex item, so it is what gives the pill
              its width and its right-hand end. It is the one that LEAVES. */}
          <span className="about-cta-disc" aria-hidden="true">
            <Chevron />
          </span>

          {/* The one that arrives. Absolutely positioned and out of the layout
              entirely, so the pill is the same size whether it is moving or
              not. */}
          <span className="about-cta-disc about-cta-next" aria-hidden="true">
            <Chevron />
          </span>
        </Link>
      </div>
    </Stage>
  );
}
