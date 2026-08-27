import type { CollectionConfig } from "payload";

/* The newsroom, as the CMS holds it.
 *
 * This is the schema src/data/news.ts describes itself as the seam for. It is
 * kept shape-for-shape with the Story type there: what changed in the move is
 * how three fields are ENTERED, not what the page receives.
 *
 *   date      replaces day + month. The design prints them separately ("18" and
 *             "MAY 2026") and the data file stored them that way; an editor
 *             typing both can type a pair that disagree, and a story stored as
 *             two strings cannot sort. One date is picked and both strings are
 *             derived from it — see toStory in src/data/news.ts, which is the
 *             only place that formats them.
 *
 *   image     is an upload rather than a typed path. A path is a thing to get
 *             wrong silently — the card renders, the picture does not — and
 *             going through Media is what puts uploads through the WebP
 *             conversion in Media.ts.
 *
 *   body      stays an array of paragraphs rather than becoming rich text. The
 *             argument is made properly in src/data/news.ts and it still holds:
 *             a paragraph is a <p>, and components/bodyReveal.ts groups lines
 *             by measuring them, so markup inside a paragraph would mean
 *             nothing to it. An editor who needs bold inside a story is the
 *             signal to revisit this, not a reason to pre-empt it.
 */
export const News: CollectionConfig = {
  slug: "news",

  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "date", "featured"],
    description:
      "Stories and events. Exactly one story is featured; ticking a new one unticks the old.",
  },

  access: { read: () => true },

  /* Newest first, which is what the newsroom means by order. The placeholder
     data was written in two descending runs rather than one, so the grid
     reorders on the way in — the dates are the truth and always were. */
  defaultSort: "-date",

  hooks: {
    /* EXACTLY ONE LEAD STORY. The design has a featured slot and a grid, and a
       featured story that also sat in the grid would be the same headline twice
       on one screen — which is the reason src/data/news.ts keeps `featured` out
       of `stories` rather than slicing it off the front.

       A checkbox cannot enforce that on its own, so this does: ticking one
       unticks the rest. The context flag is what stops the update below from
       re-entering this hook for each story it touches. */
    afterChange: [
      async ({ doc, req, context }) => {
        if (!doc.featured || context.skipFeaturedSync) return doc;

        await req.payload.update({
          collection: "news",
          where: {
            and: [{ featured: { equals: true } }, { id: { not_equals: doc.id } }],
          },
          data: { featured: false },
          context: { skipFeaturedSync: true },
          req,
        });

        return doc;
      },
    ],
  },

  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description:
          "Written exactly as it paints. The lead story is set in caps because it is display type; a card's title is sentence case because it is a sentence. Neither is text-transform doing it.",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "The route's last segment: /news/<slug>. Changing it breaks any link already published to the old one.",
      },
    },
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "news",
      options: [
        { label: "Event", value: "event" },
        { label: "News", value: "news" },
      ],
      admin: {
        description:
          "The filter tab this sits under, and what the card wears at its top edge. The tabs are counted off these values — there is no second list to keep in step.",
      },
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: {
        date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" },
        description:
          "Prints as the large day and the small month beneath it. Both are derived from this, so they cannot disagree.",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "The story the newsroom leads on — an editorial choice, not the newest date. Ticking this unticks whichever story held it before.",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description:
          "Converted to WebP on upload. The featured shot runs full-bleed off the top corner of the inner page, so it wants to be the largest of them.",
      },
    },
    {
      name: "alt",
      type: "text",
      admin: {
        description:
          "Leave empty where the picture is decoration beside a title that already says it — the grid cards. The featured shot and the inner page carry a real one. Falls back to the alt set on the image itself.",
      },
    },
    {
      name: "deck",
      type: "text",
      required: true,
      admin: {
        description:
          "The heading at the head of the article's own sheet. Not a summary and not a standfirst — display type doing a heading's job, written in the case it paints.",
      },
    },
    {
      name: "body",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Paragraph", plural: "Paragraphs" },
      admin: {
        description:
          "One entry per paragraph. The read time is counted from these, so it comes right on its own as the writing grows.",
      },
      fields: [
        {
          name: "text",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
};
