"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initHero } from "./engine";
import { initRollEntrance } from "./entrance";
import { initNote } from "./note";
import { initParallax } from "./parallax";
import { initCopyReveal, initCornerMark, initReveal } from "./reveal";

/* The only client component in the hero.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the two things
 * that need one on mount. Keeping the boundary this thin means the copy stays
 * on the server and none of it ships in the client bundle twice.
 *
 * The two are independent: the roll's scroll choreography and the type's
 * entrance share nothing but the element they are scoped to, and either can
 * fail to start without touching the other.
 *
 * Both return their own teardown, so a StrictMode double-mount tears down
 * cleanly and re-binds rather than doubling the ticker callback or stacking a
 * second tween on the same letters.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopTape = initHero(root);
    /* initReveal first, and the two after it in the same task: it is what sets
       data-reveal, and both park their own letters against a computed
       transform of `none`. A paint in between would show them standing. */
    const stopReveal = initReveal(root);
    const stopCorner = initCornerMark(root);
    const stopCopy = initCopyReveal(root);
    const stopRoll = initRollEntrance(root);
    const stopNote = initNote(root);
    const stopParallax = initParallax(root);

    return () => {
      stopTape();
      stopReveal();
      stopCorner();
      stopCopy();
      stopRoll();
      stopNote();
      stopParallax();
    };
  }, []);

  return (
    <section ref={ref} className="hero-section">
      {children}
    </section>
  );
}
