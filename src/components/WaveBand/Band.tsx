"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initBand } from "./marquee";

/* The band's only client component — same thin boundary as the hero's Stage.
 * The SVG is server-rendered markup passed through as children; this exists to
 * own a ref to the section and hand it to the marquee on mount. initBand
 * returns its own teardown, so a StrictMode double-mount re-binds cleanly
 * instead of stacking a second tween on the same textPath.
 *
 * aria-hidden: the band is decoration — the same sentence eight times, bent
 * for effect. A screen reader gains nothing from any of it.
 */
export default function Band({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initBand(root);
  }, []);

  return (
    <section ref={ref} className="wave-band" aria-hidden="true">
      {children}
    </section>
  );
}
