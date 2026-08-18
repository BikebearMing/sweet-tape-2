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
  /**
   * THE INNER PAGE'S KEY VISUAL — the roll at /products/<id>, shot square-on and
   * at a size of its own (441 x 416 at the design width, which is what the
   * artwork is drawn at; see the .product-intro block in global.css).
   *
   * OPTIONAL, and the five without one are not an oversight. Only the OPP roll
   * has been delivered; the rest fall back to `card`, which is the same object
   * photographed for the slider and is a working page rather than a hole in
   * one. Drop a file in and the fallback stops applying — see heroOf, which is
   * the one place that decision is made.
   */
  hero?: string;
  /**
   * THE SIBLINGS' LABEL ARTWORK, keyed by the variant's id — see SIBLINGS in
   * components/Siblings, which is where the three of them are named. One printed
   * circular label per variant of THIS tape, so the middle of the card reads
   * "OPP TAPE" on /products/opp and "MASKING TAPE" on /products/masking.
   *
   * OPTIONAL, AND NO TAPE DECLARES IT YET, which is not an oversight: none of
   * the six has been exported. Every card falls back to the slider `card` above
   * — the same object photographed for the orbit — so the section is a working
   * row today rather than three broken images. Drop the files in, add them here,
   * and the fallback stops applying for that tape alone.
   *
   * Keyed rather than a tuple, so a tape whose artwork lands one variant at a
   * time takes what exists and falls back on the rest. See siblingFaceOf, which
   * is the one place that decision is made — heroOf above is the same shape for
   * the same reason.
   */
  faces?: Record<string, string>;
  /** 3D roll shown in place of the card once three.js is live. GLB path. */
  model: string;
  /** The two tilted photographs. Exactly two — the layout places both by hand. */
  showcase: [string, string];
  /** Chips in the left column. */
  tags: string[];
  /** Paragraph under the chips. */
  copy: string;
  /**
   * THE ORIGIN STORY — the inner page's second section, in TWO HALVES because a
   * strip of this tape is stuck across the sentence between them.
   *
   * It is one paragraph and it is stored as two strings rather than one with a
   * marker in it, for the reason every other split on this site is explicit:
   * where the tape lands is a DRAWING decision, not something to be parsed out
   * of the copy at render time. A CMS field for this is two fields.
   *
   * Sentence case here and uppercase on the page — the caps are the section's
   * setting (text-transform in global.css), so the copy stays readable in the
   * data file and in a screen reader.
   */
  origin: [string, string];
  /**
   * THE NOTE IN THE MARGIN — the tape's character, written by hand beside the
   * photograph. Lines, not a sentence: the breaks are part of the drawing, which
   * is the same call components/HandNote/copy.ts makes and says why at length.
   *
   * Lower case and loose punctuation on purpose. This is the one piece of copy
   * on the site in somebody's handwriting, and it should read as an aside
   * somebody scribbled rather than as a line of body text set in a script face.
   *
   * ASCII ONLY. Vara's fonts are JSON files of drawn glyphs carrying 33-126 and
   * nothing else — a curly apostrophe or an em dash comes out as the question
   * mark it substitutes for anything it cannot draw. Use ' and -.
   */
  character: string[];
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
    /* PLACEHOLDER — the origin story has not been written for this tape. The
       two halves are the sentence either side of the strip of tape stuck across
       it; see `origin` in the type above. Replace both before this ships. */
    origin: [
      "Placeholder opening line.",
      "PLACEHOLDER — the masking tape's origin story goes here, and the tape above is stuck across the sentence at the break between these two strings.",
    ], // placeholder
    /* PLACEHOLDER — four short lines in somebody's handwriting. ASCII only. */
    character: [
      "placeholder note.",
      "four short lines",
      "in a hand, saying",
      "what this one is.",
    ], // placeholder
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
    /* PLACEHOLDER — the origin story has not been written for this tape. The
       two halves are the sentence either side of the strip of tape stuck across
       it; see `origin` in the type above. Replace both before this ships. */
    origin: [
      "Placeholder opening line.",
      "PLACEHOLDER — the double-sided tape's origin story goes here, and the tape above is stuck across the sentence at the break between these two strings.",
    ], // placeholder
    /* PLACEHOLDER — four short lines in somebody's handwriting. ASCII only. */
    character: [
      "placeholder note.",
      "four short lines",
      "in a hand, saying",
      "what this one is.",
    ], // placeholder
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
    /* PLACEHOLDER — the origin story has not been written for this tape. The
       two halves are the sentence either side of the strip of tape stuck across
       it; see `origin` in the type above. Replace both before this ships. */
    origin: [
      "Placeholder opening line.",
      "PLACEHOLDER — the stationery tape's origin story goes here, and the tape above is stuck across the sentence at the break between these two strings.",
    ], // placeholder
    /* PLACEHOLDER — four short lines in somebody's handwriting. ASCII only. */
    character: [
      "placeholder note.",
      "four short lines",
      "in a hand, saying",
      "what this one is.",
    ], // placeholder
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
    /* PLACEHOLDER — the origin story has not been written for this tape. The
       two halves are the sentence either side of the strip of tape stuck across
       it; see `origin` in the type above. Replace both before this ships. */
    origin: [
      "Placeholder opening line.",
      "PLACEHOLDER — the cloth tape's origin story goes here, and the tape above is stuck across the sentence at the break between these two strings.",
    ], // placeholder
    /* PLACEHOLDER — four short lines in somebody's handwriting. ASCII only. */
    character: [
      "placeholder note.",
      "four short lines",
      "in a hand, saying",
      "what this one is.",
    ], // placeholder
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
    /* The only one delivered so far, and the page was designed around it. Not
       under /assets/slider/opp/ with the rest of this tape's files, because it
       is not the slider's: the folder note at the top of this file says a
       tape's artwork lives together, and this is the exception worth naming
       rather than the rule being broken. Move it in when the other five land
       and the whole set can be keyed by id. */
    hero: "/assets/opp-tape-inner-product.png",
    /* The brown packing roll. It was opp.glb, which was in the tree, unused,
       and was a guess; this is the export the artwork was actually made for.
       It USED to be the hero's roll too — the hero now dispenses the low-noise
       one (Hero/engine.ts MODEL_URL), so the object the page opens with is the
       entry below rather than this one. */
    model: "/assets/tapes/header-brown.glb",
    showcase: ["/assets/slider/opp/shot-1.png", "/assets/slider/opp/shot-2.png"],
    tags: ["CARTON SEALING", "BULK PACKING", "BROWN"], // placeholder
    copy: "Placeholder copy for the OPP tape — replace before this goes anywhere near a build.", // placeholder
    /* The one that is written. Straight off the design. */
    origin: [
      "Built for the big leagues.",
      "BIG BARRY Hold showed up the day someone taped a fragile box with the wrong tape and watched it arrive in pieces. Never again.",
    ],
    character: [
      "steady, no-nonsense.",
      "the strong heroic",
      "type who lets his",
      "grip do the talking.",
    ],
    /* THE SITE'S OWN PAIRING, not a sixth colour scheme.
     *
     * These were five greens sampled off a 328px mock and marked placeholder
     * from the day they were written. They were near-misses on colours this
     * site already has — #B5E01F against the lime's #b6fe00, #4a7a10 against
     * the dark green — and the note by --pick-rise-colour in global.css is
     * blunt about exactly that: a fourth green nearly like the other three
     * reads as a mistake rather than as a choice.
     *
     * So they are the pairing the home page opens and closes on, which is the
     * one this tape was always reaching for: #b6fe00 lime, #013900 dark green.
     * The chip inverts it, which is what every chip on a lime sheet does.
     *
     * `ring` is left alone deliberately — it is the pale band that opens behind
     * a roll on the SLIDER'S orbit and never appears on the product page, and
     * every one of the six has its own tint of its own stage colour. It is
     * still a placeholder; it is just not this page's placeholder.
     */
    colours: {
      ring: "#e4f7a8", // placeholder
      bg: "#b6fe00",
      /* THE ONE COLOUR HERE THAT IS NOT THE SITE'S PAIRING, and it is specified
         rather than picked: the opening screen's THE / RELIABLE are drawn in
         this mid green. It has to be its own value — the marks are a stencil
         punched out of the sheet they lie on, so at #013900 they read as a hole
         in the lime and at #b6fe00 they vanish into it. This is the step
         between, which is what makes the word read as printed ON the sheet. */
      word: "#52AF16",
      tagBg: "#013900",
      tagInk: "#b6fe00",
      ink: "#013900",
    },
  },
  {
    id: "opp-quiet",
    label: "OPP tape, low noise",
    word: "silent",
    roll: "/assets/slider/opp-quiet/roll.png",
    card: "/assets/slider/opp-quiet/card.png",
    /* THE HERO'S ROLL — the same file Hero/engine.ts opens the page with, so
       the slider shows the object the visitor has already been watching rather
       than a second model of it. */
    model: "/assets/tapes/Low-Noise-Tape.glb",
    showcase: [
      "/assets/slider/opp-quiet/shot-1.png",
      "/assets/slider/opp-quiet/shot-2.png",
    ],
    tags: ["LOW NOISE", "QUIET UNWIND", "NIGHT SHIFT"], // placeholder
    copy: "Placeholder copy for the low-noise OPP tape — replace before this goes anywhere near a build.", // placeholder
    /* PLACEHOLDER — the origin story has not been written for this tape. The
       two halves are the sentence either side of the strip of tape stuck across
       it; see `origin` in the type above. Replace both before this ships. */
    origin: [
      "Placeholder opening line.",
      "PLACEHOLDER — the low-noise OPP tape's origin story goes here, and the tape above is stuck across the sentence at the break between these two strings.",
    ], // placeholder
    /* PLACEHOLDER — four short lines in somebody's handwriting. ASCII only. */
    character: [
      "placeholder note.",
      "four short lines",
      "in a hand, saying",
      "what this one is.",
    ], // placeholder
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

/* A tape by its id, or nothing. The inner page's route reads this, and it is
   here rather than in the route so that `tapes` stays the one thing anybody has
   to know about — the same call src/data/news.ts makes with storyOf. */
export function tapeOf(id: string): Tape | undefined {
  return tapes.find((t) => t.id === id);
}

/* WHICH PICTURE THE INNER PAGE SHOWS, and the whole of the fallback in one
   place. See the `hero` field above for why five tapes take the second half of
   this expression today. */
export function heroOf(tape: Tape): string {
  return tape.hero ?? tape.card;
}

/* WHICH LABEL A SIBLING CARD SHOWS, and the whole of that fallback in one place
   as well. See the `faces` field above for why all six tapes take the second
   half of this expression today, and SIBLINGS in components/Siblings for where
   the variant ids come from. */
export function siblingFaceOf(tape: Tape, variant: string): string {
  return tape.faces?.[variant] ?? tape.card;
}

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
