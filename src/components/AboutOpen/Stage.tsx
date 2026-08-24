"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";
import { whenRevealed } from "@/components/Preloader/gate";

import { initAboutReveal } from "./reveal";
import { initSpaceOut } from "./spaceOut";

/* The section's only client component — the same thin boundary the hero, the
 * band and the pinning section all use. Everything inside it is server-rendered
 * markup passed through as children; this exists to own a ref and hand the
 * section to reveal.ts on mount, so the copy stays on the server and none of it
 * ships in the client bundle twice.
 *
 * THE SECTION ITSELF IS HERE rather than in index.tsx, and that is the point of
 * the file: data-reveal is set on this element and the stylesheet keys the
 * letters' masks off `.about-hero[data-reveal="live"]`, so the element the ref
 * points at has to be the one carrying the class.
 *
 * initAboutReveal returns its own teardown, so a StrictMode double-mount
 * re-binds cleanly rather than stacking a second tween on the same letters.
 *
 * AND THE NOTE IS BUILT BEHIND THE GATE rather than on mount, which is the one
 * thing here that is not obvious. Every note below the fold releases itself when
 * it scrolls into view — HandNote/hand.ts watches for that with an
 * IntersectionObserver — and this one is on the opening screen, so it is already
 * intersecting on the first frame, and the first frame is under the cover. Built
 * on mount it would write itself out in full behind a sheet of paper and be
 * revealed as finished handwriting, which is exactly the mistake reveal.ts
 * refuses on the headline's behalf. Deferring the BUILD is what defers the
 * observer, and the pen touches down after the cover clears.
 *
 * components/WhatsRolling/Stage.tsx is the same arrangement for the same reason,
 * and is where it was worked out.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* initAboutReveal first: it is what sets data-reveal, and the letters park
       themselves against a computed transform of `none`. The scrub is
       independent of it — it moves .half and the hand, neither of which the
       reveal touches — but both return their own teardown, so a StrictMode
       double-mount re-binds cleanly rather than stacking two of either. */
    const stopReveal = initAboutReveal(root);
    const stopSpaceOut = initSpaceOut(root);

    /* Torn down before the cover lifts (StrictMode's double mount) and there is
       nothing to stop — which is why the teardown unsubscribes AND calls
       whatever the build left behind, rather than assuming one of the two. */
    let stopNote: (() => void) | null = null;
    const unsubscribe = whenRevealed(() => {
      stopNote = initHandNote(root);
      /* AND ONLY NOW IS THE NOTE SHOWN. The ruled margin is two cubics in the
         server's markup, so until the line above runs it is sitting there fully
         drawn; hand.ts only parks it when it builds. The stylesheet holds the
         whole note at nothing until this lands — the same hand-over the letters
         make with data-reveal, in a second attribute because it is a second
         beat. Set AFTER the build, so the strokes are parked before they are
         shown rather than after. */
      root.dataset.note = "live";
    });

    return () => {
      unsubscribe();
      stopNote?.();
      stopReveal();
      stopSpaceOut();
    };
  }, []);

  return (
    <section ref={ref} className="about-open about-hero">
      {children}
    </section>
  );
}
