"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initReason } from "./arrive";

/* THAT'S WHY SWEET TAPE EXISTS.'s client boundary — a ref and one driver.
 *
 * The same hair-thin wrapper every section on this site has: the markup is
 * server-rendered, and the only thing that has to run in the browser is the
 * element handed to the engine. initReason returns its own teardown, so a
 * StrictMode double-mount re-binds rather than leaving a second ScrollTrigger,
 * a second timeline and a second WebGL context behind.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initReason(root);
  }, []);

  return (
    <section ref={ref} className="reason">
      {children}
    </section>
  );
}
