import type { Metadata } from "next";

import PickYourPlayer from "@/components/PickYourPlayer";
import Footer from "@/components/Footer";

/* OUR FAMILY — the product page.
 *
 * One section and the footer. PICK YOUR PLAYER is the whole of the page above
 * the sign-off — the six rolls read across in a row, which is the product list
 * — and the footer closes it the way it closes the home page.
 *
 * THE LABEL AND THE SLUG DO NOT MATCH, and that is on purpose rather than a
 * leftover. The family IS the products — there is one page, not two — but the
 * two names are doing different jobs: OUR FAMILY is how the brand says it, and
 * is what every link on the site reads, while /products is what the word for
 * this page is everywhere OUTSIDE it. A slug is read by search engines, pasted
 * into messages and typed into address bars by people who have never seen the
 * nav, and none of them are looking for a family.
 *
 * So there is nothing at /our-family. Both links that lead here — the menu's
 * row and the footer's — point at this slug under that label, and they are the
 * only two places it is written.
 *
 * Everything site-wide — the preloader, the smooth scroll, the cursor and the
 * pull-down menu — is in (frontend)/layout.tsx and arrives here untouched.
 */
export const metadata: Metadata = {
  title: "Our Family — Sweet Tape",
  description: "Six tapes, one for every job. Pick your player.",
};

export default function Products() {
  return (
    <>
      <PickYourPlayer />
      <Footer />
    </>
  );
}
