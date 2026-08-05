import type { CSSProperties } from "react";

/* The four tapes.
 *
 * This is the seam the CMS will eventually plug into: swap `tapes` for an
 * awaited Payload query and nothing downstream changes, because everything —
 * markup, colours, animation — reads from this shape and only this shape.
 *
 * Colours used to live in custom.css keyed on [data-index]. They are here
 * instead so a tape is one object rather than a row of CSS plus a row of
 * data-attributes that had to be kept in step by hand. They still reach the DOM
 * as custom properties (see cssVars), which is what the animation reads.
 */

export type TapeColours = {
  /** Band that grows out from behind the roll when it is selected. */
  ring: string;
  /** Colour the stage floods with. */
  bg: string;
  /** THE and CREATIVE. */
  word: string;
  /** Chip fill and chip text, in the left column and the subhead. */
  tagBg: string;
  tagInk: string;
  /** Body copy in the left column. */
  ink: string;
};

export type Tape = {
  /** Stable key. Was data-index. */
  id: string;
  /** Screen-reader name for the orbit button. */
  label: string;
  /** Thumbnail on the orbit. */
  roll: string;
  /** Hang tag at the centre of the stage. */
  card: string;
  /** 3D roll shown in place of the card once three.js is live. GLB path. */
  model: string;
  /** The two tilted photographs. Exactly two — the layout places both by hand. */
  showcase: [string, string];
  /** Chips in the left column. */
  tags: string[];
  /** Paragraph under the chips. */
  copy: string;
  colours: TapeColours;
};

export const tapes: Tape[] = [
  {
    id: "mask-1",
    label: "Masking tape",
    roll: "/assets/rolling/roll-mask.png",
    card: "/assets/masking-center.png",
    model: "/assets/tapes/Masking-Tape.glb",
    showcase: ["/assets/mask-image-1.jpg", "/assets/mask-image-2.jpg"],
    tags: ["LABELING", "PAINT WORK", "BUNDLING"],
    copy: "Always ready for school projects, quick labels, and weekend crafts. Easygoing. Comes off clean. No drama.",
    colours: {
      ring: "#fff1a2",
      bg: "#fa8005",
      word: "#fcd805",
      tagBg: "#FFDC13",
      tagInk: "#D7791A",
      ink: "#FFDC13",
    },
  },
  {
    id: "mask-2",
    label: "Cloth tape",
    roll: "/assets/rolling/roll-cloth.png",
    card: "/assets/cloth-center.png",
    model: "/assets/tapes/Cloth-Tape.glb",
    showcase: ["/assets/cloth-image-1.jpg", "/assets/cloth-image-2.jpg"],
    tags: ["HEAVY DUTY", "CARTON SEALING", "GAFFER WORK"],
    copy: "Built for the jobs that fight back. Tough weave, firm grip, tears clean by hand.",
    colours: {
      ring: "#d9d2f7",
      bg: "#2E3EAC",
      word: "#101E83", // placeholder
      tagBg: "#172795", // placeholder
      tagInk: "#B0B9FA",
      ink: "#919CFF",
    },
  },
  {
    id: "mask-3",
    label: "Double-sided tissue tape",
    roll: "/assets/rolling/roll-double.png",
    card: "/assets/double-center.png",
    model: "/assets/tapes/Double-Tape.glb",
    showcase: ["/assets/double-image-1.jpg", "/assets/double-image-2.jpg"],
    tags: ["INVISIBLE HOLDING", "SMOOTH MOUNTING", "QUICK PATCHING"],
    copy: "The kind of tape that commits. Strong hold on both sides, easy to use, hard to let go.",
    colours: {
      ring: "#a8dcf0",
      bg: "#50CBFF",
      word: "#007db2",
      tagBg: "#1b87b8",
      tagInk: "#8bd8f5",
      ink: "#1b87b8",
    },
  },
  {
    id: "mask-4",
    label: "Stationery tape",
    roll: "/assets/rolling/roll-stationery.png",
    card: "/assets/stationery-center.png",
    model: "/assets/tapes/Cello-Tape.glb",
    showcase: ["/assets/stationery-image-1.jpg", "/assets/stationery-image-2.jpg"],
    tags: ["SMALL REPAIRS", "STICK & GO", "DESK DRAWER ESSENTIAL"],
    copy: "From broken corners to last-minute projects. Easy to tear. Easy to use. Weirdly reliable.",
    colours: {
      ring: "#ffd9c2",
      bg: "#FF7B5F",
      word: "#a82712", // placeholder
      tagBg: "#9e2a12", // placeholder
      tagInk: "#f2a08c",
      ink: "#9e2a12",
    },
  },
];

/* Custom properties rather than props threaded through the tree: the animation
 * reads a tape's palette with getComputedStyle(button) at the moment it needs
 * it, and copies the values onto whichever element is being repainted. Keeping
 * them as CSS variables on the button means that lookup — and every CSS rule
 * that already consumes them — keeps working untouched. */
export function cssVars(c: TapeColours): CSSProperties {
  return {
    "--ring": c.ring,
    "--bg": c.bg,
    "--word": c.word,
    "--tag-bg": c.tagBg,
    "--tag-ink": c.tagInk,
    "--ink": c.ink,
  } as CSSProperties;
}
