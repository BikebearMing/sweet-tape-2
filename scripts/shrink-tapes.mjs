/* Re-encodes the textures inside public/assets/tapes/*.glb.
 *
 *   npm run tapes            report what it would do, change nothing
 *   npm run tapes -- --write actually write the files
 *
 * RUN IT AFTER EVERY RE-EXPORT FROM BLENDER, and read the report before
 * writing. A fresh export arrives with print-resolution maps baked into it and
 * is between five and ten times the size it needs to be; this is the step that
 * makes it a web asset. It is deliberately NOT part of the build — it rewrites
 * files in place and lossily, so running it twice on the same file re-encodes
 * an already-encoded JPEG. Restore from git and re-run rather than stacking it.
 *
 * WHAT IT FOUND THE FIRST TIME, because the numbers are the argument for it
 * existing at all. Ten files, 22.6 MB. Geometry was 60 KB of that per model —
 * 1,832 verts and 1,394 triangles, which is why Draco is NOT in this script and
 * would have been the wrong tool: it compresses the one part of these files
 * that was never the problem. Textures were 97-99% of every file. One map,
 * cloth-tape-side, was 7891x3396 — 136 MB of GPU memory on its own, for a roll
 * that is never drawn wider than 1146 device pixels anywhere on the site.
 * Afterwards: 4.6 MB on disk, and the six models the slider holds resident went
 * from 412 MB of texture memory to 143 MB.
 *
 * THREE THINGS IT DOES NOT DO, each for a reason worth keeping:
 *
 *   NO GLTF EXTENSION. Not EXT_texture_webp, not KHR_texture_basisu. WebP would
 *   be smaller again on the wire and KTX2 would stay compressed on the GPU,
 *   which is the only thing that fixes MEMORY rather than download — but both
 *   are extensions, and an extension listed as required is a file that a loader
 *   which does not know it will refuse outright rather than render imperfectly.
 *   Everything here stays plain JPEG in a plain GLB, so any loader that read
 *   these files before reads them after. Check extensionsRequired stays `none`.
 *
 *   NO DEDUPLICATION ACROSS FILES. Three maps — tape-inner-texture, the
 *   seamless one and SWEET_TAPE_CORE — are byte-identical in every export, and
 *   they are most of what is left: about 94 MB of the 143. three.js does not
 *   share textures between separately-loaded GLBs, so each file's copy becomes
 *   its own GPU upload. Fixing that means external textures or applying the
 *   shared maps in code, and both are changes to how the viewer loads rather
 *   than to what is in the files.
 *
 *   NO PRUNING. gltf-transform will happily drop unreferenced materials, and
 *   TapeSlider/tape3d.ts keys its finishes off MATERIAL NAMES. A prune that
 *   removed a name the code mentions would fail silently and at runtime.
 */
import { NodeIO, VertexLayout } from "@gltf-transform/core";
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public/assets/tapes");
const WRITE = process.argv.includes("--write");

/* THE TWO CAPS, AND THE MEASUREMENT UNDER THEM.
 *
 * The roll is drawn in three places and the largest is /products/[id]: a 573px
 * canvas at devicePixelRatio 2, so 1146 device pixels for the WHOLE roll. That
 * is the number both of these are set against, and it is worth re-measuring if
 * the layout ever gives the roll more room.
 *
 * A FACE is the label disc, read square-on, so its texels map about one-to-one
 * onto those 1146 pixels — 1024 is a hair under and mipmapping covers the
 * difference. A WRAP runs around the circumference: half of it is visible at
 * once, so its long edge is stretched across roughly the same 1146 pixels while
 * carrying twice as much artwork, which is why it gets twice the budget.
 *
 * Told apart by aspect ratio rather than by name, because the names come from
 * whoever exported them and change. Anything longer than 2:1 is a strip that
 * goes round something. */
const WRAP_ASPECT = 2;
const CAP_WRAP = 2048;
const CAP_FACE = 1024;

/* 4:4:4 rather than the usual 4:2:0. The label artwork is saturated flat brand
   colour with hard edges between fields, which is precisely what chroma
   subsampling smears — and at these dimensions the extra chroma costs tens of
   kilobytes, not hundreds. */
const JPEG = { quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" };

/* SEPARATE, AND THIS ONE LINE IS NOT A PREFERENCE — IT IS A BUG FIX.
 *
 * gltf-transform writes INTERLEAVED vertex data by default: POSITION, NORMAL
 * and TEXCOORD_0 woven into one buffer at a 32-byte stride, instead of three
 * packed arrays. It is a perfectly legal glTF and a marginally better one; the
 * numbers are bit-for-bit the same either way.
 *
 * IT BROKE THE HOMEPAGE HERO. Hero/heroTape.ts domes the label disc — it fans
 * the face's normals radially outward so a flat disc catches the key like a
 * wound roll does (FILM.DOME) — and to re-apply that against the export's own
 * normals rather than compounding it, it takes a snapshot of them. That
 * snapshot used to read the attribute's raw `.array`, which for a packed
 * attribute IS the normals and for an interleaved one is the whole woven buffer.
 * Read at stride 3 it returned a blend of positions and UVs, applyDome fanned
 * garbage axes across the face, and the roll grew a hard faceted wedge across
 * the label instead of a smooth highlight.
 *
 * The snapshot has since been fixed to read through the attribute API, so it no
 * longer cares. This stays anyway, for two reasons: the packed layout is what
 * every one of these exports arrived in, so writing it back is the change that
 * changes nothing; and three.js has other places that hand you `.array`. Making
 * the asset boring is cheaper than auditing every one of them.
 *
 * If you ever want interleaving back, re-render the hero and diff it. The
 * measurement that caught this was RMSE 9.74 against a noise floor of 0.76. */
const io = new NodeIO().setVertexLayout(VertexLayout.SEPARATE);
let before = 0;
let after = 0;

for (const file of readdirSync(DIR).filter((n) => n.endsWith(".glb")).sort()) {
  const path = join(DIR, file);
  const size0 = statSync(path).size;
  before += size0;

  const doc = await io.read(path);
  const notes = [];

  for (const tex of doc.getRoot().listTextures()) {
    const image = tex.getImage();
    if (!image) continue;

    const m = await sharp(image).metadata();
    const aspect = Math.max(m.width / m.height, m.height / m.width);
    const cap = aspect > WRAP_ASPECT ? CAP_WRAP : CAP_FACE;
    const wide = m.width >= m.height;

    /* ALPHA OFF FIRST, AND WITHOUT COMPOSITING IT.
     *
     * Every material in every one of these exports is alphaMode: OPAQUE, so the
     * renderer has never once sampled the alpha channel the PNGs carry — it is
     * left over from however they were baked. Dropping it is what lets all of
     * them become JPEG, which is most of the size win on the face discs.
     *
     * removeAlpha() and not flatten(): removeAlpha discards the channel and
     * leaves RGB exactly as it stands, where flatten would composite the
     * transparent regions onto a background colour and so rewrite the very
     * pixels the renderer DOES read. The two differ only in the parts of the
     * image nobody can see, which is exactly where a silent change hides.
     *
     * Before the resize, not after, so the downscale averages the same three
     * channels the GPU is mipmapping today. */
    let pipe = sharp(image).removeAlpha();

    if (Math.max(m.width, m.height) > cap) {
      pipe = pipe.resize({
        width: wide ? cap : undefined,
        height: wide ? undefined : cap,
        fit: "inside",
        kernel: "lanczos3",
      });
    }

    const out = await pipe.jpeg(JPEG).toBuffer();
    const m2 = await sharp(out).metadata();

    if (WRITE) {
      tex.setImage(new Uint8Array(out));
      tex.setMimeType("image/jpeg");
    }

    notes.push(
      `  ${`${m.width}x${m.height}`.padEnd(11)} -> ${`${m2.width}x${m2.height}`.padEnd(11)}` +
        ` ${`${(image.byteLength / 1024).toFixed(0)}k`.padStart(6)} ->` +
        ` ${`${(out.byteLength / 1024).toFixed(0)}k`.padStart(6)}  ${tex.getName()}`,
    );
  }

  if (WRITE) await io.write(path, doc);
  const size1 = WRITE ? statSync(path).size : size0;
  after += size1;

  console.log(`${file}  ${(size0 / 1048576).toFixed(2)} MB -> ${(size1 / 1048576).toFixed(2)} MB`);
  for (const n of notes) console.log(n);
}

console.log(
  `\n${WRITE ? "" : "[dry run — pass --write to apply] "}` +
    `TOTAL ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB` +
    (before ? `  (-${(100 * (1 - after / before)).toFixed(1)}%)` : ""),
);
