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

/* THE ROLL THESE ARE TORN OFF, and there is one: MASKING, the torn-edged cream
 * strip the product page is designed around — the file and the underside
 * TapeSlider/strips.ts gives the masking roll.
 *
 * THERE WERE TWO ROLLS AND EIGHT STRIPS — three brown, three clear film, and one
 * pinning each photograph. All of it came off bar two, asked for: the sheet is
 * held at two opposite corners, and that is the whole of the taping. */
type Roll = { src: string; back: "peel-back-masking"; cls: string };

const MASKING: Roll = {
  src: "/assets/masking-tape-x2.png",
  back: "peel-back-masking",
  cls: "reimagine-prop-masking",
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
  { key: "rei-mask-a", roll: MASKING },
  { key: "rei-mask-b", roll: MASKING },
];

/* HD EXPORTS OF THEIR OWN, NOT THE SLIDER'S 204px SHOTS. These boxes draw at
 * 26vw — 500px of a 1920 screen — and the slider's showcase files are a
 * contract at 204 x 210, so borrowing them here was a 2.5x blow-up (user,
 * 2026-09-28: "more hd"). Cut to 1000, about twice the draw, the same bargain
 * cloth-tapex4 strikes for the pinning card. The slider keeps its own copies. */
const SHOTS = [
  {
    key: "rei-shot-a",
    src: "/assets/masking-x4-reimagine.webp",
    alt: "A roll of SweetTape masking tape on a watercolour painting in progress",
  },
  {
    key: "rei-shot-b",
    src: "/assets/double-x4-reimagine.webp",
    alt: "A roll of SweetTape double-sided tissue tape on a checkerboard cutout",
  },
];

/* THE PEN MARKS — the heart, the rule under the last line, and the squiggle,
 * drawn on the sheet in the statement's own green.
 *
 * The list was open and empty for a round waiting on the artwork, which is why
 * adding the marks was three lines here and one rule in global.css: the markup
 * below maps over this, and ./unfold.ts animates anything wearing
 * .reimagine-prop.
 *
 * PLAIN <img> AND NOT A Peel: they are ink going onto paper, and the drawing of
 * them is inside the file. What this layer gives them is when they appear and
 * where — the same rise-and-settle the photographs get, because a mark that is
 * drawn ON the sheet arriving the way a mark that is stuck TO it arrives is
 * close enough at this size, and the alternative is a second mechanism for
 * three props.
 *
 * TWO WEBPS AND ONE SVG, though all three arrived as SVGs. The heart and the
 * squiggle were Figma exports with the crayon texture as a base64 raster
 * INSIDE the svg — 290KB of wrapper around a bitmap — so they are flattened to
 * the webp they really were, trimmed to the ink so the box in global.css is
 * the mark and not a mostly-empty export canvas. The underline is real vector
 * and stays one.
 *
 * LIST ORDER IS ARRIVAL ORDER, as with the strips: heart at the top, the rule
 * under the last line, then the squiggle at the foot — a hand working down the
 * page. */
const MARKS: Array<{ key: string; src: string }> = [
  { key: "rei-mark-a", src: "/assets/doodle-heart.webp" },
  { key: "rei-mark-c", src: "/assets/full-of-heart-underline.svg" },
  { key: "rei-mark-b", src: "/assets/doodle-leftof-bottom-image.webp" },
];

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
