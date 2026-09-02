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
   * THE SIBLINGS' LABEL ARTWORK — the rest of this range, one printed circular
   * label per variant, in the order they stand in the row.
   *
   * A LIST AND NOT A MAP, which is the whole of what changed here and is worth
   * the paragraph. It was keyed by variant id — normal, strong, xtra — against a
   * section that drew exactly those three cards, so an upload only appeared if
   * its key matched one of three strings nothing on the screen mentioned. Every
   * label uploaded under a name a person would actually write drew nothing.
   *
   * AND THE RANGE IS NOT THREE GRADES OF EVERYTHING. The OPP roll has three
   * variants, the cloth two, the double-sided tissue one. Three cards was a fact
   * about the mock; this is the fact about the products, so the LIST IS THE ROW
   * and its length is the number of cards.
   *
   * OPTIONAL AND EMPTY IS STILL A WORKING SECTION: no labels means three of the
   * hang tag, which is exactly the row every tape drew before any of this
   * artwork existed. See siblingFacesOf, which is the one place that decision is
   * made — heroOf above is the same shape for the same reason.
   *
   * THE ALT IS THE PICTURE'S OWN, off the media record, because the variant's
   * name is PRINTED IN THE ARTWORK and there is nowhere else to read it from.
   * A label with none falls back to the tape's name, which is a card described
   * as the thing it is a picture of rather than not described at all.
   */
  faces?: { src: string; alt: string }[];
  /** 3D roll shown in place of the card once three.js is live. GLB path. */
  model: string;
  /** The two tilted photographs. Exactly two — the layout places both by hand. */
  showcase: string;
  /** Chips in the left column. */
  tags: string[];
  /** Paragraph under the chips. */
  copy: string;
  /**
   * THE ORIGIN STORY — the inner page's second section. One paragraph, with a
   * strip of tape stuck across it, and {{tape}} in the copy is where it lands.
   *
   * IT WAS TWO STRINGS AND THE ARGUMENT FOR THAT WAS WRONG, which is worth
   * writing down because it sounded right for months: where the tape falls is a
   * DRAWING decision, so it should be explicit in the shape of the data rather
   * than parsed out of a sentence. The shape it produced was a pair of halves
   * with nothing to say what the halves were — a required "exactly two lines"
   * on a field whose second line was not a line at all — and the only position
   * it could express was the join between them. One strip, between two runs of
   * words, and never anywhere else in the paragraph.
   *
   * A token IS explicit. It is in the copy because the position is a fact about
   * the copy: it goes between these two words and not those two, and an editor
   * reading the box can see exactly where. It can appear anywhere, including
   * mid-sentence and at the very end, and more than once if a paragraph ever
   * wants two.
   *
   * WHICH TAPE IS NOT IN HERE, and that is on purpose. The token says WHERE; the
   * roll is a fact about the product and lives in code beside the rest of the
   * artwork — see STORY_ROLL in components/TapeSlider/strips.ts.
   *
   * Line breaks in the copy are whitespace. The paragraph flows to its own
   * measure and always has; the old second "line" was the marker, not a break.
   *
   * Sentence case here and uppercase on the page — the caps are the section's
   * setting (text-transform in global.css), so the copy stays readable in the
   * data file and in a screen reader.
   */
  origin: string;
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

/* WHAT THE SIBLINGS ROW IS MADE OF, and the whole of that fallback in one place
 * as well.
 *
 * THE LIST IS THE ROW: one card per label, in the order they were added. A tape
 * whose artwork has not been drawn yet gets THREE OF THE HANG TAG — the row the
 * section drew for all six before any of it existed, which is a working section
 * rather than an empty green band. Add one label and the fallback stops applying
 * for that tape entirely, so a half-filled tape is never three cards where one
 * is real and two are the wrong picture. */
const FALLBACK_FACES = 3;

export function siblingFacesOf(tape: Tape): { src: string; alt: string }[] {
  if (tape.faces?.length) return tape.faces;
  return Array.from({ length: FALLBACK_FACES }, () => ({
    src: tape.card,
    alt: tape.label,
  }));
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
 * The four sections in the middle of a product page — the origin story, THE
 * SIBLINGS, SUPER POWERS and THE RUN — were the SITE's lime and dark green
 * rather than the tape's, and fixed in the stylesheet. That was a real design:
 * a page that opens in the product's colour, passes through shared brand ground
 * and hands off to the next tape's colour. This does not undo it. It makes the
 * ground editable per tape, and EVERY FIELD IS BLANK BY DEFAULT MEANING "leave
 * it as it is" — so a tape nobody has touched is exactly the page it was, and no
 * one has to type seventeen hex values to keep today's look.
 *
 * AND THE OPENING SCREEN IS IN HERE TOO, which reads like a contradiction: that
 * screen is already in the tape's colour and was never the site's. It is here
 * because being painted in the palette is not the same as being able to SET the
 * palette — the same six values paint the roll in three other places. See
 * introVars, which is the only helper in this file whose blank falls back to the
 * tape rather than to the stylesheet.
 *
 * BLANK IS THE ABSENCE OF AN OVERRIDE AND NOT A COLOUR. An empty string is not
 * a value the browser can use, so the vars are omitted entirely rather than set
 * to "" — see sectionVars, which is what does the omitting. Set to "", the
 * custom property would exist and hold nothing, the fallback in the stylesheet
 * would not fire, and the section would paint transparent.
 */
export type SectionColours = {
  /** The opening screen's sheet. Blank means the tape's own `colours.bg`, which
   *  is what it has always been. See introVars for why this exists. */
  introBg?: string;
  /** THE and the tape's word on that sheet. Blank means `colours.word`. */
  introWord?: string;
  /** The chip above the mark — its fill. Blank means `colours.tagBg`. */
  introTagBg?: string;
  /** And its text. Blank means `colours.tagInk`. */
  introTagInk?: string;
  /** The line of copy beside the roll. Blank means `colours.ink`. */
  introInk?: string;
  /** The origin story's ground. Site default #0d470c. */
  originBg?: string;
  /** Everything written on it — the story, the rule under its last word, the
   *  arrow into the margin and the handwritten note. ONE FIELD FOR FOUR THINGS
   *  on purpose: they are the same lime in the design, and the section's own
   *  note in global.css argues that at length — every mark on this ground is
   *  one colour because that is the pairing the home page opens and closes on.
   *  Splitting it into four boxes would invite a page where the story and the
   *  note beside it are written in different hands. Site default #b6fe00. */
  originInk?: string;
  /** THE SIBLINGS' ground. Site default #0d470c. */
  siblingsBg?: string;
  /** The three grade cards on it. Site default #c6fd00. */
  siblingsCard?: string;
  /** The name set across them. Site default #a8f000. */
  siblingsInk?: string;
  /** SUPER POWERS' sheet. Site default #b6fe00. */
  powersBg?: string;
  /** The two words themselves, one either side of the stack. Its own field and
   *  not `powersInk`: that is what is printed on the OPEN CARD, which is a
   *  different surface — the name is set on the sheet and the claim is set on
   *  the card, and on the site's own palette those are the dark green and the
   *  lime respectively. Site default #013900. */
  powersHeading?: string;
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

/** THE OPENING SCREEN, AND WHY IT IS HERE AT ALL.
 *
 *  Every other section in this list overrides a colour the STYLESHEET sets. This
 *  one overrides a colour the TAPE sets, which is a different kind of override
 *  and the reason it was missing for so long: the opening screen is already
 *  painted in the tape's palette, so it looked like the one section that already
 *  had its own colours.
 *
 *  It does not. `colours` is not the opening screen's palette — it is the TAPE's,
 *  and it is read in four places: this screen, the roll buttons in the home
 *  page's orbit, the row at /products, and the door NEXT UP opens. Change bg to
 *  repaint the opening screen and the roll's chip on the home page changes with
 *  it. There was no way to say "this section, in this colour" without saying it
 *  about the whole product everywhere it appears.
 *
 *  So these five are the same bargain the other four sections get — blank means
 *  the colour it already was — with one difference worth stating: blank here
 *  falls back to the TAPE's palette rather than to the site's, because that is
 *  what the section falls back to. Nothing has a hex for a placeholder for the
 *  same reason; the default is a different colour on every product.
 *
 *  SET AFTER cssVars ON THE SAME ELEMENT, which is the whole mechanism — see
 *  components/ProductIntro. The palette lands first under the names the shared
 *  component rules read, and an override lands on top of it. The tape's own
 *  --bg and --word are left alone underneath, so anything reading the PALETTE
 *  rather than the section still gets the palette. */
export function introVars(s?: SectionColours): CSSProperties {
  return sectionVars([
    ["--stage-bg", s?.introBg],
    ["--word-colour", s?.introWord],
    ["--tag-bg", s?.introTagBg],
    ["--tag-ink", s?.introTagInk],
    ["--ink", s?.introInk],
  ]);
}

/** The origin story's ground and everything written on it. The chips are the
 *  tape's own and come from `colours` rather than from here. */
export function originVars(s?: SectionColours): CSSProperties {
  return sectionVars([
    ["--info-bg", s?.originBg],
    ["--info-ink", s?.originInk],
  ]);
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
    ["--pow-ink", s?.powersHeading],
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
