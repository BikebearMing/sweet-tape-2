"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";

/* Smooth scrolling, mounted once at the layout so it covers the whole document.
 *
 * Lenis is driven from GSAP's ticker rather than its own rAF loop, so scroll and
 * animation update on the same frame — two loops would let the slider's parallax
 * read a scroll position one frame stale, and it jitters. lagSmoothing(0) stops
 * GSAP absorbing a slow frame, which would desync the two again.
 *
 * Renders nothing; it exists for the effect.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Hijacked scrolling is one of the things "reduce motion" is actually
    // asking about, so leave the native behaviour alone.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1 });
    const raf = (t: number) => lenis.raf(t * 1000); // ticker counts seconds, Lenis wants ms

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's own defaults
      lenis.destroy();
    };
  }, []);

  return null;
}
