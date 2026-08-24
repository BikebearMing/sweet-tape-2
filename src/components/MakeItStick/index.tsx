/* eslint-disable @next/next/no-img-element */
import Peel from "@/components/Peel";
import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";
import Stage from "./Stage";

/* LET'S MAKE IT STICK — the key visual, and the last thing said before the
 * footer takes the page.
 *
 * Two boxes on the lime sheet, laid side by side and taped together: the
 * product photograph on the left, tilted a couple of degrees the way everything
 * on this site is put down by hand, and the line itself on the right, set in
 * lime on the same dark green the pinning section writes in. The strip of kraft
 * tape stands upright across the seam between them, which is the whole gag —
 * the section is about tape and it is the tape that is holding it together.
 *
 * Server-rendered like the slider, the pinning section and the footer. Stage is
 * a hair-thin client wrapper that owns the ref and hands the section to
 * Peel/peel.ts, reveal.ts and parallax.ts; nothing below this line is a client
 * component.
 *
 * THREE THINGS ARRIVE AS THE SECTION DOES, and they are three files because
 * they are three different moves. The strip presses itself down (Peel, scrubbed
 * by the scroll). The headline writes itself letter by letter in a scattered
 * order, which is the site's headline voice — the hero's, the footer's and the
 * pinning section's (reveal.ts). The sub-line rises a line at a time out of a
 * floor that is not drawn, which is the site's BODY voice and deliberately not
 * the headline's — components/bodyReveal.ts, shared with the footer's small
 * print. And the photograph drifts inside its own frame without the frame
 * moving a pixel (parallax.ts).
 *
 * THE GEOMETRY IS IN global.css, in vw, off the 1440 design width like the rest
 * of the site — the four figures the design specified (128.67px of inline
 * padding, 135px of block padding, a 175px radius on both boxes and a 2.966deg
 * tilt on the photograph) are named custom properties there rather than numbers
 * typed into this file.
 */

/* Section copy — the obvious CMS fields, so they are named constants rather
   than strings buried in the markup. The heading's break is set by design and
   not by wrapping, which is why it is three strings and not one. */
const HEADING = ["LET’S", "MAKE IT", "STICK!"];
const SUB = "For everything that matters.";
const SHOT = "/assets/make-it-stick.jpg";
const SHOT_ALT =
  "Six rolls of Sweet Tape held in someone’s arms — stationery, OPP, cloth, masking and double-sided tissue tape.";

/* THE STRIP. The ratio is the only number this file needs out of the artwork:
 * it is what turns one length into the box Peel has to be told about, so the
 * thickness is never typed and cannot drift from the picture.
 *
 * The same kraft roll the pinning section tapes its photographs down with —
 * one board, one roll. Its box is landscape because the ARTWORK is landscape;
 * standing it upright is a job for the stylesheet (see .stick-tape), and doing
 * it here by swapping the two figures would hand the clip frame a box that is
 * not the picture's and cut the strip in half.
 *
 * 22.222vw is 320px at the design width — long enough to bridge the gap with a
 * good bite of each box, which is what makes it read as holding them together
 * rather than as a label stuck on the join.
 */
const TAPE = {
  src: "/assets/tape top.webp",
  ratio: 428 / 173,
  /* The roll's own colour, so the turned-back end shows the stuff the strip is
     made of rather than a sheet of paper grey. See BACKS in components/Peel. */
  back: "peel-back-kraft",
} as const;
const TAPE_L = 22.222;
const TAPE_BOX = `${TAPE_L}vw ${(TAPE_L / TAPE.ratio).toFixed(3)}vw`;

export default function MakeItStick() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE TAPE NEVER GOES ON. A scrubbed peel rests at
          --peel: 0, and 0 here is `from` — the end still turned back — so a
          page where peel.ts never runs is a page with a strip curled up in the
          middle of it for good. Press it flat instead and leave it there: the
          arrangement still reads, it is just no longer being taped down in
          front of you. Same escape the hero and the pinning section carry, and
          the reduced-motion rule in global.css is the other half of it.

          NOR DOES THE TYPE ARRIVE. Both entrances are parked by global.css and
          released by the section's own scripts — the headline's letters under
          their masks, the sub-line's words under theirs — so a page where
          neither runs is a page with an empty green card on it. The
          stylesheet's hold is lifted here as well, which costs nothing when
          scripting is on: the contents are not even parsed. The hero, the
          pinning section and the footer all carry the same escape. */}
      <noscript>
        <style>{`.make-it-stick .stick-tape { --peel: 1 }
          .make-it-stick .char, .make-it-stick .body-rise { transform: none }`}</style>
      </noscript>

      <div className="stick-row">
        {/* THE FRAME AND THE PICTURE ARE TWO BOXES, and they are two so that one
            can hold still while the other drifts (parallax.ts). The rounded
            box, the tilt and the cast shadow all belong to the frame — it is
            what is taped to the card beside it, and it does not move. The
            artwork inside is cut taller than the hole and slides in that slack.

            The picture keeps the alt: it is not decorative, it is the product,
            and it is the only photograph of it in the section. The wrapper is a
            plain div and carries nothing to announce. */}
        <div className="stick-shot">
          <img className="stick-shot-img" src={SHOT} alt={SHOT_ALT} />
        </div>

        <div className="stick-card">
          {/* Split to letters for the reveal, which is the hero's and the
              footer's — each one waits below its own mask and slides up in a
              shuffled order (reveal.ts).

              aria-label rather than a second hidden copy of the words: it is
              honoured on a heading, so the line is announced whole and the
              rows of letter boxes are never read out a fragment at a time. The
              footer's headline is marked up the same way. */}
          <h2 className="stick-headline" aria-label={HEADING.join(" ")}>
            {HEADING.map((line) => (
              <span className="line" key={line} aria-hidden="true">
                {letters(line)}
              </span>
            ))}
          </h2>

          {/* Body copy, so it takes the BODY entrance and not the headline's —
              split to words and revealed a measured line at a time. aria-label
              is not honoured on a paragraph, so the readable copy is a real
              (hidden) text node and the split version is taken out of the tree;
              the hero's corner mark makes the same call for the same reason. */}
          <p className="stick-sub body-copy">
            <span className="sr-only">{SUB}</span>
            <span aria-hidden="true">{bodyCopy(SUB)}</span>
          </p>
        </div>

        {/* THE PEEL, RUN BACKWARDS — the strip is found turned back on itself
            and the SCROLL is what presses it down, end-first, as the section
            comes up the screen. `from` is the lifted end and `to` is flat,
            which is the whole of it: the geometry in global.css is
            direction-blind, so a peel written with its far value in `from` is a
            peel run backwards and there is no second code path for it.

            Scrubbed rather than looped, so it lifts back off on the way up —
            the scroll IS the hand doing it. The hero's tape-on-note and
            tape-on-lemon are the same object making the same move.

            A quarter turn on the direction swings the fold ACROSS the strip so
            it lands end-first rather than creasing lengthwise into a stripe,
            and the SIGN of it is which end that is: +90 lays the strip on from
            the bottom up, -90 from the top down. It reads that way round
            because the strip is stood upright by a transform in global.css and
            the two turns compose — the argument is with the rule that does the
            turning, see .stick-tape.

            `in` brings the scrub forward. The default starts the peel when the
            strip's top edge is 92% down the window, which on a section this
            deep in the page meant it sat folded for a beat after arriving; past
            1 the travel has already begun while the strip is still below the
            fold, so it comes up the screen mid-press rather than waiting to be
            noticed. `out` is left alone — it is where the move FINISHES, and
            starting earlier against the same finish is what lengthens it.

            `box` is what the turned clip frame is bled by, and global.css sizes
            the wrapper off the very properties this prop sets — so there is one
            statement of the strip's size and the stylesheet reads it rather
            than keeping a copy. */}
        <Peel
          className="stick-tape"
          src={TAPE.src}
          back={TAPE.back}
          drive="scroll"
          direction="90deg"
          box={TAPE_BOX}
          from={0.55}
          to={0}
          in={1.08}
        />
      </div>
    </Stage>
  );
}
