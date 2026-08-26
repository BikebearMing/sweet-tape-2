"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initWeWanted } from "./crawl";

/* The section's only client component — the same thin boundary the band, the
 * slider and the pinning section all use. Everything inside it is
 * server-rendered markup passed through as children; this exists to own a ref
 * and hand the section to crawl.ts on mount.
 *
 * THE STAGE IS A BOX OF ITS OWN and that is not tidiness: a pin is an element
 * held with position: fixed inside something taller, so the thing being held and
 * the thing providing the scrolling cannot be the same box. .wanted-stage is one
 * screen tall and is what stands still; the <section> around it is however long
 * ScrollTrigger's spacer makes it. THE SIBLINGS, SUPER POWERS and the home
 * page's camera are all built this way.
 *
 * AND THE CANVAS IS A BOX OF ITS OWN FOR THE SAME KIND OF REASON. On the sheets
 * where this section is a canvas walked past a window — see pans() in crawl.ts —
 * ONE element moves, and everything drawn on it has to be inside that element or
 * it is not on the canvas. The sentence and the four claims are siblings, so the
 * canvas is the box that holds both; the stage's paper grain stays outside it,
 * because a grain that travelled with the drawing would give the pin away.
 *
 * It is present on every sheet and is nothing but a positioning context until
 * the engine sets data-pan — the same shape as .giant-canvas on the home page.
 *
 * initWeWanted returns its own teardown, so a StrictMode double-mount re-binds
 * cleanly rather than leaving an orphaned ScrollTrigger holding a pin — worse
 * here than elsewhere, because a stale pin leaves a pin-spacer in the document
 * and everything below it moves.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initWeWanted(root);
  }, []);

  return (
    <section ref={ref} className="we-wanted">
      <div className="wanted-stage">
        <div className="wanted-canvas">{children}</div>
      </div>
    </section>
  );
}
