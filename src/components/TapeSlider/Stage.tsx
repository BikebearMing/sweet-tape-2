"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initTapeSlider } from "./engine";

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
    if (!ref.current) return;
    return initTapeSlider(ref.current);
  }, []);

  return (
    <section ref={ref} className="tape-slider-parent">
      {children}
    </section>
  );
}
