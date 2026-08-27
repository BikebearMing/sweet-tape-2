import { getPayload } from "payload";

import config from "@/payload.config";

import { urlOf } from "./media-url";
import type { Homepage, Slide, TapeColours } from "./homepage-types";

/* Sweet Tape — what the home page is showing.
 *
 * THE SLIDER USED TO BE THE TAPES THEMSELVES, and this file is where that stops
 * being true. src/data/tapes.ts still answers "what is this product", on every
 * route that asks; this answers "what is the front door showing", which turned
 * out to be a different question with a different editor and a different
 * schedule. See src/globals/Homepage.ts, which argues the separation.
 *
 * EACH SLIDE CARRIES ITS OWN COPY. Nothing here reads a tape, and that is the
 * point rather than an oversight: the home page can show a photograph, a claim
 * or a shorter line the product page does not, and changing one does not change
 * the other. The cost is that a name written in both places is written twice.
 *
 * THE TYPES AND cssVars MOVED, to ./homepage-types, for the reason every one of
 * these files splits: this module imports the Payload config and drags the
 * Postgres adapter with it, and the slider's engine is a client component.
 */

export type { Homepage, Slide, TapeColours } from "./homepage-types";
export { cssVars } from "./homepage-types";

/** Rows of `{ image }`, as the srcs the stage wants. */
function images(rows: { image: unknown }[] | null | undefined): string[] {
  return (rows ?? []).map((r) => urlOf(r.image));
}

/** One row of the orbit, as the slider has always expected a roll. */
function toSlide(row: NonNullable<
  Awaited<ReturnType<typeof fetchSlider>>
>["rolls"][number]): Slide {
  return {
    id: row.key,
    label: row.label,
    thumb: urlOf(row.thumb),
    card: urlOf(row.card),
    showcase: images(row.showcase) as [string, string],
    model: row.model,
    word: row.wordmark,
    tags: (row.tags ?? []).map((t) => t.text),
    copy: row.copy,
    colours: row.colours as TapeColours,
  };
}

async function fetchSlider() {
  const payload = await getPayload({ config });

  /* depth 1 resolves every upload to its Media document. */
  const doc = await payload.findGlobal({ slug: "homepage", depth: 1 });
  return doc.slider ?? null;
}

/** The home page, as its sections want it.
 *
 *  AN EMPTY ORBIT IS A REAL ANSWER and not an error. A global exists the moment
 *  it is declared and holds nothing until somebody saves it, so a fresh database
 *  has a home page with no rolls on it. The slider renders nothing in that case
 *  and the rest of the page is unaffected — which is a page an editor can then
 *  go and fill in, rather than a 500 they have to be talked through. */
export async function getHomepage(): Promise<Homepage> {
  const slider = await fetchSlider();

  return {
    slider: {
      subhead: slider?.subhead || "MEET THE ONE WHO STICKS",
      rolls: (slider?.rolls ?? []).map(toSlide),
    },
  };
}
