import type { Metadata } from "next";

import Footer from "@/components/Footer";
import NotFound from "@/components/NotFound";

/* THE 404 — one title card and the footer.
 *
 * TWO DOORS LEAD HERE. notFound() thrown from /products/[id] and /news/[id] when
 * the id is not a record, and any URL the site has no route for at all — the
 * second of those only because of [...slug]/page.tsx beside this file, which is
 * the one non-obvious thing about this page and is argued there.
 *
 * THE FOOTER IS HERE AND NOT DEFERRED, the same call /contact makes: a page that
 * says "there is nothing here" is finished by definition, so it is closed
 * properly and the footer's arc bites up into the lime. The section pays the
 * toll for that bite itself — see .not-found in global.css. It is also what
 * makes this page useful rather than merely apologetic: the four routes and the
 * social row are the way out, beside the link to the home page above them.
 *
 * Everything site-wide — the cover, the smooth scroll, the cursor, the masthead
 * and the pull-down menu — is in (frontend)/layout.tsx and arrives here
 * untouched.
 */
export const metadata: Metadata = {
  title: "Page not found — SweetTape",
  description: "This page came unstuck. Let's get you back to SweetTape.",
  /* A dead URL has nothing worth indexing and no canonical to point at. Next
     serves this with a 404 status, which is the real signal; this is the belt
     to that's braces, and it costs one line. */
  robots: { index: false, follow: true },
};

export default function NotFoundPage() {
  return (
    <>
      <NotFound />
      <Footer />
    </>
  );
}
