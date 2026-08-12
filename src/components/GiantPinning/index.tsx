/* eslint-disable @next/next/no-img-element */
import { Fragment, type CSSProperties } from "react";

import HandNote from "@/components/HandNote";
import { letters } from "@/components/letters";
import Peel from "@/components/Peel";
import Stage from "./Stage";

/* WHY WE EXIST — three giant statements on one wide canvas, walked past by a
 * camera while the section is pinned.
 *
 * The composition is a STAIRCASE, not a row: TO CREATE sits high on the left,
 * TO FIX drops below it in the middle, TO PROTECT climbs back up on the right,
 * and the two arrows are drawn on the legs between them. So the camera travels
 * right AND vertically, which is the whole reason the class names the design
 * came with say "down-to-horizontal" and "diagdown-to-horizontal" — each phrase
 * is arrived at along a slope and is level once you are on it.
 *
 * Nothing here knows that. The markup only says WHERE each block sits on the
 * canvas, in --gx / --gy; pin.ts measures the blocks and works out the camera
 * stops that centre each one. Move a block in the stylesheet and the camera
 * follows it — there is no second copy of the coordinates to keep in step.
 *
 * Server-rendered, like the slider and the footer. Stage is a hair-thin client
 * wrapper that owns the ref; everything below stays on the server.
 */

/* The section's own copy. Not per panel, so it sits apart from PANELS — and it
   is the obvious CMS field, so it is named rather than buried in the markup. */
const SUBHEAD = "WHY WE EXIST";
const HEADING = ["WE’RE HERE", "FOR THE EVERYDAY", "MOMENTS."];

/* A loose object on the canvas: a product tag or a photograph, scattered around
 * the type the way the mock has them.
 *
 * Placement is per prop and lives here rather than in the stylesheet because it
 * is DATA — thirty numbers that describe an arrangement, not rules that
 * describe behaviour. They reach the DOM as custom properties and the stylesheet
 * reads them, which is the same seam tapes.ts uses for the tape palettes.
 *
 * x / y are PERCENTAGES OF THE PHRASE'S OWN BOX — x of its width, y of its
 * height — measured from its top-left. Percentages rather than vw so that an
 * arrangement survives a change of type size: raise --giant-size and the props
 * spread with the letters instead of bunching up at the left of a phrase that
 * grew out from under them. 0 is the left edge / cap line, 100 is the right edge
 * / baseline, and outside that range is fine and usual — the mock has tags
 * hanging well below the baseline.
 *
 * w is the width in vw. Not a percentage: a product tag is a physical thing of
 * roughly one size on the page, and it should not double because the phrase
 * beside it happens to be TO PROTECT rather than TO FIX.
 *
 * r is the tilt — nothing is straight, because these are meant to read as laid
 * down by hand. z is the one that matters most: below 0 the prop is behind the
 * letters, above 0 it is on top of them, and the mock has both, which is what
 * stops the type looking pasted over a background.
 *
 * kind is what it IS, and the stylesheet only uses it to round the corners of
 * the photographs — the tags are round already.
 */
type Prop = {
  src: string;
  kind: "shot" | "tag";
  x: number;
  y: number;
  w: number;
  r: number;
  z: number;
  /**
   * HOW FAR IT DRIFTS against the type, at most, as a fraction of the window —
   * 0.04 is about 58px at 1440. 0 is glued to the letters and travels with them,
   * and NEGATIVE is in front: a nearer thing overtakes the camera, and having
   * some props do that is what stops the section reading as one flat sheet with
   * pictures printed on it.
   *
   * THE SIGN SHOULD AGREE WITH z, and that is the only rule here. A prop drawn
   * over the letters that lags behind them is the depth cue and the layering
   * saying opposite things, and the eye picks the layering — so the drift just
   * looks like the picture sliding. Every reversed prop below is z 1 or 2, and
   * the one prop that sits BEHIND the type (PROTECT's shot, z -1) is the one
   * that must stay positive.
   *
   * One or two per panel is the dose. Reversed props are far the more noticeable
   * of the two directions, because they move AGAINST the type rather than
   * trailing it — flip them all and the section reads as sliding apart rather
   * than as having depth.
   *
   * KEPT SMALL. These were roughly twice this and read as the scenery sliding
   * around rather than as depth; the amount you can see happening is the amount
   * that has stopped being parallax. If a prop needs more presence, the ease
   * below is the dial to reach for first.
   */
  p?: number;
  /**
   * The curve it spends that drift along — any GSAP ease name.
   *
   * Two props at the same amplitude AND the same curve are one plane, however
   * far apart they are on the canvas, so these are all different within a panel.
   *
   * NOTHING STEEPER THAN power2.inOut, and this is the correction to what was
   * here before — which said power4 and expo "hold near-still through the middle
   * and do all their moving at the edges". They do the opposite. An inOut ease
   * spends most of its travel at the MIDDLE OF ITS DOMAIN, and the domain here is
   * distance from the centre of the screen, so the midpoint is about a third of
   * a window off centre — in full view. A steep curve therefore dumps the whole
   * drift into a narrow band right where you are looking.
   *
   * What you feel is speed, not distance, and the peak of it is
   *
   *     p x maxSlope / RANGE     as a fraction of the camera's own speed
   *
   * which put expo at 48% and circ — vertical tangent at its midpoint — at
   * unbounded. That was the "harsh", and it is why the totals measured small
   * while the section felt violent: the same displacement crammed into a third
   * of the distance is three times the velocity.
   *
   * Max slopes: none 1, sine.inOut 1.57, power1.inOut 2, power2.inOut 3,
   * power3.inOut 4, power4.inOut 5, expo.inOut 6.9, circ.inOut infinite. Keep
   * p x maxSlope under about 0.065 and nothing outruns the camera by more than a
   * tenth. See parallax.ts for why an `out` is wrong here regardless.
   */
  e?: string;
};

/* The photograph that stands INSIDE the phrase, in the gap between TO and the
 * noun — the one the mock puts there on all three.
 *
 * Not one of the scattered props: it is a flex item in the headline itself, so
 * the gap is not a length anybody types. The picture IS the gap, the letters
 * make room for it the way they make room for a letter, and changing its size
 * moves the noun rather than leaving a hole of the wrong width behind.
 *
 * lift is how far the corner comes up, as a fraction of the card — Peel's `to`.
 * The three differ slightly so the section does not look mechanised.
 */
type Slot = {
  src: string;
  /**
   * How much of the strip is still up at the start, as a fraction of it.
   *
   * The strip is being PUT ON, not taken off, so this is Peel's `from` and the
   * `to` is 0 — flat, stuck down. Running it the other way (flat, then lifting)
   * is the same geometry backwards and reads as the tape giving up, which is not
   * what a thing holding a photograph to a board should look like.
   */
  lift: number;
  /** Seconds before the first pass, so the three are not in step. */
  delay: number;
  /** The card's own tilt. Nothing is laid down straight. */
  tilt: number;
  /**
   * A vertical nudge, in em of the giant type, on top of where the row centres
   * it. Negative is up.
   *
   * In em rather than the px it was measured in, like every other figure inside
   * a phrase: -0.118em is the -65px the design asked for at the current
   * --giant-size, and it stays that proportion if the type is resized. A fixed
   * px here would slide out of place the moment --giant-size moved.
   */
  dy?: number;
  /**
   * The same, sideways. Positive is right.
   *
   * Worth knowing what it does NOT do: the card's box in the row is unmoved, so
   * this slides the picture off its own gap rather than widening the gap. The
   * letters stay where they were. To move the noun instead, change --giant-slot
   * or the margins on .giant-slot.
   */
  dx?: number;
  /**
   * Its parallax speed, and the one place the numbers are kept small.
   *
   * The card is a flex item BETWEEN TO and the noun — the letters made a gap of
   * exactly its width — so anything the props would wear slides it out of that
   * gap and onto a letter. A third of a prop's drift is enough that it does not
   * read as printed on the type, and little enough that it stays in its hole.
   */
  p?: number;
  /** Its curve, as on a prop. */
  e?: string;
};

/* THE ROLLS. Two strips, and the ratio is the only number either of them needs
 * from its file — it is what turns one width into the box Peel wants, so the
 * height is never typed and never drifts from the artwork.
 *
 * THE TWO ARE NOT THE SAME SHAPE — kraft is 428x173 and black is 213x106, so
 * 2.47 against 2.01 — and that is exactly why this is a table rather than one
 * filename with a width beside it. A single TAPE_BOX would have handed the
 * black strip the kraft strip's proportions, and the box is what the turned clip
 * frame is bled by: it would not have looked like a squashed picture, it would
 * have looked like the peel animation not running properly at one end.
 *
 * In em of the giant type, like everything else inside a phrase, so a strip
 * scales with --giant-size along with the card it is holding down. */
const TAPES = {
  kraft: { src: "/assets/tape top.png", ratio: 428 / 173 },
  black: { src: "/assets/black-tape.png", ratio: 213 / 106 },
} as const;

type TapeName = keyof typeof TAPES;

const TAPE_W = 0.62;
const tapeBox = (name: TapeName) =>
  `${TAPE_W}em ${(TAPE_W / TAPES[name].ratio).toFixed(4)}em`;

/* The lean, and where it has to live. Nothing on this page is put down straight,
   but a tilt written as `rotate` on the wrapper would REPLACE --peel-dir — that
   property is how Peel aims the fold — and the strip would stand on end with its
   artwork still counter-turned. So the lean is folded into the direction: its
   own tilt plus the quarter turn that takes the fold across the strip and lifts
   it end-first. The hero's tape-on-lemon is the same sum. */
const TAPE_TILT = -1.6;
const TAPE_DIR = `${TAPE_TILT + 90}deg`;

type Panel = {
  /* The class the design named the block with. Also the pin's hook — pin.ts
     collects .giant-row and does not care about these, but they are what a
     stylesheet rule reaches for when one phrase needs its own treatment. */
  className: string;
  /** Kept as two nodes because the mock colours and tilts the noun on its own. */
  lead: string;
  word: string;
  /**
   * WHICH ROLL THIS PANEL WAS TAPED DOWN WITH — kraft masking tape on TO CREATE
   * and TO PROTECT, a black strip on TO FIX, which is how the mock has them.
   *
   * Per PANEL and not per picture, because that is what it is: one person taped
   * this arrangement down in one sitting, so every strip in a panel comes off
   * the same roll. Two rolls within a phrase would read as a mistake rather than
   * as a choice.
   */
  tape?: TapeName;
  /** The picture standing in the phrase's own gap. */
  slot: Slot;
  props: Prop[];
  /**
   * The hand-written note, if this panel has one — placed on the same --px/--py
   * percentages of the row as a prop, and for the same reason given there.
   *
   * ALL THREE PANELS CARRY ONE NOW, which this was originally optional to
   * prevent: the argument was that an aside in someone's handwriting stops
   * being an aside at three and becomes a caption style. That was overruled by
   * the design, and the field stays optional because it still describes
   * something a panel may not have — but if a fourth phrase is ever added, the
   * question of whether it needs one is a real question, not a default.
   *
   * The placements are NOT interchangeable between panels. See the values
   * themselves: the percentages are of each row's own width, and the three rows
   * are different widths.
   */
  note?: { x: number; y: number };
};

const PANELS: Panel[] = [
  {
    className: "down-to-horizontal",
    lead: "TO",
    word: "CREATE",
    slot: {
      src: "/assets/slider/masking/shot-1.png",
      lift: 0.34,
      delay: 0.4,
      tilt: 3.19,
      dy: -0.118, // -65px at the current type size
      p: 0.012,
      e: "sine.inOut",
    },
    props: [
      { src: "/assets/slider/double/shot-1.png", kind: "shot", x: 98, y: -15, w: 15, r: -8, z: 2, p: -0.03, e: "none" },
      { src: "/assets/slider/double/card.png", kind: "tag", x: 69, y: -24, w: 17, r: -6, z: 1, p: 0.03, e: "sine.inOut" },
      { src: "/assets/slider/masking/card.png", kind: "tag", x: 53, y: 58, w: 20, r: 5, z: 1, p: 0.03, e: "power1.inOut" },
      { src: "/assets/slider/opp-quiet/card.png", kind: "tag", x: 94, y: 54, w: 18, r: -14, z: 1, p: -0.02, e: "power2.inOut" },
    ],
    /* Centred under the slot and just clear of it: the card spans 22.5%..37.4%
       of the row and ends at 73.8% of its height, and the note is 7.9% of the
       row wide. */
    note: { x: 26, y: 78 },
  },
  {
    className: "diagdown-to-horizontal",
    lead: "TO",
    word: "FIX",
    tape: "black",
    slot: {
      src: "/assets/slider/cloth/shot-1.png",
      lift: 0.28,
      delay: 1.1,
      tilt: 9.6,
      dy: -0.36,
      dx: 0.15,
      p: 0.01,
      e: "none",
    },
    props: [
      { src: "/assets/slider/cloth/shot-2.png", kind: "shot", x: 32, y: 22, w: 21, r: -5, z: 1, p: -0.025, e: "power1.inOut" },
      { src: "/assets/slider/cloth/card.png", kind: "tag", x: -5, y: 54, w: 16, r: 12, z: 1, p: 0.04, e: "sine.inOut" },
    ],
    /* Above and to the left of BOTH pictures — the slot standing in the phrase's
       gap and the shot below it — so it reads as written about the pair rather
       than as a label on either one.

       CLEAR OF THE CAP LINE, which is what the negative y is buying. The note is
       written in --giant-ink and so are the letters: an inch lower and its last
       two lines lie across the T and the O in the same dark green, which is not
       a note overlapping type, it is a note that has disappeared. Its box ends
       about 240px above a cap line at 260 at the current size. */
    note: { x: 19, y: -24 },
  },
  {
    className: "diagup-to-horizontal",
    lead: "TO",
    word: "PROTECT",
    slot: {
      src: "/assets/slider/opp/shot-1.png",
      lift: 0.38,
      delay: 0.75,
      tilt: 4.8,
      /* -6vw and 3vw as placed by hand, converted at the current --giant-size of
         38.194vw. em rather than the vw they were typed in for the reason the
         field's own note gives: this is a nudge INSIDE a phrase, so it has to
         scale with the type or it slides off the card at the mobile size, where
         --giant-size drops to 20vw and a vw figure would be three times too big
         relative to the letters. */
      dy: -0.1571,
      dx: 0.0785,
      p: 0.014,
      e: "sine.inOut",
    },
    props: [
      /* THE ONE WITH THE ARGUMENT AGAINST IT, kept because it was asked for.
         Moved out to the right shoulder and brought to the FRONT (z 3), and the
         --pp note above says the sign of the drift should agree with z — a thing
         drawn over the letters that lags behind them is the layering and the
         depth cue disagreeing. At z 3 this wants a NEGATIVE p. It is left
         positive at 0.045 because that is the arrangement that was chosen; the
         one number to flip if it ever reads as sliding rather than as depth. */
      { src: "/assets/slider/opp/shot-2.png", kind: "shot", x: 98, y: 12, w: 17, r: 5, z: 3, p: 0.045, e: "none" },
      { src: "/assets/slider/opp/card.svg", kind: "tag", x: 61, y: -66, w: 11, r: 6, z: 1, p: -0.02, e: "power2.inOut" },
      { src: "/assets/slider/opp/card.svg", kind: "tag", x: 43, y: 71, w: 16, r: 9, z: 1, p: 0.032, e: "power1.inOut" },
    ],
    /* Under the slot, the same reading TO CREATE's note takes — and NOT the
       same numbers, because --px/--py are percentages of the ROW and this row
       is the widest of the three. The slot itself is identical and sits at the
       same absolute offset in every phrase (it follows TO, which never
       changes), so the longer the noun, the smaller a fraction of the row that
       offset is. Copying 26/78 across would have put the note under the P.

       Worked from CREATE's own figures. Its note is 7.9% of its row and 12.8vw
       wide (--hand-w on .giant-note), which makes that row 162vw; PROTECT is
       one letter longer and measures about 179. The slot box centres at 47.8vw
       from the row's left edge in both, and this card is nudged a further 3vw
       right by its dx — so 50.8/179 is 28.4%, less half the note's 7.2%, is 25.

       y is CREATE's 78 less the 1.5vw this card rides higher (dy -0.1571em
       against -0.118em, on a row 41vw tall), plus a little back for the steeper
       tilt dropping its low corner. It keeps the same 1.7vw of air under the
       card that the first note has.

       Clear of the tag at x 43 — that one starts 11% of the row to the right of
       where this ends. */
    note: { x: 25, y: 75 },
  },
];

/* The props are scenery — every one of them is a picture of a thing the
 * headline already says in words, so they are announced to nobody. The section
 * reads as its heading and its three phrases, which is the whole message.
 *
 * THE PHOTOGRAPHS ARE TAPED DOWN AND THE TAGS ARE NOT, which is why this branches
 * on kind rather than rendering one thing. A product tag is a thing that HANGS —
 * it has a hole and a string in its own artwork — and taping one to the board
 * would be describing it wrongly. A photograph is a thing that lies flat and has
 * to be held there, which is the whole reason the slot's card has a strip across
 * it, and every loose shot in the section is the same object in the same
 * arrangement.
 *
 * So a shot is a WRAPPER now rather than a bare <img>: the strip has to be
 * positioned against the picture, and an <img> cannot hold a child. The wrapper
 * keeps .giant-prop, so every rule about placement and parallax still lands on
 * it unchanged — parallax.ts collects `.giant-prop, .giant-slot` and writes
 * --pdx, and it neither knows nor cares which tag name it found.
 */
function Props({ items, tape, lift }: { items: Prop[]; tape: TapeName; lift: number }) {
  return (
    <>
      {items.map((p, i) => {
        const vars = {
          "--px": `${p.x}%`,
          "--py": `${p.y}%`,
          "--pw": `${p.w}vw`,
          "--pr": `${p.r}deg`,
          "--pz": p.z,
          /* Unitless, and read straight off the inline style by parallax.ts
             every frame — so these are two of the values you can type into
             devtools and watch change. --pe takes any GSAP ease name. */
          "--pp": p.p ?? "",
          "--pe": p.e ?? "",
        } as CSSProperties;

        const className = `giant-prop giant-prop--${p.kind}`;

        if (p.kind === "tag") {
          return (
            <img
              key={`${p.src}-${i}`}
              className={className}
              src={p.src}
              alt=""
              aria-hidden="true"
              style={vars}
            />
          );
        }

        return (
          <span key={`${p.src}-${i}`} className={className} aria-hidden="true" style={vars}>
            <img src={p.src} alt="" />
            {/* THE SAME STRIP AS THE SLOT'S, and deliberately the same numbers:
                same roll, same lean, same amount still up at the start, same
                press. See the note on the slot's own Peel below for why it is
                the tape that moves and not the picture, and why this is
                drive="manual" rather than a loop.

                It sizes itself off the picture rather than off the giant type —
                .giant-prop--shot gives itself a font-size equal to its own
                width, so `em` in here means the same fraction of THIS card that
                it means of the slot's. A tag-sized 11vw photograph and a 21vw
                one therefore wear a strip in proportion rather than the same
                absolute strip, which on the small ones would have been most of
                the picture. See global.css. */}
            <Peel
              className="giant-tape"
              src={TAPES[tape].src}
              drive="manual"
              direction={TAPE_DIR}
              box={tapeBox(tape)}
              from={lift}
              to={0}
            />
          </span>
        );
      })}
    </>
  );
}

export default function GiantPinning() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE LETTERS NEVER COME UP. The stylesheet parks them
          below their masks and reveal.ts is what lifts them, so a page where
          that never runs is a section of blank lime. Same guard the hero
          carries, and the same one-line fix: put them home and leave them
          there. */}
      <noscript>
        <style>{`.giant-pinning .char { transform: none }`}</style>
      </noscript>
      {/* The canvas is what moves. It is several viewports wide and everything
          on it is placed absolutely, so the browser lays the arrangement out
          once and the camera is a single transform on one element rather than
          three elements being moved in step. */}
      <div className="giant-canvas">
        <div className="top-title">
          <h5 className="subhead">{SUBHEAD}</h5>
          {/* One heading, three lines, each its own row of split letters. A <br>
              between plain strings would not survive the split — the letters
              have to be laid into a row that can be a line. */}
          <h2 className="h2" aria-label={HEADING.join(" ")}>
            {HEADING.map((line) => (
              <span className="line" key={line}>
                {letters(line)}
              </span>
            ))}
          </h2>
        </div>

        {/* Fragment, not a wrapper div — every block on the canvas is placed
            absolutely off .giant-canvas, and a div per panel would be one more
            box to reason about for nothing. */}
        {PANELS.map((panel, i) => {
          /* Resolved once per panel rather than at each of the two or three
             places a strip is rendered, so the slot and the loose photographs
             cannot end up on different rolls by an edit reaching only one of
             them. Kraft is the default because two of the three are. */
          const roll = panel.tape ?? "kraft";

          return (
          <Fragment key={panel.word}>
            {/* The arrow sits BEFORE the block it leads to, so the DOM reads in
                the order the camera travels. Decorative: it is a drawn line
                repeating what the layout already shows. */}
            {i > 0 && (
              <div
                className={i === 1 ? "diag-down-arrow" : "diag-up-arrow"}
                aria-hidden="true"
              >
                {/* INLINE, not a mask on the div any more. The mask was fine for
                    painting a fixed shape in --giant-ink, and useless the moment
                    the arrow had to DRAW itself: a mask has no stroke to run a
                    dash along. As real geometry the line is one path with a
                    dash the length of itself, and reveal.ts walks its offset
                    from hidden to nothing.

                    Same two paths as the mask carried, and the same trick — the
                    up arrow is the down arrow with its y values mirrored, which
                    is why the two read as one hand. currentColor, so the ink
                    still comes from the stylesheet. */}
                <svg viewBox="0 0 150 100" fill="none" aria-hidden="true">
                  <path
                    className="arrow-line"
                    d={
                      i === 1
                        ? "M4 8 C 46 14 100 42 132 84"
                        : "M4 92 C 46 86 100 58 132 16"
                    }
                  />
                  {/* THE HEAD IS THE ORIGINAL MARK, MOVED — not redrawn. Its two
                      barbs are deliberately uneven (about 42deg back on one side
                      and 13deg on the other), which is what makes it read as
                      drawn by hand rather than constructed, and eyeballing a new
                      one at the new angle would have quietly straightened it. So
                      the offsets were rotated by the 8deg the longer curve
                      changed its arrival angle by, and re-anchored to the new
                      tip. Same mark, further along. */}
                  <path
                    className="arrow-head"
                    d={
                      i === 1
                        ? "M111 80 L132 84 L123 65"
                        : "M111 20 L132 16 L123 35"
                    }
                  />
                </svg>
              </div>
            )}

            <div className={`giant-row ${panel.className}`}>
              {/* Split to its letters on the SERVER, by the same helper the
                  hero, the footer and the menu use — so there is never a frame
                  of unsplit text and no splitter runs on mount.

                  aria-label rather than hidden copy: on a heading the label is
                  honoured, so the phrase is announced as a phrase and the pile
                  of letter spans is never read out. The hero's headline is
                  marked up the same way.

                  The noun keeps a span of its own. It carries no styling yet —
                  it is where "colour the verb differently" goes when the design
                  asks for it, and losing it to the split would be losing the
                  only join in the phrase. */}
              <h1 className="giant" aria-label={`${panel.lead} ${panel.word}`}>
                {letters(panel.lead)}

                {/* THE GAP, and the thing standing in it. No word space either
                    side of this and no `gap` on the row — this box is the space,
                    so there is exactly one thing to size and the letters cannot
                    end up spaced against a hole of a different width. */}
                <span
                  className="giant-slot"
                  aria-hidden="true"
                  style={
                    {
                      "--giant-tilt": `${panel.slot.tilt}deg`,
                      "--giant-dy": `${panel.slot.dy ?? 0}em`,
                      "--giant-dx": `${panel.slot.dx ?? 0}em`,
                      "--pp": panel.slot.p ?? "",
                      "--pe": panel.slot.e ?? "",
                    } as CSSProperties
                  }
                >
                  <img className="giant-card" src={panel.slot.src} alt="" />

                  {/* THE TAPE IS WHAT PEELS, not the photograph. A picture whose
                      corner lifts is a picture coming unstuck from nothing; a
                      strip of tape lifting its end is the thing that was holding
                      it, and it is the tape the mock draws across the top edge.
                      Same object and the same move as the hero's tape-on-note.

                      direction 90deg folds it end-first, off the right. The tilt
                      alone would run the fold ALONG the strip and crease it
                      lengthwise into a stripe — see the hero's note, which is
                      where that was learned.

                      PUT ON, ONCE, not looping. from is the lifted end and to
                      is flat, so the move is the strip coming DOWN — and it
                      happens on the same cue as the phrase's letters, so the
                      picture gets taped to the board as the words arrive.

                      A loop cannot do this. It alternates, so it rests at one
                      end and spends the wait there: rest flat and the motion is
                      a peel, rest lifted and you have a permanently curled strip
                      that occasionally presses down. Neither is a thing being
                      put on. drive="manual" hands --peel to reveal.ts, which
                      writes it once and leaves it stuck.

                      "scroll" is out for a different reason — it scrubs off the
                      element's position in the VIEWPORT, and this one is inside
                      a pinned box whose viewport position barely changes for the
                      whole section. */}
                  <Peel
                    className="giant-tape"
                    src={TAPES[roll].src}
                    drive="manual"
                    direction={TAPE_DIR}
                    box={tapeBox(roll)}
                    from={panel.slot.lift}
                    to={0}
                  />
                </span>

                <span>{letters(panel.word)}</span>
              </h1>
              {/* The loose photographs wear the panel's roll and the slot's own
                  lift — one arrangement, taped down in one sitting. */}
              <Props items={panel.props} tape={roll} lift={panel.slot.lift} />

              {/* The hand-written note, where a panel asks for one — an aside in
                  someone's handwriting, laid near the pictures it is about.

                  The SAME component the hero's pinboard uses, not a copy of it:
                  one ruled margin, one set of letterforms, one file to change.
                  What differs is CSS on this instance — where it sits, how big
                  it is, and that it is written in the giant ink rather than the
                  board's lime (see .giant-note in global.css).

                  Placed on --px / --py like the props around it, and for the
                  reason given there: percentages of the ROW, so the arrangement
                  holds its shape when --giant-size moves. Its SIZE is --hand-w
                  in vw, like a prop's --pw — a note is a physical thing of one
                  size on the page, not a fraction of whichever phrase it
                  happens to be near.

                  decorative, because these exact words are already on the page:
                  the hero's copy is the one in the accessibility tree, and these
                  repeats must not say it again. */}
              {panel.note && (
                <HandNote
                  className="giant-note"
                  decorative
                  style={
                    {
                      "--px": `${panel.note.x}%`,
                      "--py": `${panel.note.y}%`,
                    } as CSSProperties
                  }
                />
              )}
            </div>
          </Fragment>
          );
        })}
      </div>
    </Stage>
  );
}
