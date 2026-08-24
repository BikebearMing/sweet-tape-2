"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initReimagine } from "./unfold";

/* The section's only client component — the same thin boundary every other
 * section on this site uses. Everything inside is server-rendered markup passed
 * through as children; this exists to own a ref and hand the section to
 * unfold.ts on mount.
 *
 * initReimagine returns its own teardown, so a StrictMode double-mount re-binds
 * cleanly rather than leaving a dead ScrollTrigger holding a half-opened sheet.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initReimagine(root);
  }, []);

  return (
    <section ref={ref} className="reimagine">
      {/* THE STAGE — one screen, and the box that is PINNED.

          It carries everything: the two grounds, the grain, the sheet and the
          writing on it. ./unfold.ts pins this at top top for two screens while
          the paper opens, so anything painted on the section instead would
          scroll behind a sheet that is not moving.

          AND IT IS THIS DIV AND NOT THE <section> FOR A REASON THAT COST A
          WHOLE AFTERNOON. Pinning reparents the pinned element into a
          .pin-spacer; React does not see it and calls removeChild on a parent
          that is no longer the parent, and every navigation away from the page
          dies. It only bites when the pinned box is a direct child of the page,
          which is why Conveyor/Stage.tsx — the one section on this site that
          pins itself — carries the diagnosis and a second effect to work around
          it. A stage is what the other five pinned sections have instead of
          that workaround, and it is why this one needs nothing.

          It is here and not in index.tsx because it wraps everything the section
          draws and there is nothing to say about it that is not said in
          global.css. components/Reason is built the same way round. */}
      <div className="reimagine-stage">{children}</div>
    </section>
  );
}
