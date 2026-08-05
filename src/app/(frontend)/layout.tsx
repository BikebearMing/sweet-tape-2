import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/inter-tight";
import "lenis/dist/lenis.css";

/* The whole site, one stylesheet. It @imports letters.css, which is generated
   — see `npm run letters`. */
import "@/styles/global.css";

import Cursor from "@/components/Cursor";
import Menu from "@/components/Menu";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Sweet Tape",
  description: "Meet the one who sticks.",
};

/* The site's root layout. The admin has its own, in the (payload) group — the
   two never share a shell, which is why neither route group inherits the
   other's CSS. */
export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Futura PT Condensed. The kit is domain-locked: every host you serve
            from, localhost included, has to be listed at fonts.adobe.com or it
            silently falls back to Arial Narrow. There is no Metadata API for a
            third-party stylesheet, hence the literal tag. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/wyl5nhy.css" />
      </head>
      <body>
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
