import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Article from "@/components/Article";
import Footer from "@/components/Footer";
import RelatedNews from "@/components/RelatedNews";
import { all, storyOf } from "@/data/news";

/* A STORY — /news/[id], the news page's inner page.
 *
 * Two sections and the footer. The first is the whole article: the headline on
 * the lime with the photograph off the corner, and the sheet of paper laid over
 * the join with the copy, the share row and the way back on it. See
 * components/Article, which says why that is one section rather than three.
 *
 * Under it, three more stories on the newsroom's dark green — the index's own
 * cards, one row deep (components/RelatedNews). It is what turns a story from
 * somewhere a reader stops into somewhere they carry on from, and it is the
 * section that pays the footer's toll now that it is the last on the page.
 *
 * TEN ROUTES, ONE COMPONENT, AND NO COPY HERE. Everything a story is lives in
 * src/data/news.ts and arrives as one object — so a story added there is a page
 * that exists, generated, titled and linked to from the index, with nothing in
 * this folder to touch. That is the same seam the index and the lead story are
 * built on and the reason this file is as short as it is.
 *
 * THE LEAD STORY IS ONE OF THEM. It is deliberately not in the `stories` array
 * — a featured story that was also in the grid would be the same headline twice
 * on one screen — and a router does not care about that arrangement at all:
 * /news/featured has to resolve like any other. `all` is where the two are put
 * back together, once, in the data file.
 *
 * Everything site-wide — the cover, the page transition, the smooth scroll, the
 * cursor, the masthead and the pull-down menu — is in (frontend)/layout.tsx and
 * arrives here untouched. The masthead in particular: the section's top padding
 * is measured to clear its badge, which is the only relationship between them.
 */

/* Every story, built at build time. The set is a file in the repository rather
   than a table somewhere, so there is nothing to fetch and no reason to leave
   any of them to be rendered on demand. */
export async function generateStaticParams() {
  return all.map((story) => ({ id: story.id }));
}

/* Anything NOT in that list is a 404 rather than a page rendered on the fly.
   The ids are a closed set — see generateStaticParams — so a request for one
   that is not here is a stale link or a guess, and neither should be answered
   with an empty article. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const story = storyOf((await params).id);
  if (!story) return {};

  return {
    title: `${story.title} — Sweet Tape`,
    /* The article's own first paragraph, which is what a description is for.
       Trimmed to a length a search result will show rather than sent whole — and
       cut at a word, with the ellipsis only where something was actually taken
       off. */
    description: summarise(story.body[0] ?? ""),
  };
}

/* 155 characters is about what a result listing prints before it stops. */
const SUMMARY = 155;

function summarise(text: string): string {
  if (text.length <= SUMMARY) return text;
  const cut = text.slice(0, SUMMARY);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const story = storyOf((await params).id);
  /* Belt and braces beside dynamicParams above: that setting is what stops an
     unknown id ever reaching here, and this is what happens if it does. A page
     rendered with no story is a crash in the middle of the markup; a page
     rendered with notFound() is a 404. */
  if (!story) notFound();

  return (
    <>
      <Article story={story} />
      <RelatedNews story={story} />
      <Footer />
    </>
  );
}
