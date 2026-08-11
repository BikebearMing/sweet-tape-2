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

type Glyph = { letter: string; src: string };

const WORDS = marks.words as Record<string, Glyph[]>;

/* THE POOL. The bottom mark is one fixed set of spans sized to the longest word,
   not a list rebuilt per tape — the same call buildChips makes in engine.ts, and
   for the same reason: a swap happens while the letters are mid-dip, and
   replacing the elements would pull them out from under the tween holding them.

   So a tape does not change the DOM here. It changes ONE attribute, and
   letters.css re-points every span's stencil, width and arc index off it. Words
   shorter than the pool take their tail out of the flex flow with display:none,
   which is also generated. */
const POOL = Math.max(...Object.values(WORDS).map((w) => w.length));

/* The src is genuinely unused: the `content` line in global.css replaces the
   bitmap with this same 1x1, because the element paints --word-colour through
   the stencil and the original artwork would otherwise sit on top of it. Spares
   get it so the pool costs no requests it will never show. */
const BLANK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export function lettersOf(word: string): Glyph[] {
  return WORDS[word] ?? [];
}

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

/* The tape's word — CREATIVE, FIXER, RELIABLE... Each letter is wrapped so it
   has a box to be clipped by: the wrapper holds its place on the arc, the image
   inside does the dip. One element cannot carry both transforms.

   `word` is the first tape's, which is the first paint and the no-JS fallback;
   after mount the engine owns the attribute. */
export function BottomTitle({ word }: { word: string }) {
  const glyphs = lettersOf(word);
  return (
    <div className="bottom-title" data-word={word}>
      {Array.from({ length: POOL }, (_, i) => (
        <span className="glyph" key={i}>
          <img src={glyphs[i]?.src ?? BLANK} alt="" />
        </span>
      ))}
    </div>
  );
}

/** The words the two marks spell, for anyone not looking at pictures. */
export function wordmarkText(word: string): string {
  return `THE ${lettersOf(word)
    .map((g) => g.letter)
    .join("")}`;
}
