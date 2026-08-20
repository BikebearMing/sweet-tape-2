import type { Metadata } from "next";

import AboutOpen from "@/components/AboutOpen";
import WeWanted from "@/components/WeWanted";
import Reimagine from "@/components/Reimagine";

/* ABOUT — the brand's own page.
 *
 * Three sections so far. The first is a screen of dark green with nothing on
 * it, holding the place the page's opening statement will take (components/
 * AboutOpen, which argues why it is empty rather than filled with dummy type).
 * The second is WE WANTED TO BE. — the sentence bent round a wave and crawled
 * in from the right while four boxes pop up under it. The third turns the page
 * over: a lime screen with a ball of paper in the middle of it, which opens as
 * you arrive and has the statement written across it.
 *
 * NO FOOTER YET, and that is a decision rather than an oversight. /contact
 * closes with one because a contact page ENDS at the form; this page does not
 * end here — the origin story, the people and the sign-off are still to come —
 * and a footer parked under the second section would be the page claiming to be
 * finished. /products/[id] is open at the foot for exactly this reason. Add it
 * when the last section lands.
 *
 * THE MENU HAS LINKED HERE ALL ALONG. /about is one of the four routes in the
 * pull-down and in the footer's row, and until now it was the only one of them
 * that 404'd. Nothing in either list changes — the link was already correct.
 *
 * Everything site-wide — the cover and its page transition, the smooth scroll,
 * the cursor, the masthead and the pull-down menu — is in (frontend)/layout.tsx
 * and arrives here untouched. The masthead is the one that needs anything from
 * the page: it is dark green ink by default and this page is a dark green sheet,
 * so the About block in global.css turns it lime for the length of the route.
 */
export const metadata: Metadata = {
  title: "About — Sweet Tape",
  description:
    "Three generations of tape. We wanted to be clearer, easier to choose, recognisable, and more human.",
};

export default function AboutPage() {
  return (
    <>
      <AboutOpen />
      <WeWanted />
      <Reimagine />
    </>
  );
}
