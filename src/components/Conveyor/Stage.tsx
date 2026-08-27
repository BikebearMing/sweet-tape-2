"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

import { initHandNote } from "@/components/HandNote/hand";

import { initConveyor } from "./belt";

/* The section's only client component — the same thin boundary the band, the
 * slider and WE WANTED TO BE. all use. Everything inside it is server-rendered
 * markup passed through as children; this exists to own a ref and hand the
 * section to belt.ts on mount.
 *
 * NO STAGE BOX INSIDE IT, unlike the sections that pin. Nothing here is held
 * still — the belt is scrubbed where it stands — so the section can be the
 * trigger and the thing that moves at the same time, and one box is enough.
 *
 * AND THAT ONE SENTENCE IS WHY THIS FILE HAS TWO EFFECTS IN IT. Read on.
 *
 * initConveyor returns its own teardown, so a StrictMode double-mount re-binds
 * cleanly rather than leaving a second ScrollTrigger writing the same property.
 */

/* useLayoutEffect on the client, useEffect on the server — React warns that the
   layout one does nothing during SSR, and it is right: this is a client
   component but a client component still renders on the server once. The
   teardown below is the only thing that uses it, and a teardown has nothing to
   do on a render that will never unmount. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  /* Held here rather than returned from the effect, because the thing that has
     to CALL it is the other effect. Nulled on the way out so that whichever of
     the two fires second finds nothing left to do. */
  const teardown = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* THE ROLL PILL'S NOTE IS WRITTEN BY THE SAME PEN as the board's and the
     * opening screen's, and like both of those the section that carries one is
     * what starts it — initHandNote scans this root for .hand-note and builds
     * each one it finds on its own IntersectionObserver.
     *
     * IT FINDS THREE, and that is correct rather than a leak. The row is printed
     * REPEAT times (see components/Conveyor), so there are three copies of the
     * pill on the belt and each has to be able to write when ITS OWN copy comes
     * past the window — a single build shared between them would leave two
     * ruled corners with nothing beside them. Only the first is in the
     * accessibility tree; the other two are marked decorative in the markup.
     *
     * NOTHING WAITS ON THE BELT. The note is released by being seen, which on a
     * row that travels is exactly the beat wanted: the pen touches down as the
     * pill arrives from the right rather than on a clock the belt knows nothing
     * about. So this is a plain second init beside the first and not something
     * belt.ts has to hand off to. */
    const stop_note = initHandNote(root);
    const stop_belt = initConveyor(root);

    teardown.current = () => {
      stop_belt();
      stop_note();
    };
    return () => {
      teardown.current?.();
      teardown.current = null;
    };
  }, []);

  /* THE SAME TEARDOWN AGAIN, IN THE PHASE THAT CAN STILL REACH THE DOM, and it
   * fixes a crash on every navigation away from /about.
   *
   * THE BUG. belt.ts pins with `pin: true`, which pins the TRIGGER — and the
   * trigger is the section this file renders. Pinning reparents: ScrollTrigger
   * wraps the pinned element in a .pin-spacer, so <section class="conveyor">
   * stops being a child of <body> and becomes a child of that spacer. React
   * never sees this happen and goes on believing the section's parent is the
   * one it rendered it into.
   *
   * Then the reader clicks a link. React deletes the page's subtree, and it
   * removes a subtree by calling removeChild on the TOP-LEVEL host nodes of it
   * — body.removeChild(section) — which throws NotFoundError, because the
   * section's real parent is the spacer. The whole navigation's commit dies
   * with it.
   *
   * WHY THE OTHER FIVE PINS ON THIS SITE ARE FINE. THE BELT, THE SIBLINGS,
   * SUPER POWERS, WE WANTED TO BE., GIANT PINNING and the reel all pin an inner
   * stage div rather than their section, so their spacer is created INSIDE a
   * section that is still where React left it. React does not remove nested
   * host nodes one by one — it removes the outermost and lets the browser take
   * the rest with it — so a spacer below the top level is never something it
   * asks a question about. This section is the only one on the site that pins
   * itself, which is the design decision the comment above describes, and it is
   * the only one that crashed.
   *
   * WHY THE TEARDOWN ABOVE DOES NOT ALREADY FIX IT. It does the right thing:
   * run.scrollTrigger.kill() calls disable(), which calls revert(), which calls
   * _swapPinOut and puts the section back exactly where React thinks it is. It
   * simply runs TOO LATE. A useEffect cleanup is a PASSIVE effect, and React
   * flushes passive destroys after the mutation phase — after the removeChild
   * that has already thrown. A useLayoutEffect cleanup is destroyed during the
   * mutation phase, and for a fiber being deleted React destroys the layout
   * effects of a component BEFORE it recurses into that component's host nodes
   * to remove them. That ordering is the entire fix.
   *
   * WHY THE SETUP DID NOT MOVE UP HERE WITH IT. Making the whole effect a
   * layout effect is the shorter version of this and is what GSAP's own React
   * guide recommends, and it would change WHEN the belt is measured — from
   * after the first paint to before it. That is three pins on this page whose
   * refreshPriority order is hand-tuned, plus .reason's negative margin, which
   * is an appointment with this section's spacer height (see RUN.HOLD in
   * ./belt.ts). None of that is worth re-proving to fix a teardown. The bug is
   * a statement about the teardown, so only the teardown moved.
   *
   * IF THIS SECTION EVER GROWS A STAGE BOX, delete this effect. Pin an inner
   * div like everything else does and the whole problem stops existing. */
  useIsomorphicLayoutEffect(
    () => () => {
      teardown.current?.();
      teardown.current = null;
    },
    [],
  );

  return (
    <section ref={ref} className="conveyor">
      {children}
    </section>
  );
}
