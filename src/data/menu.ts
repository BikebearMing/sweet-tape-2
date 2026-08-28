import { getPayload } from "payload";

import config from "@/payload.config";

import { urlOf } from "./media-url";
import type { MenuItem } from "./menu-types";

/* Sweet Tape — what is in the pull-down menu.
 *
 * THE ROWS USED TO BE A CONSTANT in components/Menu, which is a client
 * component and so could not have gone and read them itself. They are read here
 * instead, on the server, and handed down as a prop from the frontend layout —
 * which is the one place that renders the menu, and renders it on every route.
 */

export type { MenuItem } from "./menu-types";

/* The shared preview, and what a row without a picture of its own falls back
   to. Three of the four rows have always used it: their routes exist but their
   artwork does not, and one honest placeholder is better than three copies of
   a picture that is not of the thing it sits behind. */
const FALLBACK_THUMB = "/assets/mask-image-1.jpg";

/* WHAT IS SHOWN IF THE RECORD HAS NEVER BEEN SAVED — exactly what the menu said
 * before it had one.
 *
 * A global exists the moment it is declared and holds nothing until somebody
 * opens it and presses save, so between deploying this and an editor's first
 * visit every row would be missing. The menu is on EVERY page, so that is not a
 * blank section on one route — it is a site with no navigation. Falling back
 * makes the window invisible.
 *
 * `required: true` does not do this job: it is enforced when the document is
 * SAVED, not when it is read, and an unsaved global is an absence rather than a
 * validation error.
 */
const FALLBACK: MenuItem[] = [
  { label: "ABOUT", href: "/about", thumb: FALLBACK_THUMB },
  /* OUR FAMILY is the one row whose label and slug are different words, and the
     only one carrying a preview of its own — the shot of all six rolls the
     closing key visual uses. See the note in src/globals/Menu.ts. */
  { label: "OUR FAMILY", href: "/products", thumb: "/assets/make-it-stick.jpg" },
  { label: "NEWS", href: "/news", thumb: FALLBACK_THUMB },
  { label: "CONTACT", href: "/contact", thumb: FALLBACK_THUMB },
];

/** The menu's rows, in the order they hang. */
export async function getMenu(): Promise<MenuItem[]> {
  const payload = await getPayload({ config });

  /* depth 1 resolves each row's picture to its Media document. */
  const doc = await payload.findGlobal({ slug: "menu", depth: 1 });

  const rows = (doc.items ?? [])
    .filter((r) => r.label && r.href)
    .map((r) => ({
      label: r.label,
      href: r.href,
      thumb: urlOf(r.thumb) || FALLBACK_THUMB,
    }));

  return rows.length ? rows : FALLBACK;
}
