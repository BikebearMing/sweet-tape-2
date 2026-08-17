"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initPeel } from "@/components/Peel/peel";
import { initBodyReveal } from "@/components/bodyReveal";
import { initStickParallax } from "./parallax";
import { initStickReveal } from "./reveal";

/* The only client component in the section. It owns the ref and hands the
 * section to the four things that run in it.
 *
 * initPeel SCANS ITS OWN ROOT for [data-peel] and drives what it finds, so a
 * section that renders a Peel and never calls it gets the rest pose and nothing
 * else — which is the bug the pinning section's Stage documents at length. Three
 * sections render tape now; three roots call this, each with its own teardown.
 *
 * The other three are the section's arrival: the headline's letters, the
 * sub-line's lines and the photograph's inner drift. All four are independent —
 * they share nothing but the element they are scoped to, and any one can fail
 * to start without touching the others. The footer's Stage is built the same
 * way and for the same reason.
 *
 * Everything inside is server-rendered markup passed through as children. The
 * copy, the arrangement and the picture all stay on the server; this is a ref
 * and an effect.
 *
 * Every one of them returns its own teardown, so a StrictMode double mount
 * tears down cleanly and re-binds rather than stacking a second tween on the
 * same letters or a second ticker callback on the same picture.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopPeel = initPeel(root);
    const stopReveal = initStickReveal(root);
    const stopBody = initBodyReveal(root);
    const stopParallax = initStickParallax(root);

    return () => {
      stopPeel();
      stopReveal();
      stopBody();
      stopParallax();
    };
  }, []);

  return (
    <section ref={ref} className="make-it-stick">
      {children}
    </section>
  );
}
