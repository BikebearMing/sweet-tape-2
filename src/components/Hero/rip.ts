/* The rip's geometry.
 *
 * Split out of Tear.tsx because both ends need it: the server draws the whole
 * rip once for first paint, and the scroll loop in engine.ts redraws a slice of
 * it every frame as the tape zips it shut. Same numbers, same seed, one
 * generator — the two can't drift apart.
 *
 * THE ZIP
 * -------
 * The rip is a function of one thing: where the tape's leading edge is. Above
 * it the two halves are together, below it they are apart, and in between they
 * close over ZIP_RUN — so the paper is drawn in to meet the tape rather than
 * simply being covered by it. Scroll and the wedge travels down the page.
 *
 *      ...........  halves apart
 *       \       /
 *        \     /    ZIP_RUN: drawn together
 *         \   /
 *          \./  <-- the tape's end
 *           |      closed (and under the tape)
 *
 * WHY IT IS REDRAWN RATHER THAN TRANSFORMED
 * -----------------------------------------
 * Closing a gap by an amount that varies down the page is not a transform —
 * there's no translate or scale that opens the bottom of a shape while holding
 * the top shut. So the path is rebuilt. That is affordable only because of the
 * two limits in path(): nothing above the tape's tip is emitted (it is shut, and
 * under the tape anyway) and nothing outside the viewport is either. What is
 * left is a couple of hundred points a frame however long the section is.
 *
 * It is also why there is not a filter anywhere in Tear.tsx. A blur or a
 * turbulence over the rip's box would re-run on every one of those rebuilds, and
 * large filter regions are rasterised at reduced resolution besides — which is
 * most of what made the first pass look soft. The shadow is stacked strokes and
 * the fibre is hairlines: both geometry, both drawn at full device resolution,
 * neither caring how often the path underneath them changes.
 */

/* Units: the viewBox is the section, 10 units to the vw. Width is the viewport;
   height is .hero-section's own 170.139vw from hero.css. Both are vw, so the
   ratio holds at every viewport — change the section's height and change HEIGHT
   with it. */
export const WIDTH = 1000;
export const HEIGHT = 1701.4;

/* Re-roll the rip. Any integer; the shape is otherwise identical build to
   build, which is what lets the server and the client draw the same edge. */
const SEED = 20250804;

const TEAR = {
  /* How far apart the halves are pulled once fully open, in units.
     The ceiling is the tape: the strip lands 14.7vw wide, so nothing here may
     reach past ~73 units either side of the middle or white would show past the
     tape. The numbers below reach 27 at their worst — deliberately far under it,
     because a rip that only just fits looks like it was measured to. */
  GAP: 30,

  /* The whole rip drifting off the centre line — slow, over ~16vw. This is what
     stops it reading as a straight gap with a decorative edge. */
  WANDER: 7,
  WANDER_RUN: 40,

  /* The edge itself, in two bands: facets a couple of vw long, and per-step
     jaggedness on top of them. Paper tears at both scales at once. */
  COARSE: 2.6,
  COARSE_RUN: 6,
  FINE: 1.7,

  /* Tear a sheet in two and pull the halves apart and the two new edges are the
     same curve moved sideways — every peak on one is the matching notch on the
     other. That congruence is most of what says "these were one piece", so both
     edges here are the one profile. MICRO is the small independent wobble that
     keeps them from being provably identical, which fibre pull-out would give
     you anyway. It scales with the gap, so a shut seam is properly shut. */
  MICRO: 0.8,

  /* Distance down the page between facets, in units. 0.4vw — about 6px at the
     1440 design width, which is roughly the size of the flecks a real edge tears
     into. Halve it for a finer edge and the path costs proportionally more. */
  STEP: 4,

  /* How far below the tape's end the halves have finished separating. Long
     enough to read as the paper being drawn in, short enough that the rip is
     open again well before the next screenful. */
  ZIP_RUN: 100,
};

/* mulberry32. Seeded rather than Math.random because this runs on the server for
   first paint and again in the browser every frame, and the two have to agree on
   the edge to the unit. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Value noise: random knots every `run` samples, smoothstepped between. Gives a
   wobble with one characteristic size, which is what lets WANDER and COARSE be
   two recognisable scales rather than one mush. */
function wobble(rand: () => number, n: number, run: number): number[] {
  const knots = Math.ceil(n / run) + 2;
  const k = Array.from({ length: knots }, () => rand() * 2 - 1);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / run;
    const a = Math.floor(t);
    const f = t - a;
    out.push(k[a] + (k[a + 1] - k[a]) * f * f * (3 - 2 * f));
  }
  return out;
}

/* Sampled once, for the section's whole height, and indexed by row from then
   on. Pinning the rip to a fixed grid of rows is the whole point: the slice
   path() emits moves with the viewport, and if the samples moved with it the
   edge would crawl against the page instead of being torn into it. */
const N = Math.ceil(HEIGHT / TEAR.STEP) + 1;
const EDGE = (() => {
  const rand = seeded(SEED);
  const drift = wobble(rand, N, TEAR.WANDER_RUN);
  const facet = wobble(rand, N, TEAR.COARSE_RUN);
  const mid = new Float64Array(N);
  const microL = new Float64Array(N);
  const microR = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    mid[i] =
      WIDTH / 2 +
      drift[i] * TEAR.WANDER +
      facet[i] * TEAR.COARSE +
      (rand() * 2 - 1) * TEAR.FINE;
    microL[i] = (rand() * 2 - 1) * TEAR.MICRO;
    microR[i] = (rand() * 2 - 1) * TEAR.MICRO;
  }
  return { mid, microL, microR };
})();

/* The band the core is painted in — found from the samples rather than guessed,
   so the fills in Tear.tsx can never come up short of the edge. */
export const BAND = (() => {
  let min = WIDTH;
  let max = 0;
  for (let i = 0; i < N; i++) {
    min = Math.min(min, EDGE.mid[i] - TEAR.GAP / 2 - TEAR.MICRO);
    max = Math.max(max, EDGE.mid[i] + TEAR.GAP / 2 + TEAR.MICRO);
  }
  return { x: Math.floor(min) - 3, w: Math.ceil(max - min) + 6 };
})();

const round = (v: number) => Math.round(v * 10) / 10;

/** How far open the rip is at `y`, given the tape's end at `tip`. */
function opening(y: number, tip: number) {
  const t = Math.min(Math.max((y - tip) / TEAR.ZIP_RUN, 0), 1);
  return t * t * (3 - 2 * t); // eased at both ends: paper bends, it doesn't crease
}

/**
 * The rip between two heights, shut above `tip`.
 *
 * `from`/`to` are the range worth drawing — the viewport with a margin, from
 * engine.ts. Everything outside it is either off screen or shut, and emitting it
 * would only make the path longer for no pixels. Pass 0 / HEIGHT and a tip below
 * the section to get the whole thing open, which is what the server renders.
 */
export function path(from: number, to: number, tip: number): string {
  const top = Math.max(from, tip, 0);
  const bottom = Math.min(to, HEIGHT);
  if (bottom <= top) return "";

  const first = Math.ceil(top / TEAR.STEP);
  const last = Math.min(Math.floor(bottom / TEAR.STEP), N - 1);
  if (last < first) return "";

  const left: string[] = [];
  const right: string[] = [];

  /* The apex, at the tape's end rather than at whichever row happens to fall
     nearest it. Without it the point where the rip shuts would jump a row at a
     time as you scroll — 6px of stutter, right where the eye is. Both edges meet
     here, so the x is just the row's centre line. */
  if (tip > from && tip < bottom) {
    const at = `${round(EDGE.mid[Math.min(first, N - 1)])},${round(tip)}`;
    left.push(at);
    right.push(at);
  }

  for (let i = first; i <= last; i++) {
    const y = i * TEAR.STEP;
    const open = opening(y, tip);
    const half = (TEAR.GAP / 2) * open;
    const mid = EDGE.mid[i];
    left.push(`${round(mid - half + EDGE.microL[i] * open)},${round(y)}`);
    right.push(`${round(mid + half + EDGE.microR[i] * open)},${round(y)}`);
  }

  /* Down the left edge, back up the right. After the opening M every bare
     coordinate pair is an implicit lineto, which is where most of the weight of
     this string would otherwise have gone. */
  return `M${left.join(" ")} ${right.reverse().join(" ")}Z`;
}

/** The whole rip, fully open — first paint, and the state it stays in if the
 *  scroll loop never runs (no JS, no WebGL, reduced motion). */
export function fullPath() {
  return path(0, HEIGHT, -TEAR.ZIP_RUN * 2);
}

/* Paper fibre, as hairlines rather than noise.
 *
 * The section's grain overlay paints below the tear and so cannot reach the
 * core; left bare, the gap is a flat shape beside a textured one. These run the
 * full height and are clipped to the core, so they cost nothing to redraw and
 * stay sharp at any density — where an feTurbulence over a box this size would
 * be rasterised down and go to mush. Vertical because that is the way the stock
 * would have been pulled. */
export const FIBRE = (() => {
  const rand = seeded(SEED ^ 0x5bf03635);
  const lines: { x: number; w: number; o: number; light: boolean }[] = [];
  for (let i = 0; i < 36; i++) {
    lines.push({
      x: round(BAND.x + rand() * BAND.w),
      w: round(0.5 + rand() * 1.4),
      o: round(0.03 + rand() * 0.05),
      light: rand() < 0.4, // a few standing proud of the surface, not sunk into it
    });
  }
  return lines;
})();
