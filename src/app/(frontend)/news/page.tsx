import type { Metadata } from "next";

import Footer from "@/components/Footer";
import NewsIndex from "@/components/NewsIndex";
import TopStory from "@/components/TopStory";
import WhatsRolling from "@/components/WhatsRolling";

/* WHAT'S ROLLING — the news page.
 *
 * Three screens and the footer. The title card, the one story the newsroom is
 * leading on, and then the wall of everything else with its three tabs beside it
 * — which is the shape a newsroom has: a name, a lead, and a list.
 *
 * THE LEAD IS THE HOME PAGE'S CLOSING KEY VISUAL, structurally: a photograph in a
 * tilted frame, a card beside it, a strip of kraft tape across the seam. Not a
 * lookalike — the same classes and the same three engines, inverted in colour.
 * components/TopStory says why at length, and it is the reason this page cost so
 * little to build.
 *
 * EVERY CARD LEADS SOMEWHERE. The lead and all nine are links to /news/[id],
 * which is the story page — one section, built out of this page's own objects
 * inverted, in components/Article. The paths come from hrefOf in
 * src/data/news.ts, so the wall, the lead and the routes are one statement.
 *
 * Everything site-wide — the cover, the page transition, the smooth scroll, the
 * cursor, the masthead and the pull-down menu — is in (frontend)/layout.tsx and
 * arrives here untouched. The masthead in particular: the badge in the top middle
 * and the claim in the corner are the layout's on every route but the home page,
 * which is why the title card's top padding is measured to clear the badge and is
 * the only relationship between them.
 */
export const metadata: Metadata = {
  title: "What’s Rolling — Sweet Tape",
  description: "News and events from Sweet Tape.",
};

export default function News() {
  return (
    <>
      <WhatsRolling />
      <TopStory />
      <NewsIndex />
      <Footer />
    </>
  );
}
