/* Regenerates src/styles/letters.css from src/data/wordmarks.json.
 *
 *   npm run letters
 *
 * Emits, per letter, only things that come straight from the artwork and none
 * of which should be typed by hand:
 *
 *   --glyph       the mask stencil (see the header it writes into letters.css)
 *   flex-grow     the letter's intrinsic pixel width, which is what gives each
 *                 letter its share of the word's vw width
 *   aspect-ratio  intrinsic width / height — needed because blanking the bitmap
 *                 in the CSS throws the intrinsic size away
 *   --i           the letter's place along the arc, which is just its index
 *
 * And per word: --letters, the count the arc divides by, plus the rule that
 * hides the tail of the pool. The bottom mark is ONE POOL of elements sized to
 * the longest word (see WordMarks.tsx), so a five-letter word is the same eight
 * spans with the last three taken out of the flex flow. Everything a word needs
 * therefore has to be scoped to it, which is what [data-word] does.
 *
 * Everything here is MEASUREMENT. Taste lives in src/styles/letters-tuning.css,
 * which is hand-written, scoped the same way, and imported after global.css so
 * that it overrides anything emitted here. That file is where a value goes when
 * the design wants something the artwork does not say — this script will
 * happily overwrite letters.css and cannot reach it.
 *
 * This is the one stylesheet global.css does not absorb, precisely because it is
 * rewritten wholesale here; global.css @imports it, so the layout still pulls in
 * a single file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const marks = JSON.parse(readFileSync(join(ROOT, "src/data/wordmarks.json"), "utf8"));

/* THE ARTWORK'S INTRINSIC SIZE, READ OUT OF THE FILE HEADER.
 *
 * No image library — the two things this needs are four numbers near the front
 * of the file, and a build script that can be run with plain node is worth more
 * than one that cannot. It reads PNG and WebP because the letter artwork was
 * converted to WebP and the PNGs it was made from may still be sitting beside
 * it; whichever wordmarks.json names is what gets measured.
 *
 * WEBP IS THREE FORMATS IN ONE CONTAINER and all three have to be handled,
 * because which one comes out is an encoder decision rather than ours: a
 * lossless encode is VP8L, a lossy one is VP8, and either becomes VP8X the
 * moment the file carries an alpha chunk or metadata. Guessing wrong here does
 * not throw — it returns two plausible numbers off the wrong offsets, and the
 * damage lands in letters.css as a letter with the wrong aspect ratio. */
function dims(webPath) {
  const b = readFileSync(join(ROOT, "public", webPath));

  /* PNG: the IHDR's width and height are big-endian uint32 at 16 and 20. */
  if (b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }

  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);

    /* VP8X — the extended container. The canvas size is what matters and it is
       stored MINUS ONE, as two 24-bit little-endian values at 24 and 27. */
    if (chunk === "VP8X") {
      return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    }

    /* VP8L — lossless. One 32-bit little-endian word at 21 carries both, 14
       bits each and again minus one, width in the low bits. */
    if (chunk === "VP8L") {
      const v = b.readUInt32LE(21);
      return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 };
    }

    /* VP8 — lossy. Past the 3-byte frame tag and the 3-byte sync code, two
       16-bit little-endian values whose low 14 bits are the dimensions. */
    if (chunk === "VP8 ") {
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
  }

  throw new Error(`dims: not a PNG or WebP — ${webPath}`);
}

/* THE. Three letters that never change, sharing out one fixed width — so each
   one's grow value is its intrinsic width and the aspect ratio gives it back
   the height that width threw away. */
function fixedWidthRules(selector, list) {
  return list
    .map((g, i) => {
      const d = dims(g.src);
      return (
        `\n/* ${g.letter} — ${d.w}x${d.h} */\n` +
        `${selector}:nth-child(${i + 1}) {\n` +
        `  --glyph: url("${g.src}");\n` +
        `  flex-grow: ${d.w};\n` +
        `  aspect-ratio: ${d.w} / ${d.h};\n` +
        `}\n`
      );
    })
    .join("");
}

/* The tape's word, which is a different problem: six words of five to eight
   letters have to read as ONE type size, and dividing a fixed width between
   them does the opposite — the fewer the letters the bigger each one gets.
   CREATIVE came out 216px tall and SILENT 157px, off the same stylesheet.

   The artwork settles it. Every letter of every word is cropped tight to its
   ink (measured: no transparent margin anywhere) and drawn at one size — ink
   heights run 199 to 244 across all six words, which is letterform and optical
   overshoot, not scale. So the letters are simply laid out AT that size, scaled
   by one number: --unit, one artwork pixel on screen. The word's width is then
   whatever the word happens to be, and the cap height is the same everywhere.

   Both dimensions are emitted, so nothing has to be inferred from the other:
   aspect-ratio would do, but only until a letter needs nudging. */
function drawnSizeRules(selector, list) {
  return list
    .map((g, i) => {
      const d = dims(g.src);
      return (
        `\n/* ${g.letter} — ${d.w}x${d.h} */\n` +
        `${selector}:nth-child(${i + 1}) {\n` +
        `  --glyph: url("${g.src}");\n` +
        `  --lw: ${d.w};\n` +
        `  --lh: ${d.h};\n` +
        `  --i: ${i};\n` +
        `}\n`
      );
    })
    .join("");
}

const words = Object.entries(marks.words);

/* The word every other word is matched to. CREATIVE, because it is the mark the
   design was signed off on and the one already on the page at the right size —
   matching to it means the tape that was already right does not move. */
const REF_WORD = "creative";

/* A word's cap height, as the MEDIAN of its letters rather than the tallest or
   the mean. The letters within a word vary by design — round ones overshoot
   flat ones by a few px, and that overshoot is the artwork's and must survive.
   What must not survive is the variation BETWEEN words, which is export drift:
   RELIABLE is drawn about 6% larger than SILENT, and left alone the two words
   arrive at visibly different type sizes.

   Median rather than max because a word can have one outlier — RELIABLE's R is
   244 against a body of 228s — and matching on it would shrink the other seven
   letters to correct for one. */
function capOf(list) {
  const hs = list.map((g) => dims(g.src).h).sort((a, b) => a - b);
  const mid = hs.length >> 1;
  return hs.length % 2 ? hs[mid] : (hs[mid - 1] + hs[mid]) / 2;
}

const REF_CAP = capOf(marks.words[REF_WORD]);
/* The pool every word is laid into. Exported to WordMarks.tsx through
   wordmarks.json rather than duplicated: the component counts the same lists. */
const POOL = Math.max(...words.map(([, l]) => l.length));

const wordBlocks = words
  .map(([name, list]) => {
    const scope = `.bottom-title[data-word="${name}"]`;
    const spare =
      list.length < POOL
        ? `\n/* The pool runs to ${POOL}; ${name.toUpperCase()} is ${list.length}. display:none rather\n` +
          `   than opacity, so the spares take no width in the flex row. */\n` +
          `${scope} .glyph:nth-child(n + ${list.length + 1}) {\n  display: none;\n}\n`
        : "";
    const ink = list.reduce((sum, g) => sum + dims(g.src).w, 0);
    const cap = capOf(list);
    /* How much this word has to be scaled to sit at the reference cap height.
       Exactly 1 for the reference word itself, which is the point. */
    const match = REF_CAP / cap;
    const unit =
      name === REF_WORD
        ? `  /* the reference word — its --unit IS the base */\n`
        : `  /* cap ${cap} against ${REF_WORD}'s ${REF_CAP} — ${
            match > 1 ? "drawn small" : "drawn large"
          }, so scaled ${match > 1 ? "up" : "down"} */\n` +
          `  --unit: calc(var(--unit-base) * ${match.toFixed(4)});\n`;
    return (
      `\n/* ------------------------------------------------------------------\n` +
      `   ${name.toUpperCase()} — ${list.length} letters, ${ink} artwork px wide,\n` +
      `   median cap ${cap}. Lands at ${(ink * 0.0674 * match).toFixed(1)}vw of word.\n` +
      `   ------------------------------------------------------------------ */\n` +
      `${scope} {\n  --letters: ${list.length};\n` +
      unit +
      `}\n` +
      drawnSizeRules(`${scope} .glyph`, list) +
      spare
    );
  })
  .join("");

const out = `/* ==========================================================================
   GENERATED by scripts/gen-letters.mjs — hand edits here are LOST.
   Run \`npm run letters\` after changing src/data/wordmarks.json or the artwork.

   TO CHANGE A VALUE BY HAND, put it in src/styles/letters-tuning.css instead.
   Copy the selector out of this file verbatim, change the value there, and it
   takes — that file is imported after global.css, so it is later in the cascade
   than anything here, and regenerating this one cannot touch it. Its header
   lists everything that can be overridden.

   Pulled in by global.css, which @imports it rather than absorbing it — this
   file is machine-written and that one is not.

   Letter stencils. The artwork is used as a MASK rather than shown: the element
   paints --word-colour and the stencil punches the letter out of it, which is
   what lets one set of images take every tape's colour. Only the alpha channel
   is read, so it does not matter that the delivery draws each word in its own
   ink — FIXER's letters are blue in the file and lime on the page.

   Plain url() paths, not base64 data URIs. Masks are subject to same-origin,
   which a file:// page fails — the old static build had to inline all the
   artwork for that reason alone. Served over HTTP by Next, the paths just work,
   and the browser caches the PNGs like any other image.

   THE is fixed. The bottom word belongs to the tape: every word below is a
   complete set of stencils for the SAME pool of spans, selected by the
   data-word the engine writes on .bottom-title as the letters dip out of sight.

   The two marks are sized by opposite rules, which is deliberate — see
   drawnSizeRules in the generator. THE shares out a fixed width. The tape's
   word is laid out at the size it was DRAWN at, so six words of different
   lengths come out one type size and different widths.
   ========================================================================== */

/* THE — the mask is also what animates; global.css slides mask-position. */
${fixedWidthRules(".top-title img", marks.the)}
/* ==========================================================================
   The bottom mark, once per word. The mask stays parked at 0 0 and travels
   with the image; .glyph does the clipping.
   ========================================================================== */
${wordBlocks}`;

writeFileSync(join(ROOT, "src/styles/letters.css"), out);
console.log(
  `wrote src/styles/letters.css — ${(out.length / 1024).toFixed(1)}KB, ` +
    `${marks.the.length} for THE, ${words.length} words in a pool of ${POOL} ` +
    `(${words.map(([n, l]) => `${n}:${l.length}`).join(", ")})`
);
