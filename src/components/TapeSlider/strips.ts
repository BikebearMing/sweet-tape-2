/* THE STRIP EACH TAPE'S PHOTOGRAPHS ARE HELD DOWN WITH.
 *
 * The two showcase shots are stuck to the stage with a piece of the tape the
 * section is currently about, and the strip changes with the tape — so a
 * selection swaps three things behind the same edge-on turn: the photograph,
 * the photograph beside it, and the tape across both of them.
 *
 * ONE ENTRY PER ROLL, NOT PER TAPE, because a strip of tape is a picture of the
 * FILM and several tapes dispense the same film: stationery and low-noise OPP
 * are both clear, and share one file named for both. A table keyed by tape id
 * would have been the same 3.9MB SVG typed out twice with two chances to
 * mistype it.
 *
 * Ordinary OPP used to be the third of those and is not — see ROLL_OF and the
 * `brown` entry. It was the case that proved the indirection was worth having:
 * one line moved it onto artwork of its own and nothing else in the codebase
 * had to know.
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
  /**
   * The ARTWORK's own aspect — its visible width over its visible height, with
   * the transparent margin taken off both. `ink` above corrects the width and
   * this is the other half of the same measurement.
   *
   * It exists for one job: the origin story's {{tape height=…}} option, which
   * asks for a strip a given number of pixels thick. Without this the only
   * height in the code is the FILE's, and on the cloth roll — 0.697 of its box
   * is artwork — a strip asked to be 40 tall would draw 28. Measured off the
   * alpha channel like `ink`, in a browser rather than in sharp: two of these
   * files are SVGs wrapping a raster in a <pattern>, which librsvg renders as
   * nothing at all.
   */
  art: number;
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
  /* The masking strip, re-drawn. It was /assets/tape-on-lemon.webp — the same
     object in a heavier, more golden rendering — and this one is the torn-edged
     cream the product page is designed around. One file per roll, so the swap is
     one line and it lands everywhere masking is taped down: the origin story,
     the photograph beside it, and the showcase shots on the home page's stage.
     That is the point of the table. */
  masking: {
    src: "/assets/masking-tape-product-inner.webp",
    box: [184, 68],
    ink: 0.924,
    art: 3.091,
    back: "peel-back-masking",
  },
  tissue: {
    src: "/assets/double-side.svg",
    box: [120, 43],
    ink: 0.925,
    art: 3.707,
    back: "peel-back-tissue",
  },
  clear: {
    src: "/assets/stationery-silent-opp-tape.svg",
    box: [141, 92],
    ink: 0.858,
    art: 4.267,
    back: "peel-back-clear",
    blend: "screen",
  },
  cloth: {
    src: "/assets/black-tape.webp",
    box: [213, 106],
    ink: 0.916,
    art: 2.654,
    back: "peel-back-black",
  },
  /* THE BROWN PACKING TAPE — the OPP rolls' own strip, and the reason they are
     no longer sent to `clear`.
   *
   * The three see-through tapes shared one file because they ARE one tape as
   * far as a strip of it goes: stationery and low-noise OPP both dispense
   * clear film. Ordinary OPP does not — it is the brown carton tape, it is
   * printed BROWN on its own label, and the roll standing beside it on the
   * product page is brown. A clear strip there was the wrong product, and on
   * the dark green it also composited as a pale grey slab, because the clear
   * artwork is drawn to be SCREENED onto something light (see `blend`).
   *
   * The file was already in the tree, unused. `ink` is measured off its alpha
   * channel like the rest: 416 of 428px across. No blend — this one is an
   * opaque picture of a strip, not a set of highlights to be added to whatever
   * is underneath. */
  brown: {
    src: "/assets/tape top.webp",
    box: [428, 173],
    ink: 0.972,
    art: 2.94,
    back: "peel-back-masking",
  },
} as const satisfies Record<string, Roll>;

type RollName = keyof typeof ROLLS;

/* Which roll a tape is taped down with — its own, in every case.

   TWO clear tapes share one file now, not three: ordinary OPP has moved to a
   brown strip of its own. That is exactly the change this table was shaped to
   allow — "a tape that later gets artwork of its own is one line here and
   nothing else" — and it is one line. See the `brown` entry above for why the
   clear file was the wrong product for it in the first place. */
const ROLL_OF: Record<string, RollName> = {
  masking: "masking",
  double: "tissue",
  stationery: "clear",
  cloth: "cloth",
  opp: "brown",
  "opp-quiet": "clear",
};

/* AND WHICH ROLL IS STUCK ACROSS THE ORIGIN STORY'S SENTENCE, where it is not
   the tape's own.
 *
 * The strip in the paragraph started as the same one holding the photograph
 * down — this tape, taped with itself, which is the right default and stays the
 * default. It is not always the right picture. The story is about what the tape
 * was made FOR, and the tape in the sentence is sometimes the one that failed:
 * a box that arrived in pieces was taped with something else, and drawing the
 * hero across that line puts the wrong roll on the wrong half of the story.
 *
 * SO IT IS A TABLE AND IT IS ALMOST EMPTY, which is the whole design. Absent
 * means ROLL_OF — the tape's own — so nothing here is a list of six answers to
 * keep in step with six products. It is a list of the exceptions, and a product
 * that has not been decided yet is simply not in it.
 *
 * IN CODE AND NOT IN THE CMS, the same call ROLL_OF above makes: these are
 * facts about which FILE goes where, and the four figures behind each of them —
 * a box, an ink fraction, a peel back and a blend — are measured off the file
 * itself. A field would be a dropdown of six words with none of that behind it. */
const STORY_ROLL: Record<string, RollName> = {};

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
  /**
   * The roll's own `ink` — how much of the file is artwork and how much is the
   * transparent margin Figma exported around it, 0..1.
   *
   * Passed through rather than kept private because a caller that sizes a strip
   * by its VISIBLE length, rather than by handing Peel the box above, has no
   * other way to get from one to the other: the product page's origin section
   * is measured that way (the design gives the tape's width on screen, not its
   * file's), and without this it would be reverse-engineering a number this
   * module already knows. See --strip-ink in global.css.
   */
  ink: number;
  /** The roll's own `art` — the visible artwork's aspect. The origin story's
   *  {{tape height=…}} option is the only thing that reads it; see the field on
   *  Roll above, which is where it is argued. */
  art: number;
};

function strip(name: RollName): Strip {
  const roll: Roll = ROLLS[name];
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
    ink: roll.ink,
    art: roll.art,
  };
}

/** The strip a tape's photographs are held down with — its own film. */
export function stripOf(tapeId: string): Strip {
  return strip(ROLL_OF[tapeId] ?? "masking");
}

/** And the one stuck across its origin story, which is the same strip unless
 *  STORY_ROLL says otherwise. See the note there. */
export function storyStripOf(tapeId: string): Strip {
  return strip(STORY_ROLL[tapeId] ?? ROLL_OF[tapeId] ?? "masking");
}

/* Packed onto the roll button beside the rest of the tape's payload, because
   the engine works entirely off the DOM — see RollPicker. The lengths are
   written as px and the blend as a keyword, so the engine can hand all three
   straight to custom properties without knowing what they mean. */
export const stripAttr = (tapeId: string) => {
  const s = stripOf(tapeId);
  return [s.src, s.back, `${s.w.toFixed(2)}px`, `${s.h.toFixed(2)}px`, s.blend].join("|");
};
