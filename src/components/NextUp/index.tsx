/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { letters } from "@/components/letters";
import { nextTape, type Tape } from "@/data/tapes";
import Stage from "./Stage";

/* NEXT UP — the last thing on a product page, and the way out of it.
 *
 * A yellow panel across the foot of the page with the name of the next tape's
 * grade on it and its printed label under that. It is the page's ending and its
 * only forward door: everything above is about ONE tape, and this is where the
 * family carries on.
 *
 * IT IS A LINK, AND THE WHOLE PANEL IS THE LINK. The stencil this was built to
 * is markup for the drawing rather than for the behaviour, so the anchor is a
 * decision this file makes: a full-width panel headed NEXT UP with a picture of
 * a product on it is a thing a reader will click, and one that is not clickable
 * is a dead end dressed as a door. Wrapping the whole panel rather than putting
 * a link on the words means the target is the size of the panel — which is what
 * it looks like — instead of two words in the middle of it.
 *
 * WHICH TAPE IS NEXT IS NOT DECIDED HERE. src/data/tapes.ts owns the order and
 * the wrap; see nextTape, which is why this section exists on all six pages
 * including the last.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref and hands the section to reveal.ts.
 */

/* Section-level copy — the same words on every product page, so a named
   constant rather than a string buried in the markup. The same call the slider,
   the origin section and THE SIBLINGS all make. */
const KICKER = "MEET THE NEXT FAMILY";
const HEADING = "NEXT UP";

export default function NextUp({ tape }: { tape: Tape }) {
  const next = nextTape(tape);

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT NOTHING IN HERE ARRIVES. The letters are parked
          under their masks by global.css and the chip is held at nothing by the
          same attribute, both released by the section's own script — so a page where reveal.ts never runs is an empty yellow band
          with a live link in it. The stylesheet's hold is lifted here instead,
          which costs nothing when scripting is on: the contents are not even
          parsed. Every other section on this site carries the same escape. */}
      <noscript>
        <style>{`.next-up .char { transform: none }
          .next-up .subhead { opacity: 1; visibility: visible }`}</style>
      </noscript>

      {/* THE WHOLE PANEL. aria-label rather than letting the anchor be read out
          of its parts: what is inside it is a chip, a row of letter boxes and a
          picture, and a screen reader announcing "MEET THE NEXT FAMILY N E X T
          U P Masking tape" is three fragments where one sentence will do. */}
      <Link
        className="wrapper"
        href={`/products/${next.id}`}
        aria-label={`Next up: ${next.label}`}
      >
        <div className="top">
          <h5 className="subhead">{KICKER}</h5>

          {/* SPLIT TO LETTERS FOR THE REVEAL, which is the site's — each waits
              below its own mask and slides up in a shuffled order (reveal.ts).
              aria-hidden throughout: the anchor's own label above is what is
              announced, so the boxes are decoration by the time they get here. */}
          <h2 className="h1-v2" aria-hidden="true">
            <span className="line">{letters(HEADING)}</span>
          </h2>
        </div>

        {/* The next tape's printed label, at the artwork's own size. Its name is
            in the anchor's label rather than in alt, for the reason above: an
            alt here would be the third thing read out inside one link. */}
        <img className="bottom-roll" src={next.card} alt="" />
      </Link>
    </Stage>
  );
}
