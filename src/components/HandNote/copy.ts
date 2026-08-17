/* The note's words, in a module of their own because both halves need them and
   neither should drag the other into its bundle: the markup wants the readable
   sentence for assistive tech, and hand.ts wants the lines to hand to Vara.
   Importing one from the other would pull a React component into the client
   chunk to get at a string array. */

/* Four EXPLICIT lines, not a sentence left to wrap. A hand-written note has a
   shape — the breaks are part of the drawing, the same call the hero's headline
   and corner mark already make — and Vara's own wrapping is measured in a mix
   of px and font units, which is not a thing to hand a line break to. hand.ts
   turns wrapping off entirely. */
export const NOTE_LINES = [
  "we built for",
  "everyday moments.",
  /* A hyphen, not the em dash the copy wants. Vara's fonts are JSON files of
     drawn glyphs, and this one carries ASCII 33–126 and nothing else; an em
     dash would come out as the question mark Vara substitutes for anything it
     cannot draw. In this hand the hyphen is long and slightly rising, which is
     close enough to the dash the line is asking for. */
  "not industrial-just",
  "real life.",
];

/* The readable sentence for the screen-reader text node is joined in the markup
   now rather than exported from here as a second constant — the note takes its
   lines as an argument, so the only place that knows which lines an instance is
   carrying is the instance. */

/* How the lines cross from the markup to the drawing.
 *
 * The note is server-rendered and hand.ts finds its instances by querying the
 * DOM, so an instance's copy has to be ON the element rather than passed down a
 * prop chain the drawing never sees — the same call every other per-instance
 * setting already makes (--hand-ink, --hand-draw), just in an attribute rather
 * than a custom property, because this one is a list and not a value.
 *
 * A pipe rather than a newline: a literal LF survives the HTML parser, but it
 * is invisible in the source, in devtools and in a diff, and the one thing this
 * separator must never be is something a line of copy could contain by
 * accident. No hand-written note has a pipe in it. */
export const LINE_SEP = "|";
