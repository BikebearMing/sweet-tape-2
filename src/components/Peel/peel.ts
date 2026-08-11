/* Sweet Tape — a stuck-down thing coming away.
 *
 * Adapted from React Bits' sticker-peel, which is a HOVER effect: two discrete
 * clip-paths with a CSS transition between them, and the flap's travel written
 * twice, once per state. Neither driver here has a pointer to hover with, and a
 * scrub has nowhere to transition to and back from — so the geometry is driven
 * by a single number instead.
 *
 * THAT NUMBER IS --peel, 0..1, and it is the only thing this file writes.
 * Everything else — where the fold line sits, how far the flap has travelled,
 * how much light it catches — is a calc() off it in global.css (see "Peel"). So
 * the shape of the MOVEMENT lives here and the shape of the OBJECT lives in the
 * stylesheet, and neither has to know the other's numbers.
 *
 * Two ways to move it, chosen per element by data-peel:
 *
 *   "loop"    on its own, forever: lift, hang, settle, wait. Decoration.
 *   "scroll"  scrubbed off the page position, both ways. The scroll IS the
 *             hand pulling it, so it follows the wheel back up as readily as
 *             down — a peel that only went one way would be a thing that had
 *             happened, and this one is a thing being done.
 *
 * Written as a style property rather than tweened by GSAP's CSSPlugin: the
 * value is a bare number with no unit for the plugin to infer, and writing it
 * directly is both unambiguous and what parallax.ts already does. GSAP is here
 * for the easing curves and the loop's repeat, not for the writing.
 *
 * Both drivers read the scroll off GSAP's ticker rather than a scroll listener,
 * because Lenis is on that same ticker: a listener would read a position one
 * frame stale and the peel would judder against the board it is stuck to.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount rebinds rather than stacking a second driver on the same element.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

/* The loop's beat, in seconds. Live-tweakable in dev via `peel.BEAT` in the
   console — the timelines are built on mount, so a change lands on the next
   reload rather than mid-loop; these are for tuning, not for driving. */
export const BEAT = {
  RISE: 0.5, // the lift — quick, it is a thing coming unstuck
  HOLD: 0.9, // hanging at full peel
  FALL: 0.8, // and settling back, slower than it left
  /* Between one peel and the next. Long enough that it reads as an occasional
     twitch in the corner of the eye rather than a loop demanding attention. */
  EVERY: 3.4,
  /* Two peels starting together read as one mechanism. Each element is offset
     from the last by this much unless it names its own data-peel-delay. */
  STAGGER: 1.3,
};

/* The scrub's window, as fractions of the viewport height. Progress is 0 while
   the element's TOP is still below IN, and 1 once its CENTRE has risen to OUT —
   so the whole peel plays out in the middle of the screen, where it is being
   looked at, rather than finishing while the thing is still on its way in.

   Overridable per element with data-peel-in / data-peel-out. */
export const SCRUB = {
  IN: 0.92, // element top at 92% down the viewport — just inside the bottom edge
  OUT: 0.46, // element centre a touch above the middle
  /* Off the raw scroll fraction. Linear is honest but mechanical at both ends;
     inOut gives the lift somewhere to start from and somewhere to arrive, which
     is what stops a scrubbed peel feeling like a slider being dragged. */
  EASE: "power1.inOut",
};

/* Kept live this far outside the viewport so a peel straddling the edge is
   never caught mid-lift when it scrolls in. */
const NEAR_VIEW = "15% 0px";

/* Below this the write is churn: a repaint of a clip nobody can see move. The
   progress itself keeps full precision, so the tail still arrives. */
const STEP = 1e-3;

function num(raw: string | undefined, fallback: number): number {
  const n = parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : fallback;
}

/* Position in the document, walking the offsetParent chain — the same reading
   parallax.ts takes, and for the same reason: transforms do not disturb
   offsetTop, where a getBoundingClientRect would read back the very drift that
   file writes and feed on itself. */
function docTop(el: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    y += n.offsetTop;
  }
  return y;
}

export function initPeel(root: HTMLElement): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-peel]"));

  /* A thing peeling itself is decoration by definition; "reduce motion" leaves
     it wherever the stylesheet put it. --peel is never written, so the initial
     value of 0 stands — which for a scroll-driven peel is not a flat image but
     its designed rest pose, since that is what --peel-from means. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!els.length || reduced) return () => {};

  /* Named explicitly, both of them. Anything else — "manual" — is a peel whose
     --peel somebody else is writing, and the whole point of it is that nothing
     here touches it: the preloader's mark is one beat of a fixed piece of
     choreography (Preloader/reveal.ts), not a thing that lifts on its own. This
     used to be `!== "scroll"`, which would have quietly put that mark on the
     idle loop the moment anything scanned the preloader for peels. */
  const scrolled = els.filter((el) => el.dataset.peel === "scroll");
  const looped = els.filter((el) => el.dataset.peel === "loop");

  const stop = [initLoops(looped), initScrub(scrolled)];
  return () => stop.forEach((fn) => fn());
}

/* ---- on its own, forever ------------------------------------------------ */

function initLoops(els: HTMLElement[]): () => void {
  if (!els.length) return () => {};

  const loops = new Map<Element, gsap.core.Timeline>();

  els.forEach((el, i) => {
    // The proxy the tween actually moves.
    const at = { p: 0 };
    const write = () => el.style.setProperty("--peel", String(at.p));

    const tl = gsap.timeline({
      paused: true,
      repeat: -1,
      repeatDelay: num(el.dataset.peelEvery, BEAT.EVERY),
      delay: num(el.dataset.peelDelay, i * BEAT.STAGGER),
    });

    tl.to(at, { p: 1, duration: BEAT.RISE, ease: "power2.out", onUpdate: write })
      /* power3.inOut on the way down, not the mirror of the lift: adhesive lets
         go all at once and sticks back gradually, so the fall leaves slowly,
         runs, and arrives soft. */
      .to(
        at,
        { p: 0, duration: BEAT.FALL, ease: "power3.inOut", onUpdate: write },
        `+=${BEAT.HOLD}`
      );

    loops.set(el, tl);
  });

  /* Paused off-screen rather than left running: every frame of a peel re-clips
     and re-shadows an element, and this page already has two WebGL canvases and
     a physics loop wanting the frame. Observed per element, not per section —
     the hero is 170vw tall and its props are nowhere near each other. */
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const tl = loops.get(entry.target);
        if (!tl) continue;
        if (entry.isIntersecting) tl.play();
        else tl.pause();
      }
    },
    { rootMargin: NEAR_VIEW }
  );

  /* Nothing starts under the cover. A peel that ran while the preloader was up
     would be uncovered halfway through its lift, which reads as a glitch rather
     than as a movement — the same reason the hero's type waits. */
  const ungate = whenRevealed(() => els.forEach((el) => io.observe(el)));

  return () => {
    ungate();
    io.disconnect();
    for (const [el, tl] of loops) {
      tl.kill();
      (el as HTMLElement).style.removeProperty("--peel");
    }
    loops.clear();
  };
}

/* ---- scrubbed off the scroll -------------------------------------------- */

type Scrub = {
  el: HTMLElement;
  /* scrollY at which the peel starts and finishes. Measured, not guessed —
     re-measured whenever the layout can have moved. */
  from: number;
  to: number;
  at: number; // where the write has got to, full precision
  on: boolean; // in view, so worth writing to
};

function initScrub(els: HTMLElement[]): () => void {
  if (!els.length) return () => {};

  const ease = gsap.parseEase(SCRUB.EASE);
  const items: Scrub[] = els.map((el) => ({
    el,
    from: 0,
    to: 1,
    at: NaN,
    on: false,
  }));
  const byEl = new Map<Element, Scrub>(items.map((it) => [it.el, it]));

  function measure() {
    const vh = window.innerHeight;
    for (const it of items) {
      const top = docTop(it.el);
      const centre = top + it.el.offsetHeight / 2;
      it.from = top - vh * num(it.el.dataset.peelIn, SCRUB.IN);
      it.to = centre - vh * num(it.el.dataset.peelOut, SCRUB.OUT);
      /* A window that closes before it opens would divide by zero and flip the
         peel inside out. Can only happen if the overrides are set backwards. */
      if (it.to <= it.from) it.to = it.from + 1;
    }
  }

  function frame() {
    const y = window.scrollY || window.pageYOffset || 0;
    for (const it of items) {
      if (!it.on) continue;
      const raw = (y - it.from) / (it.to - it.from);
      const p = ease(raw < 0 ? 0 : raw > 1 ? 1 : raw);
      if (Math.abs(p - it.at) < STEP) continue;
      it.at = p;
      it.el.style.setProperty("--peel", String(Math.round(p * 1e3) / 1e3));
    }
  }

  /* One observer for the lot, but the flag it sets is PER ELEMENT — the peels
     on a page are nowhere near each other, and a callback only carries the
     entries that changed. Read as `entries.some(...)`, one peel leaving the
     viewport is indistinguishable from all of them leaving, so it would stop
     the ticker for a peel still on screen mid-travel: on the way back up the
     hero, the lemon's tape drops off the bottom edge while the note's tape is
     still visible and still fully stuck down, and the note would then never
     lift again.

     A scrubbed peel is a pure function of scrollY, so an element that is
     genuinely off-screen needs nothing kept in step — it is correct on the
     first frame it comes back. */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const it = byEl.get(e.target);
        if (it) it.on = e.isIntersecting;
      }
    },
    { rootMargin: NEAR_VIEW }
  );
  items.forEach((it) => io.observe(it.el));

  // The hero is sized in vw, so a width change moves every window's ends.
  const ro = new ResizeObserver(measure);
  ro.observe(document.documentElement);
  const ac = new AbortController();
  window.addEventListener("resize", measure, { signal: ac.signal, passive: true });

  measure();
  gsap.ticker.add(frame);

  return () => {
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frame);
    for (const it of items) it.el.style.removeProperty("--peel");
  };
}
