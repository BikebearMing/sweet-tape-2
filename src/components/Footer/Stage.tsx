"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initFooterBalls } from "./balls";
import { initFooterReveal } from "./reveal";

/* The only client component in the footer.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the reveal on
 * mount. Keeping the boundary this thin means the copy stays on the server and
 * none of it ships in the client bundle twice. The hero and the slider are
 * built the same way.
 *
 * The two are independent: the copy's arrival and the loose objects in the bed
 * share nothing but the element they are scoped to, and either can fail to
 * start without touching the other — the physics is dynamically imported, so
 * "fail to start" includes a chunk that never arrives.
 *
 * Both return their own teardown, so a StrictMode double-mount tears down
 * cleanly and re-binds rather than stacking a second tween on the same letters,
 * leaving an orphaned ScrollTrigger behind, or running two engines over one
 * set of balls.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initFooterReveal(root);
    const stopBalls = initFooterBalls(root);

    return () => {
      stopReveal();
      stopBalls();
    };
  }, []);

  return (
    <footer ref={ref} className="site-footer">
      {children}
    </footer>
  );
}
