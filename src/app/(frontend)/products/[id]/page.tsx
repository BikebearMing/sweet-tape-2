import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Footer from "@/components/Footer";
import NextUp from "@/components/NextUp";
import ProductInfo from "@/components/ProductInfo";
import ProductIntro from "@/components/ProductIntro";
import ProductReel from "@/components/ProductReel";
import Siblings from "@/components/Siblings";
import { tapeOf, tapes } from "@/data/tapes";

/* A TAPE — /products/[id], the family's inner page.
 *
 * One section so far: the roll standing in its own name on its own colour (see
 * components/ProductIntro). What goes under it is still being drawn, and the
 * page is deliberately left open at the foot rather than closed with a footer
 * that would only have to be moved down again — see the note by the return.
 *
 * SIX ROUTES, ONE COMPONENT, AND NO COPY HERE. Everything a tape is already
 * lives in src/data/tapes.ts and arrives as one object — the same file the
 * slider's orbit, the row at /products and the footer's rolls all read — so a
 * seventh tape added there is a page that exists, generated, titled and linked
 * to from the row, with nothing in this folder to touch. That is the same seam
 * /news/[id] is built on and the reason this file is as short as it is.
 *
 * WHY THE SLUG IS THE TAPE'S id AND NOT ITS NAME. The ids are already the
 * artwork folders and the keys everything else in the codebase joins on, so a
 * separate slug field would be a second name per tape to keep in step with the
 * first for no reader-visible gain — /products/opp-quiet is as legible as
 * anything a slug generator would have produced from "OPP tape, low noise".
 *
 * THE PARENT IS /products AND IT IS NOT A LIST OF THESE. It is PICK YOUR
 * PLAYER — the row of six, which is the product list read at a glance — and it
 * is labelled OUR FAMILY everywhere on the site. The chip at the top of this
 * page leads back to it. See (frontend)/products/page.tsx, which is the long
 * version of the three names.
 *
 * Everything site-wide — the cover and its page transition, the smooth scroll,
 * the cursor, the masthead and the pull-down menu — is in (frontend)/layout.tsx
 * and arrives here untouched. The masthead in particular is what puts the claim
 * in the top-left corner and the badge in the middle of the screenshot this was
 * built from; neither is drawn by this page.
 */

/* Every tape, built at build time. The set is a file in the repository rather
   than a table somewhere, so there is nothing to fetch and no reason to leave
   any of them to be rendered on demand. */
export async function generateStaticParams() {
  return tapes.map((tape) => ({ id: tape.id }));
}

/* Anything NOT in that list is a 404 rather than a page rendered on the fly.
   The ids are a closed set — see generateStaticParams — so a request for one
   that is not here is a stale link or a guess, and neither should be answered
   with a page about no tape. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tape = tapeOf((await params).id);
  if (!tape) return {};

  return {
    /* THE label, not the word mark. "Masking tape — Sweet Tape" is what a
       search result and a browser tab want; THE CREATIVE is the drawing on the
       page and means nothing out of it. */
    title: `${tape.label} — Sweet Tape`,
    description: tape.copy,
  };
}

export default async function TapePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tape = tapeOf((await params).id);
  /* Belt and braces beside dynamicParams above: that setting is what stops an
     unknown id ever reaching here, and this is what happens if it does. A page
     rendered with no tape is a crash in the middle of the markup; a page
     rendered with notFound() is a 404. */
  if (!tape) notFound();

  /* AND NOW IT HAS A FOOTER. It did not for a long time, and that was a
     decision rather than an omission: the footer is the thing that ENDS a page,
     so dropping it in while the sections under the opening screen were still
     being drawn would have meant threading every one of them in above it.

     The condition that held it back is met. NEXT UP is the page's ending — the
     way out of one tape and into the next — so there is now something for the
     footer to come after, and every route in this group carries the same one.

     THE JOINS ARE ALL DRAWN AND NONE OF THEM IS THIS FILE'S BUSINESS. The
     opening section's lime sheet has a convex bottom edge and the origin section
     under it is the site's dark green; the run opens a fresh lime sheet; NEXT UP
     lays a yellow panel on it; and the footer bites its own arc up into whatever
     it lands on. Every one of those sections declares its own ground rather than
     inheriting one, so sections can be added, moved or removed here without any
     of them having to know what came before. */
  return (
    <>
      <ProductIntro tape={tape} />
      <ProductInfo tape={tape} />
      {/* The same tape in its three grades. Directly under the origin story and
          on the same dark green, with no seam between them: the two are one
          continuous surface, which is why this section declares that green
          again rather than inheriting it. See components/Siblings. */}
      <Siblings tape={tape} />
      {/* THE RUN — the tape at work, on a fresh lime sheet the page scrolls
          sideways through. It is the last section drawn so far and the one the
          page currently ends on, which is why it carries a tail of bare sheet
          at its foot; see --reel-tail in global.css, and components/ProductReel
          for the camera. */}
      <ProductReel tape={tape} />
      {/* AND THE WAY OUT. The next tape in the family, on a yellow panel across
          the foot of the page — the page's ending and its only forward link.
          Which tape is next, and the wrap that means every page has one, is
          nextTape in src/data/tapes.ts. See components/NextUp. */}
      <NextUp tape={tape} />
      <Footer />
    </>
  );
}
