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
    /* THE LEMON BADGE — the brand's own lozenge, and the one mark of the four
     * that is the design's rather than a stand-in. The card's claim is about
     * being RECOGNISED and the drawing puts the most recognisable thing the
     * brand owns in the dip: the logo's silhouette, filled, nested in the
     * valley between the card's two halves.
     *
     * THE PATH IS public/assets/preloader-image.svg's OUTER SILHOUETTE — the
     * same file the top band, the hero and the preloader draw the badge from —
     * scaled from its 191x118 box into this one's 100x100 (0.5236) and centred.
     * Traced, not redrawn, so it cannot drift from the logo.
     *
     * FILLED, WHERE ITS THREE NEIGHBOURS ARE STROKED: the drawing shows a solid
     * pale badge on the deep floor, and a stroked lemon at this weight is a
     * pointy ellipse. The fill/stroke pair is set here because the svg root
     * below sets the opposite; the INK is still the box's — see the
     * data-box="recognisable" override in global.css, which hands the mark the
     * ceiling's colour so the badge reads as the pale half showing through. */
    <g fill="currentColor" stroke="none" transform="translate(0 19) scale(0.5236)">
      {/* THE COLLAR FIRST — the same silhouette scaled up a seventh about its
          own centre and filled with the FLOOR's colour, so wherever the badge
          rides over the pale ceiling the deep wraps it, exactly as the drawing
          nests it into the divider. Over the floor it vanishes into the same
          paint, which is why one halo serves every position. */}
      <path
        fill="var(--box-deep)"
        transform="translate(90.5 59) scale(1.14) translate(-90.5 -59)"
        d="M84.5137 1.62111C112.565 -1.28159 138.265 6.19363 154.421 19.8369L154.422 19.8379C156.243 21.3707 158.612 22.1241 160.994 21.875L160.993 21.874L171.151 20.8252C173.185 20.615 174.812 22.4927 174.314 24.4795L169.991 41.7315L168.973 45.7891L168.972 45.7901C168.193 48.8992 168.464 52.1771 169.733 55.1123L170.001 55.6953L171.829 59.4551L179.595 75.4522V75.4531C180.49 77.2979 179.281 79.4664 177.246 79.6768L167.089 80.7266H167.087C164.856 80.9601 162.817 82.0432 161.359 83.7266L161.076 84.0713C148.053 100.737 124.433 113.318 96.3818 116.221C68.3258 119.123 42.6306 111.648 26.4746 98.0049L26.4736 98.0039L26.125 97.7256C24.4737 96.4705 22.4287 95.8226 20.3477 95.9317L19.9023 95.9658L9.74414 97.0166C7.71054 97.2269 6.0827 95.349 6.58008 93.3623L10.9033 76.1084L11.9229 72.0527V72.0518C12.7015 68.9423 12.4317 65.664 11.1621 62.7285L10.8945 62.1465L9.06543 58.3867H9.06641L1.30078 42.3887C0.405343 40.544 1.61401 38.3757 3.64844 38.1651L13.8066 37.1152H13.8086C16.0395 36.8817 18.0776 35.7983 19.5352 34.1152L19.8193 33.7705C32.8421 17.1048 56.4629 4.52379 84.5137 1.62111Z"
      />
      <path d="M84.5137 1.62111C112.565 -1.28159 138.265 6.19363 154.421 19.8369L154.422 19.8379C156.243 21.3707 158.612 22.1241 160.994 21.875L160.993 21.874L171.151 20.8252C173.185 20.615 174.812 22.4927 174.314 24.4795L169.991 41.7315L168.973 45.7891L168.972 45.7901C168.193 48.8992 168.464 52.1771 169.733 55.1123L170.001 55.6953L171.829 59.4551L179.595 75.4522V75.4531C180.49 77.2979 179.281 79.4664 177.246 79.6768L167.089 80.7266H167.087C164.856 80.9601 162.817 82.0432 161.359 83.7266L161.076 84.0713C148.053 100.737 124.433 113.318 96.3818 116.221C68.3258 119.123 42.6306 111.648 26.4746 98.0049L26.4736 98.0039L26.125 97.7256C24.4737 96.4705 22.4287 95.8226 20.3477 95.9317L19.9023 95.9658L9.74414 97.0166C7.71054 97.2269 6.0827 95.349 6.58008 93.3623L10.9033 76.1084L11.9229 72.0527V72.0518C12.7015 68.9423 12.4317 65.664 11.1621 62.7285L10.8945 62.1465L9.06543 58.3867H9.06641L1.30078 42.3887C0.405343 40.544 1.61401 38.3757 3.64844 38.1651L13.8066 37.1152H13.8086C16.0395 36.8817 18.0776 35.7983 19.5352 34.1152L19.8193 33.7705C32.8421 17.1048 56.4629 4.52379 84.5137 1.62111Z" />
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
