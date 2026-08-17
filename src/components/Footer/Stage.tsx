"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initBodyReveal } from "@/components/bodyReveal";
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
 * The three are independent: the type's arrival, the legal line's and the loose
 * objects in the bed share nothing but the element they are scoped to, and any
 * one can fail to start without touching the others — the physics is
 * dynamically imported, so "fail to start" includes a chunk that never arrives.
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
    /* The legal line, on the site's body entrance rather than the letter one
       the row and the headline take — its own cue, its own timeline, and it
       does not belong in reveal.ts's cascade: that is the footer arriving, and
       this is small print at the very foot of it, half a section lower. */
    const stopBody = initBodyReveal(root);
    const stopBalls = initFooterBalls(root);

    return () => {
      stopReveal();
      stopBody();
      stopBalls();
    };
  }, []);

  return (
    <footer ref={ref} className="site-footer">
      {children}
    </footer>
  );
}
