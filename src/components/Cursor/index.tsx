"use client";

import { useEffect } from "react";
import { initCursor } from "./cursor";

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
  return null;
}
