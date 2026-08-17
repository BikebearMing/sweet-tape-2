import type { ReactNode } from "react";

/* Running copy, split for the LINE reveal — the site's second text entrance.
 *
 * The headlines are split to letters (see letters.tsx) and go up in a shuffled
 * scatter. Body copy does not: it is small, it is read rather than looked at,
 * and forty characters sparkling into place is a lot of event for one sentence.
 * So a paragraph arrives a line at a time, each line sliding up out of a floor
 * you cannot see — nothing else moves, and the reader gets the sentence in the
 * order they were going to read it in anyway.
 *
 * WHY WORDS AND NOT LINES, when the effect is per line. A line is not a thing
 * the markup can know: it is decided by the font, the measure and the window,
 * and it changes when any of those do. So the split is to WORDS — the largest
 * unit that is stable — and bodyReveal.ts groups them back into lines by
 * measuring where they landed, at the moment it plays. One word per box means
 * the paragraph still wraps exactly where the unsplit text would have, because
 * the spaces between the boxes are real text nodes with their own width.
 *
 * Two boxes each, the same shape letters() uses: .body-clip holds the word's
 * place in the line and masks it, .body-rise is the only thing that moves. The
 * mask is what makes the floor invisible — it is the word's own line box, so
 * there is no edge on the page for the copy to slide out of, only the line the
 * copy was going to sit on.
 *
 * Server-rendered wherever it is called, like letters(): no unsplit flash, no
 * splitter running on mount, and nothing here ships to the client.
 */
export function bodyCopy(text: string): ReactNode[] {
  /* Whitespace-collapsed on the way in, so copy written across several source
     lines does not arrive with empty boxes in it. The separator is put back as
     a real space between the boxes rather than as padding on them — an ordinary
     space is what the browser breaks a line at, and a box with a margin is not
     something it will ever break. */
  return text
    .trim()
    .split(/\s+/)
    .flatMap((word, i) => [
      i > 0 ? " " : null,
      <span className="body-clip" key={i}>
        <span className="body-rise">{word}</span>
      </span>,
    ]);
}
