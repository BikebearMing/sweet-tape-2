"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initNewsFilter } from "./filter";
import { initIndexReveal } from "./reveal";

/* The only client component in the section. It owns the ref and hands the
 * section to the two things that run in it.
 *
 * THE PAIR IS WIRED HERE rather than by one importing the other, which is the
 * same arrangement the product page's row and its recolour are in. The filter
 * knows which tab is on and nothing else; the reveal knows how a card arrives and
 * nothing else. Handing the first a callback into the second is what keeps it
 * that way — the filter still works on a page where the reveal never started, and
 * the reveal is a section entrance on any page with no tabs at all.
 *
 * ORDER MATTERS ONE WAY ROUND: the reveal is built first, because the filter's
 * callback fires the moment a tab is picked and there has to be something to call
 * by then. Nothing else about them is ordered.
 *
 * Everything inside is server-rendered markup passed through as children — the
 * three tabs and all nine cards, titles, dates and pictures included. Filtering
 * is one attribute on this element and the stylesheet does the hiding, so the
 * grid never re-renders and none of the copy is in the client bundle. See
 * filter.ts, which makes the argument at length.
 *
 * Both return a teardown, so a StrictMode double mount tears down cleanly and
 * re-binds rather than stacking a second listener on the same tabs.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reveal = initIndexReveal(root);
    const filter = initNewsFilter(root, reveal.replay);

    return () => {
      filter.stop();
      reveal.stop();
    };
  }, []);

  return (
    <section ref={ref} className="news-index">
      {children}
    </section>
  );
}
