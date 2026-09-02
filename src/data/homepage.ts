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

export type { Homepage, Phrase, Slide, TapeColours } from "./homepage-types";
export { cssVars } from "./homepage-types";

/* WHAT IS SHOWN IF THE RECORD HAS NEVER BEEN SAVED. A global exists the moment
 * it is declared and holds nothing until somebody presses save, so every field
 * below is null between deploying a new one and an editor's first visit. This is
 * what the page said before it had those fields, so that window is invisible.
 * ./contact.ts argues the call at length and ./about.ts makes the same one.
 *
 * The slider is NOT in here and cannot be: an empty orbit is a real answer (see
 * getHomepage below), and six invented rolls would not be. */
const FALLBACK = {
  hero: {
    kicker: ["WE'RE", "HERE TO"],
    headline: ["STICK", "BY YOU"],
    cornerMark: ["STICK WITH YOU THROUGH", "THREE GENERATIONS"],
    cardboard:
      "DIY FAIL, MOVING DAY CHAOS, SCHOOL PROJECT EMERGENCY,LAST-MINUTES FIXES. WE ALWAYS STICK BY YOU.",
  },
  band: { head: "WHEN LIFE GETS MESSY,", tail: "SOMETHING HAS TO HOLD" },
  reasons: {
    subhead: "WHY WE EXIST",
    heading: ["WE\u2019RE HERE", "FOR THE EVERYDAY", "MOMENTS."],
    phrases: [
      { lead: "TO", word: "CREATE" },
      { lead: "TO", word: "FIX" },
      { lead: "TO", word: "PROTECT" },
    ],
  },
  stick: {
    heading: ["LET\u2019S", "MAKE IT", "STICK!"],
    sub: "For everything that matters.",
  },
};

/** A textarea, as the array of lines the design breaks by hand. Falls back
 *  whole: a headline half from each source is two lines never written together. */
function lines(raw: unknown, fallback: readonly string[]): string[] {
  const out =
    typeof raw === "string"
      ? raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : [];
  return out.length ? out : [...fallback];
}

/** Rows of `{ image }`, as the srcs the stage wants. */
function images(rows: { image: unknown }[] | null | undefined): string[] {
  return (rows ?? []).map((r) => urlOf(r.image));
}

/** One row of the orbit, as the slider has always expected a roll. */
function toSlide(
  row: NonNullable<
    NonNullable<Awaited<ReturnType<typeof fetchHomepage>>["slider"]>["rolls"]
  >[number],
): Slide {
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

async function fetchHomepage() {
  const payload = await getPayload({ config });

  /* depth 1 resolves every upload to its Media document. */
  return payload.findGlobal({ slug: "homepage", depth: 1 });
}

/** The home page, as its sections want it.
 *
 *  AN EMPTY ORBIT IS A REAL ANSWER and not an error. A global exists the moment
 *  it is declared and holds nothing until somebody saves it, so a fresh database
 *  has a home page with no rolls on it. The slider renders nothing in that case
 *  and the rest of the page is unaffected — which is a page an editor can then
 *  go and fill in, rather than a 500 they have to be talked through. */
export async function getHomepage(): Promise<Homepage> {
  const record = await fetchHomepage();
  const slider = record.slider ?? null;
  const doc = record as unknown as Record<string, unknown>;

  const phrases = (
    (doc.reasonsPanels as { lead?: string; word?: string }[]) ?? []
  )
    .filter((p) => p?.word)
    .map((p) => ({ lead: p.lead ?? "", word: p.word as string }));

  return {
    hero: {
      kicker: lines(doc.heroKicker, FALLBACK.hero.kicker),
      headline: lines(doc.heroHeadline, FALLBACK.hero.headline),
      cornerMark: lines(doc.heroCornerMark, FALLBACK.hero.cornerMark),
      cardboard: (doc.heroCardboard as string) || FALLBACK.hero.cardboard,
    },
    band: {
      head: (doc.bandHead as string) || FALLBACK.band.head,
      tail: (doc.bandTail as string) || FALLBACK.band.tail,
    },
    slider: {
      subhead: slider?.subhead || "MEET THE ONE WHO STICKS",
      rolls: (slider?.rolls ?? []).map(toSlide),
    },
    reasons: {
      subhead: (doc.reasonsSubhead as string) || FALLBACK.reasons.subhead,
      heading: lines(doc.reasonsHeading, FALLBACK.reasons.heading),
      phrases: phrases.length ? phrases : FALLBACK.reasons.phrases,
    },
    stick: {
      heading: lines(doc.stickHeading, FALLBACK.stick.heading),
      sub: (doc.stickSub as string) || FALLBACK.stick.sub,
    },
  };
}
