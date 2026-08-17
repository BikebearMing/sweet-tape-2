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

/* The same letters, in copy that WRAPS.
 *
 * letters() gives a row that cannot break — its boxes are flex items, and a flex
 * row lays them out on one line however long it gets. That is right for a
 * headline whose breaks are set by design, which is most of them on this site;
 * it is wrong for a long line that has to fit whatever box it is given, which is
 * the hero's cardboard copy and the lead story's title.
 *
 * So each WORD becomes an inline-flex box of letter clips. The letters row up
 * inside it, the line breaks BETWEEN the boxes exactly where the unsplit text
 * would have broken, and the spaces between them are real text nodes carrying
 * their own width — so the word spacing is the font's rather than a margin's.
 *
 * LONG TOKENS ARE CHUNKED FURTHER, after commas and hyphens: "EMERGENCY,LAST-"
 * is one whitespace token but three chunks. Adjacent chunks butt together
 * seamlessly because they are inline boxes with nothing between them, and the
 * line is allowed to break at the join — which is where plain text would have
 * broken too.
 *
 * --i restarts at each chunk, which the arc would care about and nothing that
 * uses this does: an arc is for a row of set width, and this is for copy that
 * does not know its own. The reveals only ever collect .char, and to them a
 * wrapped block is one pool of letters like any other.
 *
 * Server-rendered wherever the caller is, like letters() — no unsplit flash and
 * no splitter running on mount.
 */
export function words(text: string): ReactNode[] {
  return text.split(/\s+/).flatMap((token, t) => [
    t > 0 ? " " : null,
    ...token.split(/(?<=[,-])/).map((chunk, c) => (
      <span className="word" key={`${t}-${c}`}>
        {letters(chunk)}
      </span>
    )),
  ]);
}
