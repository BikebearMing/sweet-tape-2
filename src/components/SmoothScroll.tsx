"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { whenRevealed } from "@/components/Preloader/gate";
import { initViewport } from "@/components/viewport";

/* Smooth scrolling, mounted once at the layout so it covers the whole document.
 *
 * Lenis is driven from GSAP's ticker rather than its own rAF loop, so scroll and
 * animation update on the same frame — two loops would let the slider's parallax
 * read a scroll position one frame stale, and it jitters. lagSmoothing(0) stops
 * GSAP absorbing a slow frame, which would desync the two again.
 *
 * Renders nothing; it exists for the effect.
 */

/* The live instance, for the one caller outside this file — see resetScroll.
   A module variable rather than a context because the caller is a plain DOM
   engine and there is exactly one scroller on the site, which is the same pair
   of reasons the preloader's gate is on the document. */
let scroller: Lenis | null = null;

/* Back to the top, now, with nothing animated about it.
 *
 * WHY IT CANNOT BE window.scrollTo. Lenis does set a real scroll position, but
 * it also keeps its own — the target it is easing towards — and it writes that
 * one to the document on every frame. Move the document behind its back and the
 * next frame puts it straight back. So a route change that scrolled the native
 * way would land the reader wherever they had got to on the page they just
 * left, on a page they have never seen.
 *
 * Called from the page transition while the cover is still down, which is what
 * makes an instant jump the right kind: there is nothing on screen to jump.
 * Falls back to the native scroll for the case where Lenis is not running at
 * all — reduced motion, where the transition is called off anyway and this is
 * only ever the router's own reset. */
export function resetScroll(): void {
  if (scroller) {
    scroller.scrollTo(0, { immediate: true, force: true });
    return;
  }
  window.scrollTo(0, 0);
}

export default function SmoothScroll() {
  useEffect(() => {
    /* THE VIEWPORT FIRST, and outside the reduced-motion guard below, because
       it is not motion — it is what the whole site believes a screen is. A
       reader who has asked for less motion still gets a retracting address bar,
       and the sections that measure themselves off the window still have to not
       move when it retracts. See components/viewport.ts. */
    const stopViewport = initViewport();

    /* AND SCROLLTRIGGER IS TOLD THE SAME THING. Its default is to refresh every
       trigger on `resize`, which on a phone means recomputing every pin and
       every scrub range several times during a single downward flick — each one
       a chance for a pinned section to jump. ignoreMobileResize makes it skip
       the refresh when only the HEIGHT changed on a touch device, which is
       exactly the toolbar and nothing else: a rotation changes the width and
       still refreshes.

       Set before any trigger is built. It is global config rather than a
       per-trigger option, so it has to be in place by the time the sections
       mount, and this component is above all of them in the layout. */
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Hijacked scrolling is one of the things "reduce motion" is actually
    // asking about, so leave the native behaviour alone.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return stopViewport;
    }

    /* duration is how long Lenis takes to run out the distance a wheel notch
       asks for — the glide. Higher is looser and heavier; past about 2.2 the
       page starts feeling detached from the wheel rather than smoothed.
       wheelMultiplier is the other half of the feel: it sets how much distance
       a notch asks for in the first place, so drop it below 1 to make the page
       travel less per notch rather than take longer over the same travel. */
    const lenis = new Lenis({ duration: 1.8 });
    scroller = lenis;
    const raf = (t: number) => lenis.raf(t * 1000); // ticker counts seconds, Lenis wants ms

    gsap.ticker.add(raf);

    /* AND SCROLLTRIGGER HAS TO BE TOLD, on the same frame Lenis writes.
     *
     * Lenis sets a real scroll position, so ScrollTrigger does see it — via the
     * browser's own scroll event, which arrives AFTER the frame that moved it.
     * One frame late is invisible on a scrubbed tween and is not invisible on a
     * PIN, because a pin is a threshold: the section is measured against a
     * position it has already left, so it stays in flow for the frame that
     * crosses the pin point and is snapped back into place on the next one.
     *
     * Measured on the giant section, whose pin starts at y=3523: the wrapper
     * reached wrapTop -9.2 still unpinned, then pinned at -0.2 — a 9px snap
     * DOWN at that crossing speed, and the error is one frame of scroll, so it
     * grows with how fast the wheel is thrown. That is the jump as TO CREATE
     * takes the screen.
     *
     * lenis.on("scroll") fires synchronously from inside lenis.raf, which is
     * already on the GSAP ticker above — so the pin is evaluated against the
     * position of the frame being drawn rather than the one before it. It is
     * also the integration Lenis documents for exactly this pairing, and its
     * absence is why every other scroll-driven thing here reads window.scrollY
     * off the ticker by hand rather than trusting a listener. */
    lenis.on("scroll", ScrollTrigger.update);

    /* NOT YET. Turning lag smoothing off is about keeping Lenis and GSAP on the
       same frame, and nothing is scrolling while the preloader holds the page —
       the stylesheet has the scroll locked for the whole of it. What IS
       happening in that window is hydration, and with smoothing off a 200ms
       stall advances every running timeline by 200ms, which the cover pays for
       out of its own choreography: the mark's unfold is a 240ms move half a
       second in, and it can lose most of itself to one slow frame.

       So the preloader keeps its own setting until the cover has gone (see
       initPreloader), and this takes over at the handoff — the same moment the
       scroll unlocks, which is the first moment any of this matters. Fires
       immediately on a page with no preloader on it.

       AND NOT AT THE HANDOFF EITHER — two seconds after it. The hero's
       entrances are still running for nearly that long past the release (title
       0.3s + 1.2s, corner mark 0.55s + 1.1s), and on a COLD load the worst
       stall of the page's life lands inside that window: the GLB arrives late,
       and three's first compile blocks the main thread on more or less the
       frame the title starts rising. With smoothing already off, that one
       stall advances the tween by its full length — the letters snap in
       standing and only the tail of the stagger is seen to move. On a refresh
       the model and the shader cache are warm, the compile happens behind the
       cover, and it never showed. So the preloader's (120, 33) holds until the
       entrances are done; the scroll gives up nothing unless a frame actually
       stalls, which is exactly the frame it should give something up on. */
    let settle: gsap.core.Tween | null = null;
    const stopGate = whenRevealed(() => {
      settle = gsap.delayedCall(2, () => gsap.ticker.lagSmoothing(0));

      /* AND EVERY PIN IS RE-MEASURED, which is a bug fix and not housekeeping.
       *
       * The lock above is `overflow: hidden` on the root, and while it is on the
       * document has no scrollbar — the gutter reserved by scrollbar-gutter is
       * not kept through it. So a window 1440 wide reports a client width of
       * 1440 during the hold and 1428 the instant it lifts, and any pin built in
       * between measures the wrong one: ScrollTrigger writes the pinned box's
       * width onto the element and onto its spacer as inline px, and those two
       * numbers do not follow a viewport that changed after they were taken.
       *
       * WHAT IT LOOKED LIKE was a HORIZONTAL SCROLLBAR on /about and nowhere
       * else — three pinned sections there, each spacer 12px wider than the page
       * that held it, and the widest of them not inside anything that clips x.
       * Every route with a pin on it had the same 12px; that one was the only
       * one where it could be seen.
       *
       * HERE AND NOT IN THE SECTIONS, because it is one fact about the page —
       * the viewport just changed size — and every trigger on it wants the same
       * answer. It is also the only moment on the site when that is true without
       * a resize event to announce it.
       *
       * Cheap and invisible: the page is at the top, nothing has been scrolled
       * past, and a refresh at scroll 0 moves nothing. */
      ScrollTrigger.refresh();
    });

    return () => {
      stopViewport();
      stopGate();
      settle?.kill();
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's own defaults
      lenis.destroy();
      /* Only if it is still ours. StrictMode's second mount has already put its
         own instance here by the time the first one tears down, and clearing it
         blind would leave resetScroll talking to nothing. */
      if (scroller === lenis) scroller = null;
    };
  }, []);

  return null;
}
