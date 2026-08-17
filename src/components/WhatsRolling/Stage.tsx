"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";
import { whenRevealed } from "@/components/Preloader/gate";
import { initRollingReveal } from "./reveal";

/* The only client component in the section — the ref and one effect.
 *
 * Everything inside is server-rendered markup passed through as children: the
 * copy, the split letters and the tag all stay on the server, which is what
 * keeps the headline out of the client bundle and means there is never a frame
 * of unsplit text. The hero, the closing key visual and the product page's
 * opener are all built this way.
 *
 * The headline and the tag are ONE arrival on one cue and are one call for that
 * reason — splitting them into a file each would be two things that start
 * whenever their own code happens to run. See reveal.ts.
 *
 * THE NOTE IS THE SECOND CALL, and it is BUILT BEHIND THE GATE rather than on
 * mount, which is the one thing here that is not obvious. Every other note on
 * the site is below the fold and releases itself when it scrolls into view
 * (HandNote/hand.ts watches for that with an IntersectionObserver). This one is
 * on the opening screen, so it is already intersecting on the first frame — and
 * the first frame is under the preloader. Built on mount it would write itself
 * out in full behind a sheet of paper and be revealed as finished handwriting,
 * which is the same mistake reveal.ts refuses for the headline. Deferring the
 * BUILD is what defers the observer, and the pen starts as the cover clears.
 *
 * Its own subscription rather than a line inside the reveal's: that file is the
 * headline's timeline and the note is not on it. The gate is one-shot per
 * subscription and this component remounts per route, so a return to the page
 * gets a fresh one — see Preloader/gate.ts.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initRollingReveal(root);

    /* Torn down before the cover lifts (StrictMode's double mount) and there is
       nothing to stop — which is why the teardown unsubscribes AND calls
       whatever the build left behind, rather than assuming one of the two. */
    let stopNote: (() => void) | null = null;
    const unsubscribe = whenRevealed(() => {
      stopNote = initHandNote(root);
      /* AND ONLY NOW IS THE NOTE SHOWN. The ruled margin is two cubics in the
         server's markup, so until the line above runs it is sitting there fully
         drawn — and the cover uncovers the BOTTOM of the screen first
         (PRELOADER.HANDOFF), which is where the note is. Without this the reader
         gets a ruled corner for a few frames, then nothing for as long as the
         note waits on the headline, then the same corner drawn properly.

         The stylesheet holds it at nothing until this lands; the attribute is
         the same hand-off .rolling-tag and the headline's letters already make,
         one beat later because this arrives one beat later. Set AFTER the build,
         so the strokes are parked before they are shown rather than after. */
      root.dataset.note = "live";
    });

    return () => {
      unsubscribe();
      stopNote?.();
      stopReveal();
    };
  }, []);

  return (
    <section ref={ref} className="whats-rolling">
      {children}
    </section>
  );
}
