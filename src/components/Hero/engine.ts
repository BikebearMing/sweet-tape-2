/* Sweet Tape — the hero's scroll choreography.
 *
 * Nothing pins, and nothing rewinds. The roll turns side-on in place once its
 * centre crosses the viewport's, then the strip pays out downward — growing
 * GROWTH px per scrolled px until it catches the viewport bottom, tracking it
 * (less END_GAP) until it reaches its stop just past the cardboard — where the
 * scroll hands over to the finale (see CUT): the tape is cut at the board's
 * top, the tail rewinds, the roll turns home. The whole dispense is RATCHETED:
 * scrolling up leaves everything exactly as far along as it got, and after the
 * finale the scene is a still life until the page is loaded afresh.
 *
 *   scroll >  seqStart |------ roll yaws to 90 ------|
 *                                        |-------- strip pays out ----------->
 *                                        |<- HANDOFF ->|   held under the chase
 *                                     the two overlap       line, to the stop —
 *                                     so neither stops      then the finale
 *
 * Framework-free for the same reason the slider is: React renders the markup
 * once and hands the subtree over. There is no state here React could usefully
 * hold — the whole thing is a pure function of window.scrollY.
 *
 * Driven off GSAP's ticker rather than a scroll listener, because Lenis is on
 * that same ticker: a scroll listener would read a position one frame stale and
 * the roll would judder against the page it is supposed to be nailed to.
 *
 * Everything is scoped to `root` and released by the returned cleanup, so
 * StrictMode's double mount rebinds rather than doubling anything.
 */
import gsap from "gsap";
import type { HeroTape } from "./heroTape";

/** Served straight from /public. Preloaded in index.tsx — see the note there. */
export const MODEL_URL = "/assets/tapes/header-brown.glb";

/* The choreography, in px of scroll travel. All live-tweakable in dev via
   `hero.SCROLL` in the console; the ticker re-reads them every frame. */
export const SCROLL = {
  LEAD: 200, // px before the roll's centre crosses the viewport's
  YAW_DIST: 550, // scroll travel the turn takes — raise it to slow the turn
  /* How far BEFORE the turn ends the roll starts feeding tape.
   *
   * Not a nicety. The strip hangs from the roll's back tangent, so its first
   * half-radius of length is behind the roll and invisible — about 120px of
   * scroll at GROWTH 4. Start the two moves end to end and that is dead air:
   * the roll finishes turning, everything stops, and only then does an end
   * appear from behind it. Overlapping by roughly that much means the tape is
   * already on its way out of sight when the turn completes, and the end
   * emerges just as the roll settles. */
  HANDOFF: 130,
  GROWTH: 4,
  END_GAP: 160, // the tape's end rides this far above the viewport bottom
  SOFTEN: 250, // px over which phase corners are rounded off
};

/* The finale. When the strip's end reaches its stop — a little past the
 * cardboard's bottom — the sequence leaves the scroll's hands for good: the
 * tape is cut just below the cardboard's top, the tail above the cut rewinds
 * home, and the roll turns back to its resting pose with the label landing
 * upright. One animation, once: the whole dispense is ratcheted (scrolling up
 * never reverses it), the finale plays on its own clock, and only a refresh
 * starts the story over.
 *
 * TOP_ON / BOTTOM_OVER are in px at the cardboard's edges: where the cut sits
 * relative to the board's top (negative = above it, overhanging the green),
 * and how far PAST its bottom the end sticks out — the piece left behind
 * reads as taped across the cardboard, not cut to fit it.
 * Live-tweak in dev (before the cut fires): hero.CUT.TOP_ON = 80 */
export const CUT = {
  TOP_ON: -60,
  BOTTOM_OVER: 90,
  /** The finale's timing, seconds: the cut+rewind, and the roll's turn home
      (overlapping — the roll starts turning while the tail is still going). */
  REWIND: 0.7,
  RETURN: 1.0,
  OVERLAP: 0.35, // the turn starts this long into the rewind
};

/* The yaw is the scroll's to drive, so both ends of it live here rather than
   with the scene's resting pose. YAW_REST is where the roll sits before the
   sequence starts; YAW_END is side-on, where the axle lies along X and the roll
   can spin about itself. */
const YAW_REST = 35;
const YAW_END = 90;

/* How far outside the viewport the section stays "live". Intersection changes
   are delivered around the frame the edge is crossed, so the margin buys enough
   slack that the ticker is already running well before any of it is on screen.  */
const NEAR_VIEW = "50% 0px";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep: eases both ends

// Polynomial smooth minimum: min(a, b) with the corner rounded off over k px,
// so a curve meeting its ceiling does it without a kink.
function smin(a: number, b: number, k: number) {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b * (1 - h) + a * h - k * h * (1 - h);
}

export function initHero(root: HTMLElement): () => void {
  const mount = root.querySelector<HTMLElement>(".hero-tape");
  if (!mount) return () => {};

  // A roll that unspools as you scroll is exactly what "reduce motion" is
  // asking about. Park it at rest and leave it there.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* The 3D stage arrives asynchronously (its chunk, then the GLB), so the
     section runs with or without it: null until ready, and if it never arrives
     the hero is type and colour, which are already on screen. */
  let tape: HeroTape | null = null;
  let tapeGone = false; // torn down before the async load resolved
  let onScreen = true; // until the observer says otherwise

  /* Document-space measurements, taken once per layout change rather than per
     frame. offsetTop accumulation, not getBoundingClientRect: a rect is
     viewport-relative and would have to be re-read every frame, which is a
     forced layout on the scroll path. */
  let seqStart = 0;
  let stripTopDoc = 0;
  let tapeFloorDoc = 0;
  let cardTopDoc = 0;
  let cardBottomDoc = 0;

  /* The story so far. "scrub": the scroll owns the pose (ratcheted — see
     maxPast). "finale": the cut tween owns it. "done": nobody does — the
     scene is a still life until refresh. */
  let phase: "scrub" | "finale" | "done" = "scrub";
  let maxPast = 0; // the ratchet on the turn: the dispense only ever advances
  let maxLen = 0; // and on the strip — scrolling up retracts nothing
  let finale: gsap.core.Timeline | null = null;
  const board = root.querySelector<HTMLElement>(".cardboard-wrapper");

  function docTop(el: HTMLElement) {
    let y = 0;
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
      y += n.offsetTop;
    }
    return y;
  }

  function measure() {
    // The roll lives in the mount's top square (side = mount width); the
    // sequence begins when the roll's centre crosses the viewport's.
    // `!` because measure is a hoisted declaration: TS keeps the narrowing from
    // the guard above for arrow functions, but not for these.
    const rollCentre = docTop(mount!) + mount!.clientWidth / 2;
    seqStart = rollCentre - window.innerHeight / 2 - SCROLL.LEAD;
    stripTopDoc = rollCentre;
    // The canvas's own floor. offsetHeight already carries however far the CSS
    // hangs the box below the section, so this needs no knob of its own — it is
    // wherever global.css put it, and nothing can be drawn past it.
    tapeFloorDoc = docTop(mount!) + mount!.offsetHeight;
    // The cardboard is what the strip finishes against; without one the floor
    // stands in and the finale simply never has a stop to reach.
    cardTopDoc = board ? docTop(board) : tapeFloorDoc;
    cardBottomDoc = board ? cardTopDoc + board.offsetHeight : tapeFloorDoc;

    // A resize after the story ended must re-aim the still life at wherever
    // the cardboard moved to — its px are all measured from these.
    if (phase === "done") tape?.pose(YAW_REST, stopPx(), cutPx(), 1);
  }

  /* The strip's final measurements, from the measure()d document. Functions
     rather than cached px so a mid-finale resize stays honest. */
  const stopPx = () =>
    Math.min(
      cardBottomDoc + CUT.BOTTOM_OVER - stripTopDoc,
      tapeFloorDoc - stripTopDoc
    );
  const cutPx = () => Math.max(cardTopDoc + CUT.TOP_ON - stripTopDoc, 0);

  /* The finale — the one animation. From here the scroll is a spectator:
     `phase` gates frame() out, the ratchet already holds the length, and the
     tween walks cut and return on its own clock. */
  function startFinale() {
    if (!tape || phase !== "scrub") return;
    phase = "finale";
    const stop = stopPx();
    const s = { cut: 0, home: 0 };
    finale = gsap.timeline({
      onUpdate() {
        tape?.pose(
          YAW_END + (YAW_REST - YAW_END) * s.home,
          stop,
          s.cut * cutPx(),
          s.home
        );
        tape?.draw();
      },
      onComplete() {
        phase = "done";
        finale = null;
      },
    });
    finale
      .to(s, { cut: 1, duration: CUT.REWIND, ease: "power2.in" }, 0)
      .to(s, { home: 1, duration: CUT.RETURN, ease: "power3.inOut" }, CUT.OVERLAP);
  }

  function frame() {
    if (!tape || !onScreen) return;
    // The finale and the still life after it are not the scroll's to drive.
    if (phase !== "scrub") return;

    if (reduced) {
      tape.pose(YAW_REST, 0);
      tape.draw();
      return;
    }

    /* Ratcheted: the dispense only ever advances. Scrolling back up leaves
       the roll turned and the tape hanging exactly as far as it got — the
       sequence is one gesture with one direction, not a scrubber. */
    const y = window.scrollY;
    maxPast = Math.max(maxPast, y - seqStart, 0);
    const past = maxPast;

    // Smoothstepped, so the turn glides in and settles rather than arriving.
    const yaw = YAW_REST + (YAW_END - YAW_REST) * smooth(clamp01(past / SCROLL.YAW_DIST));

    /* The strip, in document px. It grows once the yaw is done, held under the
       chase line (its end riding END_GAP above the viewport bottom) and under
       the section's end (where it finishes and scrolls off with everything
       else).

       past2^2/(past2+SOFTEN) starts quadratically — zero velocity at the
       handoff — and settles to a straight GROWTH slope; each ceiling is then
       met through smin, so no corner anywhere kinks the motion.

       HANDOFF pulls the start back into the turn. It can be raised past
       YAW_DIST without breaking anything: the tape simply begins feeding from
       the first scrolled px, before the roll has begun to turn. */
    const feedStart = Math.max(SCROLL.YAW_DIST - SCROLL.HANDOFF, 0);
    const past2 = Math.max(past - feedStart, 0);
    const grown = (SCROLL.GROWTH * past2 * past2) / (past2 + SCROLL.SOFTEN);
    // The chase reads the LIVE scroll, not the ratchet — it exists to keep
    // the end from outrunning the viewport on the way down, and the ratchet
    // on lenPx below is what keeps scrolling back up from retracting it.
    const chase = y + window.innerHeight - stripTopDoc - SCROLL.END_GAP;
    // Where the tape finally stops: a little past the cardboard's bottom —
    // the finale's trigger line — bounded by the canvas floor as ever.
    const stop = stopPx();
    maxLen = Math.max(
      maxLen,
      smin(smin(grown, chase, SCROLL.SOFTEN), stop, SCROLL.SOFTEN),
      0
    );

    tape.pose(yaw, maxLen);
    tape.draw(); // no-ops unless the pose actually moved

    /* The smin ceilings approach the stop asymptotically, so "arrived" is a
       few px shy of it — close enough that the finale's own first frames
       cover the difference. */
    if (maxLen >= stop - 4 && stop > 0) startFinale();
  }

  /* Off screen the section stops costing anything: no scroll maths, no render,
     and the GPU is left to whatever is actually in view. The pose is stale
     while it is away and re-syncs on the first frame back — from the current
     scroll position, not the one it left at. */
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { rootMargin: NEAR_VIEW }
  );
  io.observe(root);

  // The section is sized in vw, so its box changes with the viewport's width —
  // that is the resize that needs a new drawing buffer.
  const ro = new ResizeObserver(() => {
    measure();
    tape?.resize();
  });
  ro.observe(root);

  const ac = new AbortController();
  // A height-only change (a mobile URL bar retracting) leaves the vw-sized box
  // alone, so the observer never fires — but seqStart is measured off
  // innerHeight and has moved.
  window.addEventListener("resize", measure, { signal: ac.signal, passive: true });

  measure();
  gsap.ticker.add(frame);

  /* Dynamic import so three and the GLTF loader ship as their own chunk,
     fetched after the section is interactive rather than blocking it. */
  import("./heroTape")
    .then((mod) =>
      mod.createHeroTape(mount, MODEL_URL).then((t) => {
        if (tapeGone) return t.dispose();
        tape = t;
        // The box may have moved while the model was in flight; the observer's
        // call would have found `tape` still null.
        t.resize();
        frame(); // catch up to where the page is now, not where it started

        /* There is something in the box now, and that is news: the roll's
           entrance (Hero/entrance.ts) cannot play over an empty rectangle, so
           it waits on this. An attribute rather than a callback because the two
           are started independently from Stage.tsx and neither owns the other —
           the same reason the preloader's hand-off is an attribute. */
        mount.dataset.tape = "live";

        if (process.env.NODE_ENV !== "production") {
          // Console handle for tuning. Compiled out of production builds —
          // NODE_ENV is a build-time constant, so the whole block is dropped.
          Object.assign(window, {
            hero: {
              SCROLL,
              CUT,
              CONFIG: mod.CONFIG,
              STRIP: mod.STRIP,
              END: mod.END,
              LIGHT: mod.LIGHT,
              FACE_LIGHT: mod.FACE_LIGHT,
              FILM: mod.FILM,
              tune: t.tune,
            },
          });
        }
      })
    )
    .catch(() => {
      // No three after all. Nothing to undo: the mount is an empty box the
      // layout already accounts for.
    });

  return () => {
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frame);
    finale?.kill();
    finale = null;
    // dispose runs here OR in the loader's then-branch, never both: tapeGone
    // tells a load that resolves after teardown to discard itself.
    tapeGone = true;
    tape?.dispose();
    tape = null;
    delete mount.dataset.tape; // the box is empty again — see the note above
  };
}
