import type { GlobalConfig } from "payload";

/* The pull-down menu.
 *
 * A GLOBAL, because the menu is not on a page — it is on every page. It hangs
 * off the top-right corner of the site from a tab that is reachable from
 * anywhere, so there is no document it belongs to and no route that owns it.
 *
 * ROWS, IN THE ORDER THEY HANG. The order is the array's; drag to reorder.
 * There is no `order` field to keep in step, for the same reason the home
 * page's orbit has none.
 *
 * A LABEL AND A SLUG ARE DIFFERENT WORDS, and the menu is where that is most
 * obviously true. OUR FAMILY points at /products: the family IS the products,
 * and OUR FAMILY is how the brand says it in a nav while /products is what the
 * page is called everywhere outside one — in a search result, in a pasted link,
 * in an address bar. Two fields, so neither has to be derived from the other.
 *
 * THE FOOTER'S ROW IS NOT THIS. It carries the same four destinations in a
 * DIFFERENT ORDER, which is a drawing decision rather than an oversight, so it
 * is still its own list in components/Footer. Pointing both at one record would
 * mean either losing that or adding a second order field to say it.
 */
export const Menu: GlobalConfig = {
  slug: "menu",

  admin: {
    description:
      "The pull-down menu, on every page. Rows hang in the order they are listed here — drag to reorder.",
  },

  access: { read: () => true },

  fields: [
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      maxRows: 6,
      labels: { singular: "Row", plural: "Rows" },
      admin: {
        description:
          "Six is the ceiling: the panel drops to a measured height and the rows are sized to fill it, so a seventh would either overflow the paper or shrink the rest to fit a row only one page asked for.",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          admin: {
            description:
              "What the row says. Capitals — the menu does not transform it, so what is typed is what is drawn, and it is what a screen reader announces.",
          },
        },
        {
          name: "href",
          type: "text",
          required: true,
          admin: {
            placeholder: "/about",
            description:
              "Where it goes. A path beginning with a slash for a page on this site; a full https:// address for somewhere else.",
          },
        },
        {
          name: "thumb",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "The picture that shows behind the row on hover. Optional — a row without one falls back to the shared preview, which is what most of them have always used.",
          },
        },
      ],
    },
  ],
};
