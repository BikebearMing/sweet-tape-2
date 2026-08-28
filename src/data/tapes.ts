import { getPayload } from "payload";

import config from "@/payload.config";
import type { Tape as TapeDoc } from "@/payload-types";

import { urlOf } from "./media-url";
import type { Tape, TapeColours, Power, MarkFile } from "./tape-types";

/* Sweet Tape — the six rolls.
 *
 * THE SEAM, NOW PLUGGED IN. This file used to hold the tapes themselves and said
 * the CMS would arrive here; it has. What it holds now is the same Tape shape
 * over a Payload query, so every component that drew a roll still asks this file
 * for it and still gets what it got before.
 *
 * THE TYPES AND THE PURE HELPERS MOVED, to ./tape-types. This module imports the
 * Payload config, which drags the Postgres adapter with it — fatal in a client
 * component, and components/Preloader is one. Anything that does not need the
 * database lives over there and is importable from anywhere. Re-exported below
 * so that a server component can carry on importing everything from "@/data/tapes"
 * as it always has.
 *
 * ARTWORK IS A MEDIA RECORD NOW, and this is where that stops being visible.
 * Every picture field comes back as an uploaded document; urlOf (./media-url)
 * turns one into the string the components have always been handed, stamped
 * with the record's updatedAt so replacing a file busts every cache of it.
 * Nothing downstream knows any of that happened — which was the point of the
 * shape.
 */

export type { Tape, TapeColours, Power, SectionColours } from "./tape-types";
export {
  heroOf,
  siblingFacesOf,
  cssVars,
  /* The per-section overrides, one helper per section. Each returns only the
     custom properties this tape actually set, so an untouched tape passes an
     empty object and the stylesheet's own colours stand. */
  originVars,
  siblingsVars,
  powersVars,
  reelVars,
} from "./tape-types";

/* WHY THE WHOLE COLLECTION, EVERY TIME. Six rolls is one small query and the
   database is in the same datacentre as the server. The orbit needs all of them,
   the row at /products needs all of them, and NEXT UP needs to know what follows
   this one — which is a question about the list, not about a tape. Anything
   cleverer would be a cache to invalidate in exchange for nothing. */
async function fetchAll(): Promise<Tape[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tapes",
    limit: 100,
    sort: "order",
    /* depth 1 resolves every upload to its Media document. It used to be 0,
       when the artwork was a string and there was nothing to resolve. */
    depth: 1,
  });

  return docs.map(toTape);
}

/** An upload, as the two things a file has to be read off disk: what it is
 *  called and when it last changed. Undefined for an unset field or for a bare
 *  id — the latter is what a query at depth 0 returns, and a mark that silently
 *  became the built-in one would be the harder bug of the two to notice. */
function markFileOf(file: unknown): MarkFile | undefined {
  if (!file || typeof file !== "object") return undefined;
  const m = file as { filename?: string | null; updatedAt?: string | null };
  return m.filename ? { filename: m.filename, updatedAt: m.updatedAt ?? "" } : undefined;
}

/** An upload's own alt text, or "" — the media record carries one, and for the
 *  siblings' labels it is the only place the variant's name is written down.
 *  Empty for a bare id, which is what depth 0 hands back. */
function altOf(image: unknown): string {
  if (!image || typeof image !== "object") return "";
  const m = image as { alt?: string | null };
  return m.alt ?? "";
}

/** One Payload document, as the components have always expected a tape.
 *
 *  The arrays come back as rows with a wrapper key on each — Payload's shape for
 *  a list of scalars — and are unwrapped here rather than at nine call sites.
 *  The tuples are asserted rather than checked: minRows/maxRows on the
 *  collection is what makes them true, so a length check here would be a second
 *  enforcement of a rule already enforced where an editor can see it. */
function toTape(doc: TapeDoc): Tape {
  /* ONE BOX, BROKEN WHERE SOMEBODY PRESSED ENTER.
   *
   * These four — the origin story, the character list, the reel's claim and its
   * note — used to be arrays of rows holding one text box each. That is what a
   * list of lines looks like to a database and nothing like what it should look
   * like to a person: a four-line headline was four boxes to open, fill and
   * drag into order.
   *
   * The break is still set BY HAND and is still a drawing decision — where
   * display type this size turns is not something to infer from the measure —
   * so nothing about the page changed. Only where the break is typed.
   *
   * Blank lines are dropped rather than kept as empty strings: a stray Enter at
   * the end of a box is a slip, not a line, and every one of these is rendered
   * as its own element where an empty one would be a gap in the type. */
  /* Still an array, and the last one: `tags` is hidden rather than removed
     (nothing on a product page draws it any more), so it keeps the shape it had
     rather than being migrated for a field nobody sees. */
  const texts = (rows: { text: string }[] | null | undefined) =>
    (rows ?? []).map((r) => r.text);

  const lines = (value: string | null | undefined) =>
    (value ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  const images = (rows: { image: unknown }[] | null | undefined) =>
    (rows ?? []).map((r) => urlOf(r.image));

  return {
    id: doc.slug,
    label: doc.label,
    word: doc.wordmark,

    card: urlOf(doc.card),
    /* undefined rather than "" when unset, because heroOf falls back on the card
       and `??` is what does it — an empty string is a value and would win. */
    hero: urlOf(doc.hero) || undefined,

    /* THE ROW, IN ORDER. A list rather than the map this used to be — see
       `faces` in ./tape-types.ts, which argues why the variant keys went. The
       alt comes off the media record itself because the variant's name is
       printed IN the label and there is nowhere else to read it from; an image
       with none falls back in siblingFacesOf rather than here, so the fallback
       is in the one place all of this section's fallbacks are. */
    faces: (doc.faces ?? []).map((f) => ({
      src: urlOf(f.image),
      alt: altOf(f.image) || doc.label,
    })),

    model: doc.model,

    showcase: urlOf(doc.showcase),
    tags: texts(doc.tags),
    copy: doc.copy,
    origin: lines(doc.origin) as [string, string],
    character: lines(doc.character),

    reel: {
      headline: lines(doc.reel?.headline),
      note: lines(doc.reel?.note),
      shots: images(doc.reel?.shots) as [string, string, string, string],
    },

    /* titleTop/titleBottom become the pair the card draws. Two fields in the
       admin rather than one string with a marker in it: an editor cannot
       accidentally produce a third line the card has no room for. */
    powers: (doc.powers ?? []).map((p) => ({
      id: p.key,
      title: [p.titleTop, p.titleBottom] as [string, string],
      copy: p.copy,
      /* THE FILE ITSELF AND NOT ITS URL, which is the one field on a tape that
         does not become a src. The mark is INLINED into the card — a bounce
         written in CSS cannot reach inside an <img> — so what the section needs
         is the file's contents, and to fetch those it needs the name on disk.
         The timestamp rides along as the cache key: it moves when an editor
         drops a replacement on the field, and nothing else does.
         See components/SuperPowers/markSvg.ts. */
      mark: markFileOf(p.mark),
    })) as [Power, Power, Power],

    colours: doc.colours as TapeColours,

    /* PASSED THROUGH AS IT COMES, nulls and all. Payload stores an untouched
       text field as null and the type wants undefined, but nothing downstream
       tells the two apart — sectionVars (tape-types.ts) drops anything falsy on
       its way to a custom property, which is the one place the distinction
       would matter. Casting rather than rebuilding ten fields to change ten
       nulls into ten undefineds. */
    sections: (doc.sections ?? undefined) as Tape["sections"],
  };
}

/* ------------------------------------------------------------------ *
 * What the pages ask for
 * ------------------------------------------------------------------ */

/** Every roll, in orbit order — which is the order the row at /products stands
 *  in and the order the slider turns through. One order, one place. */
export async function getTapes(): Promise<Tape[]> {
  return fetchAll();
}

/** The tape a route segment names, or undefined — which the page turns into a
 *  404 rather than guessing at. */
export async function getTapeOf(id: string): Promise<Tape | undefined> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tapes",
    where: { slug: { equals: id } },
    limit: 1,
    /* depth 1, AND IT IS LOAD-BEARING. It was 0, which was correct for exactly
       as long as the artwork was a string typed into a box — there was nothing
       to resolve, so resolving nothing was free. The moment every picture became
       an upload, depth 0 started handing this function a row of BARE IDS, urlOf
       turned each one into "", and the inner page rendered its hero, its two
       showcase shots and all four reel frames as images with no source.
       Nothing threw and nothing logged; the page was simply blank where the
       product should be. fetchAll above was already at 1, which is why /products
       looked right and /products/<slug> did not. */
    depth: 1,
  });

  return docs[0] ? toTape(docs[0]) : undefined;
}

/* THE ONE AFTER THIS ONE, and it wraps.
 *
 * The order is the collection's order — the same order the row at /products
 * stands in and the slider's orbit turns through — so NEXT UP at the foot of an
 * inner page means the same "next" a reader has already been shown twice. There
 * is no separate running order to keep in step.
 *
 * IT WRAPS RATHER THAN ENDING, and that is what makes the section unconditional:
 * the last tape's next is the first, so every inner page has one and no page
 * needs a branch for the case where it does not. A reader who follows it round
 * arrives back where they started having seen all six.
 *
 * Falls back to the tape itself if it is somehow not in the list — a link back
 * to the page you are on is inert, which is the right failure for a piece of
 * navigation that has lost its place.
 */
export async function getNextTape(tape: Tape): Promise<Tape> {
  const all = await fetchAll();
  const i = all.findIndex((t) => t.id === tape.id);
  return i < 0 ? tape : all[(i + 1) % all.length];
}

/** Just the colours, keyed by id — what the preloader's stack needs and the
 *  only thing it needs. Its own function because it is asked for in the root
 *  layout, on every route, and pulling six whole tapes through to read one hex
 *  value off each would be the wrong shape to hand a client component. */
export async function getPalette(): Promise<{ id: string; bg: string }[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "tapes",
    limit: 100,
    sort: "order",
    depth: 0,
    select: { slug: true, colours: true },
  });

  return docs.map((d) => ({
    id: d.slug,
    bg: (d.colours as TapeColours).bg,
  }));
}
