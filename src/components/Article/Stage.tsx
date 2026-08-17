"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initBodyReveal } from "@/components/bodyReveal";
import { initHandNote } from "@/components/HandNote/hand";
import { whenRevealed } from "@/components/Preloader/gate";
import { initArticleReveal } from "./reveal";

/* The only client component in the section besides the share row. It owns the
 * ref and hands the page to the three things that run in it.
 *
 * The two headings and the chip, the article's own copy, and the note. All
 * three are independent — they share nothing but the element they are scoped to,
 * and any one can fail to start without touching the others. Every Stage on this
 * site is built the same way.
 *
 * THE NOTE IS BUILT BEHIND THE GATE, which is the one thing here that is not
 * obvious, and it is the title card's arrangement word for word: every other
 * note on the site is below the fold and releases itself when it is scrolled to
 * (HandNote/hand.ts watches with an IntersectionObserver). This one is on the
 * opening screen, so it is already intersecting on the first frame — and the
 * first frame is under the preloader. Built on mount it would write itself out
 * in full behind a sheet of paper and be revealed as finished handwriting, which
 * is the same mistake reveal.ts refuses for the headline. Deferring the BUILD is
 * what defers the observer, and the pen starts as the cover clears.
 *
 * WHEN it starts is not decided here either: initArticleReveal publishes
 * --hand-delay on this element once it knows how long the headline takes, and
 * hand.ts reads it off the note. Neither file names the other.
 *
 * Everything inside is server-rendered markup passed through as children — both
 * headings, their split letters, the date, the photograph and every paragraph of
 * the article. None of the copy is in the client bundle.
 *
 * All three return a teardown, so a StrictMode double mount tears down cleanly
 * and re-binds rather than stacking a second pen on the same note.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initArticleReveal(root);
    const stopBody = initBodyReveal(root);

    /* Torn down before the cover lifts (StrictMode's double mount) and there is
       nothing to stop — which is why the teardown unsubscribes AND calls
       whatever the build left behind, rather than assuming one of the two. */
    let stopNote: (() => void) | null = null;
    const unsubscribe = whenRevealed(() => {
      stopNote = initHandNote(root);
      /* AND ONLY NOW IS THE NOTE SHOWN. Its ruled margin is two cubics in the
         server's markup, so until the line above runs it is sitting there fully
         drawn. The stylesheet holds it at nothing until this attribute lands;
         set AFTER the build, so the strokes are parked before they are shown
         rather than after. The title card carries the identical pair. */
      root.dataset.note = "live";
    });

    return () => {
      unsubscribe();
      stopNote?.();
      stopBody();
      stopReveal();
    };
  }, []);

  return (
    <article ref={ref} className="news-article">
      {children}
    </article>
  );
}
