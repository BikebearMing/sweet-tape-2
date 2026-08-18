/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { cssVars, heroOf, type Tape } from "@/data/tapes";
import { TopTitle, BottomTitle, wordmarkText } from "@/components/TapeSlider/WordMarks";
import Stage from "./Stage";

/* A PRODUCT — the opening screen of /products/<id>.
 *
 * The tape's own colour across the sheet, the way back to the family set in a
 * chip at the top, and the roll standing in the middle of its own name: THE
 * above it, RELIABLE (or FIXER, or CREATIVE) below and behind it. One drawing,
 * and the page announces one product.
 *
 * IT IS THE SLIDER'S CENTRE COLUMN, ON ITS OWN, and that is deliberate rather
 * than a shortcut. A visitor arrives here from the row on /products, having
 * just been shown this exact arrangement on the home page — the same two word
 * marks, the same chip, the same roll between them — so meeting it again with
 * the machinery taken away reads as having walked up to the thing that was on
 * the shelf. A second composition would read as a different shop.
 *
 * WHAT IS NOT HERE is everything that existed to serve a CHOICE: the orbit of
 * six rolls, the left column of chips and copy that changes with the selection,
 * the two showcase photographs, and the colour sheet that wipes between tapes.
 * There is one tape on this page and nothing to swap, so there is nothing to
 * cover a swap with either.
 *
 * THE ROLL IS THE SLIDER'S OWN 3D ONE — this tape's GLB in the same viewer
 * (TapeSlider/tape3d.ts), on the same lighting rig, at the same angle: face-on,
 * and held there. A visitor arriving from the home page has just been
 * shown this exact object and should meet the same one here rather than a
 * photograph of it. See roll.ts, which mounts it and then carries it down the
 * page into the origin section as you scroll, and the <img> in the markup, which
 * is what stands in the slot until three.js lands and what stays there if it
 * never does (see `hero` in src/data/tapes.ts).
 *
 * Server-rendered, like every other section on this site. Stage is a hair-thin
 * client wrapper that owns the ref and hands the section to reveal.ts; nothing
 * below this line is a client component.
 *
 * THE GEOMETRY IS IN global.css, in vw off the 1440 design width like the rest
 * of the site.
 */

/* The way back, and it is the page's one piece of navigation. OUR FAMILY is how
   the brand says /products — see (frontend)/products/page.tsx, which is the
   long version of why the label and the slug are different words. It reaches
   the transition as an ordinary <a href>, like every other link on the site. */
const BACK = { label: "OUR FAMILY", href: "/products" };

export default function ProductIntro({ tape }: { tape: Tape }) {
  return (
    /* THE TAPE'S PALETTE, arriving as custom properties exactly as it does on
       the slider's orbit buttons and on the row at /products — so a colour
       edited in src/data/tapes.ts turns up on all three with nothing to keep in
       step.

       --stage-bg and --word-colour are the two the shared component rules read
       by those names: the sheet's colour, and the ink the letter stencils are
       punched out of. They are pointed at this tape's --bg and --word here
       rather than being a seventh and eighth field in the data, because they
       are not separate decisions — they are those two colours, under the names
       the stylesheet already knows. */
    <Stage
      /* THE MODEL'S PATH ARRIVES AS AN ATTRIBUTE rather than a prop of roll.ts —
         the seam every 3D section on this site uses. roll.ts is plain DOM: it is
         handed the section and finds everything it needs on it. */
      model={tape.model}
      style={
        {
          ...cssVars(tape.colours),
          "--stage-bg": tape.colours.bg,
          "--word-colour": tape.colours.word,
        } as CSSProperties
      }
    >
      {/* WITHOUT JAVASCRIPT THE WORD MARKS NEVER ARRIVE. Both are parked by
          reveal.ts on mount rather than by the stylesheet — see the note there
          on why this one section parks in script — so a page with no scripting
          has nothing holding its letters down and needs no escape hatch. The
          roll is the same: its rest pose is the stylesheet's, and the bounce is
          on top of a picture that is already in place.

          Which is worth stating rather than leaving to be noticed, because the
          hero, the pinning section and the row at /products all carry a
          <noscript> block and the absence of one here looks like an omission.
          It is the opposite: there is nothing to release. */}

      <div className="pi-sheet">
        {/* The page's one h1, and the mark it names is a row of pictures with
            no text in them — so the words are announced here and the letters
            are taken out of the tree. aria-label is honoured on a heading, but
            a real text node is simpler when the copy is not also drawn on
            screen; the slider's equivalent h2 makes the same call. */}
        <h1 className="sr-only">{wordmarkText(tape.word)}</h1>

        {/* The chip. Same component as the slider's subhead and the left
            column's tags — look, perforation and palette all come from the
            shared rule — and only its placement is this stage's business.

            A LINK, where the slider's is a label. It is in the position a
            breadcrumb sits in and it is the one thing on this page a reader
            will want to press, and a page reached from a row of six products
            should say what row it came from AND lead back to it. Nothing about
            the drawing changes: a chip is a chip. */}
        <a className="subhead pi-back" href={BACK.href}>
          {BACK.label}
        </a>

        {/* THE, then the roll, then the tape's word — in paint order as well as
            in reading order. The roll stands in front of both marks: THE's feet
            go behind its top edge and the word's middle behind its bottom,
            which is what sets the roll IN the type rather than between two
            lines of it. */}
        <TopTitle />

        {/* THE ROLL, and it is the real 3D one — the slider's key visual on the
            slider's own settings, at the slider's angle. See roll.ts.

            TWO BOXES, ONE ROLL, AND THEY CANNOT BE MERGED. `.pi-roll` is where
            the page puts the roll and what carries it DOWN THE PAGE to the
            origin section as you scroll; `.pi-roll-in` is what the entrance
            bounces and what the canvas is appended into. Both moves are a
            transform on their own element because they overlap in time — a
            visitor who scrolls while the roll is still arriving would otherwise
            have one of the two silently overwrite the other.

            The <img> is the slot's occupant until three.js and the GLB land —
            hidden from first paint once scripts are running, exactly as the
            slider's key visual is and for the same reason: letting the flat
            artwork paint first only flashes a picture the 3D roll is about to
            replace. If the chunk never arrives it stays, and IS the roll. */}
        <div className="pi-roll">
          <div className="pi-roll-in">
            <img src={heroOf(tape)} alt={tape.label} draggable={false} />
          </div>
        </div>

        <BottomTitle word={tape.word} />
      </div>
    </Stage>
  );
}
