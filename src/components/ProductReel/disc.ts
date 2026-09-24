/* Sweet Tape — the label without the shadow it was exported with.
 *
 * THE SHADOW IS IN THE ARTWORK, not in the stylesheet: the card files carry a
 * faint black disc offset down and to the right, and the same files are the
 * slider's, the products row's and the next-up roll's — so it cannot be taken
 * out of the file for this section alone, and no CSS reaches inside an <img>.
 * It can be CUT OFF, though: the label is an opaque disc and the shadow is not,
 * so the badge is clipped to the disc.
 *
 * MEASURED OFF THE PIXELS rather than typed per tape, because the six files do
 * not agree — the disc is 96.8% of one, 94.2% of another and all of a third —
 * and the cards are CMS uploads, so a table of figures here would be wrong the
 * first time one is replaced. Same-origin, so the canvas is readable.
 *
 * ponytail: one 128px canvas read per page. If a card is ever served from
 * another origin the read throws, and the badge simply keeps its shadow.
 */
const SIZE = 128;
/* The label is fully opaque and its shadow is about a tenth of that; anything
   well between the two separates them. */
const OPAQUE = 200;

export function clipToDisc(img: HTMLImageElement): void {
  const run = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

      let l = SIZE, r = -1, t = SIZE, b = -1;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          if (data[(y * SIZE + x) * 4 + 3] <= OPAQUE) continue;
          if (x < l) l = x;
          if (x > r) r = x;
          if (y < t) t = y;
          if (y > b) b = y;
        }
      }
      if (r < 0) return;

      const pct = (v: number) => `${((v / SIZE) * 100).toFixed(2)}%`;
      img.style.clipPath = `ellipse(${pct((r - l + 1) / 2)} ${pct((b - t + 1) / 2)} at ${pct((l + r + 1) / 2)} ${pct((t + b + 1) / 2)})`;
    } catch {
      /* A tainted canvas. The badge keeps its shadow. */
    }
  };

  if (img.complete && img.naturalWidth) run();
  else img.addEventListener("load", run, { once: true });
}
