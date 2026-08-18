"use client";

import { useEffect, useRef, type ReactNode } from "react";

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
 * second tween on the same letters or leaving an orphaned ScrollTrigger behind.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initSiblingsReveal(root);
  }, []);

  return (
    <section ref={ref} className="siblings-section">
      {children}
    </section>
  );
}
