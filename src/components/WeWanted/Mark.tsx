/* THE DRAWING ON A BOX — four line marks, one per claim.
 *
 * STAND-INS, AND THE FILE SAYS SO OUT LOUD. The design's own icons are not in
 * the repo yet; these are drawn to the right weight and the right size so the
 * section can be built, judged and tuned against real shapes rather than against
 * four empty squares. Swapping one is a matter of replacing its path and nothing
 * else — the box knows the mark only as a child that takes its ink.
 *
 * INLINE SVG AND NOT FOUR FILES, for the reason SUPER POWERS' mark is inline:
 * the colour is the BOX's, not the drawing's. An <img> is a document of its own
 * and `currentColor` does not cross that boundary, so four external icons would
 * each need their own copy of four palettes baked into them — and a fifth the
 * day a box changes tone. Inline, the mark is ordinary DOM and inherits.
 *
 * STROKED, NOT FILLED, and every one of them is drawn in the same 100x100 box at
 * the same stroke width, which is what makes four different subjects read as one
 * set. The stroke is not scaled with the box (vector-effect is deliberately NOT
 * used): the mark is sized in vw like everything else on the card, so its lines
 * should thicken with it exactly as the type does.
 *
 * aria-hidden, all four. Each one is the words under it, drawn — the box already
 * says CLEARER in type, and a screen reader gaining "tape strip" from this is
 * being told the same thing twice.
 */

import type { ReactElement } from "react";

/** Which drawing a box carries. The box's own data names one; see BOXES in
    ./index.tsx. */
export type MarkKind = "strip" | "parcel" | "roll" | "person";

/* One subject each, and they are in the order the boxes read.
 *
 * strip  — a torn length of tape, ends ragged. CLEARER: the thing itself.
 * parcel — a carton in three quarters, seam down the top face. EASY TO CHOOSE:
 *          the job the tape is bought for.
 * roll   — a roll seen from slightly above. RECOGNISABLE: the shape the brand
 *          is known by, and the same object the wave band prints.
 * person — head and shoulders. MORE HUMAN, which is the only one of the four
 *          that is not a tape.
 *
 * TWO OF THEM TOOK SEVERAL GOES and each carries the record of what it drew
 * before, because the failures are not obvious from the paths that replaced
 * them: a flat box is read by its lines, and a circle is read by whatever is
 * attached to it.
 */
const PATHS: Record<MarkKind, ReactElement> = {
  strip: (
    /* Tilted off the horizontal, because a strip of tape lying dead level reads
       as a rule rather than as something laid down by hand. The zigzag at each
       end is the tear — four teeth, which is enough to read as torn at this size
       and few enough that they do not turn into a pattern. */
    <g transform="rotate(-8 50 50)">
      <path d="M26,34 H74 L80,42 L74,50 L80,58 L74,66 H26 L20,58 L26,50 L20,42 Z" />
    </g>
  ),
  parcel: (
    <g>
      {/* A CARTON IN THREE QUARTERS — the top face and the two sides, which is
       * the one drawing of a box nobody misreads.
       *
       * FLAT ONES WERE TRIED AND EVERY ONE OF THEM DREW SOMETHING ELSE. A
       * rectangle with a band down it is a book; with a band across it, a stack
       * of drawers; with a lid seam and a strip over it, a calendar. A square
       * with lines in it is a square with lines in it, and the lines decide what
       * it is. Turn the box and it is a box before anything has been added to
       * it.
       *
       * The seal is the line down the top face: the seam the tape closes, drawn
       * with the same weight as everything else so it reads as part of the
       * carton rather than as a fold in it. */}
      <path d="M50,18 L84,36 L50,54 L16,36 Z" />
      <path d="M16,36 V68 L50,86 V54" />
      <path d="M84,36 V68 L50,86" />
      <path d="M33,27 L67,45" />
    </g>
  ),
  roll: (
    <g>
      {/* A ROLL, SEEN FROM SLIGHTLY ABOVE — the ring, the hole, and the depth
       * between them.
       *
       * FACE-ON IT WAS A TARGET. Two flat concentric circles have nothing in
       * them that says tape: at this size and this weight the mark reads as a
       * bullseye, and the claim under it is about being RECOGNISED, which is
       * the one thing a mark that reads as something else cannot do.
       *
       * A TAIL DOES NOT RESCUE IT AND WAS TRIED THREE WAYS. A spout off the
       * ring at ten o'clock is a whistle; a stub off the bottom corner, a
       * magnifying glass; a torn strip running off to the right, a key. A
       * circle with any small thing attached is read as that thing's handle.
       *
       * Depth is what fixes it. The roll is a cylinder with a hole through it,
       * and drawing it as one — an ellipse for the top face, an ellipse for the
       * hole, and the side wall under them — is a roll of tape and nothing
       * else. It is also the object the wave band prints in the middle of its
       * sentence, seen from a different angle. */}
      <path d="M20,36 V58 A30,17 0 0 0 80,58 V36" />
      <ellipse cx="50" cy="36" rx="30" ry="17" />
      <ellipse cx="50" cy="36" rx="11" ry="6" />
    </g>
  ),
  person: (
    <g>
      <circle cx="50" cy="36" r="12" />
      {/* Shoulders, as one arc rather than a body: at this size anything more is
          a figure, and a figure needs a face. */}
      <path d="M26,76 A24,24 0 0 1 74,76" />
    </g>
  ),
};

export default function Mark({ kind }: { kind: MarkKind }) {
  return (
    <svg
      className="wanted-box-mark"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {PATHS[kind]}
    </svg>
  );
}
