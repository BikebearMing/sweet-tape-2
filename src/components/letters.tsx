import type { CSSProperties, ReactNode } from "react";

/* The rows these letters sit in are flex, so a plain space between two of them
   is dropped — the gap between words has to be a character carrying a width of
   its own. Built from its code point rather than pasted: a literal no-break
   space in source is invisible to the next person to read this line, and
   indistinguishable from the ordinary space it must not be. */
const NBSP = String.fromCharCode(0xa0);

/* One run of copy, split to its letters.
 *
 * Two boxes each: .clip holds the letter's place in the row and masks it, .char
 * is the only thing that moves. Both the hero's arc and the reveal want the
 * transform property and one element cannot carry both — global.css has the
 * long version, under Hero.
 *
 * --i is where the letter stands along its row, which is what the hero's arc
 * reads (together with --letters on the row itself) to work out its point on
 * the curve. Written from the string rather than as :nth-child rules — the
 * markup is generated anyway, and the copy can change length without the
 * stylesheet knowing. Nothing else uses it, and it costs one custom property.
 *
 * Server-rendered wherever the caller is, so the split costs nothing on mount
 * and there is never a frame of unsplit text — unlike the runtime splitters
 * this pattern usually comes with.
 *
 * Shared by the hero's headline and the menu's labels: the two carry different
 * type and therefore different .clip padding, which is a stylesheet matter, but
 * the structure the reveals walk has to be one thing.
 */
export function letters(text: string): ReactNode[] {
  return [...text].map((ch, i) => (
    <span className="clip" key={i} style={{ "--i": i } as CSSProperties}>
      <span className="char">{ch === " " ? NBSP : ch}</span>
    </span>
  ));
}
