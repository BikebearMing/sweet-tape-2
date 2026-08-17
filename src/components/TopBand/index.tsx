"use client";

/* eslint-disable @next/next/no-img-element */
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { letters } from "@/components/letters";
import { initTopBand } from "./reveal";

/* The band across the top of the page — the claim on the left, the badge in the
 * middle.
 *
 * IT SCROLLS AWAY, and that is the whole reason it is its own component. It
 * lived in the menu for a while, which put it beside the pull tab and made it
 * fixed along with it — so the badge sat over the middle of the page all the
 * way down, in front of whatever happened to be under it. Only the TAB is meant
 * to be pinned there: it is the way into the menu and has to be reachable from
 * anywhere. This is masthead, it belongs to the top of the page, and it should
 * leave with the top of the page.
 *
 * So it is positioned against the DOCUMENT rather than the viewport
 * (position: absolute, in a box that no positioned ancestor contains), which is
 * what makes it scroll like anything else printed on the sheet. Lenis smooths
 * the native scroll rather than transforming a wrapper, so there is nothing
 * clever holding it in place — it simply goes up with the page.
 *
 * NOT ON THE HOME PAGE. The hero sets this same badge in the gap in its kicker
 * and prints this same claim in its own top-left corner, so the pair would land
 * as a second copy of each a few pixels off the first — and now that both
 * scroll, they would travel up the screen together as an obvious double. Every
 * other route has an empty band up there and wants this.
 *
 * Mounted once in the layout, so every route gets it without asking.
 */

/* The badge — the same file the preloader and the hero draw theirs from,
   deliberately and not by coincidence: it is one logo, and pointing all three at
   it means there is one thing to replace when the artwork changes.

   It is also already in the browser by the time this needs it. The layout
   preloads it for the preloader, which paints it before anything else on the
   page, so this copy is a cache hit and the drop has nothing to decode on its
   first frame. */
const MARK = "/assets/preloader-image.svg";

/* THE CLAIM, and the same words the hero prints in its own top-left corner —
   written out again rather than imported, and that is on purpose twice over.
   Hero/index.tsx is a server component with a three-dimensional roll hanging off
   it, so importing a string from it would pull the whole module into this
   bundle. And the two are not one thing that happens to appear twice: the
   hero's is printed INTO its lime field, perforated down the edge like a label,
   and this is masthead that takes the colour of whatever the page has become.
   Either could change without the other.

   Two lines, not a wrap: the break is set by design, the same call the hero's
   headline and the footer's sign-off make. And it arrives the way the hero's
   does — perforation first, then the letters — off the hero's own constants;
   see TopBand/reveal.ts. */
const NOTE = ["STICK WITH YOU THROUGH", "THREE GENERATIONS"];

/** The one page that already has both of these built into it. */
const HOME = "/";

export default function TopBand() {
  const ref = useRef<HTMLDivElement>(null);
  const here = usePathname();

  /* Before the early return, because hooks are not optional — and harmless on
     the home page, where the effect finds no band and does nothing.

     ON THE ROUTE, and not once. This component does not remount across a
     client-side navigation — it is mounted in the layout, which is the whole
     reason the menu and the cover survive one — so it is the same instance that
     went from rendering nothing on the home page to rendering a masthead on the
     next route. With an empty dependency list the effect had already run, found
     ref.current null, and returned: the claim's letters would sit under their
     masks for good and the badge would never drop. Keyed on `here` it runs again
     on the render that puts the band on the page, which is also the render
     during which the transition is holding the gate — so the entrance queues
     behind the cover exactly as it does on a cold load. */
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return initTopBand(root);
  }, [here]);

  if (here === HOME) return null;

  return (
    /* A box of no height pinned across the top of the document — it exists to
       be the containing block the two pieces are placed against, so neither has
       to know what the page under it is doing. It catches no clicks; the badge
       takes its own back (see .top-band in global.css). */
    <div className="top-band" ref={ref}>
      {/* WITHOUT JAVASCRIPT THE CLAIM NEVER ARRIVES. Its letters are parked
          under their masks by global.css and released by TopBand/reveal.ts, so
          a page where that never runs is a page with an empty corner and a line
          of dots that never got drawn. The stylesheet's hold is lifted here
          instead, which costs nothing when scripting is on: the contents are
          not even parsed. The hero, the footer and the closing key visual all
          carry the same escape. */}
      <noscript>
        <style>{`.top-band .char { transform: none }
          .top-band .top-perf { clip-path: none }`}</style>
      </noscript>

      {/* THE CLAIM, and it is the hero's corner mark rather than a block that
          drops in: the perforation is ruled down the left edge and then the
          copy is written against it a letter at a time. That is the site's
          voice for small type in a corner, and this is two hundred pixels from
          where the front page does exactly the same thing.

          Split to letters, so everything visible here is decoration as far as a
          screen reader is concerned — a row of block-level letter boxes is
          otherwise liable to be announced a fragment at a time. aria-label is
          not honoured on a paragraph, so the readable copy is a real hidden
          text node; the hero's copy of this mark makes the same call for the
          same reason.

          The perforation is a real element rather than a ::before, because the
          entrance has to be able to reach it and a pseudo-element cannot be
          handed to GSAP. */}
      <p className="top-note">
        <span className="sr-only">{NOTE.join(" ")}</span>
        <span className="top-perf" aria-hidden="true" />
        {NOTE.map((line) => (
          <span className="line" key={line} aria-hidden="true">
            {letters(line)}
          </span>
        ))}
      </p>

      {/* A LINK HOME rather than a picture. A logo in that position is the one
          thing on a page every reader already expects to be clickable, and this
          site has no other way back to the front from inside the menu's four
          rows.

          The alt is empty and the name is on the anchor: it is the anchor that
          is announced, and a picture with its own alt inside a labelled link
          would have the same thing read out twice.

          A plain <img> rather than next/image: this is a 5 kB flat SVG at a size
          the stylesheet sets in vw, so there is nothing for an optimiser to
          resize and no intrinsic box worth declaring — the same call the rest of
          the site's artwork makes. */}
      <a className="top-mark" href="/" aria-label="Sweet Tape — home">
        <img src={MARK} alt="" draggable={false} />
      </a>
    </div>
  );
}
