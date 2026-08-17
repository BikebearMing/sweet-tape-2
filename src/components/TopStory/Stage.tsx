"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initPeel } from "@/components/Peel/peel";
import { initStickParallax } from "@/components/MakeItStick/parallax";
import { initStickReveal } from "@/components/MakeItStick/reveal";

/* The only client component in the section — and every engine in it is imported
 * from the closing key visual rather than written again.
 *
 * THAT IS THE POINT OF THE SECTION. The lead story is the same object as LET'S
 * MAKE IT STICK: a photograph in a tilted frame, a card beside it, and a strip of
 * kraft tape stood upright across the seam holding the two together. Not a
 * similar arrangement — the same one, down to the class names the markup uses
 * (.stick-row, .stick-shot, .stick-card, .stick-tape), which is what lets all
 * three of these run here untouched:
 *
 *   initPeel        scans its own root for [data-peel]; the strip presses itself
 *                   down as the section comes up the screen, scrubbed by the
 *                   scroll exactly as it does on the home page.
 *   initStickReveal collects .stick-headline .char; the title writes itself in
 *                   the site's headline voice, on a ScrollTrigger because this
 *                   section is below the fold.
 *   initStickParallax reads .stick-shot / .stick-shot-img; the photograph drifts
 *                   inside its frame without the frame moving a pixel.
 *
 * None of them names a section, so none of them had to change. What is this
 * section's own is the palette and the card's furniture — the chip, the date and
 * the arrow — and those are CSS and markup, which is where a variation belongs.
 *
 * NO BODY REVEAL HERE, where the key visual has one: this card carries no
 * running copy. Its date is a number and its chip is a label, and both arrive
 * with the card rather than a line at a time.
 *
 * Everything inside is server-rendered markup passed through as children. Every
 * engine returns its own teardown, so a StrictMode double mount tears down
 * cleanly and re-binds rather than stacking a second tween on the same letters.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopPeel = initPeel(root);
    const stopReveal = initStickReveal(root);
    const stopParallax = initStickParallax(root);

    return () => {
      stopPeel();
      stopReveal();
      stopParallax();
    };
  }, []);

  return (
    <section ref={ref} className="top-story">
      {children}
    </section>
  );
}
