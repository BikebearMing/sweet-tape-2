"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initPeel } from "@/components/Peel/peel";

/* The only client component in the section, and it exists for one reason: the
 * strip of tape across the seam has to be driven.
 *
 * initPeel SCANS ITS OWN ROOT for [data-peel] and drives what it finds, so a
 * section that renders a Peel and never calls it gets the rest pose and nothing
 * else — which is the bug the pinning section's Stage documents at length. Three
 * sections render tape now; three roots call this, each with its own teardown.
 *
 * Everything inside is server-rendered markup passed through as children. The
 * copy, the arrangement and the picture all stay on the server; this is a ref
 * and an effect.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initPeel(root);
  }, []);

  return (
    <section ref={ref} className="make-it-stick">
      {children}
    </section>
  );
}
