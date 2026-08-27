/* eslint-disable @next/next/no-img-element */
import Peel from "@/components/Peel";

/* WHAT IS LYING ON THE SHEET — the strips of tape holding it down, the two
 * product photographs pinned to it, and the slots the pen marks go in.
 *
 * THE SECTION'S OWN NOTE SAID THESE WERE MISSING AND THIS IS THEM. See the head
 * of ./index.tsx: the statement is written on a piece of paper that was thrown
 * away and is being read anyway, and a sheet with nothing but type on it is a
 * page, not a sheet. The tape at the corners is what makes it a thing somebody
 * put up.
 *
 * THEY ARE NOT PART OF THE STATEMENT AND THEY DO NOT SHARE ITS MACHINERY. The
 * copy is letters under masks; these are objects that arrive. Two different
 * moves, and the only thing they have in common is when they happen — see
 * REIMAGINE.PROPS in ./unfold.ts, which is where "after the paper has opened"
 * is written down.
 *
 * EVERY MEASUREMENT IS IN THE STYLESHEET AND NOT HERE, which is the same split
 * the hero makes with #tape-on-note: this file says WHAT the props are and what
 * order they arrive in, global.css says where they sit and how big they are.
 * One class per prop, and each of those rules is four numbers — see the props
 * block in global.css. The positions there are read off the design and are
 * MEANT to be turned; nothing in this file moves when they are.
 *
 * WHICH IS ALSO WHY THE PEELS' `box` IS A VAR AND NOT A FIGURE. Peel needs the
 * artwork's box in CSS units to bleed its turned clip frame, and a literal one
 * typed here is a second copy of a number no media query can reach — the phone
 * re-sizes these and the fold would go on being bled for the desktop's. The
 * stylesheet declares --pw and --ph; both the rule's own width and this read
 * them. The hero's strips carry the long version of the argument.
 */

/* THE TWO ROLLS THESE ARE TORN OFF, and there are only two.
 *
 * KRAFT is the brown packing tape — the same file and the same underside as the
 * strip in the third line of the statement, which is not a saving so much as
 * the point: the tape holding the sheet down and the tape laid across the
 * sentence are one roll.
 *
 * CLEAR is the OPP film, and it is the one prop on this sheet that needs
 * something said about how it is painted. Its artwork is drawn with
 * mix-blend-mode: screen INSIDE the file — it is a set of highlights meant to be
 * ADDED to whatever it is lying on, not a picture of a strip — so painted
 * normally it composites against nothing and arrives as a flat mid-grey slab.
 * The stylesheet screens it at page level (see .reimagine-prop-clear), which is
 * what the artwork was drawn expecting. TapeSlider/strips.ts hit exactly this
 * and its `blend` note is the long version.
 *
 * AND IT IS WHY THE CLEAR STRIPS ARE AT THE EDGES. Screen against the off-white
 * paper is very nearly nothing; against the lime and the dark green either side
 * of --rei-split it is a strip of tape catching the light, which is what the
 * design has them doing. If one of these moves onto the middle of the sheet it
 * will disappear, and the fix is `blend: normal`, not a bigger strip. */
type Roll = { src: string; back: "peel-back-kraft" | "peel-back-clear"; cls: string };

const KRAFT: Roll = {
  src: "/assets/tape top.webp",
  back: "peel-back-kraft",
  cls: "reimagine-prop-kraft",
};

const CLEAR: Roll = {
  src: "/assets/stationery-silent-opp-tape.svg",
  back: "peel-back-clear",
  /* THE CLASS IS WHERE THE SCREEN BLEND IS HUNG, and it is on the ROLL rather
     than on each strip's own rule for the reason Peel's `back` prop is: how a
     material is painted is a fact about the artwork, not about the place it is
     used. Three strips, one file, one statement about it. */
  cls: "reimagine-prop-clear",
};

/* THE ARTWORK'S BOX, READ OFF THE STYLESHEET. Every prop rule declares --pw and
   --ph as bare unit counts and the base rule multiplies them by --prop-u; this
   does the same multiplication so Peel is told the box in the same CSS units it
   is being drawn at.

   WRITTEN WITHOUT SPACES INSIDE EACH calc(), AND THAT IS NOT A STYLE CHOICE.
   Peel splits this prop on whitespace to get its two lengths, so a calc() with
   spaces in it arrives as four fragments and neither dimension survives. CSS
   demands the spaces only around + and -; * needs none. The statement's own
   strip carries the same warning in ./index.tsx. */
const BOX = "calc(var(--pw)*var(--prop-u)) calc(var(--ph)*var(--prop-u))";

/* WHICH END LIFTS — the right one, on every strip here.
 *
 * 90deg is a quarter turn, which swings the fold ACROSS the strip so it comes
 * away end-first rather than dropping along its whole length at once. It reads
 * backwards: the edge named is the edge the fold hinges FROM, so what is left
 * standing at --peel 1 is the other end.
 *
 * THE LEAN IS NOT IN HERE and must not be. --peel-dir turns the CLIP FRAME and
 * .peel-turn turns the artwork back upright inside it, so a direction is not a
 * tilt — a strip given 106deg here does not lie at 106deg, it peels from an edge
 * 106deg round. The visible lean is `transform: rotate(--pr)` on the prop's own
 * rule, applied after `rotate: var(--peel-dir)`, so the two compose and the fold
 * still comes off the strip's own right end however far it is turned. */
const DIRECTION = "90deg";

/* ONE STRIP. The class is the whole of what makes it this strip rather than
   another: it carries the position, the size and the lean, and it is the only
   thing that changes between the six of them. */
function Strip({ roll, className }: { roll: Roll; className: string }) {
  return (
    <Peel
      className={`reimagine-prop reimagine-prop-tape ${roll.cls} ${className}`}
      src={roll.src}
      back={roll.back}
      /* MANUAL, LIKE THE STATEMENT'S OWN STRIP. Nothing on this section peels on
         a loop or on the scroll — ./unfold.ts owns the clock, and these are on
         it. */
      drive="manual"
      /* 0 IS FLAT AND IT IS THE REST POSE, which is what paints before any
         script runs and if none ever does: a page with no JS has the sheet taped
         down rather than a sheet with the tape missing. The timeline starts at
         the far end and comes back — see REIMAGINE.PROPS.TAPE.FROM. */
      from={0}
      to={1}
      direction={DIRECTION}
      box={BOX}
    />
  );
}

/* THE STRIPS THAT HOLD THE SHEET DOWN, IN THE ORDER THEY ARRIVE.
 *
 * DOCUMENT ORDER IS ARRIVAL ORDER — ./unfold.ts takes the props off the markup
 * and staggers them down the list, exactly as it takes the flipbook's six frames
 * off the markup and plays them down theirs. So the sequence is stated once,
 * here, and there is no second copy of it in the script.
 *
 * ROUGHLY READING ORDER, which is not the same as design order and is the one
 * that reads: the two brown strips at the top left first, then across the top,
 * then down the sheet, then the brown strip at the foot. Props that arrive
 * top-left-to-bottom-right look like a hand working across the page; props that
 * arrive in the order somebody happened to draw them look like a list. */
const STRIPS: Array<{ key: string; roll: Roll }> = [
  { key: "rei-kraft-a", roll: KRAFT },
  { key: "rei-kraft-b", roll: KRAFT },
  { key: "rei-clear-a", roll: CLEAR },
  { key: "rei-clear-b", roll: CLEAR },
  { key: "rei-clear-c", roll: CLEAR },
  { key: "rei-kraft-c", roll: KRAFT },
];

/* THE TWO PRODUCT PHOTOGRAPHS, EACH WITH THE STRIP THAT PINS IT.
 *
 * THE STRIP IS INSIDE THE PHOTOGRAPH'S BOX AND THAT IS THE WHOLE REASON THIS IS
 * NOT SIX STRIPS AND TWO IMAGES IN ONE FLAT LIST. A photograph that lands with a
 * bounce and a piece of tape that stays where it was put is a photograph that has
 * come loose from its tape for a fifth of a second. Nested, the tape is carried
 * by whatever the picture does — it is stuck to it, which is what the drawing
 * says.
 *
 * THE FILES ARE THE SLIDER'S OWN SHOTS. /assets/slider/double/shot-1 is the
 * checkerboard the design shows; /assets/slider/masking/shot-1 is the closest
 * thing in the tree to the watercolour it wants, and it is the roll being used
 * on somebody's artwork, which is the same sentence in a different photograph.
 * They are 204 x 210, which is small for the box they are drawn in — the design's
 * are about 230 across at 1440 — so they are placeholders in resolution and not
 * in content. Swap the two `src`s when the real crops land and nothing else here
 * moves.
 *
 * ALT TEXT AND NOT aria-hidden. The strips around them are decoration and Peel
 * gives its artwork an empty alt for that reason; these two are photographs of
 * the product being used, which is the only thing on this sheet besides the
 * statement that a reader who cannot see it is missing. */
const SHOTS = [
  {
    key: "rei-shot-a",
    src: "/assets/slider/masking/shot-1.webp",
    alt: "A roll of Sweet Tape masking tape held against a wall of artwork",
  },
  {
    key: "rei-shot-b",
    src: "/assets/slider/double/shot-1.webp",
    alt: "A roll of Sweet Tape double-sided tissue tape on a checkerboard cutout",
  },
];

/* THE PEN MARKS — the heart and the squiggle drawn on the sheet, and they are
 * not here yet.
 *
 * AN EMPTY LIST AND NOT A COMMENTED-OUT BLOCK, deliberately. The markup below
 * maps over this, the stylesheet already carries .rei-mark-a and .rei-mark-b,
 * and ./unfold.ts already animates anything wearing .reimagine-prop — so adding
 * one is a single line here and nothing else anywhere. A block of commented-out
 * JSX is a line that has to be un-commented AND checked against three files that
 * have moved under it in the meantime.
 *
 * THEY ARE GIFS, which is why they are plain <img> and not a Peel: they are ink
 * going onto paper, and the drawing of them is inside the file. What this layer
 * gives them is when they appear and where — the same rise-and-settle the
 * photographs get, because a mark that is drawn ON the sheet arriving the way a
 * mark that is stuck TO it arrives is close enough at this size, and the
 * alternative is a second mechanism for two props.
 *
 * Their boxes are already measured in global.css off the design. Fill in `src`
 * and they land where they are drawn. */
const MARKS: Array<{ key: string; src: string }> = [];

export default function Props() {
  return (
    /* ONE LAYER OVER THE WHOLE SHEET. inset: 0 of .reimagine-sheet, so every prop
       below is positioned against the same box the paper and the statement are —
       one drawing, one origin, and --prop-u scales all three together.

       AFTER THE STATEMENT IN SOURCE, which is what puts the props over the type
       where they overlap it. Both are unpositioned-in-z siblings inside the
       sheet, so the later one paints on top, and the photographs in the design
       do lie across the foot of the sentence. */
    <div className="reimagine-props">
      {STRIPS.map(({ key, roll }) => (
        <Strip key={key} roll={roll} className={key} />
      ))}

      {SHOTS.map(({ key, src, alt }) => (
        <div className={`reimagine-prop reimagine-shot ${key}`} key={key}>
          {/* THE BOX THAT BOUNCES, AND IT IS A SECOND ELEMENT FOR A REASON THAT
              IS EASY TO TALK YOURSELF OUT OF.

              The prop's own rule leans it — `transform: rotate(--pr)` — and the
              arrival is a translate and a scale, which are also transform. One
              element and GSAP owns the whole property: it decomposes whatever
              CSS left there and re-composes its own matrix, so the lean survives
              by GSAP's good manners rather than by construction, and it stops
              surviving the day the lean is written some other way or the tween
              is given a transform GSAP does not decompose.

              Two elements and the two facts are in two places: the outer box is
              where the prop IS and how it is turned, the inner one is what
              happens to it. Nothing has to be inferred and re-written each
              frame.

              The tape is INSIDE this and not beside it — see the note above
              SHOTS. */}
          <div className="reimagine-pop">
            <img
              className="reimagine-shot-img"
              src={src}
              alt={alt}
              width={204}
              height={210}
              /* EAGER, for the flipbook's reason one class up. These are below
                 the fold and they arrive on a clock rather than on the scroll:
                 the section is pinned, the paper opens, and a fifth of a second
                 later these are asked for. Deferred, what plays is an empty box
                 bouncing. They are 204px wide. */
              loading="eager"
              decoding="async"
            />

            <Strip roll={KRAFT} className={`${key}-tape`} />
          </div>
        </div>
      ))}

      {MARKS.map(({ key, src }) => (
        <div className={`reimagine-prop reimagine-shot ${key}`} key={key}>
          <div className="reimagine-pop">
            <img className="reimagine-mark" src={src} alt="" loading="eager" />
          </div>
        </div>
      ))}
    </div>
  );
}
