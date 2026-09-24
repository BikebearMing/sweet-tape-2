/* Four EXPLICIT lines, not a sentence left to wrap. A hand-written note has a
   shape — the breaks are part of the drawing, the same call the hero's headline
   and corner mark already make. Nothing wraps these: each is its own line box
   in HandNote/index.tsx. */
export const NOTE_LINES = [
  "we built for",
  "everyday moments.",
  "not industrial—just",
  "real life.",
];

/* The readable sentence for the screen-reader text node is joined in the markup
   now rather than exported from here as a second constant — the note takes its
   lines as an argument, so the only place that knows which lines an instance is
   carrying is the instance. */
