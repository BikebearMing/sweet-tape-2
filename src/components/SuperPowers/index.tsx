import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";
import { powersVars } from "@/data/tapes";
import type { Tape } from "@/data/tapes";
import Mark from "./Mark";
import Stage from "./Stage";

/* SUPER POWERS — the product page's fifth section.
 *
 * Between THE SIBLINGS and THE RUN, and it opens the lime sheet those two
 * sections' dark green ends on. A window three cards tall in the middle of a
 * held screen, with the section's name split around it: SUPER on the left,
 * POWERS on the right, and the stack in the gap between the two words.
 *
 * WHAT IT DOES. The page holds still and the tape's three claims are scrolled up
 * through that window a card at a time. The card in the middle is open and the
 * two either side are settled back, which is the one place this departs from the
 * reference effect it is built on, where the slides either side are crushed to
 * slivers. Slivers need five slots to work; at three, two thirds of what is on
 * screen would be edges.
 *
 * THE RUN IS TALLER THAN THE SCREEN AND IS CUT BY IT at both ends, so what the
 * reader sees is cards passing through the section rather than three cards
 * arranged in it. See .powers-stack in global.css.
 *
 * A card that has had its turn is not scrolled past — it is SHUT TO NO HEIGHT AT
 * ALL, and the ones below climb into the room it leaves. Nothing in the stack is
 * ever translated, which is why there is no offset anywhere in this section to
 * keep in step. See .powers-stack in global.css.
 *
 * ONLY THE CARD IN THE MIDDLE HAS ANYTHING ON IT. Every other card in the run is
 * a blank green shape. Three things arrive when a card reaches the middle, on
 * three timelines of their own, together:
 *
 *   THE CLAIM, in the site's headline voice — every letter under its own mask,
 *   sliding up in a shuffled order. The hero's, the footer's and THE SIBLINGS'.
 *
 *   THE MARK, dropping onto the card and bouncing once. Once, and then it stands
 *   there: see .powers-mark-jump in global.css, which argues that at length. It
 *   is held a fraction behind the other two because it is the only one of the
 *   three that lands ON the card rather than being part of it.
 *
 *   THE SENTENCE, a line at a time out of a floor that is not drawn. The news
 *   page's body voice exactly (components/bodyReveal.ts) — the same call that
 *   file makes about why running copy does not get the letter treatment.
 *
 * All three go back out when the card leaves the middle, which is what makes the
 * middle of the window the one place anything can be read. SuperPowers/reveal.ts
 * records the arrangement this replaced — every card written all the time — and
 * why it turned out to be the weaker one.
 *
 * THE MARK IS THE CLAIM'S NOW, not the section's. Every card wore the same box
 * until there was more than one drawn; each claim can carry its own, uploaded
 * rather than checked in, and a claim that carries none still gets that box. It
 * is a file rather than a path because it is INLINED — see ./Mark.tsx, and
 * ./markSvg.ts under it, which is where all of that is argued.
 *
 * THE COPY IS THE TAPE'S AND NOT THIS SECTION'S. THE SIBLINGS above it is three
 * GRADES of one tape and its three names live in that component, because they
 * are a fact about the RANGE; what a tape is good at is a fact about the TAPE,
 * so it comes in on the tape and this file has no product copy in it at all. See
 * `powers` in src/data/tapes.ts, which makes the whole of that argument.
 *
 * ONLY THE NAME IS HERE, for the reason every other section keeps its own: it is
 * the section's, not the tape's, and it is the same two words on all six routes.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref and hands the section to reveal.ts; nothing below
 * this line is a client component.
 */

/* THE NAME, IN TWO HALVES, because that is what it is on the page — one word
   either side of the stack rather than a line with something in the middle of
   it. Two constants and not one string split on its space: the split IS the
   drawing, and a .split(" ") at render time would be this file inferring a
   layout decision from a space character. */
const NAME_LEFT = "SUPER";
const NAME_RIGHT = "POWERS";

/* THREE CARDS AND NO MORE — the tape's three claims, once each.
 *
 * THEY WERE RUN THROUGH TWICE FOR A WHILE and it is worth saying why that was
 * wrong, because the argument for it is not stupid. A window three slots deep
 * over a run of exactly three means the first card opens with a blank pad above
 * it and the last with one below, so the arrangement the section is built on — a
 * card being read with a card either side of it — only ever happens on the
 * middle one. Repeating the claims fills those slots with real cards.
 *
 * It fills them by saying the same thing twice. A reader who has just been told
 * what the tape does is told it again, and a page that repeats itself to fill a
 * gap has a gap it has not solved. The pads are the honest answer: the run has
 * an end, and it is allowed to look like it has an end.
 *
 * The count is not a constant here any more because there is nothing to count —
 * it is however many claims the tape has, which is three by the type in
 * src/data/tapes.ts. Everything downstream (the beats, the length of the pin,
 * which slots can be opened) is read off the markup by reveal.ts, so a tape that
 * ever carried four would need nothing changed anywhere. */

export default function SuperPowers({ tape }: { tape: Tape }) {
  return (
    <Stage style={powersVars(tape.sections)}>
      {/* WITHOUT JAVASCRIPT THE SECTION IS STILL A SECTION, and that is worth
          the four lines. The letters are parked under their masks by global.css
          and the words of every sentence under theirs, both released by this
          section's own script — so a page where reveal.ts never runs would be a
          lime band with three empty green cards on it.

          The stylesheet's hold is lifted here instead, which costs nothing when
          scripting is on: the contents of a noscript element are not even
          parsed. Every other section on this site carries the same escape.

          THE RUN IS THE FOURTH LINE AND IT IS THE ONE THAT MATTERS MOST. Every
          slot rests at --pow-shown 0, which is no height at all — the stylesheet
          holds the whole run shut and reveal.ts opens the three it wants, the
          same hand-off the letters make. Opened here, the run stands at its shut
          height and the window clips it to the three that fit, which is the
          stack's own resting arrangement: no card is the active one, and without
          a script none of them can be.

          THE FILL IS THE FOURTH AND IT IS A COLOUR, NOT A MOTION. A card is
          lime until the section decides it is the one being read, at which point
          it turns dark green — so with no script every card would be a lime
          shape with lime writing on it, which is a card with nothing on it at
          all. Filled outright here, exactly as the reduced-motion path in
          SuperPowers/reveal.ts fills the open one.

          THE MARK IS HELD OFF A DIFFERENT WAY and needs its own line. The type
          is held down by a transform; the mark is held off by OPACITY, because
          the bounce is a CSS animation that is only declared once reveal.ts
          sets an attribute — and no script means no attribute, which means a
          drawing that is never asked for. Shown outright here, on the card and
          on the plate under it, exactly as the reduced-motion rules in
          global.css show them.

          It lands where it would have landed: the base rule parks the mark at
          the drop's own last pose, so with nothing running it is a box sitting
          on a card rather than one caught halfway down. */}
      <noscript>
        <style>{`.super-powers .char { transform: none }
          .super-powers .body-rise { transform: none }
          .super-powers .powers-slot { --pow-shown: 1 }
          .super-powers .powers-card { --pow-fill: 1 }
          .super-powers .powers-mark-jump,
          .super-powers .powers-mark-plate { opacity: 1 }`}</style>
      </noscript>

      {/* THE NAME'S FIRST HALF. A heading rather than two decorative words: the
          section is called SUPER POWERS and a document outline should say so —
          which is why the h2 is THIS one and the word on the right is hidden
          from the outline entirely. One heading, read whole, from the
          aria-label; the row of letter boxes is never announced a fragment at a
          time. */}
      <h2 className="powers-name" aria-label={`${NAME_LEFT} ${NAME_RIGHT}`}>
        <span className="line" aria-hidden="true">
          {letters(NAME_LEFT)}
        </span>
      </h2>

      {/* THE STACK — A WINDOW THREE SLOTS TALL WITH A LONGER RUN INSIDE IT.
          Everything outside those three is shut to no height at all rather than
          scrolled past, which is the reference effect's mechanic and the reason
          nothing here is translated: the run climbs because the slots above it
          close, not because anything moves.

          NOT A LIST, and it was one for about an hour. The two pads are slots
          with nothing on them, and a list would count them as items with no
          content — two thirds of the run's announced length would be empty. What
          is left is three headings and three sentences, which is what the
          section actually says. */}
      <div className="powers-stack">
        {/* THE PAD AT THE TOP. It takes a slot's worth of room and draws
            nothing, and it is what makes a run of three work in a window of
            three: the first card needs something above it to be opened against,
            and with only three claims there is nothing above it. So it gets an
            empty slot, and the start of the run looks like the start of a run.
            There is one at the foot for the same reason, and reveal.ts counts
            them rather than assuming them. */}
        <div className="powers-slot" aria-hidden="true" />

        {tape.powers.map((power) => (
          /* ONE CARD, and three custom properties are all that ever move on it:
             --pow-shown, whether the slot is in the window at all, --pow-open,
             whether it is the one being read, and --pow-fill, how far it has
             turned from lime to dark green. The stylesheet derives the slot's
             height and the size of everything printed on it from the first two
             and its colour from the third. The first two are a function of
             scroll position and the third is a tween; nothing else in the stack
             moves at all. */
          <div className="powers-slot powers-card" key={power.id}>
            {/* EVERYTHING PRINTED ON THE CARD, IN A BOX OF ITS OWN, and the box
                is the size of an OPEN card whatever the card is currently doing
                — see .powers-card-face in global.css. That is what lets the
                stack breathe without a single word re-wrapping: the layout is
                settled once, at one size, and --pow-open scales the finished
                thing. A face laid out at the card's live height would re-flow on
                every frame of every tween, and the sentence would re-break under
                the reader mid-move. */}
            <div className="powers-card-face">
              {/* THE CLAIM, on the two lines the design breaks it on — see
                  `title` in src/data/tapes.ts. aria-label so it is announced as
                  one phrase rather than as two, and the lines themselves hidden:
                  they are the same words again, split for the reveal. */}
              <h3
                className="powers-card-title"
                aria-label={power.title.join(" ")}
              >
                {power.title.map((line, i) => (
                  <span className="line" aria-hidden="true" key={i}>
                    {letters(line)}
                  </span>
                ))}
              </h3>

              <Mark file={power.mark} />

              {/* The sentence, split to words for the line reveal. The class is
                  the opt-in — bodyReveal.ts finds a block by .body-copy — and it
                  is the same pair the news page's running copy carries. */}
              <p className="powers-card-copy body-copy">
                {bodyCopy(power.copy)}
              </p>
            </div>
          </div>
        ))}

        {/* And the pad at the foot — the last card's neighbour below. */}
        <div className="powers-slot" aria-hidden="true" />
      </div>

      {/* The name's second half. aria-hidden and NOT a second heading: the words
          on either side of the stack are one name and the h2 above has already
          said both of them. A heading here would put SUPER and POWERS into the
          document outline as two sections, neither of which exists. */}
      <p className="powers-name" aria-hidden="true">
        <span className="line">{letters(NAME_RIGHT)}</span>
      </p>
    </Stage>
  );
}
