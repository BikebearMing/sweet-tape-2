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
      {/* THE STAGE — one screen, carrying everything: the two grounds, the
          grain, the sheet and the writing on it. No longer pinned — ./unfold.ts
          only uses it as the reveal's trigger now — but it keeps the box:
          global.css composes the whole drawing against its one-screen height.
          components/Reason is built the same way round. */}
      <div className="reimagine-stage">{children}</div>
    </section>
  );
}
