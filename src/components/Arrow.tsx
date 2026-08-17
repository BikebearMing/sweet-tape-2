/* The link marker — a small arrow pointing north-east, drawn as two strokes.
 *
 * Inline rather than an asset, and shared rather than copied. Inline, it
 * inherits currentColor for free when the palette changes, which is the whole
 * reason the menu drew its own rather than shipping an SVG file. Shared, because
 * it is now on three things — the menu's rows, the lead story's card and every
 * card in the news grid — and three copies of the same two strokes is three
 * places for the weight to drift.
 *
 * WHAT IS NOT HERE IS THE DISC IT SITS ON, or the swing. Both belong to the
 * thing being marked: the menu prints it on a lime dot at the top of a row, the
 * news cards print it on one in a bottom corner, and each turns it on hover with
 * its own timing. This is the ink and nothing else.
 *
 * The stroke is heavy against the 12-unit box because the glyph renders at about
 * 8px — a hairline at that size disappears into the disc under it, so the weight
 * had to go up to hold the ink it had when it was larger.
 */
export default function Arrow() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M1.4 10.6 10.6 1.4M3.6 1.4h7v7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
