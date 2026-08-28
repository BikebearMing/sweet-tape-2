"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

import { initSiblingsReveal } from "./reveal";

/* The only client component in the section.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the reveal on
 * mount. Keeping the boundary this thin means the copy and the artwork paths
 * stay on the server and none of it ships in the client bundle twice. The
 * origin section above and the opening screen above that are built the same
 * way.
 *
 * One thing runs here, so there is one call. It returns its own teardown, so a
 * StrictMode double mount tears down cleanly and re-binds rather than stacking a
 * second tween on the same letters or leaving an orphaned pin behind — and an
 * orphaned pin is not a leak like the others, it is three screens of spacer left
 * in the document.
 */
/* THE STYLE PROP CARRIES THIS TAPE'S OVERRIDES, and nothing else ever sets it.
   The stylesheet declares this section's colour tokens on this very element, so
   an inline value here wins over the class rule without an !important anywhere;
   a tape that overrides nothing passes an empty object and the stylesheet's own
   colours stand. See the Section colours group in src/collections/Tapes.ts. */
export default function Stage({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initSiblingsReveal(root);
  }, []);

  /* THE STAGE IS WHAT GETS PINNED, and it is a box of its own rather than the
     section itself: ScrollTrigger holds it with position: fixed and pushes the
     rest of the page down with a spacer, which it can only do to an element that
     is the window's height inside something taller. The section is that
     something — it ends up as tall as the whole pinned sequence. The pinning
     section up the page is built the same way and calls its box .wrapper. */
  return (
    <section ref={ref} className="siblings-section" style={style}>
      <div className="siblings-stage">{children}</div>
    </section>
  );
}
