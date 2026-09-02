import { getPayload } from "payload";

import config from "@/payload.config";

import { urlOf } from "./media-url";
import type {
  About,
  BeltFit,
  BeltItem,
  BeltRow,
  BeltSize,
  WantedBox,
} from "./about-types";

/* Sweet Tape — what /about says, over a Payload query.
 *
 * WHAT IS SHOWN IF THE RECORD HAS NEVER BEEN SAVED. A global exists the moment
 * it is declared and holds nothing until somebody presses save, so between
 * deploying this and an editor's first visit every field below is null. FALLBACK
 * is what the page said before it had a CMS, so that window is invisible: /about
 * is the page it has always been, and editing it changes it. ./contact.ts makes
 * the same argument at length and it is the same decision.
 *
 * THE FALLBACK IS PER SECTION AND NOT PER FIELD. Half a headline from the CMS
 * and half from here is a pair of lines that were never written together.
 */

export type {
  About,
  BeltFit,
  BeltItem,
  BeltRow,
  BeltSize,
  WantedBox,
} from "./about-types";

const FALLBACK = {
  open: {
    headline: ["THREE", "GENERATION"],
    kicker: ["ONE SHARED", "BELIEF"],
    note: [
      "we’ve believed that",
      "even the simplest",
      "products deserve",
      "thoughtful design.",
    ],
  },
  belt: [
    {
      from: -87.1,
      to: -163.1,
      items: [
        { kind: "photo", size: "xl", src: "", alt: "", fit: "full" },
        { kind: "photo", size: "med", src: "", alt: "", fit: "full" },
        { kind: "photo", size: "sm", src: "", alt: "", fit: "full" },
        {
          kind: "claim",
          size: "med",
          index: "01",
          lines: ["ROWS OF", "PRODUCTS."],
        },
        { kind: "photo", size: "xl", src: "", alt: "", fit: "full" },
      ],
    },
    {
      from: -402.3,
      to: -284.8,
      items: [
        { kind: "photo", size: "sm", src: "", alt: "", fit: "full" },
        {
          kind: "claim",
          size: "xxl",
          index: "02",
          lines: ["ENDLESS CHOICES THAT", "SOMEHOW ALL BLUR TOGETHER."],
        },
        { kind: "photo", size: "med", src: "", alt: "", fit: "full" },
        { kind: "mark" },
        {
          kind: "roll",
          size: "xl",
          lines: ["same material.", "same roll.", "same routine."],
        },
      ],
    },
    {
      from: -80.1,
      to: -155.1,
      items: [
        { kind: "photo", size: "xl", src: "", alt: "", fit: "full" },
        {
          kind: "note",
          size: "med",
          lines: ["Very few stood out.", "Even fewer felt memorable."],
        },
        { kind: "photo", size: "med", src: "", alt: "", fit: "full" },
        { kind: "photo", size: "sm", src: "", alt: "", fit: "full" },
        {
          kind: "claim",
          size: "med",
          index: "03",
          lines: ["SAME PLAIN", "PACKAGING."],
        },
      ],
    },
  ] as BeltRow[],
  reason: {
    kicker: "MADE FOR A REASON",
    top: ["THAT'S", "WHY"],
    middle: ["SWEET", "TAPE"],
    bottom: "EXISTS.",
    mark: ["GOOD", "THINGS", "STICK"],
  },
  statement: [
    "TO REIMAGINE / AN",
    "EVERYDAY / ESSENTIAL AS /",
    "SOMETHING | / MORE /",
    "THOUGHTFUL, / EXPRESSIVE",
    "AND / FULL OF HEART.",
  ],
  wanted: {
    sentence: "WE WANTED TO BE.",
    boxes: [
      { id: "clearer", num: "01", label: ["CLEARER"], mark: "strip", y: 45 },
      {
        id: "choose",
        num: "02",
        label: ["EASY TO", "CHOOSE"],
        mark: "parcel",
        y: 4.5,
      },
      {
        id: "recognisable",
        num: "03",
        label: ["RECOGNISABLE"],
        mark: "roll",
        y: 57.5,
      },
      {
        id: "human",
        num: "04",
        label: ["MORE", "HUMAN"],
        mark: "person",
        y: 24.5,
      },
    ] as WantedBox[],
  },
  cta: {
    kicker: "We believe the world is better with",
    headline: ["MORE COLOUR,", "MORE HEART, AND", "YES — BETTER TAPE."],
    label: "UNROLL THE STORY",
    href: "/products",
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

type Row = { kind?: string | null; size?: string | null; [k: string]: unknown };

function toItem(row: Row): BeltItem | null {
  const size = (row.size ?? "med") as BeltSize;

  if (row.kind === "mark") return { kind: "mark" };

  if (row.kind === "photo") {
    return {
      kind: "photo",
      size,
      src: urlOf(row.image),
      alt: typeof row.alt === "string" ? row.alt : "",
      fit: (row.fit === "inset" ? "inset" : "full") as BeltFit,
    };
  }

  const text = lines(row.lines, []);
  if (row.kind === "claim")
    return { kind: "claim", size, index: String(row.index ?? ""), lines: text };
  if (row.kind === "note") return { kind: "note", size, lines: text };
  if (row.kind === "roll") return { kind: "roll", size, lines: text };

  return null;
}

async function fetchAbout() {
  const payload = await getPayload({ config });
  /* depth 1 resolves every upload to its Media document. */
  return payload.findGlobal({ slug: "about", depth: 1 });
}

export async function getAbout(): Promise<About> {
  const doc = (await fetchAbout()) as unknown as Record<string, unknown>;

  const belt = (
    (doc.belt as { from?: number; to?: number; items?: Row[] }[]) ?? []
  )
    .map((row) => ({
      from: row.from ?? 0,
      to: row.to ?? 0,
      items: (row.items ?? []).map(toItem).filter(Boolean) as BeltItem[],
    }))
    .filter((row) => row.items.length);

  const boxes = ((doc.wantedBoxes as Row[]) ?? [])
    .map((row) => {
      const label = lines(row.label, []);
      if (!label.length) return null;
      return {
        /* THE KEY IS TYPED AND NOT DERIVED FROM THE WORDS. It reaches the markup
           as [data-box], which is what the stylesheet's four palettes are keyed
           on — so a claim reworded is a claim in the same colour, where a slug
           off the label would have made EASY TO CHOOSE into "easy-to-choose" and
           dropped the box's paint on the floor. */
        id: String(row.key ?? "clearer"),
        num: String(row.num ?? ""),
        label,
        mark: (row.mark ?? "strip") as WantedBox["mark"],
        y: typeof row.y === "number" ? row.y : 0,
      };
    })
    .filter(Boolean) as WantedBox[];

  return {
    open: {
      headline: lines(doc.headline, FALLBACK.open.headline),
      kicker: lines(doc.kicker, FALLBACK.open.kicker),
      note: lines(doc.note, FALLBACK.open.note),
    },
    belt: belt.length ? belt : FALLBACK.belt,
    reason: {
      kicker: (doc.reasonKicker as string) || FALLBACK.reason.kicker,
      top: lines(doc.reasonTop, FALLBACK.reason.top),
      middle: lines(doc.reasonMiddle, FALLBACK.reason.middle),
      bottom: (doc.reasonBottom as string) || FALLBACK.reason.bottom,
      mark: lines(doc.reasonMark, FALLBACK.reason.mark),
    },
    statement: lines(doc.statement, FALLBACK.statement),
    wanted: {
      sentence: (doc.wantedSentence as string) || FALLBACK.wanted.sentence,
      boxes: boxes.length ? boxes : FALLBACK.wanted.boxes,
    },
    cta: {
      kicker: (doc.ctaKicker as string) || FALLBACK.cta.kicker,
      headline: lines(doc.ctaHeadline, FALLBACK.cta.headline),
      label: (doc.ctaLabel as string) || FALLBACK.cta.label,
      href: (doc.ctaHref as string) || FALLBACK.cta.href,
    },
  };
}
