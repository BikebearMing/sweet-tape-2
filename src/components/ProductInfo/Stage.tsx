"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";
import { initPress } from "./press";

/* The origin section's client boundary — a ref, and the two drivers hung off it.
 *
 * NO 3D HERE ANY MORE, and the absence is the point rather than an omission.
 * This section used to build a viewer of its own: a second WebGL context, a
 * second fetch of the same GLB, and the same roll shown a second time at an
 * angle of its own. There is one roll on this page now — the opening section's —
 * and it travels down into this column as the page is scrolled. See
 * ProductIntro/roll.ts, which owns it, and `.threed-tape` in the markup, which
 * is the slot it comes to rest in and which still carries the flat card for the
 * case where three.js never arrives.
 *
 * Both initialisers return their own teardown, so a StrictMode double-mount
 * re-binds rather than doubling every listener.
 */
export default function Stage({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* NO GATE ON THE NOTE, unlike the news page's and the lead story's. Those
     * two are held behind data-note until the cover lifts because they sit where
     * the preloader uncovers FIRST — a note that has already written itself
     * under the paper is a ruled corner and nothing else by the time anybody
     * sees it. This section is a full screen below the fold and cannot be under
     * the cover, so the note's own observer is the whole of its timing: it
     * writes when it is scrolled to, which is the pinning section's arrangement
     * and the reason initHandNote gives each instance an observer of its own. */
    const stopNote = initHandNote(root);

    /* THE TAPE GOES ON HERE, and NOT through initPeel — see press.ts. Both of
     * this section's strips are drive="manual", which peel.ts deliberately
     * leaves alone, because neither of its own drivers is this gesture: "loop"
     * alternates for ever and "scroll" takes the tape back off on the way up.
     *
     * If a LOOPING or SCROLL-SCRUBBED peel is ever added to this section, this
     * is where `initPeel(root)` has to come back — it scans its own root for
     * [data-peel] and nothing binds it for you, and a peel whose section never
     * calls it is a strip frozen at its `from` pose with nothing to show that
     * anything is wrong. */
    const stopPress = initPress(root);

    return () => {
      stopNote();
      stopPress();
    };
  }, []);

  return (
    <section ref={ref} className="product-inner-info" style={style}>
      {children}
    </section>
  );
}
