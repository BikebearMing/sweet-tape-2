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

/**
 * ONE SUPERPOWER — a claim about what this tape does, printed on a card of its
 * own.
 *
 * Three of them per tape, and together they are the product page's fifth
 * section: a stack the reader scrolls through a card at a time, each card
 * growing as its turn comes and settling back when the next one takes over. See
 * components/SuperPowers.
 *
 * PER TAPE AND NOT PER RANGE, which is the one thing about this shape worth
 * arguing. THE SIBLINGS above it is three GRADES of one tape and is therefore a
 * fact about the range — it lives in the component. What a tape is GOOD AT is
 * not: a masking tape and a cloth tape do not have the same three powers, and a
 * shape that could not say so would have to be unpicked the first time somebody
 * wrote the real copy.
 *
 * `title` arrives BROKEN, as two lines, for the reason `reel.headline` gives:
 * where display type this size turns is a drawing decision, and nothing should
 * be inferring it from the string at render time. Exactly two — the card is a
 * fixed shape and a third line would either overflow it or shrink the other two
 * to fit a line only one card asked for.
 *
 * `copy` is one SENTENCE and deliberately not an array of lines. It is set in
 * the body voice and arrives a line at a time (components/bodyReveal.ts), so it
 * does wrap on the page — but where it wraps is settled by the font, the measure
 * and the window, which is exactly the thing bodyReveal.ts exists to measure
 * rather than mark up.
 *
 * Sentence case here and uppercase on the page for the titles: the caps are the
 * section's setting (text-transform in global.css), so the copy stays readable
 * in this file and in a screen reader. The sentence under the mark is set as
 * written.
 *
 * NO ARTWORK FIELD, AND THAT IS DELIBERATE. Every card is currently drawn with
 * the same mark — the box in components/SuperPowers/Mark.tsx — because it is the
 * only one of the three that has been drawn. The moment a second exists this
 * type grows an `icon` and the section reads it; adding the field today would be
 * eighteen copies of one path, which is a worse lie than one honest placeholder.
 */
export type Power = {
  /** Stable key, and the React key the stack is rendered on. */
  id: string;
  /** The claim, broken where the design breaks it. */
  title: [string, string];
  /** The line under the mark. One sentence. */
  copy: string;
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
  /**
   * THE INNER PAGE'S OWN EXPORT, and it exists so the two stages can be art
   * directed apart.
   *
   * `model` above is the home page's: it is what the orbit of six loads and what
   * the key visual flips between, and it is authored for that stage — small in
   * frame, seen for a moment, one of six. The product page shows ONE roll, most
   * of a screen tall, held still and then turned over slowly, and what reads
   * well there is not automatically what reads well there. Metalness, gloss and
   * the label's own finish are the obvious places the two want to differ.
   *
   * SO THIS IS A SECOND FILE, NOT A SECOND SETTING. Anything that can be dialled
   * at runtime already can be — see `material` in TapeSlider/tape3d.ts, which is
   * the cheaper answer for metalness and roughness and needs no re-export. This
   * field is for what only Blender can say: different maps, a different finish
   * on one part, geometry the close-up wants and the thumbnail does not.
   *
   * OPTIONAL, AND ONLY OPP DECLARES IT — the same shape as `hero` and `faces`
   * above and for the same reason. The other five inner pages load the home
   * page's export, which is a working page rather than five copies of a file
   * nobody has edited. Drop one in, name it here, and that tape alone splits.
   *
   * THE BOUNDING BOX IS NOT FREE TO CHANGE. Every export on this site measures
   * 0.999 x 0.472 x 0.997 and the flip's edge-on handoff is built on it (see the
   * note over CAMERA_Z in tape3d.ts). A separated export is free to be a
   * different MATERIAL; it is not free to be a different SIZE.
   *
   * See innerModelOf, which is the one place the fallback is decided.
   */
  modelInner?: string;
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
  /**
   * THE RUN — the product page's fourth section, and the only per-tape thing in
   * it. See components/ProductReel: a pinned frame the page scrolls sideways
   * through, opening on one photograph with the claim beside it and closing on
   * three more.
   *
   * `headline` is THE CLAIM, and it arrives BROKEN. Four lines on the mock, each
   * a string, because where a line of display type this size turns is a drawing
   * decision — the same call `origin` above makes about where the tape lands in
   * the sentence, and for the same reason: nothing should be inferring it from
   * the copy at render time. A tape whose claim wants three lines gives three.
   *
   * Sentence case here and uppercase on the page — the caps are the section's
   * setting, so the copy stays readable in the data file and in a screen reader.
   *
   * `note` is the aside scribbled beside the printed label. Lines, not a
   * sentence, and ASCII only, for exactly the reasons `character` gives above —
   * it is written by the same hand (components/HandNote). It is a SECOND note
   * rather than a reuse of `character`: both are on this page, and the same
   * sentence in the same handwriting twice on one page reads as a mistake.
   *
   * `shots` is FOUR PHOTOGRAPHS in the order the camera meets them — the opener
   * that the section is parked on when it takes the screen, then the three that
   * close the run. Exactly four: the arrangement places every one of them by
   * hand, so a fifth would have nowhere to stand.
   */
  reel: {
    headline: string[];
    note: string[];
    shots: [string, string, string, string];
  };
  /**
   * THE THREE SUPERPOWERS — the product page's fifth section, between THE
   * SIBLINGS and THE RUN. Exactly three: the stack is an arrangement rather than
   * a list, and a fourth card would have nowhere to stand. See the Power type
   * above for what one is, and components/SuperPowers for the stack.
   */
  powers: [Power, Power, Power];
  colours: TapeColours;
};

/* THE THREE SUPERPOWERS, PLACEHOLDER, AND SHARED BY EVERY TAPE UNTIL THEY ARE
 * NOT.
 *
 * `powers` is per tape and the type says so at length. What is written here is
 * the MOCK's three — drawn for the OPP tape — standing in for all six until the
 * real copy is written.
 *
 * ONE CONST RATHER THAN THE SAME THREE CARDS SIX TIMES, and that is the whole
 * point of it: six identical blocks read as six decisions that happened to
 * agree, which is the one thing this is not. Give a tape its own array and it
 * stops sharing — nothing else in the codebase has to change — and the day the
 * last one is written this const has no references left and goes with them.
 *
 * The unfinished tape's colours below carry `// placeholder` for the same
 * reason and say the same thing. */
const PENDING_POWERS: [Power, Power, Power] = [
  {
    id: "heavy-duty",
    title: ["HEAVY", "DUTY"],
    copy: "Built for heavy loads and long hauls", // placeholder
  },
  {
    id: "box-sealer",
    title: ["BOX", "SEALER"],
    copy: "Seals boxes so well, they arrive looking like you personally escorted them.", // placeholder
  },
  {
    id: "neat-seal",
    title: ["NEAT", "SEAL"],
    copy: "Seals so clean it looks professional", // placeholder
  },
];

export const tapes: Tape[] = [
  {
    id: "masking",
    label: "Masking tape",
    word: "creative",
    roll: "/assets/slider/masking/roll.webp",
    card: "/assets/slider/masking/card.webp",
    model: "/assets/tapes/Masking-Tape.glb",
    showcase: ["/assets/slider/masking/shot-1.webp", "/assets/slider/masking/shot-2.webp"],
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
    reel: {
      /* PLACEHOLDER — the claim has not been written for this tape. The breaks
         are the design's, not the copy's; see `reel` in the type above. */
      headline: [
        "Placeholder claim",
        "for the masking",
        "tape, in four",
        "lines.",
      ], // placeholder
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/masking/shot-2.webp",
        "/assets/slider/masking/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/masking/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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
    roll: "/assets/slider/double/roll.webp",
    card: "/assets/slider/double/card.webp",
    model: "/assets/tapes/Double-Tape.glb",
    showcase: ["/assets/slider/double/shot-1.webp", "/assets/slider/double/shot-2.webp"],
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
    reel: {
      /* PLACEHOLDER — the claim has not been written for this tape. The breaks
         are the design's, not the copy's; see `reel` in the type above. */
      headline: [
        "Placeholder claim",
        "for the double-",
        "sided tape, in",
        "four lines.",
      ], // placeholder
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/double/shot-2.webp",
        "/assets/slider/double/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/double/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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
    roll: "/assets/slider/stationery/roll.webp",
    card: "/assets/slider/stationery/card.svg",
    model: "/assets/tapes/Cello-Tape.glb",
    showcase: [
      "/assets/slider/stationery/shot-1.webp",
      "/assets/slider/stationery/shot-2.webp",
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
    reel: {
      /* PLACEHOLDER — the claim has not been written for this tape. The breaks
         are the design's, not the copy's; see `reel` in the type above. */
      headline: [
        "Placeholder claim",
        "for the stationery",
        "tape, in four",
        "lines.",
      ], // placeholder
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/stationery/shot-2.webp",
        "/assets/slider/stationery/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/stationery/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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
    roll: "/assets/slider/cloth/roll.webp",
    card: "/assets/slider/cloth/card.webp",
    model: "/assets/tapes/Cloth-Tape.glb",
    showcase: ["/assets/slider/cloth/shot-1.webp", "/assets/slider/cloth/shot-2.webp"],
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
    reel: {
      /* PLACEHOLDER — the claim has not been written for this tape. The breaks
         are the design's, not the copy's; see `reel` in the type above. */
      headline: [
        "Placeholder claim",
        "for the cloth",
        "tape, in four",
        "lines.",
      ], // placeholder
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/cloth/shot-2.webp",
        "/assets/slider/cloth/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/cloth/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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
    roll: "/assets/slider/opp/roll.webp",
    card: "/assets/slider/opp/card.svg",
    /* The only one delivered so far, and the page was designed around it. Not
       under /assets/slider/opp/ with the rest of this tape's files, because it
       is not the slider's: the folder note at the top of this file says a
       tape's artwork lives together, and this is the exception worth naming
       rather than the rule being broken. Move it in when the other five land
       and the whole set can be keyed by id. */
    hero: "/assets/opp-tape-inner-product.webp",
    /* The brown packing roll. It was opp.glb, which was in the tree, unused,
       and was a guess; this is the export the artwork was actually made for.
       It USED to be the hero's roll too — the hero now dispenses the low-noise
       one (Hero/engine.ts MODEL_URL), so the object the page opens with is the
       entry below rather than this one. */
    model: "/assets/tapes/header-brown.glb",
    /* THE ONE TAPE SPLIT SO FAR, and it is split because it is the one the inner
       page was designed around — see `modelInner` above.
       IT IS A COPY OF THE LINE ABOVE TODAY, byte for byte, so the page looks
       exactly as it did before the split. That is the point: the seam is open
       and the home page is out of the way, so this file can be re-exported with
       whatever metalness, gloss and maps the close-up wants without the orbit of
       six changing by a pixel. Keep the bounding box. */
    modelInner: "/assets/tapes/Header-Brown-Inner.glb",
    showcase: ["/assets/slider/opp/shot-1.webp", "/assets/slider/opp/shot-2.webp"],
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
    reel: {
      /* The one that is written. Straight off the design. */
      headline: [
        "Your parcel",
        "arriving",
        "exactly the way",
        "you packed it",
      ],
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/opp/shot-2.webp",
        "/assets/slider/opp/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/opp/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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
    roll: "/assets/slider/opp-quiet/roll.webp",
    card: "/assets/slider/opp-quiet/card.webp",
    /* THE HERO'S ROLL — the same file Hero/engine.ts opens the page with, so
       the slider shows the object the visitor has already been watching rather
       than a second model of it. */
    model: "/assets/tapes/Low-Noise-Tape.glb",
    showcase: [
      "/assets/slider/opp-quiet/shot-1.webp",
      "/assets/slider/opp-quiet/shot-2.webp",
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
    reel: {
      /* PLACEHOLDER — the claim has not been written for this tape. The breaks
         are the design's, not the copy's; see `reel` in the type above. */
      headline: [
        "Placeholder claim",
        "for the low-noise",
        "OPP tape, in four",
        "lines.",
      ], // placeholder
      /* PLACEHOLDER — three short lines in somebody's handwriting. ASCII only. */
      note: [
        "placeholder note",
        "beside the label,",
        "three lines long.",
      ], // placeholder
      /* PLACEHOLDER — none of the four photographs has been shot. This tape's own
         two slider stills and the home page's key visual stand in, with the
         first still opening AND closing the run, so the section reads today
         rather than showing four broken images. Replace all four when the
         artwork lands. */
      shots: [
        "/assets/slider/opp-quiet/shot-2.webp",
        "/assets/slider/opp-quiet/shot-1.webp",
        "/assets/make-it-stick.jpg",
        "/assets/slider/opp-quiet/shot-2.webp",
      ], // placeholder
    },
    powers: PENDING_POWERS, // placeholder — see PENDING_POWERS above
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

/* THE ONE AFTER THIS ONE, and it wraps.
 *
 * The order is the order of `tapes` above — which is the order the row at
 * /products stands in and the order the slider's orbit turns through — so NEXT
 * UP at the foot of an inner page means the same "next" a reader has already
 * been shown twice. There is no separate running order to keep in step.
 *
 * IT WRAPS RATHER THAN ENDING, and that is what makes the section unconditional:
 * the last tape's next is the first, so every inner page has one and no page
 * needs a branch for the case where it does not. A reader who follows it round
 * arrives back where they started having seen all six, which is a better end
 * than a panel that quietly disappears on one page out of six.
 *
 * Falls back to the tape itself if it is somehow not in the list — a link back
 * to the page you are on is inert, which is the right failure for a piece of
 * navigation that has lost its place.
 */
export function nextTape(tape: Tape): Tape {
  const i = tapes.findIndex((t) => t.id === tape.id);
  return i < 0 ? tape : tapes[(i + 1) % tapes.length];
}

/* WHICH PICTURE THE INNER PAGE SHOWS, and the whole of the fallback in one
   place. See the `hero` field above for why five tapes take the second half of
   this expression today. */
export function heroOf(tape: Tape): string {
  return tape.hero ?? tape.card;
}

/* WHICH ROLL THE INNER PAGE LOADS. The tape's own export if it has been split
   off for that stage, the home page's otherwise — see the `modelInner` field
   above for why splitting is a decision per tape rather than a rule. The one
   place this fallback is made, so ProductIntro never has to know there is one. */
export function innerModelOf(tape: Tape): string {
  return tape.modelInner ?? tape.model;
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
