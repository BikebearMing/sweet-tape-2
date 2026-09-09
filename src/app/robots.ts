import type { MetadataRoute } from "next";

import { SITE_URL } from "@/data/site";

/* At request time, not build time: SERVER_URL is only set on the server, and
   a static robots.txt would print the build's fallback. Same as the sitemap. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/lab"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
