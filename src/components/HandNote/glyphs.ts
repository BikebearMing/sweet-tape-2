/* Sweet Tape — the written alphabet, and the metrics the export did not carry.
 *
 * THE NOTE IS NO LONGER SET IN VARA. Vara built its letterforms at runtime from
 * a JSON font of drawn strokes; this reads a folder of per-glyph exports drawn
 * by hand for this site — /assets/Outcome, one file per character — and turns
 * each of them into the two things a note needs: some INK, and a PEN PATH that
 * uncovers it. Everything downstream is unchanged, which was the point of doing
 * it this way: a glyph is still a dashed path pulled back to zero, so the ruled
 * margin and the writing still share one timeline and still read as one hand.
 *
 * WHAT IS IN ONE OF THOSE FILES. A Lottie comp, 500x500, containing a trimmed
 * PNG of the letter and a mask drawn along the middle of it, with an After
 * Effects Stroke effect set to "reveal original image": as the stroke sweeps the
 * mask, it uncovers the PNG under it. That is a pen, exactly, and it is why none
 * of this needs a Lottie player. The mask becomes an SVG <mask> whose path is
 * dashed off its own end; the PNG becomes an <image> wearing it. Pulling the
 * dash to zero writes the letter.
 *
 * NO LOTTIE PLAYER, AND THAT IS NOT ONLY TIDINESS. The lab proved a player per
 * glyph works, but a note is around sixty characters and the product page
 * carries two of them — a hundred and twenty players, each with its own parsed
 * copy of a comp, each driven by its own tween pushing frames in with
 * goToAndStop, none of them able to share the timeline the ruled margin is on.
 * The whole of what those players were doing is transcribed below in about forty
 * lines, and what comes out the other end is one <svg> per note.
 *
 * THE METRICS ARE NOT IN THE FILES AND HAVE TO BE SUPPLIED HERE — see BASELINE,
 * which is the whole of the awkwardness and says why at length. The short
 * version: every glyph is centred in its own comp, so nothing in the export says
 * where the writing line is. The lab (/lab/lottie-note) shows the same thing
 * three ways and is where these figures were arrived at.
 */

/* WHERE THE GLYPHS LIVE. The folder is named for how it arrived rather than for
   what it is, and it is one line to move — but a re-export will land wherever
   the last one did, so it is left where the artwork is actually delivered. */
const DIR = "/assets/Outcome";

/* THE COMP, WHICH IS THE EM. Every file is 500x500 and every glyph is drawn at
   the same pen size inside it, so a comp unit means the same thing in every file
   and one comp box is the natural em for setting them. Everything in this module
   and in the layout is in these units. */
export const COMP = 500;

/* THE HAND'S X-HEIGHT, measured off the exports rather than declared: the
   letters with neither an ascender nor a descender all come out within a few
   units of each other — a 290, e 287, o 303, n 258, m 246, s 307, x 302 — and
   this is the middle of that. It is here because BASELINE is derived from it and
   because the synthetic hyphen below has to be placed against it. */
export const X_HEIGHT = 287;

/* THE ONE FILENAME THAT IS NOT ITS OWN CHARACTER.
 *
 * The full stop arrived as ". .json" — a dot, then a space — and that file
 * cannot be served at all: Next refuses any URL whose path segment begins with a
 * dot, so it is a 400 however the space is encoded. It was renamed period.json.
 *
 * A re-export should avoid naming a file after any character that is awkward in
 * a URL. The comma and the exclamation mark happen to survive; the full stop did
 * not, and a slash or a question mark would not either. */
const FILENAME: Record<string, string> = { ".": "period" };

/* WHERE THE WRITING LINE SITS IN EACH GLYPH, as a fraction of that glyph's own
 * ink height: 0 is the top of the ink, 1 is the bottom of it.
 *
 * THIS TABLE IS THE THING THE EXPORT SHOULD HAVE CARRIED. Every glyph in the
 * folder is centred in its 500x500 comp — all forty of them, to within three
 * units — and centring destroys the only thing the shared box was holding. Once
 * a glyph is centred, its ink top and its ink bottom are both determined by its
 * ink HEIGHT and nothing else, so there is no measurement anywhere in these
 * files that says where the line is. It is not hidden and not awkward to reach.
 * It is not in the file.
 *
 * So it is DERIVED, once, from the one thing the ink heights do tell us. A
 * letter with no ascender and no descender is X_HEIGHT tall and sits on the
 * line; a descending letter is that plus however far it hangs, which gives the
 * drop by subtraction and the fraction by division:
 *
 *     g  464 ink - 287 x-height = 177 below the line -> 1 - 177/464 = 0.62
 *     p  428 - 287 = 141                             -> 1 - 141/428 = 0.67
 *     q  431 - 287 = 144                             -> 0.67
 *     y  401 - 287 = 114                             -> 0.72
 *
 * f and j both ascend AND descend, so subtraction cannot separate the two ends
 * and those two are the only figures here that are a guess. The comma is a guess
 * of a different kind: nearly all of it hangs below the line.
 *
 * Everything absent from this table sits ON the line, which is every other
 * letter, every digit, the full stop and the exclamation mark.
 *
 * THE FIX IS A RE-EXPORT AND A SMALL ONE: keep the 500x500 comp exactly as it
 * is, and place each glyph where it actually sits on the line instead of in the
 * middle of the box. Nothing else has to change — not the size, not the stroke
 * reveal, not the PNGs. On the day that lands, every entry here becomes zero
 * work: delete the table and let baselineOf return the ink bottom. */
const BASELINE: Record<string, number> = {
  g: 0.62,
  p: 0.67,
  q: 0.67,
  y: 0.72,
  f: 0.69, // guessed — ascends and descends
  j: 0.69, // guessed — ascends and descends
  ",": 0.2,
};

/* A GLYPH THE EXPORT DOES NOT HAVE, drawn here rather than left as a gap.
 *
 * The hyphen is the only character in all forty-nine note lines on this site
 * that the folder cannot spell, and it is wanted in two of them — "not
 * industrial-just" on the board and "steady, no-nonsense." on one tape. Every
 * other character the notes use is exported.
 *
 * IT IS A STROKE AND NOT A PNG, which makes it the one glyph here that draws
 * itself: the letters are ink uncovered by a pen, and this is the pen. That is
 * exactly what the ruled margin already is (see the two cubics in index.tsx), so
 * it goes on the timeline beside everything else with nothing special about it
 * except that there is no image to mask.
 *
 * Slightly rising, and centred on the x-height — the same shape the Vara build's
 * hyphen had, and the note's copy has always leant on it standing in for an em
 * dash. THIS SHOULD BE DELETED the moment a hyphen is exported; it is a stopgap
 * with a drawn character's job. */
const SYNTHETIC: Record<
  string,
  { w: number; pen: number; path: (x: number, y: number) => string }
> = {
  "-": {
    w: 150,
    pen: 26,
    /* Drawn from the top-left of its own ink box, which is what the placement
       below hands it, so the glyph carries no idea of where it sits. It crosses
       the middle of the x-height rising a little to the right — level would read
       as a rule rather than as a mark somebody made. */
    path: (x, y) =>
      `M ${x + 8} ${y + X_HEIGHT * 0.56} C ${x + 50} ${y + X_HEIGHT * 0.53}, ` +
      `${x + 100} ${y + X_HEIGHT * 0.5}, ${x + 142} ${y + X_HEIGHT * 0.46}`,
  },
};

/* One pass of the pen: some ink, and the path that uncovers it.
 *
 * `href` is absent on a synthetic glyph, which is drawn BY the path rather than
 * revealed by it — see SYNTHETIC. Everything is in comp units: the layer
 * transform is baked in on the way through, so nothing downstream has to know
 * that a Lottie file has layers at all. */
export type Stroke = {
  href?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  d: string;
  pen: number;
};

export type Glyph = {
  ch: string;
  /** In the order the pen makes them — a couple of glyphs are two passes. */
  strokes: Stroke[];
  /** The ink's box in comp units. Its width is the glyph's advance. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The comp-space y the writing line runs through. */
  baseline: number;
};

/* ------------------------------------------------------------------ parsing */

type Vec = number[];
type Prop<T> = { a?: number; k?: T | { s?: T }[] };
type ShapePath = { v: Vec[]; i: Vec[]; o: Vec[]; c?: boolean };
type Mask = { pt?: { k?: ShapePath } };
type EffectProp = { mn?: string; v?: Prop<number> };
type Layer = {
  ty?: number;
  refId?: string;
  ks?: { p?: Prop<Vec>; a?: Prop<Vec>; s?: Prop<Vec> };
  masksProperties?: Mask[];
  ef?: { ef?: EffectProp[] }[];
};
type Comp = { w?: number; h?: number; assets?: { id: string; w: number; h: number; p: string }[]; layers?: Layer[] };

/* A Lottie property's value, static or the first keyframe of an animated one.
   None of these files animates a transform — they animate the stroke's End and
   nothing else — but reading the first keyframe rather than assuming `a: 0`
   costs a line and means a re-export that adds a wobble does not come out at the
   origin. */
function value<T>(prop: Prop<T> | undefined, fallback: T): T {
  if (!prop || prop.k === undefined) return fallback;
  if (prop.a === 0) return prop.k as T;
  const first = (prop.k as { s?: T }[])[0];
  return (first?.s ?? fallback) as T;
}

/* A Lottie bezier to an SVG path.
 *
 * Lottie holds a shape as three parallel lists — the vertices, and each one's
 * in- and out-tangent AS AN OFFSET FROM ITS OWN VERTEX. SVG wants absolute
 * control points, so every tangent is added to the vertex it belongs to on the
 * way out. Getting that wrong is the classic way to end up with a path that is
 * the right shape at every anchor and a mess in between. */
function toPath(shape: ShapePath, tx: number, ty: number, s: number): string {
  const { v, i, o, c } = shape;
  if (!v?.length) return "";
  const X = (n: number) => (n * s + tx).toFixed(2);
  const Y = (n: number) => (n * s + ty).toFixed(2);
  let d = `M ${X(v[0][0])} ${Y(v[0][1])}`;
  const curve = (from: number, to: number) =>
    ` C ${X(v[from][0] + o[from][0])} ${Y(v[from][1] + o[from][1])}, ${X(
      v[to][0] + i[to][0],
    )} ${Y(v[to][1] + i[to][1])}, ${X(v[to][0])} ${Y(v[to][1])}`;
  for (let n = 1; n < v.length; n++) d += curve(n - 1, n);
  if (c) d += curve(v.length - 1, 0) + " Z";
  return d;
}

/* One comp to one glyph. */
function parse(ch: string, comp: Comp): Glyph | null {
  const assets = new Map((comp.assets ?? []).map((a) => [a.id, a]));
  const strokes: Stroke[] = [];

  for (const layer of comp.layers ?? []) {
    const asset = layer.refId ? assets.get(layer.refId) : undefined;
    const shape = layer.masksProperties?.[0]?.pt?.k;
    if (!asset || !shape) continue;

    /* Layer space to comp space. The scale is uniform in every file here and is
       taken from x alone; a non-uniform one would need the pen width to become
       two numbers, which is a problem to have when it happens rather than
       now. */
    const p = value(layer.ks?.p, [0, 0]);
    const anchor = value(layer.ks?.a, [0, 0]);
    const s = value(layer.ks?.s, [100, 100])[0] / 100;
    const tx = p[0] - anchor[0] * s;
    const ty = p[1] - anchor[1] * s;

    /* The Stroke effect's brush size, in the layer's own units like the mask it
       is painted along. Falls back to something visible rather than to zero: a
       pen of no width uncovers nothing at all, which would be a blank note with
       no error anywhere to explain it. */
    const brush = (layer.ef ?? [])
      .flatMap((e) => e.ef ?? [])
      .find((prop) => prop.mn === "ADBE Stroke-0003");

    strokes.push({
      href: asset.p,
      x: tx,
      y: ty,
      w: asset.w * s,
      h: asset.h * s,
      d: toPath(shape, tx, ty, s),
      pen: value(brush?.v, 40) * s,
    });
  }

  if (!strokes.length) return null;

  /* THE INK'S BOX IS THE IMAGES' BOX and not the pen's. The pen is wider than
     the letter and runs past both ends of it — that is what makes it uncover the
     whole thing — so measuring the strokes would give every glyph an advance
     half a brush too wide on each side. */
  const x = Math.min(...strokes.map((s) => s.x));
  const y = Math.min(...strokes.map((s) => s.y));
  const w = Math.max(...strokes.map((s) => s.x + s.w)) - x;
  const h = Math.max(...strokes.map((s) => s.y + s.h)) - y;

  return { ch, strokes, x, y, w, h, baseline: y + h * (BASELINE[ch] ?? 1) };
}

/* A glyph that had to be drawn rather than exported — see SYNTHETIC. Placed at
   the comp's centre like everything else in the folder, so it behaves the same
   way in the layout and the day it is replaced by a real export nothing moves. */
function synthesise(ch: string): Glyph | null {
  const spec = SYNTHETIC[ch];
  if (!spec) return null;
  const x = (COMP - spec.w) / 2;
  const y = (COMP - X_HEIGHT) / 2;
  return {
    ch,
    strokes: [
      { x, y, w: spec.w, h: X_HEIGHT, d: spec.path(x, y), pen: spec.pen },
    ],
    x,
    y,
    w: spec.w,
    h: X_HEIGHT,
    baseline: y + X_HEIGHT,
  };
}

/* ------------------------------------------------------------------ loading */

/* ONE CACHE FOR THE WHOLE DOCUMENT, at module scope on purpose. Six sections on
   this site write a note and the product page writes two at once; they share an
   alphabet, and a per-instance cache would fetch and parse the same 'e' six
   times. A promise rather than a glyph, so two notes asking at the same moment
   join the same request instead of racing each other into it. */
const cache = new Map<string, Promise<Glyph | null>>();

function fetchGlyph(ch: string): Promise<Glyph | null> {
  const hit = cache.get(ch);
  if (hit) return hit;

  const made = synthesise(ch);
  const job = made
    ? Promise.resolve(made)
    : fetch(`${DIR}/${encodeURIComponent(FILENAME[ch] ?? ch)}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<Comp>) : null))
        .then((comp) => (comp ? parse(ch, comp) : null))
        /* A glyph that will not load is a gap in the writing and not a broken
           page — the note is decoration and its words are in the markup as text
           either way. Reported once, because a note quietly missing a letter is
           the kind of thing nobody sees for months. */
        .catch(() => null);

  cache.set(ch, job);
  return job;
}

/**
 * Every glyph a set of lines needs, fetched once and cached for the document.
 *
 * @param lines the note's copy, break by break
 * @returns what could be loaded, by character. Anything missing is simply absent
 *          and the layout leaves a word gap where it would have been.
 */
export async function loadGlyphs(
  lines: string[],
): Promise<Map<string, Glyph>> {
  const wanted = [
    ...new Set(lines.join("").toLowerCase().replace(/\s/g, "")),
  ];
  const loaded = await Promise.all(
    wanted.map((ch) => fetchGlyph(ch).then((g) => [ch, g] as const)),
  );

  const out = new Map<string, Glyph>();
  const missing: string[] = [];
  for (const [ch, glyph] of loaded) {
    if (glyph) out.set(ch, glyph);
    else missing.push(ch);
  }
  if (missing.length && process.env.NODE_ENV !== "production") {
    console.warn(
      `[HandNote] no glyph for ${missing.map((c) => JSON.stringify(c)).join(" ")} — ` +
        `add the export to ${DIR}, or a stroke to SYNTHETIC in HandNote/glyphs.ts`,
    );
  }
  return out;
}
