"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { initProductIntro } from "./reveal";
import { initProductRoll } from "./roll";

/* The client boundary at the top of the product page.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the two drivers
 * on mount. Keeping the boundary this thin means the markup and the tape data
 * stay on the server, which is the same split the slider's Stage makes.
 *
 * TWO DRIVERS, EACH WITH ITS OWN TEARDOWN, and they are separate because they
 * answer to different clocks. The entrance (reveal.ts) is a one-shot played off
 * the preloader's gate: the marks rise, the roll bounces in, and it is over. The
 * roll (roll.ts) has a lifetime as long as the page's — a WebGL context, a
 * pointer lean and a scroll-driven journey into the section below — and none of
 * that is an entrance.
 *
 * Both return their own teardown, so a StrictMode double-mount disposes the
 * first WebGL context instead of leaving it holding a canvas nobody draws into,
 * and re-parks the letters rather than leaving one held under a mask by a mount
 * whose timeline will never play.
 */
export default function Stage({
  children,
  model,
  clarity,
  style,
}: {
  children: ReactNode;
  model: string;
  clarity?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopIntro = initProductIntro(root);
    const stopRoll = initProductRoll(root);

    return () => {
      stopIntro();
      stopRoll();
    };
  }, []);

  return (
    /* THE TAPE ARRIVES AS TWO ATTRIBUTES AND NOT AS PROPS OF roll.ts, which is
       the seam every 3D section on this site is built on: roll.ts is plain DOM
       and is handed the section, not a tape. `data-clarity` is omitted rather
       than written as 0 when a tape has none, so the attribute's absence and a
       solid roll are the same thing all the way down. */
    <section
      ref={ref}
      className="product-intro"
      data-model={model}
      data-clarity={clarity}
      style={style}
    >
      {children}
    </section>
  );
}
