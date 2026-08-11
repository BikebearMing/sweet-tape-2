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

/* The same copy as one readable sentence, for the screen-reader text node. */
export const NOTE_COPY = NOTE_LINES.join(" ");
