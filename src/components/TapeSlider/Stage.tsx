"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initTapeSlider } from "./engine";
import { initSliderFit } from "./fit";

/* The only client component in the slider.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the engine on
 * mount. Keeping the boundary this thin means the markup and the tape data stay
 * on the server, and none of it ships in the client bundle twice.
 *
 * initTapeSlider returns its own teardown, so a StrictMode double-mount tears
 * down cleanly and re-binds rather than doubling every listener.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* Two independent drivers, each with its own teardown. The fit is pure
       layout — one number written on this element — and it is kept out of the
       engine deliberately: it has to be right on the first frame and stay right
       whatever the engine is doing, and a section whose tape swap failed to
       start is still a section that should be the right size. */
    const stopEngine = initTapeSlider(root);
    const stopFit = initSliderFit(root);

    return () => {
      stopEngine();
      stopFit();
    };
  }, []);

  return (
    <section ref={ref} className="tape-slider-parent">
      {children}
    </section>
  );
}
