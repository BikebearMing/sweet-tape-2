"use client";

import { useEffect, useRef, useState } from "react";
import { letters } from "@/components/letters";
import { buildMenuOpen, type MenuTimelines } from "./reveal";

/* The nav itself. Labels are set in caps here rather than by text-transform so
   the copy reads in the markup exactly as it paints — the same call the hero
   makes with its headline. Hrefs are placeholders until the routes exist, and
   every row is on the same preview until there is artwork per section. */
const ITEMS = [
  { label: "ABOUT", href: "/about", thumb: "/assets/mask-image-1.jpg" },
  {
    label: "OUR FAMILY",
    href: "/our-family",
    thumb: "/assets/mask-image-1.jpg",
  },
  { label: "NEWS", href: "/news", thumb: "/assets/mask-image-1.jpg" },
  { label: "CONTACT", href: "/contact", thumb: "/assets/mask-image-1.jpg" },
];

/* The link marker — a small arrow printed on a lime disc, aligned with the top
   of the label's capitals rather than its centre (see the Menu section of
   global.css, which sizes and places both). Inline rather than an asset: it is
   two strokes, and inline it inherits currentColor for free when the palette
   changes.

   The stroke is heavy against the 12-unit box because the glyph renders at
   about 8px — a hairline at that size disappears into the disc, and it got
   smaller without the disc doing the same, so the weight had to go up to hold
   the ink it had. */
function Arrow() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M1.4 10.6 10.6 1.4M3.6 1.4h7v7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

/* The pull-down menu.
 *
 * Two pieces, stacked: the paper panel, and the taped tab hanging off its
 * bottom-right corner. The tab is in normal flow BELOW the panel, so when the
 * panel collapses to nothing the tab rides up to the top of the viewport on its
 * own — which is the closed state, a torn tab stuck to the top-right corner
 * reading PULL ME. Nothing has to position it twice.
 *
 * The motion is two paused timelines in Menu/reveal.ts and this component owns
 * none of it — it only sets them running. Because they are built at mount
 * rather than at the first click, their `from` values are what the panel holds
 * from the start.
 */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const tlRef = useRef<MenuTimelines | null>(null);

  /* Built once and kept. StrictMode's double mount tears the first pair down —
     without which the second build's fromTo would read a half-dropped panel as
     its starting point. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const built = buildMenuOpen(root);
    tlRef.current = built;
    if (!built) return;

    /* The drop's end value is a MEASURED height, taken when the tween first
       renders — and every length in this menu is in vw, so a resized window
       leaves that measurement describing a panel that no longer exists.
       invalidate() throws the recorded values away; re-rendering at the same
       progress takes them again at the new size and puts the panel where it
       should be, open or shut or halfway. */
    const remeasure = () => {
      built.drop.invalidate();
      built.drop.progress(built.drop.progress(), true);
    };

    const ac = new AbortController();
    window.addEventListener("resize", remeasure, {
      signal: ac.signal,
      passive: true,
    });

    return () => {
      ac.abort();
      tlRef.current = null;
      built.drop.kill();
      built.contents.kill();
    };
  }, []);

  /* Open runs both: the panel drops and the contents follow it down. play() on
     a half-closed menu picks the reveal up where it was left rather than
     starting it again, which is what makes a fast double-click behave.

     Close reverses ONLY the drop. The contents are frozen, not unwound — what
     has been revealed stays revealed, and the panel closing over it is the
     exit. Putting them back to nothing is the drop's own onReverseComplete, by
     which point the panel is shut and there is nothing to see. */
  useEffect(() => {
    const built = tlRef.current;
    if (!built) return;

    if (open) {
      built.drop.play();
      built.contents.play();
    } else {
      built.contents.pause();
      built.drop.reverse();
    }
  }, [open]);

  return (
    <nav className="site-menu" ref={rootRef} data-open={open} aria-label="Main">
      {/* The panel is the clipping box the drop resizes; the sheet inside is
          what carries the padding, so the panel can close to a true nothing.
          See the Menu section of global.css. */}
      <div className="menu-panel" id="site-menu-panel">
        <div className="menu-sheet">
          <ul className="menu-list">
            {ITEMS.map(({ label, href, thumb }) => (
              <li className="menu-item" key={href}>
                {/* A real element, not a ::before — the reveal has to be able
                  to reach it, and a pseudo-element is not addressable. */}
                <span className="menu-rule" aria-hidden="true" />

                {/* The label is split to letters, so everything inside the link
                  is decoration as far as a screen reader is concerned: a row of
                  block-level letter boxes is otherwise liable to be announced a
                  fragment at a time. aria-label carries the readable name.

                  tabindex is what takes a closed menu out of the tab order.
                  Not `visibility: hidden`, which would do the same job and take
                  the retract with it — the letters have to still be paintable
                  to be seen falling back under their masks. */}
                <a
                  className="menu-link"
                  href={href}
                  aria-label={label}
                  tabIndex={open ? undefined : -1}
                >
                  {/* The hover preview. The slot is what opens — it animates
                    from zero width and clips — while the image inside holds a
                    fixed square, so the preview is uncovered rather than
                    stretched out of a sliver. */}
                  <span className="menu-thumb" aria-hidden="true">
                    <img src={thumb} alt="" />
                  </span>
                  <span className="menu-label" aria-hidden="true">
                    {letters(label)}
                  </span>
                  <span className="menu-arrow" aria-hidden="true">
                    <Arrow />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The sheet inside the button is what carries the paper and the torn
          bottom edge; the button around it is a bare box, so its drop-shadow
          is cast by the torn shape rather than being masked away with it —
          filters are applied before masks, never after. */}
      <button
        className="menu-tab"
        type="button"
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-tab-sheet">PULL ME</span>
      </button>
    </nav>
  );
}
