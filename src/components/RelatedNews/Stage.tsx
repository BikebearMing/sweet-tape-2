"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initStickReveal } from "@/components/MakeItStick/reveal";
import { initIndexReveal } from "@/components/NewsIndex/reveal";

/* The only client component in the section — and it writes no animation at all.
 * Both of the things that arrive here are imported whole.
 *
 * initIndexReveal is the newsroom's own wall coming into focus: each card starts
 * blurred, a little low and at nothing, and resolves in place, read across the
 * row. It is the same engine the index runs because this is the same object —
 * three of the index's cards instead of nine — and it needs nothing said to it:
 * it finds .index-card under whatever root it is given, and the filter half of
 * it simply finds no tabs here and builds nothing. Its `replay` is for a wall
 * that can be cut; nothing cuts this one, so it is dropped.
 *
 * initStickReveal is the site's headline voice on a ScrollTrigger — every letter
 * under its own mask, sliding up in a shuffled order. It collects
 * .stick-headline .char, which is why the heading below wears that class and
 * re-states its own size after it; the lead story's title makes exactly the same
 * bargain, and .related-title in global.css says so.
 *
 * TWO ENGINES ON ONE ROOT AND THEY DO NOT COLLIDE. Both set data-reveal="live"
 * on this element — the same value, and each of them owns different elements
 * under it — and both run in this one effect, so nothing paints between the
 * attribute landing and either of them parking what it is about to move. They
 * fire on their own triggers a hair apart, which is what the design draws: the
 * words, and then the cards under them.
 *
 * Everything inside is server-rendered markup passed through as children.
 *
 * Both return a teardown, so a StrictMode double mount tears down cleanly and
 * re-binds rather than stacking a second tween on the same cards.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cards = initIndexReveal(root);
    const stopTitle = initStickReveal(root);

    return () => {
      stopTitle();
      cards.stop();
    };
  }, []);

  return (
    <section ref={ref} className="related-news">
      {children}
    </section>
  );
}
