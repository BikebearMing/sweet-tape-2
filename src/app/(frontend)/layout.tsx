import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";

import "@fontsource-variable/inter-tight";
import "lenis/dist/lenis.css";

/* The whole site, one stylesheet. It @imports letters.css, which is generated
   — see `npm run letters`. */
import "@/styles/global.css";

import Cursor from "@/components/Cursor";
import Menu from "@/components/Menu";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Sweet Tape",
  description: "Meet the one who sticks.",
};

/* The site's root layout. The admin has its own, in the (payload) group — the
   two never share a shell, which is why neither route group inherits the
   other's CSS. */
export default function FrontendLayout({ children }: { children: ReactNode }) {
  /* The preloader's mark is the first — and for the length of the hold, the
     only — thing on screen, so its request goes with the document rather than
     waiting for the <img> to be discovered. Ahead of the hero's GLB preload in
     the head, since these are hoisted in call order and the layout renders
     first: the roll has the whole hold to arrive in, the mark does not.

     1.8 MB is a lot for a logo loop, and the obvious follow-up is an animated
     WebP or a muted video of the same 125 frames — either lands in a few
     hundred kB. Nothing here changes if the file does; only MARK in
     components/Preloader. */
  preload("/assets/preloader-middle.gif", {
    as: "image",
    fetchPriority: "high",
  });

  return (
    /* data-loading is the whole preloader hand-off: the stylesheet locks the
       scroll off it before any JS has run, the hero's title reveal waits on it,
       and the sweep takes it off as it clears. See components/Preloader/gate.ts.
       In the server HTML rather than set on mount, so it is true from the first
       byte. */
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
        {/* Before <SmoothScroll />, and that order is load-bearing: effects run
            in tree order, and the preloader's first act is to put the scroll
            back to the top (a reload would otherwise restore it, and the cover
            would lift on the middle of the site). Lenis constructed at a
            restored offset would carry that offset back the first time the
            wheel moved. */}
        <Preloader />
        <SmoothScroll />
        <Cursor />
        {/* Fixed to the top-right corner and site-wide, so it lives in the
            layout rather than on the page — it is not the hero's furniture
            even though that is what sits behind it on load. */}
        <Menu />
        {children}
      </body>
    </html>
  );
}
