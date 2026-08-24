/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";
import { cssVars, tapes } from "@/data/tapes";
import Stage from "./Stage";

/* PICK YOUR PLAYER — the product page's opening screen, and the whole of it.
 *
 * THREE NAMES FOR ONE PAGE, and they are not muddle. The slug is /products,
 * which is what this page is called anywhere outside the site. The label is OUR
 * FAMILY, which is how the brand says it and what both links to it read — the
 * family IS the products, and there is no separate products page. PICK YOUR
 * PLAYER is what it says once you are standing on it. See
 * (frontend)/products/page.tsx for the reasoning on the first two.
 *
 * The six rolls laid out in a row across a lime sheet, each lapping the one
 * before it, standing on a green rise that comes up behind them. The headline
 * over the top, a dashed guide ruled straight through the row, and two lines of
 * small print at the foot — the reason for the page on the left, the promise on
 * the right. The footer takes it from there.
 *
 * THE ROW IS THE PAGE. There is no copy per product and no detail panel: the
 * artwork already says what each roll is and what it is for — the name is
 * printed across it and the use is on the chip around its foot — so the row is
 * the whole product list, read at a glance, and picking one up is the only thing
 * to do here. That is why it is the row and not a grid of cards.
 *
 * Server-rendered like the home page's sections. Stage is a hair-thin client
 * wrapper that owns the ref and hands the section to reveal.ts, fan.ts and the
 * shared body reveal; nothing below this line is a client component.
 *
 * THREE THINGS ARRIVE, and the first two are timed to land together rather than
 * in a queue. The headline writes itself letter by letter in a scattered order,
 * which is the site's headline voice — the hero's, the footer's and the closing
 * key visual's (reveal.ts). The rolls drop onto the line, left to right, and
 * bounce there like six things put down too hard; from then on they can be
 * picked up one at a time (fan.ts). The small print rises a line at a time out
 * of a floor that is not drawn, which is the site's BODY voice and deliberately
 * not the headline's (components/bodyReveal.ts, shared with the footer's legal
 * line) — and it is the one of the three that is NOT on the preloader's cue: it
 * is below the row, and it arrives when it is scrolled to.
 *
 * THE GEOMETRY IS IN global.css, in vw off the 1440 design width like the rest
 * of the site.
 */

/* THE SIX, IN THE ORDER THE DESIGN LAYS THEM OUT — which is not the order they
 * are written in, because src/data/tapes.ts is the slider's running order and
 * this is a shelf. Ids rather than a second copy of the products: a tape is one
 * object, and this file only gets to say where in the line it stands.
 *
 * The chips under each name — NORMAL, LOW NOISE, CELLO • EASY-TEAR — are printed
 * into the artwork rather than set in markup beside it, which is why there is no
 * copy here at all. They are part of the label, not a caption on it.
 */
const ORDER = [
  "cloth",
  "masking",
  "opp",
  "opp-quiet",
  "stationery",
  "double",
] as const;

/* Resolved at module scope, so a typo or a tape renamed in the data file is a
   build that fails with the id in the message rather than a page with a hole in
   the row. */
const ROLLS = ORDER.map((id) => {
  const tape = tapes.find((t) => t.id === id);
  if (!tape)
    throw new Error(`PickYourPlayer: no tape "${id}" in src/data/tapes`);
  return tape;
});

/* Section copy — the obvious CMS fields, so they are named constants rather than
   strings buried in the markup. The heading's break is set by design and not by
   wrapping, which is why it is two strings and not one. */
const HEADING = ["PICK YOUR", "PLAYER"];
const NOTE_LEFT = "Not all tape is created for the same task.";
const NOTE_RIGHT =
  "We’ve made it easy to choose the right tape — so you don’t have to guess.";

export default function PickYourPlayer() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE TYPE NEVER ARRIVES. Both entrances are parked by
          global.css and released by the section's own scripts — the headline's
          letters under their masks, the small print's words under theirs — so a
          page where neither runs is a lime sheet with a row of rolls and nothing
          written on it. The stylesheet's hold is lifted here instead, which
          costs nothing when scripting is on: the contents are not even parsed.
          The hero, the closing key visual and the footer all carry the same
          escape.

          THE ROLLS NEED NO SUCH ESCAPE, and that is worth saying rather than
          leaving to be noticed: their rest pose is the stylesheet's — square,
          evenly lapped, in order — and everything fan.ts does to them is on top
          of a row that is already the row. That holds for the entrance as much
          as for the picking: the rolls are parked above the line and at no size
          by JavaScript, never by a rule here, so no script means no drop, no
          scatter and no picking, and the page still reads exactly as designed
          rather than showing an empty sheet where the row should be. */}
      <noscript>
        <style>{`.pick-player .char, .pick-player .body-rise { transform: none }`}</style>
      </noscript>

      {/* THE GROUND, IN TWO LAYERS — the page's colour, and the page's next
          colour parked above it waiting to be slid down. Hovering a roll floods
          the sheet with that tape's stage colour and this is what does it; see
          recolour.ts, which is a port of the tape slider's own wipe.

          It is two layers rather than a transition on one because a crossfade
          between two saturated colours goes through a muddy middle that belongs
          to neither. Nothing here is ever blended: there is a moving line, the
          new colour above it and the old below.

          Both are empty boxes and neither is in the accessibility tree. With no
          script they are the section's own lime, twice over, and the page is
          simply the colour it always was. */}
      <div className="pick-wash" aria-hidden="true">
        <div className="pick-wash-layer pick-wash-base" />
        <div className="pick-wash-layer pick-wash-next" />
      </div>

      {/* The page's one h1. Split to letters for the reveal, which is the hero's
          and the footer's — each one waits below its own mask and slides up in a
          shuffled order (reveal.ts).

          aria-label rather than a second hidden copy of the words: it is
          honoured on a heading, so the line is announced whole and the rows of
          letter boxes are never read out a fragment at a time. The footer's
          headline and the closing key visual's are marked up the same way. */}
      <h1 className="pick-title" aria-label={HEADING.join(" ")}>
        {HEADING.map((line) => (
          <span className="line" key={line} aria-hidden="true">
            {letters(line)}
          </span>
        ))}
      </h1>

      {/* THE ROW AND THE GROUND IT STANDS ON, in one positioned box — so the
          rise and the guide are placed off the ROLLS rather than off the section,
          and retuning the headline above cannot slide the ground out from under
          them. Both are decoration and neither is in the accessibility tree. */}
      <div className="pick-stage">
        {/* The rise carries its own second sheet, for the reason recolour.ts
            gives at length: it sits ABOVE the ground's sheet in the paint order,
            so a wipe passing behind would leave it standing in the old colour.
            Its copy is offset by exactly how far down the page the rise starts,
            which is what makes the two arcs read as one line crossing the
            sheet rather than as two curves sweeping past each other. */}
        <div className="pick-rise" aria-hidden="true">
          <div className="pick-rise-next" />
        </div>
        <div className="pick-guide" aria-hidden="true" />

        {/* A list, because that is what it is: six products, in a set order,
            read across. THE ROUTES HAVE LANDED — /products/<id>, one page per
            tape (see (frontend)/products/[id]/page.tsx) — so each roll is now
            the link this note used to promise, and the <a> is inside the <li>
            and around the tilt exactly as it said.

            AROUND THE TILT AND NOT AROUND THE <li>: the <li> is where fan.ts
            writes a z-index to lift the picked roll clear, and the tilt box
            inside it is what carries the transforms. An anchor wrapped outside
            would be a third box between those two with nothing to do; wrapped
            inside, it is the tilt box itself and costs the layout nothing.

            The name is on the anchor and the image's alt is empty — a picture
            with its own alt inside a labelled link has the same thing read out
            twice. The masthead's badge makes the same call.

            :focus-visible is the twin this note also asked for, and it is a
            RING rather than the lift the pointer gets — see the rule in
            global.css, which says why: fan.ts owns this element's transform and
            rewrites it on every pointer move, so a lift declared in CSS would
            not survive the first twitch of the mouse. */}
        <ul className="pick-fan">
          {ROLLS.map((tape, i) => (
            /* --i is the roll's place in the line, and the stylesheet stacks the
               row off it: each roll laps the one before it, as the design draws
               it. fan.ts lifts the picked one clear by writing a z-index on this
               element — which is why the transforms go on the box INSIDE it and
               never here. A transformed element is its own stacking context, and
               the two would fight. */
            <li
              className="pick-roll"
              key={tape.id}
              /* --i is the place in the line. The rest is the TAPE'S PALETTE,
                 arriving as custom properties exactly as it does on the
                 slider's orbit buttons — recolour.ts reads them back off this
                 element with getComputedStyle at the moment the pointer
                 arrives, so a colour edited in src/data/tapes.ts turns up on
                 both pages with nothing to keep in step. */
              style={{ "--i": i, ...cssVars(tape.colours) } as CSSProperties}
            >
              {/* Two boxes, for the reason the reference effect has two: the
                  tilt is the roll being put down and picked up, and the face is
                  the artwork sliding inside it as its neighbour is lifted. One
                  element cannot carry both — they are both transforms. */}
              <a
                className="pick-roll-tilt"
                href={`/products/${tape.id}`}
                aria-label={tape.label}
              >
                <img
                  className="pick-roll-face"
                  src={tape.card}
                  alt=""
                  draggable={false}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* The two lines under the row, set to the outer edges — the sheet's own
          margins are the measure. Body copy, so both take the BODY entrance and
          not the headline's: split to words and revealed a measured line at a
          time.

          aria-label is not honoured on a paragraph, so the readable copy is a
          real (hidden) text node and the split version is taken out of the tree;
          the footer's legal line and the closing key visual's sub-line make the
          same call for the same reason. */}
      <div className="pick-notes">
        <p className="pick-note body-copy">
          <span className="sr-only">{NOTE_LEFT}</span>
          <span aria-hidden="true">{bodyCopy(NOTE_LEFT)}</span>
        </p>
        <p className="pick-note pick-note--end body-copy">
          <span className="sr-only">{NOTE_RIGHT}</span>
          <span aria-hidden="true">{bodyCopy(NOTE_RIGHT)}</span>
        </p>
      </div>
    </Stage>
  );
}
