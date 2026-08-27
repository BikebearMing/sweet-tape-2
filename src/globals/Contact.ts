import type { GlobalConfig } from "payload";

/* The contact page, as the CMS holds it.
 *
 * A GLOBAL AND NOT A COLLECTION, because there is one contact page and there
 * will never be two. A collection would mean a list with a single row in it and
 * a slug nobody reads, plus the standing question of what the second row would
 * mean. A global is one document at one route, which is what this is.
 *
 * WHAT IS HERE AND WHAT IS STILL IN CODE. The words are here; the arrangement
 * is not. Which side of the sheet a block sits on, how the paper is perforated,
 * where the note is pinned — those are drawings, and a drawing does not become
 * editable by being turned into a field. What an editor can change here is
 * every string a reader can read, which is the whole of what this page says.
 *
 * THE HEADLINES ARE TWO LINES AND NOT ONE STRING. The break is set by DESIGN
 * and not by wrapping — see the note over HEADING in components/Contact — so it
 * is two fields, and an editor moves the break by moving a word rather than by
 * typing a character nothing on the page can see.
 */
export const Contact: GlobalConfig = {
  slug: "contact",

  admin: {
    description:
      "Everything /contact says. The layout is drawn in code; the words are here.",
  },

  access: { read: () => true },

  fields: [
    {
      type: "collapsible",
      label: "Headings",
      fields: [
        {
          name: "kicker",
          type: "text",
          required: true,
          defaultValue: "GET IN TOUCH",
          admin: {
            description:
              "The chip above the title. Set in capitals — the page does not transform it, so what is typed is what is drawn.",
          },
        },
        {
          name: "heading",
          type: "array",
          required: true,
          minRows: 2,
          maxRows: 2,
          labels: { singular: "Line", plural: "Lines" },
          admin: {
            description:
              "The page's h1, on the two lines the design breaks it on. Exactly two: each line is set on its own arc and a third has nowhere to go.",
          },
          fields: [{ name: "text", type: "text", required: true }],
        },
        {
          name: "sheetHeading",
          type: "array",
          required: true,
          minRows: 2,
          maxRows: 2,
          labels: { singular: "Line", plural: "Lines" },
          admin: {
            description:
              "The heading on the paper, over the form. Two lines, same as above.",
          },
          fields: [{ name: "text", type: "text", required: true }],
        },
      ],
    },

    {
      type: "collapsible",
      label: "The form",
      admin: {
        description:
          "Only the words on the fields. What each field IS — its type, and what a browser autofills into it — is fixed in code: those are a contract with the browser rather than copy, and a phone field that stopped being a phone field would break autofill and the keypad on a phone.",
      },
      fields: [
        {
          name: "fields",
          type: "array",
          required: true,
          minRows: 4,
          maxRows: 4,
          labels: { singular: "Field", plural: "Fields" },
          admin: {
            description:
              "Exactly four, in the order they are read. The grid is drawn two-by-two and a fifth would have nowhere to sit.",
          },
          fields: [
            {
              name: "key",
              type: "select",
              required: true,
              options: [
                { label: "Name", value: "name" },
                { label: "Company", value: "company" },
                { label: "Phone number", value: "phone" },
                { label: "Email", value: "email" },
              ],
              admin: {
                description:
                  "Which field this is. Picks the input's type and what the browser autofills into it — not shown to a reader.",
              },
            },
            {
              name: "label",
              type: "text",
              required: true,
              admin: {
                description:
                  "What it is called on the page, and what a screen reader announces. The design's second field was labelled NAME, the same as the first, which is almost certainly a placeholder — this is where that gets corrected.",
              },
            },
          ],
        },
        {
          name: "messageLabel",
          type: "text",
          required: true,
          defaultValue: "MESSAGE",
          admin: { description: "The big box under the four." },
        },
        {
          name: "sendLabel",
          type: "text",
          required: true,
          defaultValue: "SEND",
          admin: {
            description:
              "The tall block down the right. Short — it is set vertically and a sentence would not fit.",
          },
        },
      ],
    },

    {
      type: "collapsible",
      label: "The note",
      admin: {
        description:
          "The yellow sheet pinned across the join. What is written on it is DRAWN INTO THE PAPER rather than laid over it, so these are strings and never artwork — a number in an exported image needs a designer and a deploy to correct.",
      },
      fields: [
        {
          name: "email",
          type: "group",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: {
                description:
                  "As it is written on the note. Capitals, because that is how the note is drawn.",
              },
            },
            {
              name: "href",
              type: "text",
              required: true,
              admin: {
                description:
                  "What clicking it opens: mailto: and then the address, lower case. Separate from the line above because the note is drawn in capitals and a mailto: cannot carry them.",
              },
            },
          ],
        },
        {
          name: "phone",
          type: "group",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              admin: { description: "As it is read aloud, spaces and all." },
            },
            {
              name: "href",
              type: "text",
              required: true,
              admin: {
                description:
                  "What a phone dials: tel: and then the number with no spaces in it. A tel: href cannot carry the spaces the number is read with, which is why this is its own box.",
              },
            },
          ],
        },
        {
          name: "tape",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "The strip holding the note to the board. Optional — without it the note is simply unpinned, which is a page rather than a hole in one.",
          },
        },
      ],
    },

    {
      type: "collapsible",
      label: "Search and sharing",
      fields: [
        {
          name: "metaTitle",
          type: "text",
          required: true,
          defaultValue: "Contact — Sweet Tape",
          admin: {
            description:
              "The browser tab and the search result's blue line. Not shown on the page.",
          },
        },
        {
          name: "metaDescription",
          type: "textarea",
          required: true,
          admin: {
            description:
              "The grey line under it in a search result. A sentence, about 150 characters — longer is cut off mid-word.",
          },
        },
      ],
    },
  ],
};
