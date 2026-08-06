"use client";

import { useEffect, useRef } from "react";

import { letters } from "@/components/letters";
import { tapes } from "@/data/tapes";
import { initPreloader } from "./reveal";

/** The mark. Animated in the artwork itself — the lemon drops in and settles,
 *  about a second of it, then holds. Its own size is 390 x 266. */
const MARK = "/assets/preloader-middle.gif";

/** The line under it — the hero's headline, set on one line rather than the
 *  two it takes below. Split to letters and revealed with the site's one text
 *  entrance; see Preloader/reveal.ts. */
const LINE = "STICK BY YOU";

/* The stack under the sheet: one sheet per tape, in that tape's stage colour,
 * leaving one after another so the cover comes off as bands of colour rather
 * than as a single wipe.
 *
 * The order is set here and the colours are not — those come from the tapes
 * themselves, so a palette edited in src/data/tapes.ts turns up here with
 * nothing to keep in step. What the data cannot know is how the four sit
 * TOGETHER: taken in their own order the deep blue lands between two brights
 * and reads as a gap in the rainbow, so they run warm to cool instead and the
 * darkest is last — the one that finally lifts off the hero, against the
 * lightest thing on the page.
 *
 * An id that no longer exists simply drops out, which is the whole failure
 * mode: a shorter stack, still in order. */
const STACK_ORDER = ["mask-1", "mask-4", "mask-3", "mask-2"];

const STACK = STACK_ORDER.flatMap((id) => {
  const tape = tapes.find((t) => t.id === id);
  return tape ? [{ id, bg: tape.colours.bg }] : [];
});

/* The preloader.
 *
 * A sheet of paper over the page with the mark in the middle, lifted off after
 * a beat — Preloader/reveal.ts owns all of that and this component owns none of
 * it, the same division the hero and the menu make.
 *
 * Server-rendered, deliberately. The cover has to be in the first painted frame
 * or there is a flash of the page it exists to cover, so it is markup in the
 * document rather than something mounted on hydration; the "use client" here
 * buys the effect, not the rendering.
 *
 * The scroll lock is not here either. It hangs off `html[data-loading]` in
 * global.css — written into the server HTML by the layout, taken off by the
 * sweep (gate.ts) — so the page is held from the first byte rather than from
 * whenever hydration happens to land.
 */
export default function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initPreloader(root);
  }, []);

  return (
    <>
      {/* With no JS the sweep never runs, and a cover that cannot leave is a
          site that cannot be read — so the whole thing is called off before it
          paints, scroll lock included. The hero makes the same call about its
          letters. Costs nothing when scripting is on: the contents are not even
          parsed. */}
      <noscript>
        <style>{`.site-preloader { display: none } html[data-loading] { overflow: visible } html[data-loading] .menu-tab { transform: none }`}</style>
      </noscript>

      {/* aria-hidden because it is a held curtain, not content: the page behind
          it is already in the accessibility tree and reachable, and announcing
          a decorative mark over the top of it says nothing a reader needs.

          The box itself paints nothing — every colour here is on a sheet
          inside it, and they all leave. */}
      <div className="site-preloader" ref={ref} aria-hidden="true">
        {/* The stack, deepest last. All four sit exactly under the lime sheet
            and are invisible until it moves; z-index is what decides which one
            the sweep uncovers first, so it counts DOWN as the stack goes back.
            The colour is inline because it comes from the data — everything
            else about these sheets is in the stylesheet. */}
        {STACK.map(({ id, bg }, i) => (
          <div
            className="preloader-layer"
            key={id}
            style={{ background: bg, zIndex: STACK.length - i }}
          />
        ))}

        <div className="preloader-sheet" style={{ zIndex: STACK.length + 1 }}>
          {/* width/height are the artwork's own, so the box is the right shape
              before the file lands — 1.8 MB of gif is not instant even
              preloaded, and a box that resizes on arrival would jog the mark
              as it appears. The stylesheet sets the size it paints at. */}
          <img className="preloader-mark" src={MARK} alt="" width={390} height={266} />

          {/* Parked under their masks by the stylesheet and released by
              Preloader/reveal.ts, exactly as the hero's headline is — same
              structure, same tween, and it goes back the way it came before
              the paper moves. */}
          <p className="preloader-line">{letters(LINE)}</p>
        </div>
      </div>
    </>
  );
}
