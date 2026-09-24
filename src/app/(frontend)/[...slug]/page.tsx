import { notFound } from "next/navigation";

/* THE ONLY REASON THE 404 HAS THE SITE ON IT.
 *
 * Next resolves an unmatched URL against the app directory, and an unmatched URL
 * belongs to no route group — so it never enters (frontend) and never finds
 * (frontend)/not-found.tsx. The built-in bare page is what shows instead: no
 * stylesheet, no cover, no menu, no footer. The alternative is app/not-found.tsx
 * at the root, which does catch those URLs and is rendered with no layout at all
 * (there is no root layout here — the two groups each carry their own), so the
 * page would have to re-mount the entire shell by hand and keep it in step.
 *
 * This route is the way round it. A catch-all under (frontend) means every
 * unmatched path DOES enter the group, and notFound() on the first line hands it
 * straight to the sibling not-found.tsx — which is then rendered inside the
 * frontend layout, with the cover, the masthead, the menu and the cursor on it,
 * exactly like any other page.
 *
 * IT SHADOWS NOTHING. Next matches the more specific segment first, so /admin
 * and everything under it still resolve to (payload)/admin/[[...segments]],
 * /api/* to the payload routes, and /sitemap.xml, /robots.txt and the icons to
 * the metadata files at the app root. Verified against all of them; a new route
 * added anywhere above this in specificity keeps winning without this file being
 * touched.
 */
export default function CatchAll() {
  notFound();
}
