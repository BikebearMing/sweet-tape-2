import type { CollectionConfig } from "payload";

/* The tapes, as the CMS holds them.
 *
 * Kept shape-for-shape with the Tape type in src/data/tapes.ts, which is where
 * every field is argued properly — this file says what an editor sees, that one
 * says why the field exists at all. Read them together before changing either.
 *
 * WHAT A PRODUCT IS, AND NOT WHAT THE HOME PAGE IS SHOWING. The orbit used to
 * be this collection — an `order` and a `roll` thumbnail that only the slider
 * ever read — which made one record the authority on two unrelated decisions.
 * Adding a tape put it on the front page. They are separate now: see
 * src/globals/Homepage.ts. `order` remains because the row at /products and the
 * NEXT UP link still walk this collection in a running order of its own.
 *
 * ARTWORK IS UPLOADS NOW. Every picture a tape wears is a Media record rather
 * than a path typed into a box: an editor swaps a roll by dropping a file on it,
 * the delete guard stops anyone removing one still in use, and each URL carries
 * the record's updatedAt so a replacement busts every cache the moment it is
 * saved. A typed path could do none of those and could be wrong in a way nothing
 * noticed until the page was looked at.
 *
 * THE MODELS STAY STATIC. Media accepts GLBs, but the slider preloads these on
 * the home page and three.js loads them by URL — a wrong path there breaks the
 * centrepiece of the site rather than showing a broken image. They are geometry,
 * not content, and they move when there is a reason rather than because
 * everything else did.
 *
 * COLOURS ARE A GROUP, not six loose fields. `word` is a tape's wordmark key AND
 * the colour THE is set in; flat, one has to be renamed and the type stops
 * matching the schema. Nested, both keep the name the design calls them.
 */
export const Tapes: CollectionConfig = {
  slug: "tapes",

  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "slug", "order", "updatedAt"],
    description:
      "The products themselves — what each tape IS. The home page's orbit is a separate record (Globals → Homepage), so adding a tape here does not put it on the front page.",
  },

  access: { read: () => true },
  defaultSort: "order",

  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      admin: { description: "Screen-reader name for the roll button." },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "The route's last segment: /products/<slug>, and the artwork folder's name. Changing it breaks both.",
      },
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description:
          "Position in the row at /products, low to high — and the order NEXT UP walks at the foot of a product page. NOT the home page's orbit, which is set on the Homepage global and ordered by dragging the rolls there.",
      },
    },
    {
      name: "wordmark",
      type: "text",
      required: true,
      admin: {
        description:
          "Which word the bottom title spells — a key of `words` in src/data/wordmarks.json, where its letterforms are. Not free text: the stencils are generated per word into letters.css and selected by this.",
      },
    },

    {
      type: "collapsible",
      label: "Artwork",
      fields: [
        {
          name: "card",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: "Hang tag at the centre of the stage." },
        },
        {
          name: "hero",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "The inner page's key visual — the roll shot square-on. Optional: leave it empty and the page falls back to the card, which is a working page rather than a hole in one.",
          },
        },
        {
          name: "showcase",
          type: "array",
          required: true,
          minRows: 2,
          maxRows: 2,
          admin: {
            description:
              "Exactly two. The layout places each by hand, so a third would have nowhere to go.",
          },
          fields: [
            { name: "image", type: "upload", relationTo: "media", required: true },
          ],
        },
        {
          name: "faces",
          type: "array",
          admin: {
            description:
              "The siblings' printed labels, one per variant id. Optional and empty for every tape today — each card falls back to the card artwork above, so the row works rather than showing three broken images.",
          },
          fields: [
            { name: "variant", type: "text", required: true },
            { name: "image", type: "upload", relationTo: "media", required: true },
          ],
        },
      ],
    },

    {
      type: "collapsible",
      label: "3D model",
      admin: {
        description:
          "Paths into /public/assets/tapes. The slider preloads these — a wrong one breaks the home page, not just this product.",
      },
      fields: [
        { name: "model", type: "text", required: true },
        {
          name: "modelInner",
          type: "text",
          admin: {
            description:
              "A second mesh for the inner page where the slider's is not right for it. Optional.",
          },
        },
        {
          name: "clarity",
          type: "number",
          min: 0,
          max: 1,
          admin: {
            description:
              "How see-through the tape is, 0 to 1. A fact about the tape rather than a rendering setting, which is why it lives here.",
          },
        },
      ],
    },

    {
      type: "collapsible",
      label: "Copy",
      fields: [
        {
          name: "tags",
          type: "array",
          maxRows: 4,
          admin: {
            description:
              "Chips in the left column. Four is the ceiling — the tilt angles run out at five.",
          },
          fields: [{ name: "text", type: "text", required: true }],
        },
        {
          name: "copy",
          type: "textarea",
          required: true,
          admin: { description: "Paragraph under the chips." },
        },
        {
          name: "origin",
          type: "array",
          required: true,
          minRows: 2,
          maxRows: 2,
          admin: {
            description:
              "Exactly two lines, broken where the design breaks them rather than wherever the measure lands.",
          },
          fields: [{ name: "text", type: "text", required: true }],
        },
        {
          name: "character",
          type: "array",
          required: true,
          minRows: 1,
          admin: { description: "One entry per line." },
          fields: [{ name: "text", type: "text", required: true }],
        },
      ],
    },

    {
      type: "collapsible",
      label: "Reel",
      fields: [
        {
          name: "reel",
          type: "group",
          fields: [
            {
              name: "headline",
              type: "array",
              required: true,
              minRows: 1,
              admin: {
                description:
                  "Broken by hand: where display type this size turns is a drawing decision, not something to infer from the string at render time.",
              },
              fields: [{ name: "text", type: "text", required: true }],
            },
            {
              name: "note",
              type: "array",
              required: true,
              minRows: 1,
              fields: [{ name: "text", type: "text", required: true }],
            },
            {
              name: "shots",
              type: "array",
              required: true,
              minRows: 4,
              maxRows: 4,
              admin: {
                description:
                  "Exactly four. The grid is drawn for four and a fifth has nowhere to go.",
              },
              fields: [
                { name: "image", type: "upload", relationTo: "media", required: true },
              ],
            },
          ],
        },
      ],
    },

    {
      name: "powers",
      type: "array",
      required: true,
      minRows: 3,
      maxRows: 3,
      labels: { singular: "Superpower", plural: "Superpowers" },
      admin: {
        description:
          "Exactly three — the section is a stack of three cards. Per tape rather than per range: a masking tape and a cloth tape are not good at the same things.",
      },
      fields: [
        {
          /* NOT `id`. Payload gives every array row an id of its own and
             enforces it unique across the table; a field of the same name
             collides with it, and the collision only shows when two tapes share
             a power key — which they do, because the placeholder powers are one
             shared constant. */
          name: "key",
          type: "text",
          required: true,
          admin: { description: "Stable key. Not shown on the page." },
        },
        {
          name: "titleTop",
          type: "text",
          required: true,
          admin: { description: "First line of the claim." },
        },
        {
          name: "titleBottom",
          type: "text",
          required: true,
          admin: {
            description:
              "Second line. Exactly two: the card is a fixed shape and a third would overflow it.",
          },
        },
        {
          name: "copy",
          type: "textarea",
          required: true,
          admin: {
            description:
              "One sentence, under the mark. Sentence case here — the caps on the page are the section's setting, so this stays readable in a screen reader.",
          },
        },
        {
          name: "mark",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "The drawing that drops onto the card. An SVG — and it may be an ANIMATED one: an export that carries its own motion keeps it, and the page only decides when it plays. A flat SVG is dropped on by the section's own bounce instead, so either kind works. Optional: leave it empty and the card wears the stock box.",
          },
        },
      ],
    },

    {
      name: "colours",
      type: "group",
      admin: {
        description:
          "Reaches the page as custom properties on the roll button; the animation reads them from there.",
      },
      fields: [
        { name: "ring", type: "text", required: true, admin: { description: "Band behind the roll when selected." } },
        { name: "bg", type: "text", required: true, admin: { description: "Colour the stage floods with." } },
        { name: "word", type: "text", required: true, admin: { description: "THE and the tape's own word." } },
        { name: "tagBg", type: "text", required: true, admin: { description: "Chip fill." } },
        { name: "tagInk", type: "text", required: true, admin: { description: "Chip text. Check it against tagBg — 4.5:1 or better." } },
        { name: "ink", type: "text", required: true, admin: { description: "Body copy in the left column." } },
      ],
    },
  ],
};
