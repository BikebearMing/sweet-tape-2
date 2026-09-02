import type { Metadata } from "next";

import AboutCta from "@/components/AboutCta";
import AboutOpen from "@/components/AboutOpen";
import Conveyor from "@/components/Conveyor";
import Footer from "@/components/Footer";
import Reason from "@/components/Reason";
import WeWanted from "@/components/WeWanted";
import Reimagine from "@/components/Reimagine";

/* ABOUT — the brand's own page.
 *
 * Six sections so far. The first is a screen of dark green with nothing on
 * it, holding the place the page's opening statement will take (components/
 * AboutOpen, which argues why it is empty rather than filled with dummy type).
 * The second is THE BELT — three rows of pills carrying photographs of a shelf
 * past the window, with the problem written across three of them, ending with
 * the brand's own mark grown until it is the whole screen. The third is THAT'S
 * WHY SWEET TAPE EXISTS. — the answer, which arrives behind a sheet of lime
 * falling over that green on one wide arc, with the roll standing in front of
 * its own name. The fourth is a lime screen with a ball of paper in the middle
 * of it, which opens as you arrive and has the statement written across it. The
 * fifth is WE WANTED TO BE. — the sentence bent round a wave and crawled in from
 * the right while four boxes pop up under it. The sixth is the way out — MORE
 * COLOUR, MORE HEART, AND YES — BETTER TAPE. over a green curtain, with a pill
 * under it and the tapes standing in a crate at the foot of the screen
 * (components/AboutCta).
 *
 * THE ORDER IS AN ARGUMENT: the aisle, the answer to it, what the answer was
 * FOR, what we wanted to be while we did it — and then the door out, which can
 * only be last because it is the only thing on the page that asks the reader to
 * leave it. The belt goes directly
 * under the opening screen because it is the same dark green sheet, and because
 * the complaint has to be made before anything answers it.
 *
 * AND THE THIRD AND FOURTH ARE ONE SENTENCE ON ONE SHEET OF LIME. Read them in
 * order: THAT'S WHY SWEET TAPE EXISTS. — TO REIMAGINE AN EVERYDAY ESSENTIAL AS
 * SOMETHING MORE THOUGHTFUL, EXPRESSIVE AND FULL OF HEART. That is one line of
 * copy broken over two screens with the roll standing in the middle of it, and
 * the ground under it never changes: the curtain falls lime, and what comes up
 * behind it as the curtain's own screen rides out of the window is the paper
 * section's lime. The dark green pinned section between them would have closed a
 * curtain that had just been opened, and cut a sentence in half to do it.
 *
 * THREE OF THE FIVE HOLD THE SCREEN, AND THEY DO IT IN A ROW ON PURPOSE. The
 * belt is pinned while the mark grows, the paper section is pinned while the
 * sheet opens, and WE WANTED TO BE. is pinned while the sentence crawls. Between
 * the first two is the curtain, which is not pinned at all — it is POSITIONED by
 * the belt's pin, lifted back over it by a negative margin, and it plays as the
 * page moves. So the page reads hold, release, hold, release, hold rather than
 * three stops in a row, and the one section in the middle that lets the reader
 * scroll freely is what makes the two either side of it feel like beats instead
 * of like a page that keeps sticking.
 *
 * AND THE GREEN COMES BACK UNDER THE PAPER ITSELF. The lime does not run to the
 * bottom of the paper section and stop at a boundary — it stops HALFWAY DOWN THE
 * SHEET, so the paper lies across the join with its top half on lime and its
 * bottom half on the page's dark green (see --rei-split in global.css). So WE
 * WANTED TO BE. does not introduce a colour; it arrives on one that has been
 * running since the middle of the section above it, and the page closes on the
 * green it opened with. The lime is a sheet laid over the page for two sections
 * and then taken away again, which is what a curtain is.
 *
 * AND THE THIRD SECTION IS NOT WHERE IT LOOKS. It is written here, after the
 * belt, and it is DRAWN two screens further up: the curtain has to come down
 * over the belt's held mark rather than after it, so components/Reason is lifted
 * back over the section above it by a negative margin. The two are an
 * appointment — see .reason's margin-top in global.css and RUN.HOLD in
 * Conveyor/belt.ts, which are the two ends of it. Nothing between them in this
 * list can be reordered without re-counting both.
 *
 * AND IT CLOSES WITH THE FOOTER, which it did not for one round. The note that
 * stood here argued the opposite: the origin story, the people and the sign-off
 * were still to come, and a footer parked under the last of them would be the
 * page claiming to be finished. That was true of a page that ended on a section
 * nobody could get out of — it is not true of one that ends on the way out, and
 * the cost of leaving it off is a route with no nav at the bottom of it, which
 * every other page on this site has. The call to action is not a substitute for
 * that nav: it offers ONE door, and the footer's row is the rest of the site.
 *
 * A section added later goes ABOVE the call to action and above this, which is
 * the same order every other route already keeps.
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
      <Conveyor />
      <Reason />
      <Reimagine />
      <WeWanted />
      <AboutCta />
      <Footer />
    </>
  );
}
