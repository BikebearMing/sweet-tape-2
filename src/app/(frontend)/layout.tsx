import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";

import "@fontsource-variable/inter-tight";
import "lenis/dist/lenis.css";

/* The whole site, one stylesheet. It @imports letters.css, which is generated
   — see `npm run letters`. */
import "@/styles/global.css";

/* AFTER global.css, and that is the whole point: this is the hand-written
   counterpart to the generated letters.css, and being last is what lets a typed
   value beat a measured one without inventing specificity. Keep it below. */
import "@/styles/letters-tuning.css";

import Cursor from "@/components/Cursor";
import LivePreview from "@/components/LivePreview";
import Menu from "@/components/Menu";
import { PeelDefs } from "@/components/Peel";
import Preloader from "@/components/Preloader";
import { getPalette } from "@/data/tapes";
import SmoothScroll from "@/components/SmoothScroll";
import TopBand from "@/components/TopBand";

/* THE WHOLE FRONT END RENDERS ON DEMAND, and this is the line that decides it.
 *
 * The preloader is on every route and its coloured stack is the tapes' own
 * palette, which now lives in Postgres — so every page under this layout needs a
 * database to render, including the ones with no CMS content on them at all.
 * Left static, they are built at image-build time where there is deliberately no
 * DATABASE_URI, and the build dies on whichever page happens to be first.
 *
 * THE COST IS SMALL AND THE ALTERNATIVE IS WORSE. These pages render in about
 * 200ms with the database in the same datacentre, and the pages that were static
 * were static for no benefit anybody was measuring. The alternative — a
 * hard-coded fallback palette so the build can proceed — means a statically
 * built page shipping the wrong colours the moment an editor changes one, which
 * is exactly the class of silent drift moving this into the CMS was meant to
 * end.
 *
 * If a genuinely static page is ever wanted back, the way there is ISR plus an
 * afterChange hook on tapes that revalidates — not a second copy of the palette.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sweet Tape",
  description: "Meet the one who sticks.",
};

/* The site's root layout. The admin has its own, in the (payload) group — the
   two never share a shell, which is why neither route group inherits the
   other's CSS. */
export default async function FrontendLayout({
  children,
}: {
  children: ReactNode;
}) {
  /* The preloader's colours, fetched here because it cannot fetch them itself —
     it is a client component and the tapes are in Postgres. Six ids and six hex
     values; see getPalette, which selects only those two columns rather than
     pulling six whole rolls through to read one field off each. */
  const palette = await getPalette();

  /* The preloader's mark is the first — and for the length of the hold, the
     only — thing on screen, so its request goes with the document rather than
     waiting for the <img> to be discovered. Ahead of the hero's GLB preload in
     the head, since these are hoisted in call order and the layout renders
     first: the roll has the whole hold to arrive in, the mark does not.

     It used to be 1.8 MB of gif with the animation baked into it, and the note
     here used to point at an animated WebP as the way out. It went further than
     that: the movement turned out to be a peel and a tilt, both of which the
     site already draws, so the artwork is now 5 kB of flat SVG and the motion
     is a timeline (Preloader/reveal.ts). Nothing here changes if the file does;
     only MARK in components/Preloader. */
  preload("/assets/preloader-image.svg", {
    as: "image",
    fetchPriority: "high",
  });

  return (
    /* data-loading is the whole cover hand-off: the stylesheet locks the scroll
       off it before any JS has run, the hero's title reveal waits on it, and the
       sweep takes it off as it clears. See components/Preloader/gate.ts. In the
       server HTML rather than set on mount, so it is true from the first byte.

       ON EVERY ROUTE, not just the one with the overture on it. What is home-
       only is the MARK and the line under it — the site introducing itself, a
       thing to do once and at the front door. The coloured stack is site-wide:
       it covers any cold load for a beat and sweeps off (PRELOADER.SWEEP_BARE),
       and it is the same seven sheets that come back down over every route
       change from then on. So the hold is site-wide too, and the transition
       closes it again on each navigation rather than the page ever being
       uncovered while something is on its way in. */
    <html lang="en" data-loading="">
      <head>
        {/* Futura PT Condensed. The kit is domain-locked: every host you serve
            from, localhost included, has to be listed at fonts.adobe.com or it
            silently falls back to Arial Narrow. There is no Metadata API for a
            third-party stylesheet, hence the literal tag. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/wyl5nhy.css" />
      </head>
      <body>
        {/* Listens for the admin's save message when the site is being previewed
            in an iframe, and does nothing at all otherwise. Position in the tree
            does not matter — it renders no markup. */}
        <LivePreview />
        {/* Before <SmoothScroll />, and that order is load-bearing: effects run
            in tree order, and the preloader's first act is to put the scroll
            back to the top (a reload would otherwise restore it, and the cover
            would lift on the middle of the site). Lenis constructed at a
            restored offset would carry that offset back the first time the
            wheel moved. */}
        <Preloader palette={palette} />
        <SmoothScroll />
        <Cursor />
        {/* Fixed to the top-right corner and site-wide, so it lives in the
            layout rather than on the page — it is not the hero's furniture
            even though that is what sits behind it on load. */}
        <Menu />
        {/* The masthead — the claim in the top-left corner and the badge in the
            middle. Site-wide like the menu, and rendered beside it for that
            reason, but it is NOT pinned the way the menu's tab is: it is
            positioned against the document and scrolls away with the top of the
            page, which is where it belongs. Only the tab has to be reachable
            from anywhere.

            It renders nothing on the home page, whose hero prints its own copy
            of both. See components/TopBand. */}
        <TopBand />
        {/* One <defs> for every peel on the site — the filter is referenced by
            id, so a copy per instance would be duplicate ids for a filter they
            all already share. Out of flow and paints nothing. */}
        <PeelDefs />
        {children}
      </body>
    </html>
  );
}
