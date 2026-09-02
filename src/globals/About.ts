import type { GlobalConfig } from "payload";

/* The about page.
 *
 * ONE GLOBAL FOR ONE PAGE, the call Contact and Homepage both make: there is one
 * /about and there will never be two, so a collection would be a list with a
 * single row in it and a standing question about what the second row means.
 *
 * TABS AND NOT SIX COLLAPSIBLES, and the six are the six sections of the page in
 * the order a reader meets them. A collapsible is a fold in one long column —
 * fine for four fields, and this page has sixty. Tabs give the editor the same
 * mental model the page has: pick the section you are changing and everything
 * else is out of the way.
 *
 * WHAT IS HERE AND WHAT IS STILL IN CODE. The words and the belt's photographs
 * are here; the arrangement is not. Where a pill sits, how deep the curtain
 * falls, what the sheet of paper does when it opens — those are drawings, and a
 * drawing does not become editable by being turned into a field. Contact's own
 * header makes the same argument at length.
 *
 * LINES ARE A TEXTAREA AND NOT AN ARRAY OF ROWS. Every headline on this site is
 * stored as the lines the design breaks it on rather than as one string the
 * browser wraps (see any of the components), and an editor moving a break should
 * be pressing Return rather than dragging a row. One field, one blank line per
 * turn, and ./..data/about.ts splits it.
 */

/** A textarea whose newlines are the design's own line breaks. */
const lines = (
  name: string,
  label: string,
  defaultValue: string,
  description: string,
) =>
  ({
    name,
    type: "textarea" as const,
    label,
    defaultValue,
    admin: {
      description: `${description} One line per row — the breaks are the drawing, so what is typed is what is drawn.`,
    },
  }) as const;

/* THE BELT AS THE DESIGN DRAWS IT — three rows, and the travel each one is
   parked at and runs to. It is here as the array's defaultValue rather than
   only in the front end's fallback so that a first save writes the real page
   into the record: an editor's job on this tab is to drop photographs into
   pills that already exist, not to key in a comp. The photo pills carry no
   image, which is the belt as it stands — shapes until the pictures land. */
const BELT = [
  {
    from: -87.1,
    to: -163.1,
    items: [
      { kind: "photo", size: "xl", fit: "full" },
      { kind: "photo", size: "med", fit: "full" },
      { kind: "photo", size: "sm", fit: "full" },
      { kind: "claim", size: "med", index: "01", lines: "ROWS OF\nPRODUCTS." },
      { kind: "photo", size: "xl", fit: "full" },
    ],
  },
  {
    from: -402.3,
    to: -284.8,
    items: [
      { kind: "photo", size: "sm", fit: "full" },
      {
        kind: "claim",
        size: "xxl",
        index: "02",
        lines: "ENDLESS CHOICES THAT\nSOMEHOW ALL BLUR TOGETHER.",
      },
      { kind: "photo", size: "med", fit: "full" },
      { kind: "mark" },
      {
        kind: "roll",
        size: "xl",
        lines: "same material.\nsame roll.\nsame routine.",
      },
    ],
  },
  {
    from: -80.1,
    to: -155.1,
    items: [
      { kind: "photo", size: "xl", fit: "full" },
      {
        kind: "note",
        size: "med",
        lines: "Very few stood out.\nEven fewer felt memorable.",
      },
      { kind: "photo", size: "med", fit: "full" },
      { kind: "photo", size: "sm", fit: "full" },
      {
        kind: "claim",
        size: "med",
        index: "03",
        lines: "SAME PLAIN\nPACKAGING.",
      },
    ],
  },
];

export const About: GlobalConfig = {
  slug: "about",

  admin: {
    description:
      "Everything /about says, section by section. The layout is drawn in code; the words and the belt's photographs are here.",
  },

  access: { read: () => true },

  fields: [
    {
      type: "tabs",
      tabs: [
        /* ------------------------------------------------------------------ */
        {
          label: "Opening",
          description:
            "The first screen — THREE GENERATION, and the note on it.",
          fields: [
            lines(
              "headline",
              "Headline",
              "THREE\nGENERATION",
              "The statement, set on an arc.",
            ),
            lines(
              "kicker",
              "Kicker",
              "ONE SHARED\nBELIEF",
              "The line under it. Exactly two rows — the roll comes up through the gap between them.",
            ),
            lines(
              "note",
              "Hand-written note",
              "we’ve believed that\neven the simplest\nproducts deserve\nthoughtful design.",
              "Written by pen as the screen arrives. Sentence case: this one is handwriting, not display type.",
            ),
          ],
        },

        /* ------------------------------------------------------------------ */
        {
          label: "Belt",
          description:
            "The three rows of pills that run past the window. Document order is left-to-right order.",
          fields: [
            {
              name: "belt",
              type: "array",
              label: "Rows",
              labels: { singular: "Row", plural: "Rows" },
              maxRows: 3,
              /* THE BELT AS IT IS DRAWN, so an editor opening this tab is
                 handed the design and swaps pictures into it rather than being
                 handed nothing and asked to rebuild three rows of pills from a
                 comp. An array's defaultValue is written once, when the record
                 is first saved, and is never seen again after that. It is the
                 same list ../data/about.ts falls back to and the two have to
                 agree — that one is what an UNSAVED record shows, this is what
                 a first save writes. */
              defaultValue: BELT,
              admin: {
                description:
                  "Three rows, top to bottom. The middle one is the one that carries the mark, and where it stops is what leaves the mark alone in the window.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "from",
                      type: "number",
                      required: true,
                      admin: {
                        width: "50%",
                        description:
                          "Where the row is parked, in vw of its own left edge. Negative is left. This is also the pose the page rests on with no script.",
                      },
                    },
                    {
                      name: "to",
                      type: "number",
                      required: true,
                      admin: {
                        width: "50%",
                        description:
                          "Where it has travelled to by the end of the section. The difference is the travel — re-tune both if you add or remove pills.",
                      },
                    },
                  ],
                },
                {
                  name: "items",
                  type: "array",
                  label: "Pills",
                  labels: { singular: "Pill", plural: "Pills" },
                  admin: {
                    description:
                      "Left to right. Drag to reorder; the row is printed three times over so it never runs out of belt.",
                  },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          name: "kind",
                          type: "select",
                          required: true,
                          defaultValue: "photo",
                          options: [
                            { label: "Photograph", value: "photo" },
                            {
                              label: "Claim (numbered heading)",
                              value: "claim",
                            },
                            { label: "Note (small copy)", value: "note" },
                            {
                              label: "Roll (hand-written aside)",
                              value: "roll",
                            },
                            { label: "Mark (the silhouette)", value: "mark" },
                          ],
                          admin: { width: "50%" },
                        },
                        {
                          name: "size",
                          type: "select",
                          defaultValue: "med",
                          options: [
                            { label: "Small (a circle)", value: "sm" },
                            { label: "Medium", value: "med" },
                            { label: "Large", value: "xl" },
                            { label: "Extra large", value: "xxl" },
                          ],
                          admin: {
                            width: "50%",
                            condition: (_, s) => s?.kind !== "mark",
                            description:
                              "How long the pill is. The height never changes.",
                          },
                        },
                      ],
                    },
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      admin: {
                        condition: (_, s) => s?.kind === "photo",
                        description:
                          "Left empty the pill is drawn as a plain shape, which is what the belt does until the photographs land.",
                      },
                    },
                    {
                      name: "fit",
                      type: "select",
                      defaultValue: "full",
                      options: [
                        {
                          label:
                            "Full — fills the pill and is cut to its shape",
                          value: "full",
                        },
                        {
                          label:
                            "Inset — sits in the middle with room round it",
                          value: "inset",
                        },
                      ],
                      admin: {
                        condition: (_, s) => s?.kind === "photo",
                        description:
                          "Full crops the picture to the stadium. Inset keeps the whole picture and leaves the pill's green showing at the sides.",
                      },
                    },
                    {
                      name: "alt",
                      type: "text",
                      admin: {
                        condition: (_, s) => s?.kind === "photo",
                        description:
                          "What the photograph shows, for a reader who cannot see it. Leave empty if it says nothing the page does not.",
                      },
                    },
                    {
                      name: "index",
                      type: "text",
                      admin: {
                        condition: (_, s) => s?.kind === "claim",
                        description:
                          "The number beside the heading — 01, 02, 03.",
                      },
                    },
                    {
                      name: "lines",
                      type: "textarea",
                      admin: {
                        condition: (_, s) =>
                          s?.kind === "claim" ||
                          s?.kind === "note" ||
                          s?.kind === "roll",
                        description:
                          "One line per row — the breaks are the drawing. A claim and a note take two; the roll's aside takes three.",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },

        /* ------------------------------------------------------------------ */
        {
          label: "Reason",
          description:
            "THAT'S WHY SWEET TAPE EXISTS. — the screen the curtain falls on.",
          fields: [
            {
              name: "reasonKicker",
              type: "text",
              label: "Kicker",
              defaultValue: "MADE FOR A REASON",
              admin: {
                description:
                  "The chip over the title. Capitals — the page does not transform it.",
              },
            },
            lines(
              "reasonTop",
              "First line",
              "THAT'S\nWHY",
              "Exactly two words: the line is set as two boxes.",
            ),
            lines(
              "reasonMiddle",
              "Second line",
              "SWEET\nTAPE",
              "Exactly two words. The mark drops into the gap between them, so neither can carry both.",
            ),
            {
              name: "reasonBottom",
              type: "text",
              label: "Third line",
              defaultValue: "EXISTS.",
              admin: { description: "One word, and it closes the sentence." },
            },
            lines(
              "reasonMark",
              "Words inside the mark",
              "GOOD\nTHINGS\nSTICK",
              "Three rows — they are set inside a blob whose shape they have to fit.",
            ),
          ],
        },

        /* ------------------------------------------------------------------ */
        {
          label: "Statement",
          description:
            "TO REIMAGINE AN EVERYDAY ESSENTIAL — the sentence written on the sheet of paper.",
          fields: [
            {
              name: "statement",
              type: "textarea",
              label: "The statement",
              defaultValue:
                "TO REIMAGINE / AN\nEVERYDAY / ESSENTIAL AS /\nSOMETHING | / MORE /\nTHOUGHTFUL, / EXPRESSIVE\nAND / FULL OF HEART.",
              admin: {
                description:
                  "One row per line at desktop width. Two markers, both of which are part of the drawing: a pipe (|) is the hole the strip of tape lies in, and a slash (/) is where the phone turns the line. Neither is read out.",
              },
            },
          ],
        },

        /* ------------------------------------------------------------------ */
        {
          label: "We wanted",
          description:
            "WE WANTED TO BE. — the sentence on the wave, and the four claims.",
          fields: [
            {
              name: "wantedSentence",
              type: "text",
              label: "The sentence",
              defaultValue: "WE WANTED TO BE.",
              admin: {
                description:
                  "Bent round the wave and crawled in from the right. One line — the curve is what breaks it.",
              },
            },
            {
              name: "wantedBoxes",
              type: "array",
              label: "Claims",
              labels: { singular: "Claim", plural: "Claims" },
              maxRows: 4,
              /* The four the design named — see BELT above for why an array on
                 this page carries one. */
              defaultValue: [
                {
                  key: "clearer",
                  num: "01",
                  mark: "strip",
                  y: 45,
                  label: "CLEARER",
                },
                {
                  key: "choose",
                  num: "02",
                  mark: "parcel",
                  y: 4.5,
                  label: "EASY TO\nCHOOSE",
                },
                {
                  key: "recognisable",
                  num: "03",
                  mark: "roll",
                  y: 57.5,
                  label: "RECOGNISABLE",
                },
                {
                  key: "human",
                  num: "04",
                  mark: "person",
                  y: 24.5,
                  label: "MORE\nHUMAN",
                },
              ],
              admin: {
                description:
                  "Four boxes at a fixed pitch. Their horizontal place is their place in this list; only the drop is set by hand.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "key",
                      type: "select",
                      required: true,
                      defaultValue: "clearer",
                      options: [
                        "clearer",
                        "choose",
                        "recognisable",
                        "human",
                      ].map((v) => ({ label: v, value: v })),
                      admin: {
                        width: "25%",
                        description:
                          "Which of the four palettes this box is printed in. A fixed list and not free text: the colours are four rules in the stylesheet keyed on this, and a name with nothing behind it is a box with no colour.",
                      },
                    },
                    {
                      name: "num",
                      type: "text",
                      required: true,
                      admin: {
                        width: "25%",
                        description: "Printed on the ceiling — 01.",
                      },
                    },
                    {
                      name: "mark",
                      type: "select",
                      required: true,
                      defaultValue: "strip",
                      options: ["strip", "parcel", "roll", "person"].map(
                        (v) => ({
                          label: v,
                          value: v,
                        }),
                      ),
                      admin: {
                        width: "25%",
                        description: "The drawing inside the box.",
                      },
                    },
                    {
                      name: "y",
                      type: "number",
                      required: true,
                      admin: {
                        width: "25%",
                        description:
                          "How far down the screen the box sits, in vh. The scatter is the whole reason the four do not read as a row.",
                      },
                    },
                  ],
                },
                lines(
                  "label",
                  "Claim",
                  "CLEARER",
                  "The words across the floor of the box.",
                ),
              ],
            },
          ],
        },

        /* ------------------------------------------------------------------ */
        {
          label: "Call to action",
          description: "The way out — the last screen on the page.",
          fields: [
            {
              name: "ctaKicker",
              type: "text",
              label: "Kicker",
              defaultValue: "We believe the world is better with",
              admin: {
                description: "Sentence case — it runs into the headline.",
              },
            },
            lines(
              "ctaHeadline",
              "Headline",
              "MORE COLOUR,\nMORE HEART, AND\nYES — BETTER TAPE.",
              "Three rows at the design width.",
            ),
            {
              type: "row",
              fields: [
                {
                  name: "ctaLabel",
                  type: "text",
                  label: "Button",
                  defaultValue: "UNROLL THE STORY",
                  admin: { width: "50%" },
                },
                {
                  name: "ctaHref",
                  type: "text",
                  label: "Button link",
                  defaultValue: "/products",
                  admin: {
                    width: "50%",
                    description:
                      "A path on this site, or a full URL to leave it.",
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
