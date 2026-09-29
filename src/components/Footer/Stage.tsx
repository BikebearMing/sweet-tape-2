"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initFooterBalls } from "./balls";
import { initFooterReveal } from "./reveal";
import { initPoke } from "@/components/Hero/poke";

/* The only client component in the footer.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the reveal on
 * mount. Keeping the boundary this thin means the copy stays on the server and
 * none of it ships in the client bundle twice. The hero and the slider are
 * built the same way.
 *
 * The two are independent: the type's arrival and the loose objects in the bed
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
    /* The legal line is NOT here. It used to take the site's body entrance
       (components/bodyReveal.ts) on a cue of its own, and that cue could not be
       reached: the notice sits 1.6vw above the end of the document, so its
       start clamps to the very last scroll pixel and the words stayed under
       their masks. It is plain text now — see the note on it in index.tsx. */
    const stopBalls = initFooterBalls(root);
    /* The headline's pointer poke — the hero's, on the sign-off too (final
       round, 2026-09-29), the same borrow MakeItStick makes. It waits out the
       scroll-triggered reveal on its own (the parked guard in poke.ts). */
    const stopPoke = initPoke(root, ".footer-headline");

    return () => {
      stopReveal();
      stopBalls();
      stopPoke();
    };
  }, []);

  return (
    <footer ref={ref} className="site-footer">
      {children}
    </footer>
  );
}
