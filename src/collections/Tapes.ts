import type {
  CollectionConfig,
  TextFieldSingleValidation,
  TextareaFieldValidation,
} from "payload";

/* A HEX CODE, OR NOTHING AT ALL.
 *
 * Blank is the normal state of every field this guards — it means "use the
 * site's colour" — so an empty box has to pass. What must not pass is a typo:
 * these values are written straight into a custom property, and a browser given
 * a value it cannot parse does not complain, it simply ignores the declaration.
 * The section would fall back to the stylesheet's colour and look exactly as if
 * the edit had never been made, which is the kind of failure somebody spends an
 * afternoon on. Caught here, it is a message next to the box.
 *
 * Three, six or eight digits: #abc, #aabbcc, and #aabbccff for a colour with
 * transparency in it. */
/* LINES, COUNTED.
 *
 * These four used to be arrays of rows holding one text box each, which is what
 * a list of lines looks like to a database and nothing like what it should look
 * like to a person: a four-line headline was four boxes to open, fill and drag.
 * They are one box now, and the line breaks are line breaks.
 *
 * WHAT THE ARRAYS GAVE UP IS THE COUNT, so it is enforced here instead.
 * minRows/maxRows were doing real work — the origin story is drawn as exactly
 * two lines and a third has nowhere to go — and losing that to a nicer field
 * would only move the failure to the page, where nobody is watching. */
const linesOf = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

const validateAtLeast =
  (n: number): TextareaFieldValidation =>
  (value) =>
    linesOf(value ?? "").length >= n
      ? true
      : `Needs at least ${n} line${n === 1 ? "" : "s"}.`;

const validateExactly =
  (n: number): TextareaFieldValidation =>
  (value) => {
    const got = linesOf(value ?? "").length;
    return got === n
      ? true
      : `Needs exactly ${n} lines — press Enter once. There ${got === 1 ? "is" : "are"} ${got}.`;
  };

const hex: TextFieldSingleValidation = (value) => {
  if (!value) return true;
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
    ? true
    : "Use a hex code like #0d470c, or leave it blank for the site's own colour.";
};

/* The tapes, as the CMS holds them.
 *
 * Kept shape-for-shape with the Tape type in src/data/tapes.ts, which is where
 * every field is argued properly — this file says what an editor sees, that one
 * says why the field exists at all. Read them together before changing either.
 *
 * IT IS IN TABS, and it was one column of fifty-two fields. That is the whole
 * of this arrangement: nobody edits a product from top to bottom, they come to
 * change a photograph or a claim or a colour, and every one of those meant
 * scrolling past the other four. Seven tabs, each holding one job.
 *
 * THE TABS ARE UNNAMED. A named tab nests its contents under its own key, so
 * every field here would move in the database and a change about where an
 * editor LOOKS would need a migration and a rewrite of the mapper. Unnamed, a
 * tab is furniture: the data is where it always was.
 *
 * SLUG AND ORDER ARE IN THE SIDEBAR. Neither is a thing anybody comes here to
 * write — one is the address, the other a position in two lists — and both were
 * sitting in the middle of the copy an editor actually came for.
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

    /* A PREVIEW PANE, and it can have one now. The note in payload.config.ts
       said tapes could not: the rolls were drawn by the home page's slider and
       had no page of their own, so a preview would have meant pointing all six
       at "/" and calling it a preview of the edit. Separating the orbit from
       the products is what changed that — a tape is /products/<slug> and
       nothing else, which is a question with one answer. */
    livePreview: {
      url: ({ data }) =>
        `${process.env.SERVER_URL ?? ""}/products/${data?.slug ?? ""}`,
    },
  },

  access: { read: () => true },
  defaultSort: "order",

  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
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
        position: "sidebar",
        description:
          "Position in the row at /products, low to high — and the order NEXT UP walks at the foot of a product page. NOT the home page's orbit, which is set on the Homepage global and ordered by dragging the rolls there.",
      },
    },

    /* THE TABS FOLLOW THE PAGE, top to bottom, and that is the whole of this
       arrangement. They were organised by KIND before — Artwork, Copy, 3D — so
       changing one section meant visiting three tabs and every tab held pieces
       of five different sections. Nobody edits a product by kind. They come to
       change the opening screen, or the origin story, or a superpower, and now
       each of those is one place.

       COLOURS IS THE ONE THAT IS NOT A SECTION, and it is last for that reason:
       the palette is a single record that paints the opening screen, the origin
       section, NEXT UP and the scrollbar, and the overrides under it cover four
       sections at once. Splitting it across the tabs above would mean moving it
       in the database to solve a question about where an editor looks.

       THEY ARE STILL UNNAMED TABS. A named tab nests its contents under its own
       key — every field here would move — so unnamed keeps this purely about
       furniture and leaves the data exactly where it is. */
    {
      type: "tabs",
      tabs: [
        {
          label: "Hero banner",
          description:
            "The opening screen: the roll square-on, the tape's name across it, and the colours the page floods with.",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: { description: "Screen-reader name for the roll button." },
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
              name: "hero",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "The inner page's key visual — the roll shot square-on. Optional: leave it empty and the page falls back to the card, which is a working page rather than a hole in one.",
              },
            },
            {
              name: "card",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: { description:
              "The hang tag. Drawn on the row at /products, in THE RUN below, and used as this page's key visual whenever no hero shot is set." },
            },
            { name: "model", type: "text", required: true },
          ],
        },
        {
          label: "Origin section",
          description:
            "The dark green section under the opening screen — where this tape comes from, and the two photographs beside it.",
          fields: [
            {
              name: "origin",
              type: "textarea",
              required: true,
              validate: validateExactly(2),
              admin: {
                rows: 4,
                description:
                  "Where this tape comes from. Exactly two lines — press Enter once, at the break the design makes.",
              },
            },
            {
              name: "character",
              type: "textarea",
              required: true,
              validate: validateAtLeast(1),
              admin: {
                rows: 4,
                description:
                  "What it is like to use. One line per line.",
              },
            },
            {
              name: "showcase",
              type: "upload",
              relationTo: "media",
              required: true,
              admin: {
                description:
                  "The photograph beside the origin story. ONE — it was two for a while, mirroring the home page's stage, and the second was never drawn on a product page.",
              },
            },
          ],
        },
        {
          label: "Siblings",
          description:
            "The same tape in its three grades, on the green the origin section ends on.",
          fields: [
            {
              name: "faces",
              type: "array",
              admin: {
                components: { RowLabel: "/admin/RowLabel#RowLabel" },
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
          label: "Superpowers",
          description:
            "Three claims on three cards, scrolled through a held screen. Each can carry a drawing of its own.",
          fields: [
            {
              name: "powers",
              type: "array",
              required: true,
              minRows: 3,
              maxRows: 3,
              labels: { singular: "Superpower", plural: "Superpowers" },
              admin: {
                components: { RowLabel: "/admin/RowLabel#RowLabel" },
                description:
                  "Exactly three — the section is a stack of three cards. Per tape rather than per range: a masking tape and a cloth tape are not good at the same things.",
              },
              fields: [
                {
                  /* NOT `id`. Payload gives every array row an id of its own
                     and enforces it unique across the table; a field of the
                     same name collides with it, and the collision only shows
                     when two tapes share a power key — which they did, because
                     the placeholder powers were one shared constant.

                     HIDDEN NOW, AND DERIVED. It is a React key and nothing
                     else: never drawn, never read by a person, and there is no
                     answer an editor could give that would beat one taken from
                     the claim itself. Visible, it was a required box on three
                     rows of six tapes asking for a value whose only wrong
                     answer was a duplicate.

                     The hook runs BEFORE validation, so `required` is satisfied
                     by the derived value and nobody ever sees the field refuse.
                     An existing key is kept: rewriting one on a tape that
                     already has three would remount a card for no reason. */
                  name: "key",
                  type: "text",
                  required: true,
                  admin: { hidden: true },
                  hooks: {
                    beforeValidate: [
                      ({ value, siblingData }) => {
                        if (value) return value;
                        const row = siblingData as {
                          titleTop?: string;
                          titleBottom?: string;
                        };
                        const from = `${row?.titleTop ?? ""} ${
                          row?.titleBottom ?? ""
                        }`.trim();
                        return (
                          from
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, "") || "power"
                        );
                      },
                    ],
                  },
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
          ],
        },
        {
          label: "Additional info",
          description:
            "THE RUN — the pinned frame the page scrolls sideways through — and the line this product shows in a search result.",
          fields: [
            {
              name: "reel",
              type: "group",
              fields: [
                {
                  name: "headline",
                  type: "textarea",
                  required: true,
                  validate: validateAtLeast(1),
                  admin: {
                    rows: 4,
                    description:
                      "The claim across the pinned frame. One line per line — press Enter where the design breaks it, because where display type this size turns is a drawing decision rather than something to infer from the measure.",
                  },
                },
                {
                  name: "note",
                  type: "textarea",
                  required: true,
                  validate: validateAtLeast(1),
                  admin: {
                    rows: 4,
                    description:
                      "The hand-written note beside the label. One line per line, same as above.",
                  },
                },
                {
                  name: "shots",
                  type: "array",
                  required: true,
                  minRows: 4,
                  maxRows: 4,
                  admin: {
                    components: { RowLabel: "/admin/RowLabel#RowLabel" },
                    description:
                      "Exactly four. The grid is drawn for four and a fifth has nowhere to go.",
                  },
                  fields: [
                    { name: "image", type: "upload", relationTo: "media", required: true },
                  ],
                },
              ],
            },
            {
              name: "copy",
              type: "textarea",
              required: true,
              admin: { description:
              "The line under this product in a Google result, and nothing else — it is NOT drawn on the page. One sentence, about 150 characters; longer is cut off mid-word." },
            },
            {
              name: "tags",
              type: "array",
              maxRows: 4,
              admin: {
              hidden: true,
                components: { RowLabel: "/admin/RowLabel#RowLabel" },
                description:
              "NOT SHOWN ON THIS PAGE any more. The chips beside the home page's stage are the slider's own now (Globals -> Homepage), and nothing on a product page draws these. Hidden rather than deleted so the words are not lost; say if they should go.",
              },
              fields: [{ name: "text", type: "text", required: true }],
            },
          ],
        },
        {
          label: "Colours",
          description:
            "The palette this product is painted in, and — optionally — the ground each middle section stands on. One place rather than five: the palette is one record and paints across sections.",
          fields: [
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
            {
              name: "sections",
              type: "group",
              label: false,
              fields: [
            {
                  name: "originBg",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#0d470c",
                    description: "The origin story's ground. Site default #0d470c.",
                  },
                },
                {
                  name: "siblingsBg",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#0d470c",
                    description: "THE SIBLINGS' ground, under the three grade cards. Site default #0d470c.",
                  },
                },
                {
                  name: "siblingsCard",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#c6fd00",
                    description: "The three grade cards themselves. Site default #c6fd00.",
                  },
                },
                {
                  name: "siblingsInk",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#a8f000",
                    description: "The tape's name set across those cards. Site default #a8f000.",
                  },
                },
                {
                  name: "powersBg",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#b6fe00",
                    description: "SUPER POWERS' sheet — the ground the stack of cards passes over. Site default #b6fe00.",
                  },
                },
                {
                  name: "powersCard",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#0d470c",
                    description: "The card being read, once it fills. Site default #0d470c.",
                  },
                },
                {
                  name: "powersCardRest",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#9bdc00",
                    description: "A card still waiting its turn. Close to the sheet on purpose: a resting card is meant to be sensed rather than found. Site default #9bdc00.",
                  },
                },
                {
                  name: "powersInk",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#b6fe00",
                    description: "The claim and the sentence on the open card. Site default #b6fe00.",
                  },
                },
                {
                  name: "reelBg",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#b6fe00",
                    description: "THE RUN's ground. Site default #b6fe00.",
                  },
                },
                {
                  name: "reelInk",
                  type: "text",
                  validate: hex,
                  admin: {
                    placeholder: "#013900",
                    description: "THE RUN's writing. Site default #013900.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
