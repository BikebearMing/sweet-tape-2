import type { MetadataRoute } from "next";

/* The web app manifest — what an "add to home screen" and an install banner
   read. Only relative URLs, so unlike robots and the sitemap it needs no
   SITE_URL and can stay static.

   TODO(owner): export 192×192 and 512×512 PNG icons (the 512 maskable) and
   list them here — the SVG covers modern browsers, the PNGs are for the rest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SweetTape",
    short_name: "SweetTape",
    description:
      "Meet the one who sticks. Tapes made in Malaysia, for every job.",
    start_url: "/",
    display: "browser",
    background_color: "#034102",
    theme_color: "#034102",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
