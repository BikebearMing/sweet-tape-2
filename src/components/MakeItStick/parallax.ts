/* Sweet Tape — the photograph drifting inside its own frame.
 *
 * The hero's props drift by MOVING: an object on the pinboard is translated
 * against the scroll and the space around it changes shape as it goes. That is
 * wrong here. The photograph is one of two boxes taped to each other, and a box
 * that slides is a box coming out of the arrangement the tape is supposedly
 * holding together — the seam would open, the strip would no longer be on the
 * join, and the whole gag of the section is that those two things stay put.
 *
 * So the FRAME never moves and the PICTURE inside it does. The rounded box is
 * exactly where the stylesheet put it, at exactly its tilt, and the artwork
 * behind it is cut a little taller than the hole it is seen through and slides
 * within that slack as the section crosses the screen. Nothing about the layout
 * can be disturbed by it: the travel is bounded by the overhang, and the
 * overhang is the only thing that is not visible anyway.
 *
 * THE MAP IS LINEAR, and that is a departure from the pinning section's
 * parallax, which spends its drift along a curve. That one is scenery scattered
 * across a canvas — a curve is what stops three props at three distances
 * reading as one rigid sheet. This is a single window onto a picture, and a
 * window whose content accelerates is a window with something moving behind it,
 * which is not what a photograph does. Even travel, or none.
 *
 * NO EASE CHASE EITHER, where Hero/parallax.ts leans on one. That file gives
 * its props different weights so they arrive at their places at different
 * times, which is what makes clutter read as clutter. A chase here would only
 * be a second smoothing on top of Lenis's, and all a second smoothing buys is
 * lag — the picture would still be catching up with the frame after the scroll
 * had stopped.
 *
 * ZEROED AT THE CENTRE CROSSING, like every other parallax on this site: the
 * picture is exactly as the artwork was cropped at the moment the frame's
 * middle passes the middle of the window, which is when it is most looked at.
 * The drift is what happens on the way in and on the way out.
 *
 * Driven off GSAP's ticker because Lenis is on that same ticker — a scroll
 * listener would read a position one frame stale. Positions are measured
 * through the offsetTop chain, which transforms do not disturb; a rect here
 * would read back the very offset this file writes and feed on itself.
 */
import gsap from "gsap";

import { onViewportChange, screenH } from "@/components/viewport";

export const STICK_PARALLAX = {
  /* Kept animating this far outside the viewport, so the picture is never
     caught sitting still at an edge it is about to come back through. */
  NEAR_VIEW: "20% 0px",
};

/**
 * Starts the photograph's inner drift.
 *
 * @param root the <section class="make-it-stick">
 * @returns the teardown, which hands the picture back to the stylesheet
 */
export function initStickParallax(root: HTMLElement): () => void {
  const frame = root.querySelector<HTMLElement>(".stick-shot");
  const img = frame?.querySelector<HTMLElement>(".stick-shot-img");

  /* A picture drifting inside a frame is decoration by definition; "reduce
     motion" parks it, and parked is the crop the stylesheet already draws. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!frame || !img || reduced) return () => {};

  /* THE SLACK, and it is read off the layout rather than declared here. The
     stylesheet cuts the artwork taller than its frame (--stick-drift, in
     global.css) and hangs the overhang half above and half below; this is that
     half. Reading it back means the travel is whatever the stylesheet's
     overhang actually is — the picture can never be driven past its own edge
     and let the lime show through, however that figure is retuned, and there is
     no second copy of it here to keep in step. */
  let slack = 0;
  /* How far the frame's centre travels from the middle of the window before the
     box is fully off one edge or the other — half a window plus half the frame.
     The full drift is therefore spent exactly over the picture's visible life:
     saturation happens off screen, so the clamp is never something you see. */
  let range = 1;
  let centre = 0;

  let onScreen = true;

  function docTop(el: HTMLElement) {
    let y = 0;
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
      y += n.offsetTop;
    }
    return y;
  }

  function measure() {
    const frameH = frame!.offsetHeight;
    slack = Math.max((img!.offsetHeight - frameH) / 2, 0);
    centre = docTop(frame!) + frameH / 2;
    range = Math.max((screenH() + frameH) / 2, 1);
  }

  function frameTick() {
    if (!onScreen || slack <= 0) return;
    const viewCentre = window.scrollY + screenH() / 2;
    /* Positive once the frame's centre is above the middle of the window, which
       is to say once the section is on its way out. Clamped, so a fast flick
       past the section cannot throw the crop past its overhang. */
    const t = Math.max(-1, Math.min(1, (viewCentre - centre) / range));

    /* Downward as the page scrolls up past it — the sign is the same statement
       Hero/parallax.ts makes with a positive depth: the picture gives back some
       of every scrolled pixel, so it reads as sitting BEHIND the hole it is
       seen through rather than as a poster sliding about inside one. Reverse
       this and the picture reads as nearer than its own frame, which nothing
       physical does. */
    const pan = t * slack;

    /* Half-px resolution: below that the churn repaints a still page for
       movement nobody can see. */
    const snapped = Math.round(pan * 2) / 2;
    if (img!.dataset.at === String(snapped)) return;
    img!.dataset.at = String(snapped);
    /* A custom property rather than the transform, because the transform is the
       stylesheet's: it composes the pan into a translate3d of its own, and
       writing the transform here would silently take that over. */
    img!.style.setProperty("--stick-pan", `${snapped}px`);
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
    },
    { rootMargin: STICK_PARALLAX.NEAR_VIEW },
  );
  io.observe(frame);

  /* The section is sized in vw, so a width change is what moves the frame and
     resizes the overhang. */
  const ro = new ResizeObserver(measure);
  ro.observe(root);
  const ac = new AbortController();
  const stopVp = onViewportChange(measure);

  measure();
  gsap.ticker.add(frameTick);

  return () => {
    stopVp();
    ac.abort();
    io.disconnect();
    ro.disconnect();
    gsap.ticker.remove(frameTick);
    /* Back to the stylesheet's crop. A teardown mid-section must not leave the
       picture frozen at whatever offset it happened to be carrying. */
    img.style.removeProperty("--stick-pan");
    delete img.dataset.at;
  };
}
