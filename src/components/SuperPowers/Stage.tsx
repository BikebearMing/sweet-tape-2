"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initSuperPowersReveal } from "./reveal";

/* The only client component in the section.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the reveal on
 * mount. Keeping the boundary this thin means the copy stays on the server and
 * none of it ships in the client bundle twice. THE SIBLINGS above it and the
 * origin section above that are built the same way.
 *
 * One thing runs here, so there is one call. It returns its own teardown, so a
 * StrictMode double mount tears down cleanly and re-binds rather than stacking a
 * second tween on the same letters or leaving an orphaned pin behind — and an
 * orphaned pin is not a leak like the others, it is three screens of spacer left
 * in the document.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initSuperPowersReveal(root);
  }, []);

  /* THE STAGE IS WHAT GETS PINNED, and it is a box of its own rather than the
     section itself: ScrollTrigger holds it with position: fixed and pushes the
     rest of the page down with a spacer, which it can only do to an element that
     is the window's height inside something taller. The section is that
     something — it ends up as tall as the whole pinned sequence. THE SIBLINGS up
     the page is built the same way and calls its box .siblings-stage. */
  return (
    <section ref={ref} className="super-powers">
      <div className="powers-stage">{children}</div>
    </section>
  );
}
