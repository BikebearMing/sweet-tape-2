/* LAB — one DOM letter, measured and re-drawn into a canvas.
 *
 * THIS FILE HAS NO THREE IMPORT, for the reason noteFace.ts argues: the scene
 * is loaded dynamically, and anything that static-imports it drags three into
 * the page's main chunk.
 *
 * The question this answers is "can the peeling letter keep the font", and the
 * answer is the one the sticky note already gave — draw it with Canvas2D in the
 * font the DOM is using and hand the canvas over as a texture. No opentype
 * parsing, no MSDF atlas, no TextGeometry: it is futura-pt-condensed because it
 * is literally the browser setting futura-pt-condensed.
 *
 * The cost is that it is a bitmap, so it is drawn at DPR * OVERSAMPLE and
 * redrawn on resize. One letter, so that is nothing.
 *
 * MEASUREMENT IS THE HARD HALF, not drawing. The headline's letters sit on an
 * arc — each .clip carries a translate and a rotate (see "The headline's arc"
 * in global.css) — so the rendered box is not the laid-out box, and
 * getBoundingClientRect returns the AXIS-ALIGNED bounds of a rotated rectangle,
 * which is bigger than the letter. What survives the rotation is the CENTRE: an
 * affine map takes a rectangle's centroid to its image's centroid, and the AABB
 * of a rotated rectangle is centred on that same point. So the placement is
 * read as centre + unrotated size + angle, each from the source that still
 * knows it:
 *
 *   centre  getBoundingClientRect(), which is post-transform
 *   size    offsetWidth/offsetHeight, which are pre-transform
 *   angle   the computed transform matrix, decomposed
 */

/** How much finer than the device pixel grid the glyph is rasterised. The
    letter is ~290px tall at the design width and it CURLS TOWARD THE CAMERA,
    so the near end of the flap is magnified past 1:1 — at plain DPR the fold
    shows the texel grid. */
const OVERSAMPLE = 1.6;

/** Hard cap on the raster, in device pixels per side. A 20vw letter on a 4K
    display at OVERSAMPLE would otherwise ask for a texture that costs more to
    upload than the whole hero. */
const MAX_PX = 2048;

export type LetterRaster = {
  /** The letter's laid-out box, in CSS px — .clip's border box, padding and
      all. The plane is built at exactly this size, so the texture maps 1:1. */
  box: { w: number; h: number };
  /** Centre of that box in viewport px, after the arc's transform. */
  centre: { x: number; y: number };
  /** The arc's rotation, in radians, CLOCKWISE ON SCREEN (CSS's sign). */
  angle: number;
  /** Device px per CSS px in the canvases below. */
  scale: number;
  /** The ink, in CSS px relative to the box's top-left. What the peel's travel
      and the flap's tip are measured against — the box has padding on three
      sides and the glyph does not fill it. */
  ink: { x: number; y: number; w: number; h: number };
  /** The letter as it is printed: the headline's green on transparent. */
  face: HTMLCanvasElement;
  /** The same silhouette in the adhesive side's colour — what you see when the
      flap folds back on itself. */
  back: HTMLCanvasElement;
};

/** Decompose a computed `transform` to its rotation. Returns 0 for `none`. */
function angleOf(transform: string): number {
  if (!transform || transform === "none") return 0;
  const nums = transform
    .slice(transform.indexOf("(") + 1, -1)
    .split(",")
    .map((n) => parseFloat(n));
  if (nums.length < 4) return 0;
  /* matrix(a, b, c, d, e, f): the first column is where the x axis lands, and
     its angle is the rotation. atan2(b, a) is positive clockwise, because the
     y axis points down in CSS — which is the sign this type documents. */
  return Math.atan2(nums[1], nums[0]);
}

/** The canvas font shorthand for an element, as the browser has resolved it. */
function fontOf(cs: CSSStyleDeclaration): string {
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.fontSize} ${cs.fontFamily}`;
}

/** Where the glyph's baseline sits inside .char, in CSS px from its top.
 *
 * .char is a block of the row's line-height (0.73 on the headline — well under
 * 1), and a line box centres the font's own em box inside itself: half the
 * leading above, half below. Leading is negative here, so the capital
 * overshoots its box in both directions, which is exactly what .clip's padding
 * and the mask are built around. */
function baselineIn(boxH: number, ascent: number, descent: number): number {
  return (boxH - (ascent + descent)) / 2 + ascent;
}

/** Draw the glyph into a fresh canvas at `scale`, filled flat with `colour`. */
function paint(
  ch: string,
  colour: string,
  box: { w: number; h: number },
  scale: number,
  font: string,
  pad: { left: number; top: number },
  charW: number,
  charH: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.round(box.w * scale);
  c.height = Math.round(box.h * scale);

  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colour;

  const m = ctx.measureText(ch);
  const asc = m.fontBoundingBoxAscent;
  const desc = m.fontBoundingBoxDescent;

  /* .char is display:block and the only child, so its border box starts at
     .clip's padding edge; the glyph is centred in it because .h1 sets
     text-align: center and a flex row leaves that to the block inside. */
  ctx.fillText(
    ch,
    pad.left + charW / 2,
    pad.top + baselineIn(charH, asc, desc),
  );

  return c;
}

/** The ink's bounds inside a painted canvas, in CSS px. Scanned rather than
    taken from measureText's actualBoundingBox — the two agree, and the scan is
    also the check that the font actually arrived (a fallback glyph has
    different bounds, and an empty canvas has none at all). */
function inkOf(c: HTMLCanvasElement, scale: number) {
  const { width: W, height: H } = c;
  const data = c.getContext("2d")!.getImageData(0, 0, W, H).data;

  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] < 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  if (x1 < 0) return null;
  return {
    x: x0 / scale,
    y: y0 / scale,
    w: (x1 - x0 + 1) / scale,
    h: (y1 - y0 + 1) / scale,
  };
}

/** Measure and re-draw one .char. Returns null if the glyph came out blank —
    a font that has not landed, or an element with no box. */
export function rasterise(
  charEl: HTMLElement,
  faceColour: string,
  backColour: string,
): LetterRaster | null {
  const clip = charEl.parentElement;
  if (!clip) return null;

  const box = { w: clip.offsetWidth, h: clip.offsetHeight };
  if (!box.w || !box.h) return null;

  const rect = clip.getBoundingClientRect();
  const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const angle = angleOf(getComputedStyle(clip).transform);

  const csClip = getComputedStyle(clip);
  const pad = {
    left: parseFloat(csClip.paddingLeft) || 0,
    top: parseFloat(csClip.paddingTop) || 0,
  };

  const font = fontOf(getComputedStyle(charEl));
  const ch = charEl.textContent ?? "";

  const want = (window.devicePixelRatio || 1) * OVERSAMPLE;
  const scale = Math.min(want, MAX_PX / Math.max(box.w, box.h));

  const face = paint(
    ch, faceColour, box, scale, font, pad,
    charEl.offsetWidth, charEl.offsetHeight,
  );
  const ink = inkOf(face, scale);
  if (!ink) return null;

  const back = paint(
    ch, backColour, box, scale, font, pad,
    charEl.offsetWidth, charEl.offsetHeight,
  );

  return { box, centre, angle, scale, ink, face, back };
}

/** Just the placement, re-read. Called every frame — the section scrolls, and
    the letter has to stay nailed to where the DOM says it is. Cheap: one rect
    and one computed style on one element. */
export function placementOf(charEl: HTMLElement) {
  const clip = charEl.parentElement!;
  const rect = clip.getBoundingClientRect();
  return {
    centre: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    angle: angleOf(getComputedStyle(clip).transform),
  };
}
