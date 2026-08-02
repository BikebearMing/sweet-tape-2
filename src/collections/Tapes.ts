import type { CollectionConfig } from "payload";

/* The tapes, as the CMS will eventually hold them.
 *
 * NOTHING READS THIS YET. The front end runs off src/data/tapes.ts; this is the
 * schema that file will be swapped for, kept deliberately field-for-field
 * identical to the Tape type so the swap is a query and a mapper, not a
 * redesign.
 *
 * Artwork is `text` (a path under /public/assets) rather than an upload
 * relationship on purpose — the brief is local files for now. Changing these
 * four fields to `upload` later is the one migration this collection needs.
 */
export const Tapes: CollectionConfig = {
  slug: "tapes",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "order", "updatedAt"],
    description:
      "Not yet live. The site reads src/data/tapes.ts until this is wired up.",
  },
  access: { read: () => true },
  defaultSort: "order",
  fields: [
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description:
          "Position on the orbit, low to high. The first one is selected on load.",
      },
    },
    {
      name: "label",
      type: "text",
      required: true,
      admin: { description: "Screen-reader name for the roll button." },
    },
    {
      type: "collapsible",
      label: "Artwork",
      fields: [
        {
          name: "roll",
          type: "text",
          required: true,
          admin: { description: "Thumbnail on the orbit, e.g. /assets/rolling/roll-mask.png" },
        },
        {
          name: "card",
          type: "text",
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
              "Exactly two. The layout places each by hand, so a third would have nowhere to go.",
          },
          fields: [{ name: "src", type: "text", required: true }],
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
      ],
    },
    {
      type: "collapsible",
      label: "Palette",
      admin: {
        description:
          "Reaches the page as custom properties on the roll button; the animation reads them from there.",
      },
      fields: [
        { name: "ring", type: "text", required: true, admin: { description: "Band behind the roll when selected." } },
        { name: "bg", type: "text", required: true, admin: { description: "Colour the stage floods with." } },
        { name: "word", type: "text", required: true, admin: { description: "THE and CREATIVE." } },
        { name: "tagBg", type: "text", required: true, admin: { description: "Chip fill." } },
        { name: "tagInk", type: "text", required: true, admin: { description: "Chip text. Check it against tagBg — 4.5:1 or better." } },
        { name: "ink", type: "text", required: true, admin: { description: "Body copy in the left column." } },
      ],
    },
  ],
};
