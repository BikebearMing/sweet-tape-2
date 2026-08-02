/* eslint-disable @next/next/no-img-element */
import marks from "@/data/wordmarks.json";

/* The two word marks.
 *
 * Both are lists of letter images rather than text, and both are recoloured by
 * masking (see letters.css). The nth-child rules that carry each letter's
 * stencil and intrinsic size are numbered against this DOM order, so the order
 * here and in wordmarks.json must agree — which is why both come from the same
 * file.
 */

/** THE. The image is the flex item; its own mask slides to do the dip. */
export function TopTitle() {
  return (
    <div className="top-title">
      {marks.the.map((g, i) => (
        <img key={`${g.letter}-${i}`} src={g.src} alt="" />
      ))}
    </div>
  );
}

/* CREATIVE. Each letter is wrapped so it has a box to be clipped by: the
   wrapper holds its place on the arc, the image inside does the dip. One
   element cannot carry both transforms. */
export function BottomTitle() {
  return (
    <div className="bottom-title">
      {marks.creative.map((g, i) => (
        <span className="glyph" key={`${g.letter}-${i}`}>
          <img src={g.src} alt="" />
        </span>
      ))}
    </div>
  );
}

/** The word the two marks spell, for anyone not looking at pictures. */
export const WORDMARK_TEXT = "THE CREATIVE";
