"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { initPoke } from "@/components/Hero/poke";
import { playOnce, SOUNDS } from "@/components/sound";

import { initNextUpReveal } from "./reveal";

/* NEXT UP's client boundary — a ref and one driver.
 *
 * The thinnest Stage on the site, because this section has the least going on:
 * no camera, no tape, no note. What it does have is the site's type reveal, and
 * that needs an element to hang a ScrollTrigger off.
 *
 * `style` is how the NEXT tape's palette reaches the stylesheet — the custom
 * properties cssVars() writes, on the section root, exactly as the slider's
 * orbit buttons and the origin section carry them. The section is the element
 * the CSS block is keyed on, so it is the element they belong on.
 *
 * initNextUpReveal returns its own teardown, so a StrictMode double-mount
 * re-binds rather than leaving a second trigger behind.
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
    const stopReveal = initNextUpReveal(root);
    /* The site's headline hover, on the name — the same call the footer's
       sign-off and LET'S MAKE IT STICK make, with this section's selector.
       It gates itself (hover/tap, reduced motion) and wakes letters only
       once the reveal has set them home, so the two never share a letter. */
    const stopPoke = initPoke(root, ".h1-v2");
    /* The panel IS the link (see ../index.tsx), so its note hangs off the one
       anchor — once per entry, mouseenter does not bubble or repeat inside. */
    const link = root.querySelector<HTMLElement>("a");
    const hover = () => playOnce(SOUNDS.NEXT_HOVER);
    link?.addEventListener("mouseenter", hover);
    return () => {
      link?.removeEventListener("mouseenter", hover);
      stopPoke();
      stopReveal();
    };
  }, []);

  return (
    <section ref={ref} className="next-up" style={style}>
      {children}
    </section>
  );
}
