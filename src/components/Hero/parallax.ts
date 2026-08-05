/* The pinboard props' parallax.
 *
 * Anything in the hero carrying data-parallax drifts against the scroll, and
 * the number IS the depth: it is how much of a scrolled px the element gives
 * back. Positive scrolls slower than the page — further away, pressed into the
 * board; negative scrolls faster — lifted off it, toward the viewer. The drift
 * is zero at the moment the element's centre crosses the viewport's, so each
 * prop sits exactly where the stylesheet put it right when it is most looked
 * at, and the depths can be retuned without anything needing re-laying-out.
 *
 * Each prop also carries its own WEIGHT — data-parallax-ease, a response rate
 * in 1/s. The offset does not land instantly: it is chased through an
 * exponential ease at that rate, so a high number snaps with the scroll (a
 * light thing) and a low one settles seconds behind it (a heavy one). This is
 * what stops three drifting layers reading as one rigid sheet with three
 * speeds: they arrive at their places at different times, like real clutter
 * with different masses would.
 *
 * Nothing pins, same as the roll: the target is a pure function of scrollY,
 * applied as a transform. Driven off GSAP's ticker because Lenis is on that
 * same ticker — a scroll listener would read a position one frame stale, and
 * the ticker also hands over the frame's dt, which the ease needs to be
 * frame-rate independent.
 *
 * Positions are measured once per layout change via the offsetTop chain, which
 * transforms do not disturb — a getBoundingClientRect here would read back the
 * very transform this file writes and feed on itself.
 */
import gsap from "gsap";

/* Kept animating this far outside the viewport, so a prop straddling the edge
   never sits still while its neighbours move. */
const NEAR_VIEW = "20% 0px";

/* The weight when the markup does not name one: settled in about a third of a
   second, present but not syrupy. */
const DEFAULT_EASE = 6;

type Prop = {
  el: HTMLElement;
  factor: number;
  ease: number; // response rate, 1/s — higher is lighter
  centre: number;
  y: number; // where the ease has got to
};

export function initParallax(root: HTMLElement): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));

  // Drifting scenery is decoration by definition; "reduce motion" parks it.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!els.length || reduced) return () => {};

  const props: Prop[] = els.map((el) => ({
    el,
    factor: parseFloat(el.dataset.parallax || "0") || 0,
    ease: parseFloat(el.dataset.parallaxEase || "") || DEFAULT_EASE,
    centre: 0,
    y: NaN, // NaN = not yet placed; the first frame lands without easing
  }));

  let onScreen = true;

  function docTop(el: HTMLElement) {
    let y = 0;
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
      y += n.offsetTop;
    }
    return y;
  }

  function measure() {
    for (const p of props) {
      p.centre = docTop(p.el) + p.el.offsetHeight / 2;
    }
  }

  function frame(_time: number, deltaMs: number) {
    if (!onScreen) return;
    const dt = Math.min(deltaMs / 1000, 0.1); // a hung tab must not teleport
    const viewCentre = window.scrollY + window.innerHeight / 2;
    for (const p of props) {
      const target = (viewCentre - p.centre) * p.factor;
      /* Exponential chase, frame-rate independent: the same fraction of the
         remaining distance is covered per second whatever the frame time.
         First frame ever lands directly — the page must not open with the
         props swimming into position. */
      const y = Number.isNaN(p.y)
        ? target
        : p.y + (target - p.y) * (1 - Math.exp(-p.ease * dt));
      p.y = y;
      // Written at half-px resolution: below that the churn repaints a still
      // page for movement nobody can see. The ease itself keeps full precision
      // in p.y, so the tail still settles rather than stalling on the grid.
      const snapped = Math.round(y * 2) / 2;
      if (p.el.dataset.at === String(snapped)) continue;
      p.el.dataset.at = String(snapped);
      p.el.style.transform = `translate3d(0, ${snapped}px, 0)`;
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { rootMargin: NEAR_VIEW }
  );
  io.observe(root);

  // The section is sized in vw — width changes are what move the props' homes.
  const ro = new ResizeObserver(measure);
  ro.observe(root);
  const ac = new AbortController();
  window.addEventListener("resize", measure, { signal: ac.signal, passive: true });

  measure();
  gsap.ticker.add(frame);

  return () => {
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frame);
    // Hand the elements back exactly as the stylesheet had them.
    for (const p of props) {
      p.el.style.transform = "";
      delete p.el.dataset.at;
    }
  };
}
