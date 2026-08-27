import type { GlobalConfig } from "payload";

/* The home page.
 *
 * ONE GLOBAL FOR ONE PAGE, the same call the contact page makes: there is one
 * home page and there will never be two, so a collection would be a list with a
 * single row in it and a standing question about what the second row means.
 *
 * WHY THE SLIDER LIVES HERE AND NOT ON THE TAPES. It used to be the tapes
 * themselves — the collection carried an `order` and a `roll` thumbnail that
 * only the home page ever read, and the orbit was however many tapes existed in
 * whatever order they were numbered. That made one collection the authority on
 * two unrelated things: what a product IS, and what the front door happens to
 * be showing this month. Adding a tape put it on the home page; taking one off
 * the home page meant editing the product.
 *
 * They are separate decisions and they are made by different people at
 * different times, so they are separate records now. The tapes describe
 * products. This describes a page.
 *
 * AND THE SLIDES CARRY THEIR OWN COPY rather than pointing at a tape, which is
 * the part worth being explicit about because it has a cost. The home page can
 * now say something the product page does not — a different photograph, a
 * shorter line, a seasonal claim — without touching the product. The cost is
 * that a tape's name written in both places is written twice, and correcting it
 * in one does not correct it in the other. That is the trade this was asked
 * for: independence, paid for in duplication.
 *
 * WHAT IS STILL IN CODE. The strip of tape the photographs are held down with
 * is picked by the slide's key out of a table in components/TapeSlider/strips
 * .ts, and stays there: two of its three figures are facts about an SVG FILE —
 * its aspect, and how much of its box is artwork rather than transparent margin
 * — and the third is a filter id. None of them is a thing a CMS would be asked
 * for. An unknown key falls back to the masking strip rather than failing.
 */

/* The words the stencils were generated for — keys of `words` in
   src/data/wordmarks.json, whose letterforms are baked into letters.css by
   `npm run letters`. A select and not a text box: this is not free text, and a
   word with no stencils behind it is a title that renders as nothing. */
const WORDMARKS = [
  "creative",
  "trusty",
  "buddy",
  "fixer",
  "reliable",
  "silent",
] as const;

export const Homepage: GlobalConfig = {
  slug: "homepage",

  admin: {
    description:
      "The home page. The tape slider's rolls are set here, in the order they orbit — independently of the Tapes collection, which describes the products themselves.",
  },

  access: { read: () => true },

  fields: [
    {
      name: "slider",
      type: "group",
      label: "Tape slider",
      fields: [
        {
          name: "subhead",
          type: "text",
          required: true,
          defaultValue: "MEET THE ONE WHO STICKS",
          admin: {
            description:
              "The line above the stage. Capitals — the page does not transform it, so what is typed is what is drawn.",
          },
        },
        {
          name: "rolls",
          type: "array",
          required: true,
          minRows: 1,
          labels: { singular: "Roll", plural: "Rolls" },
          admin: {
            description:
              "The orbit, in the order it turns. Drag to reorder; the first one is selected on load. Adding a roll here does not create a product, and removing one does not delete anything.",
          },
          fields: [
            {
              name: "key",
              type: "text",
              required: true,
              admin: {
                description:
                  "Stable id for this roll. Not shown to a reader — it identifies the slide to the engine and picks which tape the photographs are held down with (see strips.ts). Match the product's slug where there is one, so the right strip is chosen; anything unrecognised gets the masking strip.",
              },
            },
            {
              name: "label",
              type: "text",
              required: true,
              admin: {
                description:
                  "What the roll's button is called for somebody who cannot see it. The only text on this slide a screen reader announces.",
              },
            },

            {
              type: "collapsible",
              label: "Artwork",
              fields: [
                {
                  name: "thumb",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  admin: {
                    description:
                      "The roll on the orbit, drawn at 108px. Usually the card shot cropped square.",
                  },
                },
                {
                  name: "card",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  admin: { description: "Hang tag at the centre of the stage." },
                },
                {
                  name: "showcase",
                  type: "array",
                  required: true,
                  minRows: 2,
                  maxRows: 2,
                  admin: {
                    description:
                      "Exactly two. The stage places each by hand, so a third would have nowhere to go.",
                  },
                  fields: [
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      required: true,
                    },
                  ],
                },
                {
                  name: "model",
                  type: "text",
                  required: true,
                  admin: {
                    description:
                      "Path to the 3D roll under /public/assets/tapes. The slider PRELOADS these, so a wrong one breaks the home page rather than one product. Geometry rather than content, which is why it is a path and not an upload.",
                  },
                },
              ],
            },

            {
              type: "collapsible",
              label: "Copy",
              fields: [
                {
                  name: "wordmark",
                  type: "select",
                  required: true,
                  options: WORDMARKS.map((w) => ({ label: w, value: w })),
                  admin: {
                    description:
                      "Which word the bottom title spells. Its letterforms are generated per word into letters.css, so this is a fixed list rather than free text.",
                  },
                },
                {
                  name: "tags",
                  type: "array",
                  maxRows: 4,
                  admin: {
                    description:
                      "Chips beside the stage. Four is the ceiling — the tilt angles run out at five.",
                  },
                  fields: [{ name: "text", type: "text", required: true }],
                },
                {
                  name: "copy",
                  type: "textarea",
                  required: true,
                  admin: { description: "The paragraph under the chips." },
                },
              ],
            },

            {
              name: "colours",
              type: "group",
              admin: {
                description:
                  "Reaches the page as custom properties on the roll button; the stage floods from them when this roll is picked.",
              },
              fields: [
                { name: "ring", type: "text", required: true, admin: { description: "Band behind the roll when selected." } },
                { name: "bg", type: "text", required: true, admin: { description: "Colour the stage floods with." } },
                { name: "word", type: "text", required: true, admin: { description: "THE and the tape's own word." } },
                { name: "tagBg", type: "text", required: true, admin: { description: "Chip fill." } },
                { name: "tagInk", type: "text", required: true, admin: { description: "Chip text. Check it against tagBg — 4.5:1 or better." } },
                { name: "ink", type: "text", required: true, admin: { description: "Body copy beside the stage." } },
              ],
            },
          ],
        },
      ],
    },
  ],
};
