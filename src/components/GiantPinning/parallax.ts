/* Sweet Tape — the scenery drifting against the camera.
 *
 * Everything on the canvas currently moves as one, because it IS one: a single
 * transform on .giant-canvas carries the type, the cards and the tags together.
 * That is what makes the camera cheap, and it is also what makes the section
 * read as flat — a photograph pasted to the same sheet of paper as the letter
 * behind it, travelling at exactly the letter's speed.
 *
 * Parallax is the correction, and it is two numbers per object: HOW FAR it
 * drifts, and the CURVE it spends that drift along.
 *
 *     t      = (screenX - viewportWidth / 2) / range     clamped to -1..1
 *     offset = -drift * viewportWidth * sign(t) * ease(|t|)
 *
 * The first version of this was the straight line — offset proportional to
 * distance from centre, no curve. It is the obvious thing and it is wrong twice
 * over: the drift is at its fastest exactly where the object is biggest and most
 * looked at, and the only way to make the effect subtle is to make it so small
 * it stops reading at all. An ease separates those. AMPLITUDE is how far it ever
 * goes; the EASE is where in the pass it goes there — and because it is per
 * object, two props at the same distance can still move unlike each other, which
 * is most of what sells a plane as a plane.
 *
 * INOUT CURVES, and it is not a taste call. sign(t)·ease(|t|) has slope ease'(|t|)
 * on both sides of the origin, so the family decides two things: an ease with
 * ease'(0) = 0 is momentarily glued to the type as the object crosses the middle
 * of the screen, which is where the eye is; and one with ease'(1) = 0 meets the
 * clamp at the end of the range with matching slope, so saturation is invisible.
 * Both hold for every inOut ease and neither holds for an `out`, which puts its
 * fastest drift dead centre and kinks where it saturates.
 *
 * BUT NOT A STEEP ONE, which is the harder half and was got wrong first time.
 * An inOut spends most of its travel at the MIDDLE of its domain, and the domain
 * here is distance from centre — so the midpoint sits at RANGE/2, about a third
 * of a window off centre, in full view. What the eye reads is the peak SPEED,
 *
 *     drift x maxSlope / RANGE      as a fraction of the camera's own
 *
 * and a curve like circ.inOut has a vertical tangent there: the object crosses a
 * narrow band at unbounded speed and the section reads as violent even though
 * the total displacement is tiny. Amplitude is what you measure; velocity is
 * what you feel. The ceiling that keeps the two in step lives in index.tsx next
 * to the numbers it constrains.
 *
 * WHY DISTANCE FROM CENTRE rather than a running offset off the scroll. It
 * self-zeroes. A prop is exactly where index.tsx puts it at the moment it passes
 * the middle of the screen, so the arrangement you tune in devtools is the
 * arrangement you see, and drift is bounded by the width of the window instead
 * of accumulating over seven screens of section. Nothing needs a reference
 * position, a starting scroll, or a reset — which is why this file does not know
 * what a stop, a leg or a phrase is.
 *
 * VERTICAL IS DELIBERATELY ABSENT. Two of the three legs are diagonals, so a
 * vertical term would fight the staircase itself: the props would climb as the
 * camera climbs and the step would flatten out. The camera's story is vertical
 * and the scenery's is horizontal.
 */
import gsap from "gsap";

export const GIANT_PARALLAX = {
  /* How far a prop drifts when it says nothing, as a fraction of the window —
     0.03 is 43px at 1440. Small on purpose: the common case is scenery, and the
     job is to stop it reading as printed on the type, not to make it slide. */
  DEFAULT_DRIFT: 0.03,

  /* And the curve it spends that on. See the note above on why the inOut
     family and not an `out`. */
  DEFAULT_EASE: "power2.inOut",

  /* HOW FAR FROM THE MIDDLE COUNTS AS ALL THE WAY, as a fraction of the window.
   * Past this the offset is clamped and the prop simply travels with the camera.
   *
   * A shade under a full window rather than a round 1: an object stops being
   * visible at half a window plus half of itself, so the range only has to
   * outrun that — 0.65 puts saturation about 120px beyond the widest prop's exit,
   * which is far enough that the clamp is never on screen and near enough that
   * the curve is not wasting most of its shape out of frame.
   */
  RANGE: 0.65,
};

type Layer = {
  el: HTMLElement;
  set: (value: string) => void;
  /** Centre of the object in canvas coordinates. Re-measured on every refresh. */
  home: number;
  /** --pp as the stylesheet resolves it, the fallback for the live read below. */
  drift: number;
  /** The name last parsed, so a frame that reads the same string does no work. */
  easeName: string;
  ease: (progress: number) => number;
};

export type Parallax = {
  /** Re-read the layout. Called on build and on every ScrollTrigger refresh. */
  measure: () => void;
  /** Place every layer for a camera at `cameraX`. Called per scrubbed frame. */
  update: (cameraX: number) => void;
  destroy: () => void;
};

const NONE: Parallax = { measure: () => {}, update: () => {}, destroy: () => {} };

/**
 * Builds the parallax layers for `root`.
 *
 * @param root the <section class="giant-pinning">
 */
export function initGiantParallax(root: HTMLElement): Parallax {
  const canvas = root.querySelector<HTMLElement>(".giant-canvas");
  if (!canvas) return NONE;

  /* The scattered props AND the card standing in each phrase's own gap — the
     user's "all the images". The card is the one to be careful with: it is a
     flex item between TO and the noun, so a speed of any size slides it out of
     the gap the letters made for it. Its numbers in index.tsx are accordingly a
     third of the props'. */
  const els = gsap.utils.toArray<HTMLElement>(".giant-prop, .giant-slot", root);
  if (!els.length) return NONE;

  /* Distance from the canvas's left edge to the object's centre, walking the
     offsetParent chain — a prop is placed against its row and the row against
     the canvas, so neither offsetLeft alone is the answer. Layout, not rects:
     the same reasoning as pin.ts, and here it matters more, since a rect during
     a scrub already contains the offset being solved for. */
  const homeOf = (el: HTMLElement) => {
    let x = el.offsetWidth / 2;
    let node: HTMLElement | null = el;
    while (node && node !== canvas) {
      x += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return x;
  };

  /* GSAP owns the curve vocabulary, so "power2.inOut" in the data means exactly
     what it means everywhere else on this site. An unknown name resolves to
     undefined rather than throwing, which would be a prop silently frozen — so
     it falls back to the default curve instead. */
  const easeOf = (name: string) =>
    ((gsap.parseEase(name) ??
      gsap.parseEase(GIANT_PARALLAX.DEFAULT_EASE)) as (p: number) => number);

  const fallbackEase = easeOf(GIANT_PARALLAX.DEFAULT_EASE);

  const layers: Layer[] = els.map((el) => ({
    el,
    /* A custom property rather than the transform itself. .giant-prop already
       spends `rotate` on --pr and .giant-slot spends `translate` on --giant-dx —
       writing a transform here would silently replace one of them. The
       stylesheet composes --pdx into what is already there. */
    set: gsap.quickSetter(el, "--pdx") as (value: string) => void,
    home: 0,
    drift: GIANT_PARALLAX.DEFAULT_DRIFT,
    easeName: GIANT_PARALLAX.DEFAULT_EASE,
    ease: fallbackEase,
  }));

  const measure = () => {
    for (const layer of layers) {
      layer.home = homeOf(layer.el);
      const style = getComputedStyle(layer.el);
      const declared = parseFloat(style.getPropertyValue("--pp"));
      layer.drift = Number.isFinite(declared)
        ? declared
        : GIANT_PARALLAX.DEFAULT_DRIFT;
      const named = style.getPropertyValue("--pe").trim();
      layer.easeName = named || GIANT_PARALLAX.DEFAULT_EASE;
      layer.ease = easeOf(layer.easeName);
    }
  };

  const update = (cameraX: number) => {
    const vw = window.innerWidth;
    const middle = vw / 2;
    const range = vw * GIANT_PARALLAX.RANGE;

    for (const layer of layers) {
      /* THE LIVE READ, and the reason it is off the inline style rather than the
         computed one. Every number in this section is tuned by typing into the
         element's own style in devtools, and getComputedStyle per prop per frame
         is the one thing here that would actually cost something. Reading the
         inline declaration is a string lookup, so a --pp or --pe typed into
         devtools takes effect on the next frame — and anything set from a
         stylesheet still works, it just arrives with the measure above. */
      const typed = parseFloat(layer.el.style.getPropertyValue("--pp"));
      const drift = Number.isFinite(typed) ? typed : layer.drift;

      /* Parsing a curve is not free, so it happens on the frame the NAME
         changes and not on the frames after it. */
      const named = layer.el.style.getPropertyValue("--pe").trim();
      if (named && named !== layer.easeName) {
        layer.easeName = named;
        layer.ease = easeOf(named);
      }

      /* Signed, and the sign is carried OUTSIDE the ease — an ease is defined on
         0..1 and handing it a negative progress is undefined at best. Mirroring
         it about the origin is what makes one curve describe both approach and
         departure, so a prop's drift out is the shape of its drift in. */
      const t = Math.max(-1, Math.min(1, (cameraX + layer.home - middle) / range));
      const shaped = Math.sign(t) * layer.ease(Math.abs(t));
      layer.set(`${-drift * vw * shaped}px`);
    }
  };

  measure();

  return {
    measure,
    update,
    destroy: () => {
      /* Back to the stylesheet's zero. A teardown mid-section must not leave the
         scenery frozen at the offset it happened to be carrying. */
      for (const layer of layers) layer.el.style.removeProperty("--pdx");
    },
  };
}
