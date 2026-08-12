"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";
import { initPeel } from "@/components/Peel/peel";
import { initGiantPinning } from "./pin";

/* The only client component in the section.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the pin on
 * mount. The slider and the footer are built the same way, and for the same
 * reason: the copy and the arrangement stay on the server.
 *
 * initGiantPinning returns its own teardown, so a StrictMode double-mount tears
 * down cleanly rather than leaving an orphaned ScrollTrigger holding a pin —
 * which is worse here than elsewhere, because a stale pin leaves a pin-spacer
 * in the document and every section below it moves.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* THE PEELS HAVE TO BE BOUND PER SECTION. initPeel scans its root for
       [data-peel] and drives what it finds, and the only other caller is the
       hero's Stage — scoped to the hero. So the tape on these cards rendered in
       its rest pose and stayed there: --peel never left 0, because nothing was
       writing it. Two roots, two drivers, each with its own teardown.

       Independent of the camera on purpose: either can fail to start without
       touching the other, and a section whose tape does not lift is still a
       section that reads. */
    const stopPin = initGiantPinning(root);
    const stopPeel = initPeel(root);
    /* And the note under TO CREATE, for exactly the reason the peels are bound
       here: initHandNote scans its root for .hand-note, and the hero's Stage
       only ever passes the hero. Two roots, two drivers, each with its own
       teardown — and each builds its own Vara instance, so neither can be left
       holding the other's letterforms. */
    const stopHand = initHandNote(root);

    return () => {
      stopPin();
      stopPeel();
      stopHand();
    };
  }, []);

  return (
    <section ref={ref} className="giant-pinning">
      {/* The bite in the top edge — the footer's arc, at the other end of the
          page. Decoration, and an element only because the mask has to be kept
          off the section itself: .wrapper is pinned with position: fixed, and a
          masked ancestor is a containing block for that in some engines. The
          full argument is on .giant-brow in global.css.

          BEFORE .wrapper, so the paint order matches the layout — the band is
          the section's top edge and the frame begins under it. */}
      <span className="giant-brow" aria-hidden="true" />
      <div className="wrapper">{children}</div>
    </section>
  );
}
