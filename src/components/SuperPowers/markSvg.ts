import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

/* AN UPLOADED DRAWING, MADE SAFE TO INLINE THREE TIMES ON ONE PAGE.
 *
 * WHY THIS FILE EXISTS AT ALL. The mark on a superpower card cannot be an
 * <img>. The bounce has to fire when the card takes its turn in the stack, and
 * an external SVG is a document of its own: nothing in the host page can reach
 * inside it to start, stop or restart an animation, and CSS does not cross that
 * boundary. So the drawing has to become ordinary DOM in this page — and the
 * moment a file an editor chose is inlined into a page, four things that were
 * somebody else's problem become this one's.
 *
 *   IDS COLLIDE. Every export names its paths — Vector_2, Group_650 — and three
 *   cards mean three copies of every one of them. Duplicate ids are invalid, and
 *   the first gradient or clip path anybody adds resolves to whichever copy the
 *   browser saw first. Every id here is suffixed per file, references included.
 *
 *   STYLE BLOCKS LEAK. A <style> inside an inline SVG is scoped to the DOCUMENT,
 *   not to the SVG. An export that says `svg { overflow: visible }` says it about
 *   every SVG on the page, and two exports that both define
 *   `@keyframes kf_Group_820_transform_0` define it twice and one wins. Every
 *   selector is rewritten under a class unique to the file, and every keyframe
 *   name is suffixed the same way.
 *
 *   THE ANIMATION WOULD RUN ON PAGE LOAD, in all three cards at once, whether or
 *   not any of them was on screen — which is the one behaviour the section is
 *   built to avoid. It does not, because global.css takes every animation off
 *   the mark until the slot says its turn has come. That is the SAME switch the
 *   built-in mark has always used; see .powers-mark--live there.
 *
 *   AND IT MIGHT NOT BE THE SIZE THE BOUNCE WAS DRAWN FOR. See NORMALISING.
 *
 * TWO KINDS OF FILE, TOLD APART AND TREATED DIFFERENTLY.
 *
 *   A file that ANIMATES ITSELF — a <style> with @keyframes in it, or SMIL — is
 *   left to do so. Its motion is its own and the section only decides when it
 *   plays. This is what the design's own export is: see public/assets/
 *   svgviewer-output.svg, whose sixty-seven-stop bounce was lifted into
 *   global.css by hand when there was one mark. Once there is a mark per claim,
 *   that lift is a ritual to repeat per file, and the export can simply be used.
 *
 *   A file that does NOT is dropped onto the card by the section's own bounce,
 *   which is that same lifted animation and is still in global.css. Its contents
 *   are wrapped in .powers-mark-jump, the group the keyframes move.
 *
 * NORMALISING, and it is only for the second kind. Those keyframes are baked in
 * the export's own user units — a 96-unit fall, a squash pivoted at
 * (197.938, 182.651) — so they mean what they were drawn to mean only inside a
 * 438x418 box. A drawing in any other viewBox is fitted into that box and the
 * root's viewBox is restated, so the fall is the fall whatever was uploaded.
 * The scale sits INSIDE the animated group on purpose: outside it, it would
 * multiply the animation's own translations and the mark would fall a distance
 * that depended on how the artboard happened to be cropped.
 *
 * SANITISED AGAIN HERE, though Payload already refuses an upload carrying a
 * script tag, an event handler, a javascript: URL or a foreignObject
 * (uploads/validateSvg.js). This is not distrust of that check — it is that the
 * check guards the UPLOAD and this is the INLINE, and the two are far enough
 * apart in the code that a future storage adapter or a hand-placed file could
 * reach here without passing it. The cost is one pass over a few kilobytes.
 */

/** A drawing, ready to be put inside an <svg> this page owns. */
export type MarkArt = {
  /** The innards, for dangerouslySetInnerHTML. */
  inner: string;
  /** What the root element should carry. */
  viewBox: string;
  /** The file animates itself and only needs starting. See above. */
  live: boolean;
  /** The class its own CSS was scoped under, and which the root must carry.
   *  Empty when the file brought no CSS with it. */
  scope: string;
};

/** The box the section's own bounce was drawn in. Do not change without
 *  changing @keyframes powers-mark-drop in global.css, which is baked in it. */
const FRAME = { w: 438, h: 418 };

/* Where the uploads are. The same directory the Media collection writes to, by
   the same rule: MEDIA_DIR in production, where it is a mounted volume, and the
   repository's own public/media in development. Resolved from the working
   directory rather than from this file, because under output: "standalone" this
   module is bundled into .next/standalone and a path relative to it lands
   nowhere a volume is mounted. */
const MEDIA_DIR =
  process.env.MEDIA_DIR || path.resolve(process.cwd(), "public/media");

/* AND THIS IS THE ONE THING THAT BREAKS IF UPLOADS EVER MOVE OFF DISK. Every
   other picture on this site is handed to the browser as a URL, so a storage
   adapter (@payloadcms/storage-s3, which is on the list) could be dropped in
   and nothing would notice. This reads the BYTES, because a drawing that has to
   be inlined cannot be fetched by the markup that inlines it. If the media ever
   moves to R2, this is the call site to change: markArt keeps its shape and
   fetches over HTTP instead, and the cache below stops being an optimisation
   and starts being the thing that makes it viable. */

/* READ ONCE PER FILE, NOT ONCE PER RENDER. The whole front end is
   force-dynamic, so a product page is built again on every request — and each
   one draws three marks. Without this, that is three file reads and three
   parses per visitor for bytes that changed the last time an editor pressed
   save.

   KEYED BY updatedAt, which is what makes it safe: replacing the file moves the
   timestamp, the key misses, and the new drawing is read. The old entry is left
   behind, which is a few kilobytes per replacement in a process that restarts
   on every deploy — a cheaper answer than an eviction policy for a map that
   holds one entry per mark on the site. */
const cache = new Map<string, MarkArt | null>();

/** A short, STABLE tag for one file. Stable matters more than it looks: it ends
 *  up in a class name in the server's HTML, and a random one would differ
 *  between the render React sends and the tree it hydrates against. */
function tagOf(key: string): string {
  return "m" + createHash("sha1").update(key).digest("hex").slice(0, 8);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Anything that could execute. See SANITISED AGAIN, above. */
function sanitise(svg: string): string {
  return svg
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*script\b[^>]*\/\s*>/gi, "")
    .replace(/<\s*foreignObject[\s\S]*?<\s*\/\s*foreignObject\s*>/gi, "")
    .replace(/<\s*(iframe|object|embed)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    /* Event handler attributes, in all three quotings. */
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Every id the file declares, and every reference to one, suffixed so that two
 *  copies of the same export on one page cannot claim the same name.
 *
 *  REFERENCES ARE REWRITTEN FIRST AND ONLY FOR IDS WE KNOW. A blanket rewrite of
 *  everything after a `#` would rename `#f9dd55` — CSS hex colours are not
 *  fragment references, and an export's own <style> is full of them. Restricting
 *  the match to declared names is what makes the pass safe to run over markup
 *  and stylesheet together, which it has to be: `#Group_820` appears in both. */
function namespaceIds(svg: string, tag: string): string {
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) ids.add(m[1]);
  if (!ids.size) return svg;

  const names = [...ids].map(escapeRe).join("|");
  const refs = new RegExp(
    `(url\\(\\s*#|(?:xlink:)?href\\s*=\\s*["']\\s*#|#)(${names})(?![\\w-])`,
    "g",
  );

  return svg
    .replace(refs, (_m, lead: string, id: string) => `${lead}${id}-${tag}`)
    .replace(
      /(\sid\s*=\s*["'])([^"']+)(["'])/g,
      (_m, a: string, id: string, b: string) => `${a}${id}-${tag}${b}`,
    );
}

/** One selector list, moved under the file's own class.
 *
 *  `svg` becomes the class itself rather than a descendant of it, because the
 *  class is ON the root element — `.mk svg` would match nothing, and the
 *  overflow rule every one of these exports carries is load-bearing: the mark
 *  starts its fall above the frame and would be clipped without it. */
function scopeSelectors(list: string, scope: string): string {
  return list
    .split(",")
    .map((sel) => {
      const s = sel.trim();
      if (!s) return "";
      if (s === "svg" || s === ":root") return scope;
      if (/^svg(?![\w-])/i.test(s)) return scope + s.slice(3);
      return `${scope} ${s}`;
    })
    .filter(Boolean)
    .join(",");
}

/** Walk the top level of a stylesheet, rewriting rule preludes.
 *
 *  Brace-matched rather than parsed. These files come out of a drawing tool and
 *  their CSS is a handful of keyframe blocks and a handful of id rules — a real
 *  parser would be a dependency and a week of edge cases to handle a stylesheet
 *  nobody wrote by hand. What it does not handle it leaves alone: a keyframes
 *  body is copied through untouched (its percentages are not selectors), and an
 *  at-rule it does not recognise keeps its own prelude. */
function rewriteRules(css: string, scope: string): string {
  let out = "";
  let i = 0;

  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) break;

    const head = css.slice(i, open).trim();

    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = css.slice(open + 1, j - 1);

    if (/^@(?:-webkit-)?keyframes\b/i.test(head) || /^@font-face\b/i.test(head)) {
      out += `${head}{${body}}`;
    } else if (/^@(?:media|supports|layer|container)\b/i.test(head)) {
      out += `${head}{${rewriteRules(body, scope)}}`;
    } else if (head.startsWith("@")) {
      out += `${head}{${body}}`;
    } else {
      out += `${scopeSelectors(head, scope)}{${body}}`;
    }

    i = j;
  }

  return out;
}

/** The file's own stylesheet, made local to the file.
 *
 *  Keyframe names are suffixed by a whole-word replace across the whole sheet,
 *  which is how the `animation:` shorthand that names one gets updated without
 *  parsing the shorthand. These names are the tool's own — kf_Group_820_
 *  transform_0 — so a collision with an unrelated word in the same sheet is not
 *  a risk worth a parser. */
function scopeCss(css: string, scope: string, tag: string): string {
  const names = new Set<string>();
  for (const m of css.matchAll(/@(?:-webkit-)?keyframes\s+([A-Za-z_][\w-]*)/g)) {
    names.add(m[1]);
  }
  for (const n of names) {
    css = css.replace(new RegExp(`\\b${escapeRe(n)}\\b`, "g"), `${n}_${tag}`);
  }
  return rewriteRules(css, scope);
}

/** The transform that fits one artboard into the box the bounce was drawn for.
 *  Uniform and centred — a drawing squashed to fill the frame would be a
 *  different drawing. */
function fitInto(viewBox: number[]): string {
  const [minX, minY, w, h] = viewBox;
  if (!(w > 0) || !(h > 0)) return "";

  const k = Math.min(FRAME.w / w, FRAME.h / h);
  const tx = (FRAME.w - w * k) / 2 - minX * k;
  const ty = (FRAME.h - h * k) / 2 - minY * k;

  const r = (n: number) => Number(n.toFixed(4));
  return `translate(${r(tx)} ${r(ty)}) scale(${r(k)})`;
}

/** The root element's own box, in user units. Falls back to width/height, and
 *  then to the frame — a file with neither is one the browser would size to its
 *  container anyway, and the frame is the right container here. */
function viewBoxOf(attrs: string): number[] {
  const vb = /viewBox\s*=\s*["']([^"']+)["']/i.exec(attrs);
  if (vb) {
    const n = vb[1].trim().split(/[\s,]+/).map(Number);
    if (n.length === 4 && n.every((x) => Number.isFinite(x))) return n;
  }

  const w = Number(/\bwidth\s*=\s*["']([\d.]+)/i.exec(attrs)?.[1]);
  const h = Number(/\bheight\s*=\s*["']([\d.]+)/i.exec(attrs)?.[1]);
  if (w > 0 && h > 0) return [0, 0, w, h];

  return [0, 0, FRAME.w, FRAME.h];
}

/** One uploaded file, transformed. Null when there is nothing usable, which the
 *  card reads as "draw the built-in mark" rather than as an error. */
function build(source: string, tag: string): MarkArt | null {
  const svg = sanitise(source);

  const open = /<svg\b([^>]*)>/i.exec(svg);
  const close = svg.lastIndexOf("</svg");
  if (!open || close === -1) return null;

  const attrs = open[1];
  const box = viewBoxOf(attrs);

  let inner = svg.slice(open.index + open[0].length, close);
  inner = namespaceIds(inner, tag);

  /* The file's stylesheet, lifted out of the markup so it can be scoped and put
     back as one block. More than one <style> is legal and some tools emit
     several; they are concatenated because they were always one cascade. */
  const scope = `.${tag}`;
  let css = "";
  inner = inner.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_m, body: string) => {
      css += body;
      return "";
    },
  );

  const live =
    /@(?:-webkit-)?keyframes\b/i.test(css) ||
    /<animate(?:Transform|Motion)?\b|<set\b/i.test(inner);

  const style = css.trim() ? `<style>${scopeCss(css, scope, tag)}</style>` : "";

  /* A file that moves itself keeps its own box: its animation is written in
     those units and refitting it would be rewriting the animation. */
  if (live) {
    return {
      inner: style + inner,
      viewBox: box.join(" "),
      live: true,
      scope: tag,
    };
  }

  /* And one that does not is fitted into the frame the section's bounce was
     drawn in, then handed to it. */
  const fit = fitInto(box);
  const fitted = fit ? `<g transform="${fit}">${inner}</g>` : inner;

  return {
    inner: `${style}<g class="powers-mark-jump">${fitted}</g>`,
    viewBox: `0 0 ${FRAME.w} ${FRAME.h}`,
    live: false,
    scope: css.trim() ? tag : "",
  };
}

/** A photograph or a flat export, in the same frame and dropped by the same
 *  bounce. Not the intended thing to put on a card, but silently ignoring what
 *  an editor uploaded is worse than drawing it — and it is one element. */
function raster(filename: string, tag: string): MarkArt {
  const href = `/api/media/file/${encodeURIComponent(filename)}`;
  return {
    inner:
      `<g class="powers-mark-jump">` +
      `<image href="${href}" x="0" y="0" width="${FRAME.w}" height="${FRAME.h}" ` +
      `preserveAspectRatio="xMidYMid meet" />` +
      `</g>`,
    viewBox: `0 0 ${FRAME.w} ${FRAME.h}`,
    live: false,
    scope: "",
  };
}

/** The mark on one card, or null to fall back to the built-in one.
 *
 *  Null rather than a throw on a missing file, and that is the case this most
 *  needs to survive: the database and the volume are separate things, and a row
 *  restored from a backup can name a file that is not on this disk. A card with
 *  the stock mark on it is a page; an exception here is a 500 on a product. */
export async function markArt(
  file: { filename?: string | null; updatedAt?: string | null } | null,
): Promise<MarkArt | null> {
  const filename = file?.filename;
  if (!filename) return null;

  const key = `${filename}:${file?.updatedAt ?? ""}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const tag = tagOf(key);
  let art: MarkArt | null = null;

  if (/\.svg$/i.test(filename)) {
    try {
      art = build(await readFile(path.join(MEDIA_DIR, filename), "utf8"), tag);
    } catch {
      art = null;
    }
  } else {
    art = raster(filename, tag);
  }

  cache.set(key, art);
  return art;
}
