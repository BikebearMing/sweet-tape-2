import { getPayload } from "payload";

import config from "@/payload.config";
import type { News as NewsDoc } from "@/payload-types";

import { withVersion } from "./media-url";

/* Sweet Tape — what the newsroom has in it.
 *
 * THE SEAM, NOW PLUGGED IN. This file used to hold the stories themselves and
 * described itself as the place the CMS would arrive; it has. What it holds now
 * is the same Story shape and the same helpers, over a Payload query instead of
 * an array — so every component that drew a story still asks this file for it
 * and still gets exactly what it got before.
 *
 * THE HELPERS ARE ASYNC AND THE FORMATTING IS NOT. Anything that needs the
 * database is a get* function returning a promise; anything that is arithmetic
 * over a Story it already holds — hrefOf, labelOf, readOf, countOf — stays a
 * plain call, because making them async would mean awaiting a function that
 * never touches a database.
 *
 * THE KIND IS STILL THE FILTER. KINDS below is unchanged and NewsIndex still
 * counts the tabs off it: a third kind is a line here plus an option in
 * collections/News.ts, and the filter row grows to match.
 */

/** Which tab a story belongs under. The filter row is built from these. */
export type NewsKind = "event" | "news";

export type Story = {
  /** Stable key, and the route's last segment: /news/<id>. The `slug` field on
      the News collection — Payload's own numeric id never leaves this file. */
  id: string;
  kind: NewsKind;
  /** The card's line, written exactly as it paints. */
  title: string;
  /** The day, set large on the card. Two characters, always — the design gives
      it a slot of one width and "5" would sit off-centre in it. Derived from
      the date rather than typed, so it cannot disagree with the month. */
  day: string;
  /** The rest of the date, set small under the day. */
  month: string;
  image: string;
  /** Empty where the picture is decoration beside a title that already says it
      — see the cards. The featured shot carries a real one. */
  alt: string;
  /** The heading at the top of the article's own sheet. */
  deck: string;
  /** The article, a paragraph to an entry. */
  body: string[];
};

/* The tabs, in the order the design reads them down the left-hand rule. ALL is
   not a kind and never will be: it is the absence of a filter, which is why its
   id is null rather than a third string that every comparison would have to
   know was special. */
export const KINDS: { id: NewsKind | null; label: string }[] = [
  { id: null, label: "ALL" },
  { id: "event", label: "EVENT" },
  { id: "news", label: "NEWS" },
];

/* ------------------------------------------------------------------ *
 * The query
 * ------------------------------------------------------------------ */

/* WHY THE WHOLE COLLECTION, EVERY TIME. Ten stories is one small query and the
   database is in the same datacentre as the server, so the round trip costs
   less than the branching needed to avoid it. The index needs all of them, the
   article needs its neighbours, and the counts need the totals — three of the
   four callers want the lot. If the newsroom ever runs to hundreds this becomes
   a paginated find and relatedTo becomes a query of its own; it is not there
   yet and pretending otherwise would be a cache to invalidate for no gain. */
async function fetchAll(): Promise<Story[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "news",
    limit: 1000,
    sort: "-date",
    depth: 1, // resolves `image` to the Media document rather than its id
  });

  return docs.map(toStory);
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/* One Payload document, as the components have always expected a story.
 *
 * THE DATE BECOMES TWO STRINGS HERE and nowhere else. The collection stores one
 * date because an editor typing "18" and "MAY 2026" separately can type a pair
 * that disagree; the design prints them separately, so they are split at the
 * one point that reads the record. Padded to two digits for the same reason the
 * counts are — the slot is built for two and a bare "5" sits off-centre in it.
 *
 * UTC, deliberately. The date is a day the newsroom published on, not a moment,
 * and reading it in the server's local zone is how a story dated the 1st shows
 * as the 31st to half the world. */
function toStory(doc: NewsDoc): Story {
  const d = new Date(doc.date);

  const image = typeof doc.image === "object" && doc.image ? doc.image : null;

  return {
    id: doc.slug,
    kind: doc.kind as NewsKind,
    title: doc.title,
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    /* Payload's own file route, not /media/<name>. In production the upload
       volume is mounted at /app/media — outside public/ on purpose, so that a
       redeploy cannot wipe it — which means Next never sees these as static
       files and this route is the only thing that serves them.

       STAMPED WITH THE RECORD'S OWN updatedAt, which is what makes it safe to
       cache the route for a year (see next.config.mjs). Swapping the file in the
       admin moves updatedAt, which changes this URL, which is a cache miss
       everywhere at once — the new picture appears immediately rather than when
       somebody's copy happens to expire. It is the same trick /_next/static
       plays by hashing its filenames, done with a timestamp because the filename
       here belongs to the editor rather than the build. */
    image: image?.url ? withVersion(image.url, image.updatedAt) : "",
    /* The story's own alt wins; the image's is the fallback. A card wants an
       empty one where the picture is decoration, and "" is a real answer here
       rather than a missing value — hence the ?? rather than a truthiness
       check, which would treat a deliberate blank as absent. */
    alt: doc.alt ?? image?.alt ?? "",
    deck: doc.deck,
    body: (doc.body ?? []).map((p) => p.text),
  };
}

/* ------------------------------------------------------------------ *
 * What the pages ask for
 * ------------------------------------------------------------------ */

/** EVERY STORY THERE IS, the lead one included — what the routes are built from
 *  and what the inner page is addressed against. */
export async function getAll(): Promise<Story[]> {
  return fetchAll();
}

/** THE ONE AT THE TOP. Not the newest story — the story the newsroom is leading
 *  on, which is an editorial choice and is why it is a checkbox on the record
 *  rather than a sort order. Undefined only if nobody has ticked one. */
export async function getFeatured(): Promise<Story | undefined> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "news",
    where: { featured: { equals: true } },
    limit: 1,
    depth: 1,
  });

  return docs[0] ? toStory(docs[0]) : undefined;
}

/** THE GRID — everything except the lead. Kept out of it on purpose: a featured
 *  story that also sat in the grid would be the same headline twice on one
 *  screen. */
export async function getStories(): Promise<Story[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "news",
    where: { featured: { not_equals: true } },
    limit: 1000,
    sort: "-date",
    depth: 1,
  });

  return docs.map(toStory);
}

/** The story a route segment names, or undefined — which the page turns into a
 *  404 rather than guessing at. */
export async function getStoryOf(id: string): Promise<Story | undefined> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "news",
    where: { slug: { equals: id } },
    limit: 1,
    depth: 1,
  });

  return docs[0] ? toStory(docs[0]) : undefined;
}

/* WHAT ELSE TO READ — the three cards at the foot of a story.
 *
 * RELATEDNESS IS THE KIND, because the kind is the only thing a story is
 * classified BY. There are no tags, no authors and no topics in this data, and
 * inventing a similarity score over lorem titles would be a made-up answer
 * dressed as a real one. An event beside an event is a claim the data can
 * actually support.
 *
 * ALWAYS THREE, AND NEVER THIS ONE. The rail is a row of three in the design
 * and a row of two with a hole in it is a page that looks broken — so the same
 * kind comes first and the rest of the newsroom tops it up in date order. The
 * only story that can never appear is the one being read.
 */
export async function getRelatedTo(
  story: Story,
  count = 3,
): Promise<Story[]> {
  const others = (await fetchAll()).filter((s) => s.id !== story.id);

  return [
    ...others.filter((s) => s.kind === story.kind),
    ...others.filter((s) => s.kind !== story.kind),
  ].slice(0, count);
}

/* ------------------------------------------------------------------ *
 * Arithmetic over stories already in hand — no database, no await
 * ------------------------------------------------------------------ */

/** How many stories a tab covers — the count the design prints beside each one.
 *
 *  COUNTED, NEVER TYPED. A figure written down beside a tab is a figure that is
 *  wrong the first time a story is added, and wrong silently. Padded to two
 *  digits because the design sets them that way.
 *
 *  Takes the list rather than fetching it: every caller is already drawing the
 *  stories it is counting, and a query per tab would be four round trips to
 *  answer a question the page had already asked. */
export function countOf(kind: NewsKind | null, stories: Story[]): string {
  const n = kind ? stories.filter((s) => s.kind === kind).length : stories.length;
  return String(n).padStart(2, "0");
}

/** What a card prints at its top edge. The tab's own label, found rather than
 *  written a second time — one word, one place. */
export function labelOf(kind: NewsKind): string {
  return KINDS.find((k) => k.id === kind)?.label ?? kind.toUpperCase();
}

/** Where a story lives. One place turns an id into a path, so the index's
 *  cards, the lead story and the routes cannot drift apart. */
export function hrefOf(story: Story): string {
  return `/news/${story.id}`;
}

/* HOW LONG IT TAKES TO READ, and it is COUNTED rather than typed — the same
 * call countOf makes about the tabs, for the same reason.
 *
 * 200 words a minute is the ordinary figure for prose read on a screen, and the
 * result is rounded UP and floored at one: nothing is a "0 min read", and half a
 * minute over is a minute a reader spends. When the real writing lands the
 * number comes right on its own, which is the whole point of counting it. */
const WPM = 200;

export function readOf(story: Story): string {
  const words = story.body.reduce((n, p) => n + p.trim().split(/\s+/).length, 0);
  return `${Math.max(1, Math.ceil(words / WPM))} min read`;
}
