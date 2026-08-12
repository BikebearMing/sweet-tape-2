/* eslint-disable @next/next/no-img-element */
import Peel from "@/components/Peel";
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
 * Peel/peel.ts; nothing below this line is a client component.
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
  src: "/assets/tape top.png",
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
          the reduced-motion rule in global.css is the other half of it. */}
      <noscript>
        <style>{`.make-it-stick .stick-tape { --peel: 1 }`}</style>
      </noscript>

      <div className="stick-row">
        {/* Not decorative and so not aria-hidden: this is the product, and it
            is the only picture of it in the section. */}
        <img className="stick-shot" src={SHOT} alt={SHOT_ALT} />

        <div className="stick-card">
          {/* aria-label rather than a second hidden copy of the words — it is
              honoured on a heading, so the line is announced whole and the
              three block-level spans are never read out a fragment at a time.
              The footer's headline is marked up the same way. */}
          <h2 className="stick-headline" aria-label={HEADING.join(" ")}>
            {HEADING.map((line) => (
              <span className="line" key={line} aria-hidden="true">
                {line}
              </span>
            ))}
          </h2>

          <p className="stick-sub">{SUB}</p>
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
