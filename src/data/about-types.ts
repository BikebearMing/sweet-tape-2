import type { MarkKind } from "@/components/WeWanted/Mark";

/* /about's shape, and the half of it that is safe anywhere.
 *
 * Split for the reason contact-types.ts and homepage-types.ts are: its sibling,
 * ./about.ts, imports the Payload config and drags the Postgres adapter with
 * it. Anything that does not need the database lives here.
 */

export type BeltSize = "sm" | "med" | "xl" | "xxl";

/** How a photograph is fitted to its pill — see .conveyor-train in global.css. */
export type BeltFit = "full" | "inset";

export type BeltItem =
  | { kind: "photo"; size: BeltSize; src: string; alt: string; fit: BeltFit }
  | { kind: "claim"; size: BeltSize; index: string; lines: string[] }
  | { kind: "note"; size: BeltSize; lines: string[] }
  | { kind: "roll"; size: BeltSize; lines: string[] }
  | { kind: "mark" };

/** One row of the belt: where it is parked, where it travels to, what is on it. */
export type BeltRow = { from: number; to: number; items: BeltItem[] };

export type WantedBox = {
  id: string;
  num: string;
  label: string[];
  mark: MarkKind;
  /** How far down the stage the box sits, in vh, measured to its top edge. */
  y: number;
};

/** /about, as its six sections want it. */
export type About = {
  open: { headline: string[]; kicker: string[]; note: string[] };
  belt: BeltRow[];
  reason: {
    kicker: string;
    top: string[];
    middle: string[];
    bottom: string;
    mark: string[];
  };
  statement: string[];
  wanted: { sentence: string; boxes: WantedBox[] };
  cta: { kicker: string; headline: string[]; label: string; href: string };
};
