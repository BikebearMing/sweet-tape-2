"use client";

import { useEffect, useRef, useState } from "react";
import type gsap from "gsap";

/* The arrow printed on each row's lime disc. Shared rather than local since the
   news cards took the same mark — see components/Arrow. The disc under it, and
   the swing on hover, are this section's own (.menu-arrow in global.css). */
import Arrow from "@/components/Arrow";
import { letters } from "@/components/letters";
import { onHold } from "@/components/Preloader/gate";
import {
  buildMenuOpen,
  initTabEntrance,
  MENU_DROP,
  type MenuTimelines,
} from "./reveal";

/* The nav itself. Labels are set in caps here rather than by text-transform so
   the copy reads in the markup exactly as it paints — the same call the hero
   makes with its headline.

   OUR FAMILY is the one row that leads somewhere. It is the product page —
   the family IS the products, and there is no second row for them — so it
   carries the real preview as well as the real route: the shot of all six
   rolls the closing key visual uses. The rest are placeholders on the shared
   preview until their routes and their artwork exist, which is what this list
   has always said would happen a row at a time.

   ITS SLUG IS NOT ITS LABEL, and it is the only row here of which that is true.
   /products is the word for that page everywhere outside this menu — in a
   search result, in a pasted link, in an address bar — and OUR FAMILY is how
   the brand says it in the nav. The page itself explains the split; the footer's
   row is the only other place the pairing is written. */
const ITEMS = [
  { label: "ABOUT", href: "/about", thumb: "/assets/mask-image-1.jpg" },
  {
    label: "OUR FAMILY",
    href: "/products",
    thumb: "/assets/make-it-stick.jpg",
  },
  { label: "NEWS", href: "/news", thumb: "/assets/mask-image-1.jpg" },
  { label: "CONTACT", href: "/contact", thumb: "/assets/mask-image-1.jpg" },
];

/* The pull-down menu.
 *
 * Two pieces, stacked: the paper panel, and the taped tab hanging off its
 * bottom-right corner. The tab is in normal flow BELOW the panel, so when the
 * panel collapses to nothing the tab rides up to the top of the viewport on its
 * own — which is the closed state, a torn tab stuck to the top-right corner
 * reading PULL ME. Nothing has to position it twice.
 *
 * AND A THIRD PIECE THAT IS NOT STACKED WITH THEM: the mark, pinned to the top
 * MIDDLE of the viewport. It lives in this component because it is the same
 * kind of thing — the site's nav furniture, fixed, on every page, and outside
 * any one page's layout — and putting it in the root layout beside this would
 * be a second fixed box in the same band with no relationship to the first.
 *
 * It escapes this element's box by being fixed itself rather than by any
 * trickery: .site-menu is a 31vw column pinned to the right, and a fixed child
 * is positioned against the viewport, not against it. (That holds only while no
 * ancestor carries a transform or a filter, which would make it the containing
 * block instead. Nothing here does.)
 *
 * THE BADGE AND THE CLAIM ARE NOT HERE, and they were for a while. Putting the
 * masthead in this component made it fixed along with the tab, so the logo sat
 * over the middle of the page all the way down it. Only the TAB is meant to be
 * pinned: it is the way into the menu and has to be reachable from anywhere.
 * The rest of the top of the page belongs to the top of the page and now
 * scrolls with it — see components/TopBand, which the layout mounts.
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
  /* The close is a tween ON the drop's playhead rather than the drop itself,
     so it is a separate handle and has to be killable from both effects. */
  const closeRef = useRef<gsap.core.Tween | null>(null);

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
      closeRef.current?.kill();
      closeRef.current = null;
      built.drop.kill();
      built.contents.kill();
    };
  }, []);

  /* SHUT ON THE WAY OUT. Four of the five ways off this page go through a row
     of this menu, which means the panel is standing wide open at the moment the
     transition's cover starts falling — and it does not remount, so without
     this it would still be open behind the curtain when the curtain lifted on
     the page it led to.

     Off the gate closing rather than off the pathname: the gate closes as the
     first sheet starts to move, a full cover before the route commits, so the
     close runs its own timing under the paper and is long finished by the time
     anything is visible. Waiting for the new pathname would put it a beat late
     and behind nothing.

     NOT one-shot, which is why this is onHold and not whenRevealed's shape: it
     has to work on the second navigation as well as the first. */
  useEffect(() => onHold(() => setOpen(false)), []);

  /* The tab's own arrival, once, after the preloader — its own effect because
     it shares nothing with the pair above: it is on a different clock, it
     touches a different element, and it must still run on a menu that has no
     timelines at all (an empty panel returns null from buildMenuOpen). */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return initTabEntrance(root);
  }, []);

  /* Open runs both: the panel drops and the contents follow it down. play() on
     a half-closed menu picks the reveal up where it was left rather than
     starting it again, which is what makes a fast double-click behave.

     Close touches ONLY the drop. The contents are frozen, not unwound — what
     has been revealed stays revealed, and the panel closing over it is the
     exit. Putting them back to nothing waits for the close to land, by which
     point the panel is shut and there is nothing to see.

     tweenTo rather than reverse: it scrubs the drop's playhead to 0 under its
     own duration and ease instead of replaying the drop's at the drop's rate.
     MENU_DROP.CLOSE_EASE has the reasoning — briefly, the curve that makes the
     drop crack open makes it slam shut when run backwards. */
  useEffect(() => {
    const built = tlRef.current;
    if (!built) return;

    /* Whichever direction this is, an in-flight close is now stale — including
       when the answer is another close, since the panel has moved since that
       tween measured its start. */
    closeRef.current?.kill();
    closeRef.current = null;

    if (open) {
      built.drop.play();
      built.contents.play();
      return;
    }

    built.contents.pause();

    /* Already shut — the first run of this effect, on mount. There is nothing
       to scrub, and tweening to where the playhead already sits would spend the
       close's whole duration doing nothing before rewinding the contents. */
    if (built.drop.time() === 0) {
      built.contents.pause(0);
      return;
    }

    closeRef.current = built.drop.tweenTo(0, {
      duration: MENU_DROP.CLOSE_DURATION,
      ease: MENU_DROP.CLOSE_EASE,
      onComplete: () => built.contents.pause(0),
    });
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
