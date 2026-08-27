import type { Metadata } from "next";

import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { getContact } from "@/data/contact";

/* LET'S STICK TOGETHER — /contact.
 *
 * One section and the footer, which is the whole page: the lime sheet with the
 * line across the top of it, the cream paper carrying the form, and the sticky
 * note pinned across the join. See components/Contact, which argues the
 * arrangement.
 *
 * THE FOOTER IS HERE AND NOT DEFERRED, unlike /products/[id]'s. That page is
 * open at the foot because sections are still to be added under it; this one is
 * finished — a contact page ends at the contact form — so it is closed properly
 * and the footer's arc rises into the paper from below. The section pays the
 * toll for that arc itself (--contact-arc), the same way the row at /products
 * and the closing key visual do.
 *
 * Everything site-wide — the cover and its page transition, the smooth scroll,
 * the cursor, the masthead and the pull-down menu — is in (frontend)/layout.tsx
 * and arrives here untouched. In particular the masthead is what puts the claim
 * in the top-left corner and the badge in the middle of the design this was
 * built from, and the menu is what puts the tab in the right; neither is drawn
 * by this page, and the section's top padding is measured to clear both.
 *
 * THE MENU HAS LINKED HERE ALL ALONG. /contact is one of the four routes in the
 * pull-down and in the footer's row, and until now it was the only one of them
 * that 404'd. Nothing in either list changes — the link was already correct.
 */

/* THE TAB AND THE SEARCH RESULT come off the same record the page does — a
   function rather than a constant, because it is read at request time now.
   Next calls this and the component separately, so the global is fetched twice
   per request; both hit the same connection pool for one small row, which is
   cheaper than threading a cache through two entry points that do not otherwise
   know about each other. */
export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getContact();
  return { title: meta.title, description: meta.description };
}

export default function ContactPage() {
  return (
    <>
      <Contact />
      <Footer />
    </>
  );
}
