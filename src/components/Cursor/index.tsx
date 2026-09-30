"use client";

import { useEffect } from "react";
import { initCursor } from "./cursor";
import { playOnce, SOUNDS } from "@/components/sound";

/* Mounted once at the layout, like SmoothScroll — the cursor belongs to the
 * document, not to any one section. Renders nothing: its two elements are
 * created by the module and appended to the body, so they sit outside every
 * section's stacking context and cannot be caught by one section's transform
 * or overflow (a fixed element inside a transformed ancestor is positioned
 * against that ancestor, not the viewport — and the band and the slider both
 * transform their contents).
 *
 * initCursor returns its own teardown, so a StrictMode double-mount removes
 * the first pair of elements instead of leaving them stacked.
 */
export default function Cursor() {
  useEffect(() => initCursor(), []);

  /* THE CLICK, SITE-WIDE. On `click` rather than pointerdown — a touch scroll
     starts with a pointerdown and would ding on every flick, while a tap still
     fires click. Skipped where the same click already carries its own note:
     the menu's pull tab and sound button, and the hero badge's press. */
  useEffect(() => {
    const click = (e: MouseEvent) => {
      /* composedPath rather than target.closest: the sound button swaps its
         icon ON this very click, so by the time this bubbling listener runs
         the original target is detached and closest() finds no ancestors.
         The path is snapshotted at dispatch and keeps the truth. */
      const skip = e
        .composedPath()
        .some(
          (n) =>
            n instanceof Element &&
            n.matches(".menu-tab, .menu-sound, .pl-hit"),
        );
      if (!skip) playOnce(SOUNDS.CLICK);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);

  return null;
}
