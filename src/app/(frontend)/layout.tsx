import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/inter-tight";
import "lenis/dist/lenis.css";

import "@/styles/reset.css";
import "@/styles/tokens.css";
import "@/styles/letters.css"; /* generated — npm run letters */
import "@/styles/hero.css";
import "@/styles/tape-slider.css";

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
        {children}
      </body>
    </html>
  );
}
