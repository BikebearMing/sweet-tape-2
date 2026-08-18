"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";
import { initReelPin } from "./pin";

/* The run's client boundary — a ref, and the two drivers hung off it.
 *
 * The camera is one of them and it owns the reveals: pin.ts builds the
 * timeline, so it is the only thing that knows WHEN the camera arrives at each
 * piece of the row, and cueing them from anywhere else would be a second
 * opinion about that arriving on a different frame. See pin.ts and reveal.ts,
 * which is driven from it.
 *
 * THE NOTE IS BOUND SEPARATELY, for the reason it is bound separately in every
 * section that carries one: initHandNote scans its own root for .hand-note and
 * nothing else binds it for you, so a section that never calls it shows a ruled
 * corner with no writing beside it. Independent of the camera on purpose —
 * either can fail to start without touching the other.
 *
 * Both initialisers return their own teardown, so a StrictMode double-mount
 * re-binds rather than leaving an orphaned ScrollTrigger holding a pin — which
 * is worse here than elsewhere, because a stale pin leaves a pin-spacer in the
 * document and every section below it moves.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopPin = initReelPin(root);
    const stopNote = initHandNote(root);

    return () => {
      stopPin();
      stopNote();
    };
  }, []);

  return (
    <section ref={ref} className="product-reel">
      {children}
    </section>
  );
}
