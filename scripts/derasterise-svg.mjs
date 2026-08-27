import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/* Swaps the PNG inside an SVG for a WebP of the same pixel dimensions.
 *
 * Run with:  node scripts/derasterise-svg.mjs
 *
 * WHY THESE FILES ARE HUGE. Each one is a Figma export of artwork that was
 * never vector: a single raster, base64'd into an <image> and displayed through
 * a <pattern>. Base64 costs a third again on top of an already-large PNG, and a
 * 3.7MB "SVG" is the result.
 *
 * WHY THE STRUCTURE IS LEFT ALONE. It is tempting to pull the raster out and
 * point an <img> at it, but the wrappers are not empty — one carries an alpha
 * mask and mix-blend-mode: screen, another a flip. Those are the drawing, not
 * packaging, and an <img> cannot carry them. So only the bytes between
 * `base64,` and the closing quote change: same dimensions, same transforms,
 * same mask, same blend. Nothing about how it paints moves.
 *
 * WHY NOT DOWNSCALE TOO. A 2000px raster in a 141-unit viewBox is oversampled
 * and there are more bytes to win there — but how large these actually paint
 * depends on CSS this script cannot see, and softening the artwork is a thing
 * you would notice long after the commit. Format first, because it is free;
 * resolution second, with a person looking at it.
 */

const FILES = [
  "public/assets/stationery-silent-opp-tape.svg",
  "public/assets/double-side.svg",
  "public/assets/cursor.svg",
  "public/assets/new-cursor.svg",
];

/* Quality 90 rather than the 80 the Media collection uses. That one is
   compressing photographs, where 80 is invisible; these are flat artwork with
   hard edges, which is exactly what shows ringing first. */
const QUALITY = 90;

const kb = (n) => `${(n / 1024).toFixed(0)}K`;

let before = 0;
let after = 0;

for (const rel of FILES) {
  const file = path.resolve(rel);
  const svg = await fs.readFile(file, "utf8");
  const startSize = Buffer.byteLength(svg);

  const match = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
  if (!match) {
    console.log(`${path.basename(rel)}: no embedded PNG, skipped`);
    continue;
  }

  const png = Buffer.from(match[1], "base64");
  const webp = await sharp(png).webp({ quality: QUALITY }).toBuffer();

  /* Same element, same id, same dimensions — only the payload and its mime
     type change, so every reference elsewhere in the file still resolves. */
  const out = svg.replace(
    match[0],
    `data:image/webp;base64,${webp.toString("base64")}`,
  );

  await fs.writeFile(file, out);

  const endSize = Buffer.byteLength(out);
  before += startSize;
  after += endSize;

  const cut = (100 * (1 - endSize / startSize)).toFixed(0);
  console.log(
    `${path.basename(rel).padEnd(34)} ${kb(startSize).padStart(6)} → ${kb(endSize).padStart(6)}  (−${cut}%)`,
  );
}

console.log(
  `\ntotal  ${kb(before)} → ${kb(after)}  (${kb(before - after)} saved)`,
);
