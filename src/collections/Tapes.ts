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
 * minRows/maxRows were doing real work — a note in the margin is drawn on the
 * lines it is written on — and losing that to a nicer field would only move the
 * failure to the page, where nobody is watching.
 *
 * THE ORIGIN STORY USED TO BE COUNTED TOO, at exactly two, and that count was
 * never about lines: the second "line" was where a strip of tape went, and the
 * paragraph has never drawn a break there. It is one paragraph with a {{tape}}
 * in it now, and what is checked is the token — see hasTapeToken. */
const linesOf = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

const validateAtLeast =
  (n: number): TextareaFieldValidation =>
  (value) =>
    linesOf(value ?? "").length >= n
      ? true
      : `Needs at least ${n} line${n === 1 ? "" : "s"}.`;

/* THE STRIP'S PLACE IN THE ORIGIN STORY, and the whole reason it is checked
 * here. The token is what the section cuts the paragraph at — no token, no
 * strip, and a paragraph that quietly lost the piece of tape stuck across it is
 * not an error anywhere. It renders, it reads, and it is simply missing the one
 * thing that section is drawn around. Caught at the box, it is a message beside
 * the field.
 *
 * NOT "exactly one". Two is legal and the section draws two; a paragraph that
 * ever wants a second strip should not have to be argued with. */
const hasTapeToken: TextareaFieldValidation = (value) =>
  (value ?? "").includes("{{tape}}")
    ? true
    : "Type {{tape}} where the strip of tape should sit in the paragraph.";

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
 *
 * AND THE COLOURS TAB IS BROKEN UP BY SECTION, in the order the page draws them
 * — see the note on the tab itself. Two groups of six and twelve became six
 * folds, because a field called powersCardRest is only findable by somebody who
 * already knows the section is called SUPER POWERS in the code.
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
              validate: hasTapeToken,
              admin: {
                rows: 5,
                description:
                  "Where this tape comes from — one paragraph. Type {{tape}} where the strip of tape should be stuck across it: it can go between any two words, or at the very end. WHICH tape it is, is set in the code and is normally this product's own. Line breaks are just for reading; the paragraph flows to its own width on the page.",
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
            "The rest of this range, on the green the origin section ends on — one printed label per variant.",
          fields: [
            {
              /* ONE UPLOAD PER ROW AND NOTHING ELSE.
               *
               * It carried a `variant` box next to the picture, and that box was
               * a KEY: the section drew three fixed cards — normal, strong, xtra
               * — and an upload only landed if what was typed matched one of the
               * three exactly. Nothing said so, nothing validated it, and every
               * row filled in with a sensible name like "cloth tape strong.black"
               * silently drew nothing at all.
               *
               * It was also the wrong shape for the products. The range is not
               * three grades of everything: the OPP roll has three variants, the
               * cloth two, the double-sided one. Three cards was a fact about the
               * mock rather than about the tape.
               *
               * So the ROW IS THE CARD. However many are added is how many the
               * section draws, in this order, and the name printed on each is in
               * the artwork where it was always drawn. Nothing to match and
               * nothing to keep in step. */
              name: "faces",
              type: "array",
              maxRows: 3,
              labels: { singular: "Sibling", plural: "Siblings" },
              admin: {
                components: { RowLabel: "/admin/RowLabel#RowLabel" },
                description:
                  "One printed label per variant, in the order they should stand — the middle one is the raised card. Up to three, which is what the row is drawn for. Leave it empty and the section shows three of the hang tag, which is what every tape did before the artwork existed.",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  admin: {
                    description:
                      "The round printed label. Its own Alt text in the media library is what a screen reader is told, so put the variant's name there.",
                  },
                },
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
            "Every colour this product is painted in, section by section, in the order the page draws them. The first box in each section is its ground.",
          fields: [
            /* SIX SECTIONS OF A PRODUCT PAGE, IN THE ORDER THE READER MEETS
               THEM, and it was two groups of six and twelve. That is the whole
               of this arrangement: nobody comes here to change "a colour", they
               come to change THE COLOUR OF A SECTION, and finding it meant
               reading twelve field names with the section's name buried in the
               middle of each — powersCardRest against siblingsCard against
               reelInk. Under a heading that says which section it is, each one
               only has to say which part.

               COLLAPSIBLES AND NOT TABS OR GROUPS, deliberately, and each is
               worth a word:

                 A GROUP would nest the fields under its own key, so every one
                 of these would move in the database and a change about where an
                 editor LOOKS would need a migration. Both real groups here —
                 `colours` and `sections` — are the ones the data already has.

                 TABS at this depth would be tabs inside a tab, which reads as a
                 second navigation on the same screen.

               A collapsible is furniture: it draws a heading and a fold and
               changes nothing about where anything is stored.

               THE PALETTE IS FIRST AND IS OPEN, because it is the one an editor
               is most often here for and the only one whose fields are
               required. The five section folds under it are all-optional
               overrides and start shut. */
            {
              type: "collapsible",
              label: "The tape's palette",
              admin: {
                initCollapsed: false,
                description:
                  "The product's own colours, and NOT one section's — these reach the opening screen, the roll in the home page's orbit, the row at /products and the door NEXT UP opens. Change one and it changes on all four. To repaint just the opening screen, use the fold under this.",
              },
              fields: [
                {
                  name: "colours",
                  type: "group",
                  label: false,
                  admin: {
                    description:
                      "Reaches the page as custom properties on the roll button; the animation reads them from there.",
                  },
                  fields: [
                    { name: "ring", type: "text", required: true, label: "Ring", admin: { description: "Band behind the roll when it is the selected one." } },
                    { name: "bg", type: "text", required: true, label: "Sheet", admin: { description: "The colour the stage floods with." } },
                    { name: "word", type: "text", required: true, label: "Wordmark", admin: { description: "THE and the tape's own word." } },
                    { name: "tagBg", type: "text", required: true, label: "Chip fill", admin: { description: "The chip behind the strapline." } },
                    { name: "tagInk", type: "text", required: true, label: "Chip text", admin: { description: "Check it against the chip fill — 4.5:1 or better." } },
                    { name: "ink", type: "text", required: true, label: "Body copy", admin: { description: "The line of copy in the left column." } },
                  ],
                },
              ],
            },

            /* AND THE FIVE SECTIONS' OWN GROUND, ALL OPTIONAL, ALL BLANK BY
               DEFAULT MEANING "leave it as it is". A tape nobody has touched is
               exactly the page it was, and nobody has to type seventeen hex
               values to keep today's look. The placeholder in each box is the
               colour that will be used if it is left empty, so the default is
               visible rather than remembered — except on the opening screen,
               where the default is the tape's own palette and is therefore a
               different colour on every product. Those say so in words.

               ONE `sections` GROUP HOLDING FIVE FOLDS, and the group is the one
               the data already has — the folds are inside it, so nothing moves.
               `label: false` because the group's name would print above the
               first fold and say nothing the fold does not. */
            {
              name: "sections",
              type: "group",
              label: false,
              fields: [
                {
                  type: "collapsible",
                  label: "1 · Opening screen",
                  admin: {
                    initCollapsed: true,
                    description:
                      "The screen the page opens on. Blank means this tape's palette above — these five are how the section is repainted WITHOUT repainting the roll everywhere else it appears.",
                  },
                  fields: [
                    {
                      name: "introBg",
                      type: "text",
                      label: "Sheet",
                      validate: hex,
                      admin: { description: "The ground the roll stands on. Blank = the palette's Sheet." },
                    },
                    {
                      name: "introWord",
                      type: "text",
                      label: "Wordmark",
                      validate: hex,
                      admin: { description: "THE and the tape's word, punched across the screen. Blank = the palette's Wordmark." },
                    },
                    {
                      name: "introTagBg",
                      type: "text",
                      label: "Chip fill",
                      validate: hex,
                      admin: { description: "Blank = the palette's Chip fill." },
                    },
                    {
                      name: "introTagInk",
                      type: "text",
                      label: "Chip text",
                      validate: hex,
                      admin: { description: "Check it against the chip fill — 4.5:1 or better. Blank = the palette's Chip text." },
                    },
                    {
                      name: "introInk",
                      type: "text",
                      label: "Body copy",
                      validate: hex,
                      admin: { description: "Blank = the palette's Body copy." },
                    },
                  ],
                },
                {
                  type: "collapsible",
                  label: "2 · Origin story",
                  admin: {
                    initCollapsed: true,
                    description: "The story, the arrow and the note in the margin. Blank means the site's own green and lime.",
                  },
                  fields: [
                    {
                      name: "originBg",
                      type: "text",
                      label: "Ground",
                      validate: hex,
                      admin: { placeholder: "#0d470c", description: "Site default #0d470c." },
                    },
                    {
                      name: "originInk",
                      type: "text",
                      label: "Everything written on it",
                      validate: hex,
                      admin: {
                        placeholder: "#b6fe00",
                        description:
                          "The story, the rule under its last word, the arrow, and the note in the margin. ONE field, because in the design they are all one colour. Site default #b6fe00.",
                      },
                    },
                  ],
                },
                {
                  type: "collapsible",
                  label: "3 · The siblings",
                  admin: {
                    initCollapsed: true,
                    description: "The three grade cards and the ground under them.",
                  },
                  fields: [
                    {
                      name: "siblingsBg",
                      type: "text",
                      label: "Ground",
                      validate: hex,
                      admin: { placeholder: "#0d470c", description: "Site default #0d470c." },
                    },
                    {
                      name: "siblingsCard",
                      type: "text",
                      label: "The cards",
                      validate: hex,
                      admin: { placeholder: "#c6fd00", description: "The three grade cards themselves. Site default #c6fd00." },
                    },
                    {
                      name: "siblingsInk",
                      type: "text",
                      label: "The name across them",
                      validate: hex,
                      admin: { placeholder: "#a8f000", description: "Site default #a8f000." },
                    },
                  ],
                },
                {
                  type: "collapsible",
                  label: "4 · Super powers",
                  admin: {
                    initCollapsed: true,
                    description:
                      "The sheet, the two words either side of it, and the cards passing between them. Two card colours because a card changes colour as it opens.",
                  },
                  fields: [
                    {
                      name: "powersBg",
                      type: "text",
                      label: "Sheet",
                      validate: hex,
                      admin: { placeholder: "#b6fe00", description: "The ground the stack of cards passes over. Site default #b6fe00." },
                    },
                    {
                      name: "powersHeading",
                      type: "text",
                      label: "SUPER POWERS",
                      validate: hex,
                      admin: {
                        placeholder: "#013900",
                        description:
                          "The two words themselves, one either side of the stack. Set on the sheet rather than on a card, which is why it is its own colour and not the ink below. Site default #013900.",
                      },
                    },
                    {
                      name: "powersCard",
                      type: "text",
                      label: "The open card",
                      validate: hex,
                      admin: { placeholder: "#0d470c", description: "The card being read, once it has filled. Site default #0d470c." },
                    },
                    {
                      name: "powersCardRest",
                      type: "text",
                      label: "A resting card",
                      validate: hex,
                      admin: {
                        placeholder: "#9bdc00",
                        description: "A card still waiting its turn. Close to the sheet on purpose: a resting card is meant to be sensed rather than found. Site default #9bdc00.",
                      },
                    },
                    {
                      name: "powersInk",
                      type: "text",
                      label: "Writing on the open card",
                      validate: hex,
                      admin: { placeholder: "#b6fe00", description: "The claim and the sentence. Site default #b6fe00." },
                    },
                  ],
                },
                {
                  type: "collapsible",
                  label: "5 · The run",
                  admin: {
                    initCollapsed: true,
                    description: "The last section before NEXT UP.",
                  },
                  fields: [
                    {
                      name: "reelBg",
                      type: "text",
                      label: "Ground",
                      validate: hex,
                      admin: { placeholder: "#b6fe00", description: "Site default #b6fe00." },
                    },
                    {
                      name: "reelInk",
                      type: "text",
                      label: "Writing",
                      validate: hex,
                      admin: { placeholder: "#013900", description: "Site default #013900." },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
