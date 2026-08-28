import type { CSSProperties } from "react";

/* THE TAPE SHAPE, AND THE ARITHMETIC OVER ONE.
 *
 * Split out of src/data/tapes.ts so that a CLIENT component can have it. That
 * file reaches for the database now, and anything importing it drags Payload's
 * Postgres adapter along — which is fine in a server component and fatal in one
 * that ships to the browser. components/Preloader is the one that does: it needs
 * a colour per tape and nothing else, and it is "use client" because it owns the
 * cover.
 *
 * SO THE LINE IS DRAWN AT THE DATABASE, not at types-versus-values. Everything
 * here either describes a tape or computes something FROM one already in hand —
 * no query, no config import, safe anywhere. Anything that has to ask Postgres a
 * question lives in tapes.ts and is async. If a helper here ever needs the full
 * list, it belongs over there instead.
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
 * EVERY CARD CARRIED THE SAME MARK, and this type said that the moment a second
 * one existed it would grow a field and the section would read it. It has, and
 * this is it. `mark` is a file an editor uploads rather than a path a developer
 * types, and it is OPTIONAL: a claim with nothing on it gets the built-in box
 * (components/SuperPowers/Mark.tsx), which is the drawing every card wore until
 * now. So a tape whose marks have not been drawn yet is the page it always was.
 *
 * IT IS A FILE AND NOT A URL, which is the one surprising thing here. The mark
 * has to be INLINED — the bounce is CSS and CSS does not reach inside an <img>
 * — so what the section needs is the file's CONTENTS, read off the disk the
 * uploads live on. See components/SuperPowers/markSvg.ts, which does that and
 * argues the whole of why. The name and the timestamp are what it needs: one to
 * find the file, one to know when a replacement has been dropped on it.
 */

/** An uploaded drawing, as the thing that has to go and read it. */
export type MarkFile = {
  filename: string;
  /** Moves when the file is replaced. Used as a cache key, not shown. */
  updatedAt: string;
};

/** One claim on one card. See the note above. */
export type Power = {
  /** Stable key, and the React key the stack is rendered on. */
  id: string;
  /** The claim, broken where the design breaks it. */
  title: [string, string];
  /** The line under the mark. One sentence. */
  copy: string;
  /** The drawing that drops onto the card. Absent for the built-in box. */
  mark?: MarkFile;
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
  /* THE ORBIT THUMBNAIL IS NOT HERE ANY MORE. It was the one field on a tape
     that only the home page's slider ever read, and it moved with the slider
     when the two were separated — a roll on the orbit is a fact about what the
     front page is showing, not about what a product is. See
     src/globals/Homepage.ts. */

  /** Hang tag at the centre of the stage, and on the row at /products. */
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
  showcase: string;
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
  /** Per-tape overrides for the middle sections' ground. All optional; blank
   *  means the site's own colour. See SectionColours. */
  sections?: SectionColours;
};


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
/* THE SECTIONS' OWN GROUND, AND IT IS ALL OPTIONAL.
 *
 * `colours` above is the tape's palette — the colour the opening screen floods
 * with, the ink its word is punched in, the chips. It reaches two sections and
 * the scrollbar, and it always has.
 *
 * The three sections in the middle of a product page — the origin story, THE
 * SIBLINGS, SUPER POWERS and THE RUN — were the SITE's lime and dark green
 * rather than the tape's, and fixed in the stylesheet. That was a real design:
 * a page that opens in the product's colour, passes through shared brand ground
 * and hands off to the next tape's colour. This does not undo it. It makes the
 * ground editable per tape, and EVERY FIELD IS BLANK BY DEFAULT MEANING "use
 * the site's" — so a tape nobody has touched is exactly the page it was, and no
 * one has to type ten hex values to keep today's look.
 *
 * BLANK IS THE ABSENCE OF AN OVERRIDE AND NOT A COLOUR. An empty string is not
 * a value the browser can use, so the vars are omitted entirely rather than set
 * to "" — see sectionVars, which is what does the omitting. Set to "", the
 * custom property would exist and hold nothing, the fallback in the stylesheet
 * would not fire, and the section would paint transparent.
 */
export type SectionColours = {
  /** The origin story's ground. Site default #0d470c. */
  originBg?: string;
  /** THE SIBLINGS' ground. Site default #0d470c. */
  siblingsBg?: string;
  /** The three grade cards on it. Site default #c6fd00. */
  siblingsCard?: string;
  /** The name set across them. Site default #a8f000. */
  siblingsInk?: string;
  /** SUPER POWERS' sheet. Site default #b6fe00. */
  powersBg?: string;
  /** The card being read. Site default #0d470c. */
  powersCard?: string;
  /** A card waiting its turn. Site default #9bdc00. */
  powersCardRest?: string;
  /** What is printed on the open card. Site default #b6fe00. */
  powersInk?: string;
  /** THE RUN's ground. Site default #b6fe00. */
  reelBg?: string;
  /** THE RUN's writing. Site default #013900. */
  reelInk?: string;
};

/** The custom properties for one section, with the unset ones LEFT OUT.
 *
 *  Set on the section's own root element, which is where the stylesheet
 *  declares these same tokens — so an inline value wins over the class rule
 *  without a single !important, and an absent one leaves the stylesheet's
 *  default standing. That is the whole mechanism. */
function sectionVars(pairs: [string, string | undefined][]): CSSProperties {
  const out: Record<string, string> = {};
  for (const [name, value] of pairs) {
    if (value && value.trim()) out[name] = value.trim();
  }
  return out as CSSProperties;
}

/** The origin story's ground. Its ink and chips come from `colours`. */
export function originVars(s?: SectionColours): CSSProperties {
  return sectionVars([["--info-bg", s?.originBg]]);
}

export function siblingsVars(s?: SectionColours): CSSProperties {
  return sectionVars([
    ["--sib-bg", s?.siblingsBg],
    ["--sib-card-bg", s?.siblingsCard],
    ["--sib-title-ink", s?.siblingsInk],
  ]);
}

export function powersVars(s?: SectionColours): CSSProperties {
  return sectionVars([
    ["--pow-bg", s?.powersBg],
    ["--pow-card-bg", s?.powersCard],
    ["--pow-card-rest", s?.powersCardRest],
    ["--pow-card-ink", s?.powersInk],
  ]);
}

export function reelVars(s?: SectionColours): CSSProperties {
  return sectionVars([
    ["--reel-bg", s?.reelBg],
    ["--reel-ink", s?.reelInk],
  ]);
}

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
