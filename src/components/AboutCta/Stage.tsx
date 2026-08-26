"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initBodyReveal } from "@/components/bodyReveal";

import { initCtaParallax } from "./parallax";
import { initCtaReveal } from "./reveal";

/* The section's only client component — the thin boundary the hero, the belt,
 * the closing key visual and WE WANTED TO BE. all use. Everything inside it is
 * server-rendered markup passed through as children; this exists to own a ref
 * and hand the section to the three things that run in it.
 *
 * THE SECTION ELEMENT IS HERE rather than in index.tsx, and that is the point of
 * the file: data-reveal is set on this element and the stylesheet keys the
 * letters' masks and the pill's park off `.about-cta[data-reveal="live"]`, so
 * the element the ref points at has to be the one carrying the class.
 *
 * THREE, AND THEY SHARE NOTHING BUT THE ROOT. The headline's letters and the
 * pill are one timeline off one trigger (./reveal.ts); the small line above them
 * is the site's shared body-copy entrance, which measures its own lines and is
 * not this section's business (components/bodyReveal.ts); and the curtain's
 * drift is on the ticker with no trigger at all (./parallax.ts). Any one of them
 * can fail to start without touching the other two.
 *
 * Each returns its own teardown, so a StrictMode double mount re-binds cleanly
 * rather than stacking a second tween on the same letters or a second ticker
 * callback on the same photograph.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initCtaReveal(root);
    const stopBody = initBodyReveal(root);
    const stopParallax = initCtaParallax(root);

    return () => {
      stopReveal();
      stopBody();
      stopParallax();
    };
  }, []);

  return (
    <section ref={ref} className="about-cta">
      {children}
    </section>
  );
}
