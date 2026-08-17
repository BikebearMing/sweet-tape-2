/* Sweet Tape — what the newsroom has in it.
 *
 * The seam the CMS plugs into, exactly as tapes.ts is for the products: every
 * story is one object and nothing that draws them reads anything else. A story
 * gains a field here and the card, the featured slot and the filter all pick it
 * up; none of them holds a second copy of a title or a date.
 *
 * THE KIND IS THE FILTER AND THE FILTER IS THE KIND. There is no separate list
 * of what is in each tab: NewsIndex counts the tabs off these values, so a third
 * kind is a line in KINDS and a `kind` on some stories, and the filter row grows
 * to match with nothing else to touch. What it must never become is a second
 * array per tab — the same story would then exist twice and the counts would go
 * out of step the first time one was edited.
 *
 * THE COPY IS PLACEHOLDER AND THE STRUCTURE IS NOT. Every title here is lorem,
 * because the stories have not been written and inventing nine of them would be
 * nine things to delete later. The dates, the kinds and the artwork are real
 * shapes: what replaces the lorem is a string, not a rethink of the card.
 *
 * ONE PICTURE, NINE TIMES. The grid runs the same shot on every card
 * deliberately — the layout is what is being built here and nine different
 * crops would hide whether the grid is right. Give each story its own `image`
 * when the artwork lands; nothing downstream cares that they are currently
 * equal.
 *
 * AND ONE ARTICLE, TEN TIMES, for the same reason and with the same warning.
 * `deck` and `body` are shared constants below rather than ten copies of the
 * lorem: the inner page is a composition, not a piece of writing, and ten
 * different lengths of placeholder would only make it harder to see whether the
 * measure is right. They are per-story FIELDS all the same — the sharing is one
 * line each and stops the day real copy arrives.
 */

/** Which tab a story belongs under. The filter row is built from these. */
export type NewsKind = "event" | "news";

export type Story = {
  /** Stable key, and the route's last segment: /news/<id>. See hrefOf, which is
      the only place that turns one into the other. */
  id: string;
  kind: NewsKind;
  /** The card's line, written exactly as it paints — the site's convention, and
      here it means two different cases on purpose. The lead story is set in caps
      because it is display type in the headline voice; a card's title is set in
      sentence case because it is a sentence, set in the body face at a size a
      reader reads rather than looks at. Neither is text-transform doing it. */
  title: string;
  /** The day, set large on the card. Two characters, always — the design gives
      it a slot of one width and "5" would sit off-centre in it. */
  day: string;
  /** The rest of the date, set small under the day. */
  month: string;
  image: string;
  /** Empty where the picture is decoration beside a title that already says it
      — see the cards. The featured shot carries a real one, and so does the
      inner page, which runs the same file full-bleed off its top corner. */
  alt: string;
  /** The heading at the top of the article's own sheet — a second, shorter line
      under the one the page is titled with. It is not a summary and not a
      standfirst: the design sets it as display type at the head of the copy,
      which is a heading doing a heading's job, so it is written in the case it
      paints exactly as every other line on this site is. */
  deck: string;
  /** The article, a paragraph to an entry. An array rather than one string with
      breaks in it, because a paragraph is a <p> and splitting on newlines is a
      thing to get wrong later — and because the line reveal groups its own
      lines by measuring them (components/bodyReveal.ts), so a break typed here
      would mean nothing to it anyway. */
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

/** How many stories a tab covers — the count the design prints beside each one,
 *  and the label a card wears at its own top edge.
 *
 *  COUNTED, NEVER TYPED. The design draws (15), (07) and (03) and there are nine
 *  stories here; a figure written down beside a tab is a figure that is wrong the
 *  first time a story is added, and wrong silently. Padded to two digits because
 *  the design sets them that way and a bare "9" would sit off-centre in a slot
 *  built for two.
 */
export function countOf(kind: NewsKind | null): string {
  const n = kind ? stories.filter((s) => s.kind === kind).length : stories.length;
  return String(n).padStart(2, "0");
}

/** What a card prints at its top edge. The tab's own label, found rather than
 *  written a second time — one word, one place. */
export function labelOf(kind: NewsKind): string {
  return KINDS.find((k) => k.id === kind)?.label ?? kind.toUpperCase();
}

/* THE ARTICLE ITSELF, written once and worn by all ten — see the note at the
 * top of this file. The words are the lorem passage the design sets, kept as it
 * is drawn rather than trimmed to fit: what the inner page is being built to
 * find out is whether five paragraphs at that measure read, and a shorter
 * placeholder would answer a question nobody asked.
 *
 * TYPOGRAPHIC QUOTES AND DASHES, like every other string on this site. The copy
 * is set exactly as it paints — no entity, no straight quote left for a text
 * filter to fix later.
 */
const DECK = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

const BODY = [
  "Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to Letraset, a popular manufacturer of dry transfer sheets for text and other design elements.",
  "It is believed that they scrambled parts of Cicero’s De Finibus Bonorum et Malorum in the 1960s for use in their Body Type (basically body paragraph placeholder) sheets. It usually begins with: “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.” The purpose of lorem ipsum is to create a natural looking block of text that doesn’t distract from the layout.",
  "The passage experienced a surge in popularity during the 1960s when Letraset used it on their dry-transfer sheets, and again during the 90s as desktop publishers bundled the text with their software. Today it is seen all around the web; on templates, websites, and stock designs.",
  "Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to Letraset, a popular manufacturer of dry transfer sheets for text and other design elements. A practice not without controversy, laying out pages with meaningless filler text can be very useful when the focus is meant to be on design, not content.",
  "Lorem ipsum, or lipsum as it is sometimes known, is dummy text used in laying out print, graphic or web designs. The passage is attributed to Letraset, a popular manufacturer of dry transfer sheets for text and other design elements.",
];

/* THE ONE AT THE TOP. Its own constant rather than the first of the nine,
   because it is not the newest story — it is the story the newsroom is leading
   on, which is an editorial choice and not a sort order. Pulling it out of the
   list is also what keeps the grid at nine: a featured story that was also in
   the grid would be the same headline twice on one screen. */
export const featured: Story = {
  id: "featured",
  kind: "news",
  title:
    "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT",
  day: "18",
  month: "MAY 2026",
  image: "/assets/make-it-stick.jpg",
  alt: "Six rolls of Sweet Tape held in someone’s arms.",
  deck: DECK,
  body: BODY,
};

/* FOUR EVENTS AND FIVE STORIES, which is the split the design draws and the
   reason they are interleaved rather than grouped: a grid that ran all four
   events and then all five news items would read as two blocks with a seam
   across it, and the ALL tab is meant to read as one wall. Ordered by date
   instead, newest first, which is what the filter tabs then cut through. */
const SHOT = "/assets/mask-image-1.jpg";

export const stories: Story[] = [
  {
    id: "story-1",
    kind: "event",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "18",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-2",
    kind: "news",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "16",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-3",
    kind: "event",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "11",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-4",
    kind: "news",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "04",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-5",
    kind: "news",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "29",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-6",
    kind: "event",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "22",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-7",
    kind: "news",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "15",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-8",
    kind: "event",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "07",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
  {
    id: "story-9",
    kind: "news",
    title: "Lorem ipsum, or lipsum as it is sometimes know",
    day: "01",
    month: "MAY 2026",
    image: SHOT,
    alt: "",
    deck: DECK,
    body: BODY,
  },
];

/* EVERY STORY THERE IS, the lead one included — which is what the inner page is
 * addressed against and what the routes are built from.
 *
 * The lead is not in `stories` on purpose (see above: it would otherwise be the
 * same headline twice on one screen), and that is exactly the sort of split a
 * router would fall through: /news/featured has to resolve, and nothing about
 * the index's arrangement is any business of the route. So the two are put back
 * together HERE, once, and storyOf below is the only thing that reads it. */
export const all: Story[] = [featured, ...stories];

/** The story a route segment names, or undefined — which the page turns into a
 *  404 rather than guessing at. */
export function storyOf(id: string): Story | undefined {
  return all.find((s) => s.id === id);
}

/** Where a story lives. One place turns an id into a path, so the index's nine
 *  cards, the lead story and the routes cannot drift apart — and moving the
 *  newsroom to another prefix is this line. */
export function hrefOf(story: Story): string {
  return `/news/${story.id}`;
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
 * kind comes first and the rest of the newsroom tops it up in the order it is
 * written. The only story that can never appear is the one being read, which is
 * what a reader would otherwise notice immediately.
 *
 * `count` is an argument rather than a constant because the rail's width is a
 * design decision belonging to the section that draws it — see
 * components/RelatedNews, which is the only caller and passes nothing.
 */
export function relatedTo(story: Story, count = 3): Story[] {
  const others = all.filter((s) => s.id !== story.id);
  return [
    ...others.filter((s) => s.kind === story.kind),
    ...others.filter((s) => s.kind !== story.kind),
  ].slice(0, count);
}

/* HOW LONG IT TAKES TO READ, and it is COUNTED rather than typed — the same
 * call countOf makes about the tabs, for the same reason. A figure written
 * beside a story is a figure that is wrong the first time a paragraph is added,
 * and wrong silently.
 *
 * 200 words a minute is the ordinary figure for prose read on a screen, and the
 * result is rounded UP and floored at one: nothing is a "0 min read", and half a
 * minute over is a minute a reader spends.
 *
 * The design's note says 5 min read, and the placeholder copy is nowhere near
 * that long — so this says what it says. When the real writing lands the number
 * comes right on its own, which is the whole point of counting it.
 */
const WPM = 200;

export function readOf(story: Story): string {
  const words = story.body.reduce((n, p) => n + p.trim().split(/\s+/).length, 0);
  return `${Math.max(1, Math.ceil(words / WPM))} min read`;
}
