/* The note's words, in a module of their own because both halves need them and
   neither should drag the other into its bundle: the markup wants the readable
   sentence for assistive tech, and hand.ts wants the lines to set. Importing one
   from the other would pull a React component into the client chunk to get at a
   string array. */

/* Four EXPLICIT lines, not a sentence left to wrap. A hand-written note has a
   shape — the breaks are part of the drawing, the same call the hero's headline
   and corner mark already make. Nothing wraps these: hand.ts sets a line as a
   line and starts the next one where this list says to. */
export const NOTE_LINES = [
  "we built for",
  "everyday moments.",
  /* A hyphen, not the em dash the copy wants. The alphabet is a folder of drawn
     exports and only what has been drawn can be written — see glyphs.ts, whose
     SYNTHETIC table is currently supplying this very character because it is the
     one mark in all of the site's note copy that was never exported. In this
     hand the hyphen is long and slightly rising, which is close enough to the
     dash the line is asking for. */
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
