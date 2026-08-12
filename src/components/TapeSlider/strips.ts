/* THE STRIP EACH TAPE'S PHOTOGRAPHS ARE HELD DOWN WITH.
 *
 * The two showcase shots are stuck to the stage with a piece of the tape the
 * section is currently about, and the strip changes with the tape — so a
 * selection swaps three things behind the same edge-on turn: the photograph,
 * the photograph beside it, and the tape across both of them.
 *
 * ONE ENTRY PER ROLL, NOT PER TAPE. Three of the six ship as a single piece of
 * artwork: stationery, OPP and low-noise OPP are all the same clear tape, and
 * the file is named for all three. A table keyed by tape id would have been the
 * same 3.9MB SVG typed out three times with three chances to mistype it.
 *
 * This lives here rather than in data/tapes.ts because two of the three figures
 * are facts about the FILE — its aspect and how much of it is artwork — and the
 * third is a filter id out of components/Peel. None of them is a thing a CMS
 * would ever be asked for. Same call GiantPinning's TAPES table makes, for the
 * same reason.
 */

/* WHAT THE UNDERSIDE IS MADE OF is a key of BACKS in components/Peel, and the
   values there are measured off these very files. Kept as a loose string rather
   than imported: this module is data and pulling in a component to name a
   colour would invert the dependency for no gain. The names are checked at the
   call site, which passes them straight to Peel's typed `back` prop. */
type Roll = {
  src: string;
  /** The file's own pixel box. Its ratio is what turns one length into two. */
  box: [number, number];
  /**
   * How much of that box's WIDTH is actually artwork, 0..1.
   *
   * The Figma exports have transparent margins — the clear tape's strip sits in
   * a box two and a half times its own height — so a strip sized to the file is
   * a strip of the wrong length by however much padding it happens to carry.
   * Every one of these is measured off the alpha channel, and INK below is what
   * divides by it, so the four rolls come out the same length on screen whatever
   * their files do.
   */
  ink: number;
  back: "peel-back-masking" | "peel-back-tissue" | "peel-back-clear" | "peel-back-black";
  /**
   * How the strip meets the photograph underneath it. "normal" for a tape you
   * cannot see through, which is three of the four.
   *
   * The clear roll is the exception and it is not a stylistic choice: its file
   * is drawn with mix-blend-mode: screen INSIDE it, so its artwork is a set of
   * highlights meant to be added to whatever it is lying on. Painted normally
   * it composites against nothing and arrives as the flat mid-grey slab that
   * blending was supposed to turn into clear tape. Screening it at the page
   * level is what the artwork was drawn expecting.
   */
  blend?: "screen";
};

const ROLLS = {
  masking: {
    src: "/assets/tape-on-lemon.png",
    box: [283, 134],
    ink: 0.968,
    back: "peel-back-masking",
  },
  tissue: {
    src: "/assets/double-side.svg",
    box: [120, 43],
    ink: 0.925,
    back: "peel-back-tissue",
  },
  clear: {
    src: "/assets/stationery-silent-opp-tape.svg",
    box: [141, 92],
    ink: 0.858,
    back: "peel-back-clear",
    blend: "screen",
  },
  cloth: {
    src: "/assets/black-tape.png",
    box: [213, 106],
    ink: 0.916,
    back: "peel-back-black",
  },
} as const satisfies Record<string, Roll>;

type RollName = keyof typeof ROLLS;

/* Which roll a tape is taped down with — its own, in every case. The three
   clear tapes share one file; the entry is per tape anyway so a tape that later
   gets artwork of its own is one line here and nothing else. */
const ROLL_OF: Record<string, RollName> = {
  masking: "masking",
  double: "tissue",
  stationery: "clear",
  cloth: "cloth",
  opp: "clear",
  "opp-quiet": "clear",
};

/* HOW LONG THE STRIP READS, in px of visible artwork.
 *
 * px, and this is the one place on the page where that is the right unit: the
 * showcase photographs are unsized in the stylesheet and so paint at their own
 * 204px whatever the window is doing. A strip in vw would slide off the picture
 * it is holding at every width but 1440. It follows the photograph because it
 * is stuck to it.
 *
 * About 62% of the shot's width — a good bite of the picture with a clear
 * overhang either side, which is what makes it read as holding the thing on
 * rather than as a label laid across it. */
const INK = 126;

export type Strip = {
  src: string;
  back: Roll["back"];
  /** The peel's `box`, i.e. the FILE's box scaled so its artwork spans INK. */
  w: number;
  h: number;
  blend: "normal" | "screen";
};

export function stripOf(tapeId: string): Strip {
  const roll: Roll = ROLLS[ROLL_OF[tapeId] ?? "masking"];
  const [bw, bh] = roll.box;
  // Divided by ink, so it is the ARTWORK that comes out INK long and not the
  // file. Height follows the file's own aspect, so nothing is ever squashed.
  const w = INK / roll.ink;
  return {
    src: roll.src,
    back: roll.back,
    w,
    h: (w * bh) / bw,
    blend: roll.blend ?? "normal",
  };
}

/* Packed onto the roll button beside the rest of the tape's payload, because
   the engine works entirely off the DOM — see RollPicker. The lengths are
   written as px and the blend as a keyword, so the engine can hand all three
   straight to custom properties without knowing what they mean. */
export const stripAttr = (tapeId: string) => {
  const s = stripOf(tapeId);
  return [s.src, s.back, `${s.w.toFixed(2)}px`, `${s.h.toFixed(2)}px`, s.blend].join("|");
};
