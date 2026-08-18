/* Sweet Tape — the camera that runs the product page's row.
 *
 * The section holds still while the page scrolls past it and ONE element moves:
 * .reel-canvas, about three viewports wide, carrying the opening photograph and
 * the claim beside it, the torn kraft, and the three shots that close the run.
 * Scroll position is the camera's position along that row, and the row is a
 * STRAIGHT LINE — right, from one end to the other, at one speed.
 *
 * THIS IS GiantPinning/pin.ts WITH THE STAIRCASE TAKEN OUT, and the difference
 * is worth stating because that file is ten times this one. The home page's
 * camera walks measured stops at three heights, chooses between framing a
 * phrase and sweeping it, and rounds its own right-angle corner — all of which
 * exists because the arrangement it is reading has corners in it. This one does
 * not: nothing moves vertically, nothing is wider than the window, so there are
 * no stops to solve, no per-leg durations to keep the speed constant across,
 * and no corners to round. One tween, and the constants below are the same ones
 * that file argues at length.
 *
 * WHERE THE NUMBERS COME FROM. Nowhere in here. The row's length is MEASURED off
 * the laid-out pieces — the arrangement lives in global.css as --rx / --ry — so
 * moving a photograph there moves the camera's end with it. That is the point of
 * doing it this way rather than typing a width: two lists of the same numbers
 * is two lists that drift.
 *
 * SCROLLTRIGGER, and Lenis. Lenis scrolls the window for real rather than
 * transforming a container, so the plugin's own listeners see the scroll with no
 * proxy in between. A pin is position: fixed against a scroll position both of
 * them agree on.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { initReelReveal } from "./reveal";

export const REEL = {
  /** Where the FRAME takes the screen — .wrapper, not the section around it. */
  START: "top top",

  /* THE PACE, and the one number that decides how long the section is: pixels
     of scrolling per pixel the camera travels. 1 is the canvas glued to the
     wheel — you scroll an inch, the row moves an inch.

     ONE for the reason the home page's camera is one: below 1 the row travels
     further than your hand does, and content that outruns the input reads as
     something being PLAYED at you rather than something you are scrolling. The
     section's whole length falls out of it — the row is measured, multiplied by
     this, and that is the pin's end — so a photograph moved in the stylesheet
     adjusts the amount of scrolling by itself. */
  PACE: 1,

  /* SMOOTHING — seconds the playhead takes to catch up with the scroll. `true`
     would be exact tracking, which puts every wheel notch straight onto the
     canvas so the row moves in the steps the input arrives in. A little
     catch-up turns those steps into a glide. Doing a different job from Lenis:
     Lenis smooths the PAGE's scroll, this smooths the camera's pursuit of it.
     Kept short — past about a second the row keeps travelling after your hand
     has stopped. */
  SCRUB: 0.6,

  /* NO EASE, and it is the single most important line in the file for how the
     section feels. An ease is a change of speed, and a change of speed on a
     scrubbed section is what makes it read as a RIDE rather than as a scroll —
     the row would creep at both ends and race through the middle. There is one
     leg here and it runs at one rate from the first frame to the last. */
  EASE: "none",

  /* WHERE A PIECE COUNTS AS ARRIVED, as a fraction of the window width — its
     left edge crossing this is what fires its reveal. Not 1: a photograph that
     starts fading up as its first pixel clears the right edge is a photograph
     that arrives already finished, because the camera is still travelling while
     it does. Slightly inside the edge means the gesture is read on the way in.

     The claim's four lines take this one at a time. That is the whole reason
     the reveals are cued off the CAMERA rather than off the section: a claim
     this wide would otherwise finish writing itself while its last words were
     still off the right of the screen — the failure GiantPinning/reveal.ts
     exists to solve, solved here by the fact that this camera only ever moves
     one way. */
  CUE: 0.86,

  /* WHERE THE SECTION'S OWN ARRIVAL IS, for the pieces that are already on
     screen when the pin takes over — the opening photograph, the label and the
     claim's first line. Those cannot be cued off the camera, because the camera
     has not moved yet when a reader first meets them. The origin section's
     figure, and for its reason: by three quarters there is nothing in shot but
     the sheet. */
  ENTER: "top 70%",
};

/**
 * Pins `root` and runs the canvas from one end of the row to the other.
 *
 * @param root the <section class="product-reel">
 * @returns teardown — kills the trigger, the timeline and the pin-spacer with it
 */
export function initReelPin(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLElement>(".reel-canvas");

  /* THE FRAME, and what actually gets pinned — the wrapper, not the section.
     The two are not the same box: the wrapper is exactly one viewport, which is
     what "pinned" means, while the section is the wrapper PLUS its tail (see
     --reel-tail in the stylesheet), the run of bare sheet that carries the last
     photograph clear of whatever follows once the pin lets go. Pin the section
     and that tail is inside the held box and never scrolls. */
  const frame = root.querySelector<HTMLElement>(".wrapper");

  /* A markup change this file has not caught up with. Either way there is no
     camera to build, and the section is still one readable window onto the left
     end of the row. */
  if (!canvas || !frame) return () => {};

  const reveals = initReelReveal(root);

  /* Hijacking the scroll so it drives a camera instead of the page is squarely
     what this setting is asking about. Leave: the stylesheet's reduced-motion
     block lays the row out as an ordinary stack, so the section still says
     everything it has to say — it just says it by scrolling normally.

     The reveals are flushed rather than skipped, because the letters are parked
     under their masks by the stylesheet and the photographs are held at
     nothing: "reduce motion" must not read as "hide the section". */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveals.flushAll();
    return () => reveals.destroy();
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* Where a piece sits along the row, in the canvas's own coordinates.
   *
   * offsetLeft and not getBoundingClientRect: the rect is where the element is
   * RIGHT NOW, which during a scrub is mid-tween and includes the very
   * transform being solved for. offsetLeft is the untransformed layout
   * position, which is the only stable thing to measure against.
   *
   * Walked up rather than read once, because not everything cued is a child of
   * the canvas — the claim's four lines sit inside the heading, so their own
   * offsetLeft is relative to IT and not to the row. */
  const rowLeft = (el: HTMLElement) => {
    let x = 0;
    let node: HTMLElement | null = el;
    while (node && node !== canvas) {
      x += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    return x;
  };

  /* THE ROW'S LENGTH, measured, and the reason there is no width in the
     stylesheet to keep in step with it.
   *
   * The near end is whatever the leftmost piece's own gutter is, and the far end
   * is the rightmost piece's right edge. The camera travels until the far end
   * sits that same gutter in from the window's right — so the row is left with
   * the margin it opened with, without a second figure saying so.
   *
   * Everything on this canvas is placed in vw, so the whole of this scales with
   * the window and the SHAPE of the travel never changes; only its size in px
   * does, which is what invalidateOnRefresh below is for. */
  const pieces = gsap.utils.toArray<HTMLElement>(".reel-canvas > *", root);

  const travel = () => {
    let near = Infinity;
    let far = 0;
    for (const el of pieces) {
      near = Math.min(near, el.offsetLeft);
      far = Math.max(far, el.offsetLeft + el.offsetWidth);
    }
    if (!Number.isFinite(near)) return 0;
    return Math.max(0, far + near - window.innerWidth);
  };

  /* NO PARALLAX, AND IT IS A DECISION RATHER THAN AN OMISSION.
   *
   * This section had one and it came out in pieces: the label and the note
   * first, then the photographs — which had an inner drift of their own,
   * horizontally and then vertically — and finally the tape. Each removal made
   * it better, which is the tell that the problem was never the amplitude or the
   * axis.
   *
   * The reason is the section. A reader here is already being carried sideways
   * past a row at a steady speed, and that IS the section; anything else moving
   * inside it is a second motion competing with the one that matters. Parallax
   * earns its keep on a still frame, where nothing else is going on. It does not
   * on a page that is already a camera move.
   *
   * The home page's pinning section is the counter-example and not a
   * contradiction: its camera stops on each phrase, and the scenery drifts
   * around the stops. This camera never stops.
   */

  /* ONE TWEEN, one second long, so a cue's position in the timeline IS its
     fraction of the journey and there is no second unit to convert between.
     Function-based, so GSAP re-reads it on every invalidate — every px of it
     came from a vw and all of them are wrong the moment the window changes. */
  const tl = gsap.timeline();
  tl.to(canvas, { x: () => -travel(), duration: 1, ease: REEL.EASE });

  /* WHEN THE CAMERA REACHES EACH PIECE, as a fraction of the journey.
   *
   * The canvas runs from x = 0 to x = -travel, so a piece at `rowLeft` has its
   * left edge at rowLeft + x on screen and is arrived once that is inside
   * REEL.CUE of the window. Solve for x, and the fraction is that over the
   * travel.
   *
   * STABLE UNDER RESIZE, which is why these can be worked out once even though
   * the travel cannot: every term — the piece's position, the cue line and the
   * travel itself — is a multiple of the window width, so the window cancels
   * out. GSAP will not move a callback on invalidate, and it does not have to.
   *
   * A piece whose fraction is at or below zero is already on screen when the
   * pin takes over and cannot be cued off a camera that has not moved. Those go
   * to the section's own arrival trigger below. */
  const span = travel();
  const early: HTMLElement[] = [];

  for (const el of gsap.utils.toArray<HTMLElement>("[data-reel-cue]", root)) {
    const at = span > 0 ? (rowLeft(el) - window.innerWidth * REEL.CUE) / span : 0;
    if (at <= 0) {
      early.push(el);
      continue;
    }
    /* Clamped just inside the end for the same reason the home page's flushes
       are: a call sitting exactly on the duration is one the playhead can
       arrive at without ever crossing. */
    tl.call(() => reveals.play(el), undefined, Math.min(at, 0.999));
  }

  const st = ScrollTrigger.create({
    /* The pinned element is the honest trigger: `start` is about where THIS box
       takes the screen, and the pin is what holds it there. */
    trigger: frame,
    start: REEL.START,
    /* MEASURED, not typed — the row is however long the arrangement makes it,
       and this is that length at the chosen pace. */
    end: () => "+=" + Math.round(travel() * REEL.PACE),
    pin: frame,
    /* True pinning, not fake: the frame is 100vh in a normal document flow, so
       ScrollTrigger can hold it with position: fixed and push the rest of the
       page down with a spacer. */
    pinSpacing: true,
    scrub: REEL.SCRUB,
    /* Re-measures the row and re-reads `end` on every refresh, which includes
       every resize. Without it the camera keeps aiming at where the row ended
       when the page loaded. */
    invalidateOnRefresh: true,
    animation: tl,
  });

  /* THE PIECES THAT ARE ALREADY IN SHOT, on the section's own arrival — see
     REEL.ENTER. Separate from the camera on purpose: these are met before it
     has moved, and hanging them off a timeline position of zero would fire them
     at the instant the pin engaged, which is a screen of content appearing all
     at once under the reader's eye rather than as they scroll to it. */
  const enter = early.length
    ? ScrollTrigger.create({
        trigger: root,
        start: REEL.ENTER,
        once: true,
        onEnter: () => early.forEach((el) => reveals.play(el)),
      })
    : null;

  return () => {
    /* The trigger first: killing it takes the pin-spacer out of the document,
       and doing that after clearing the transform would leave one frame with
       the canvas home and the page still several screens too tall. */
    st.kill();
    enter?.kill();
    tl.kill();
    reveals.destroy();
    /* Back to the stylesheet. A teardown mid-scrub must not leave the canvas
       parked at whatever camera position it happened to be at — with the pin
       gone that is simply a section showing an empty stretch of itself. */
    gsap.set(canvas, { clearProps: "transform" });
  };
}
