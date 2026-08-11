import type { CSSProperties } from "react";

/* The six tapes.
 *
 * This is the seam the CMS will eventually plug into: swap `tapes` for an
 * awaited Payload query and nothing downstream changes, because everything —
 * markup, colours, animation — reads from this shape and only this shape.
 *
 * Colours used to live in custom.css keyed on [data-index]. They are here
 * instead so a tape is one object rather than a row of CSS plus a row of
 * data-attributes that had to be kept in step by hand. They still reach the DOM
 * as custom properties (see cssVars), which is what the animation reads.
 *
 * Artwork lives under /assets/slider/<id>/ — card, roll, and the two shots —
 * because it arrives that way and a tape's files are only ever wanted together.
 * The word mark is the exception: it is keyed by WORD, not by tape, and lives
 * under /assets/words/<word>/. Two tapes could one day share a word; none do.
 */

export type TapeColours = {
  /** Band that grows out from behind the roll when it is selected. */
  ring: string;
  /** Colour the stage floods with. */
  bg: string;
  /** THE and the tape's own word. */
  word: string;
  /** Chip fill and chip text, in the left column and the subhead. */
  tagBg: string;
  tagInk: string;
  /** Body copy in the left column. */
  ink: string;
};

export type Tape = {
  /** Stable key. Was data-index, and is also the artwork folder. */
  id: string;
  /** Screen-reader name for the orbit button. */
  label: string;
  /**
   * Which word mark the bottom title spells for this tape — a key of `words` in
   * src/data/wordmarks.json, which is where its letterforms are. Not free text:
   * the stencils are generated per word into letters.css and selected by it.
   */
  word: string;
  /** Thumbnail on the orbit. The card at 108px; scripts made it from the card. */
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
    id: "masking",
    label: "Masking tape",
    word: "creative",
    roll: "/assets/slider/masking/roll.png",
    card: "/assets/slider/masking/card.png",
    model: "/assets/tapes/Masking-Tape.glb",
    showcase: ["/assets/slider/masking/shot-1.png", "/assets/slider/masking/shot-2.png"],
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
    id: "double",
    label: "Double-sided tissue tape",
    word: "trusty",
    roll: "/assets/slider/double/roll.png",
    card: "/assets/slider/double/card.png",
    model: "/assets/tapes/Double-Tape.glb",
    showcase: ["/assets/slider/double/shot-1.png", "/assets/slider/double/shot-2.png"],
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
    id: "stationery",
    label: "Stationery tape",
    word: "buddy",
    roll: "/assets/slider/stationery/roll.png",
    card: "/assets/slider/stationery/card.svg",
    model: "/assets/tapes/Cello-Tape.glb",
    showcase: [
      "/assets/slider/stationery/shot-1.png",
      "/assets/slider/stationery/shot-2.png",
    ],
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
  {
    id: "cloth",
    label: "Cloth tape",
    word: "fixer",
    roll: "/assets/slider/cloth/roll.png",
    card: "/assets/slider/cloth/card.png",
    model: "/assets/tapes/Cloth-Tape.glb",
    showcase: ["/assets/slider/cloth/shot-1.png", "/assets/slider/cloth/shot-2.png"],
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
  /* The two new tapes. Their artwork is final; everything WRITTEN below is not.
     The chips, the paragraph and the palette are placeholders sampled off a
     328px mock — close enough to build and lay out against, not close enough to
     ship. The mock's own copy was unreadable at that size and has not been
     guessed at. Replace all three fields per tape. */
  {
    id: "opp",
    label: "OPP tape",
    word: "reliable",
    roll: "/assets/slider/opp/roll.png",
    card: "/assets/slider/opp/card.svg",
    /* Best guess: opp.glb was already in the tree, unused, and is the only OPP
       model there is. Unverified against the artwork. */
    model: "/assets/tapes/opp.glb",
    showcase: ["/assets/slider/opp/shot-1.png", "/assets/slider/opp/shot-2.png"],
    tags: ["CARTON SEALING", "BULK PACKING", "BROWN"], // placeholder
    copy: "Placeholder copy for the OPP tape — replace before this goes anywhere near a build.", // placeholder
    colours: {
      ring: "#e4f7a8", // placeholder
      bg: "#B5E01F", // placeholder
      word: "#4a7a10", // placeholder
      tagBg: "#4a7a10", // placeholder
      tagInk: "#dff0a0", // placeholder
      ink: "#4a7a10", // placeholder
    },
  },
  {
    id: "opp-quiet",
    label: "OPP tape, low noise",
    word: "silent",
    roll: "/assets/slider/opp-quiet/roll.png",
    card: "/assets/slider/opp-quiet/card.png",
    model: "/assets/tapes/Low-Noise-Tape.glb",
    showcase: [
      "/assets/slider/opp-quiet/shot-1.png",
      "/assets/slider/opp-quiet/shot-2.png",
    ],
    tags: ["LOW NOISE", "QUIET UNWIND", "NIGHT SHIFT"], // placeholder
    copy: "Placeholder copy for the low-noise OPP tape — replace before this goes anywhere near a build.", // placeholder
    colours: {
      ring: "#fff0b0", // placeholder
      bg: "#F7D000", // placeholder
      word: "#a88700", // placeholder
      tagBg: "#a88700", // placeholder
      tagInk: "#ffeda0", // placeholder
      ink: "#8a6f00", // placeholder
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
