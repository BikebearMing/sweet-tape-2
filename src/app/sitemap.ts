import type { MetadataRoute } from "next";

import { getAll, hrefOf } from "@/data/news";
import { SITE_URL } from "@/data/site";
import { getTapes } from "@/data/tapes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tapes, stories] = await Promise.all([getTapes(), getAll()]);
  const at = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({
    url: `${SITE_URL}${path}`,
    ...extra,
  });

  return [
    at("/", { priority: 1 }),
    at("/products"),
    at("/about"),
    at("/news"),
    at("/contact"),
    ...tapes.map((t) => at(`/products/${t.id}`)),
    ...stories.map((s) => at(hrefOf(s))),
  ];
}
