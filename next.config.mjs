import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Traces the server down to just the files it actually imports, so the
     container ships ~300MB instead of the whole node_modules tree — three,
     sharp and Payload's admin bundle make that difference enormous. The
     tradeoff is that the runner stage has to copy .next/static and public in
     by hand; standalone deliberately leaves both out. See the Dockerfile. */
  output: "standalone",

  /* On in dev, where it mounts every component twice. That is exactly the case
     the slider has to survive — initTapeSlider returns a teardown so the second
     mount rebinds rather than doubling every listener and ticker callback. If
     this is ever turned off, that class of bug goes quiet rather than away. */
  reactStrictMode: true,

  // Lets other devices on the LAN (phone previews) hit the dev server's
  // internal assets without Next blocking them as cross-origin. Dev-only
  // by definition; production ignores it.
  allowedDevOrigins: ["192.168.100.127", "192.168.1.16", '192.168.0.36', '192.168.100.127'],

  /* CACHING THE ARTWORK.
   *
   * Next serves everything under /public with `max-age=0`. Nothing is
   * re-downloaded — the ETag turns each one into a 304 — but a 304 is still a
   * request, and a page that pulls thirty assets pays thirty round trips on
   * every visit before it can paint. On a phone on mobile data that is the
   * difference people actually feel.
   *
   * THIRTY DAYS, NOT A YEAR, AND NOT `immutable`. The hashed bundles under
   * /_next/static can be immutable because their names change when their
   * contents do; these cannot. /assets/cta-bg.png is the same URL forever, so
   * whatever is cached under it is what a returning visitor sees until it
   * expires. A year would mean replacing a piece of artwork and having some
   * people keep the old one until the following summer. Thirty days removes the
   * round trips for anyone who comes back inside a month and bounds how long a
   * mistake can live.
   *
   * If a file has to change sooner than that, rename it — a new URL is the only
   * cache-bust that is guaranteed to work, which is exactly why /_next/static
   * hashes its filenames.
   */
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        /* Fonts genuinely never change — a face is recut under a new name, not
           edited in place — so these get the treatment the bundles get. */
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};



// withPayload wires the admin bundle and Payload's server-only deps into the
// build. It is inert for the front end: pages that never import the config
// never pull Payload in.
export default withPayload(nextConfig);
