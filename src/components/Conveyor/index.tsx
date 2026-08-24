import type { CSSProperties, ReactNode } from "react";

import Stage from "./Stage";

/* THE BELT — /about's second screen, and the page's first picture of the problem.
 *
 * THREE ROWS OF ROUNDED PILLS RUNNING PAST THE WINDOW, most of them a photograph
 * of a shelf and three of them a line of the argument. Read left to right it is
 * one sentence in three parts: rows of products, endless choices that somehow all
 * blur together, same plain packaging — the aisle the brand was invented to be
 * the exception to. TO REIMAGINE at the foot of the page is the answer to it.
 *
 * THE ROWS ARE LONGER THAN THE WINDOW AND ARE MEANT TO BE. Each one measures
 * between 180 and 200vw, so what is on screen is a crop of a belt that carries
 * on past both edges — which is the whole point of the drawing. The reader is
 * looking at part of something that does not end. See .conveyor-track in
 * global.css for the two declarations that keep a row from being squeezed back
 * into the window, which is what flex does to it by default.
 *
 * AND EACH ROW IS PRINTED REPEAT TIMES, which is what makes the direction of a
 * row a free choice rather than something the geometry decides. One copy is
 * ~190vw against a 100vw window, so a single-copy row has under 90vw of travel
 * in it before an end comes into view — and which 90vw depends on where it
 * starts, so a row parked with its right-hand end near the screen can only ever
 * move right. That is a constraint on the DESIGN coming from the length of the
 * markup, which is the wrong way round. Three copies give every row ~380vw of
 * slack, and any row can then run either way from wherever the composition wants
 * it to start.
 *
 * THE COPIES ARE THE SAME PILLS AND ARE NOT NEW CONTENT. Only the first is real:
 * the rest are aria-hidden, so the sentence is announced once and a reader using
 * a screen reader is not told about rows of products three times. This is also
 * what a seamless loop would need if the belt is ever put on a clock instead of
 * on the scroll.
 *
 * AND THE BELT RUNS. Each row is dragged across the window as the section goes
 * by — the top one to the RIGHT and the two under it to the LEFT, so the rows
 * work against each other the way the belts in a machine do. It is scrubbed to
 * the scroll and has no clock of its own: see ./belt.ts, which is the whole of
 * the movement.
 *
 * EACH ROW CARRIES ITS OWN TRAVEL, here, with the row. Where a row starts and
 * where it ends is composition — the same kind of decision as which pill goes
 * where — so it is stated once in ROWS and read off the markup by the engine,
 * which knows that a row travels and not where to. All three are one property,
 * --x; nothing else in the stylesheet has to know the belt moves at all.
 *
 * `from` IS ALSO THE POSE THE MARKUP RESTS ON — what a page with no script, and
 * a reader who has asked for less motion, is left looking at. It used to be a
 * third number because the start of the travel was not a composition anybody
 * would want to stop on; it is one now, because the start IS the drawing: all
 * three claims readable at once, which is the pose the belt sets off from.
 *
 * THE PHOTOGRAPHS ARE NOT IN THE REPOSITORY YET, and the pills are drawn without
 * them rather than filled with stand-ins. What is in public/assets is a set of
 * 204x210 product thumbnails, and one of those blown across a 51vw pill is a
 * worse lie about the design than an empty pill is. Give a row's item a `photo`
 * and it renders one; until then the belt is its shapes, which is the half of
 * the design that is settled. components/AboutOpen above it makes the same
 * argument about a screen that has no copy yet.
 *
 * Server-rendered but for Stage, the hair-thin client wrapper that owns the ref
 * and hands the section to belt.ts; nothing below that line is a client
 * component.
 */

type Size = "sm" | "med" | "xl" | "xxl";

type Item =
  /** A pill with a photograph in it — or, until the photographs land, without. */
  | { kind: "photo"; size: Size; photo?: { src: string; alt: string } }
  /** A pill carrying one part of the sentence, numbered. */
  | { kind: "claim"; size: Size; index: string; lines: [string, string] }
  /** The aside under the second claim — small copy, not a heading. */
  | { kind: "note"; size: Size; lines: [string, string] }
  /** The mark, lying on the belt between two pills. */
  | { kind: "mark" };

/* THE BELT ITSELF. Document order is left-to-right order and top-to-bottom
 * order, so the arrangement is stated once, here, and the stylesheet only ever
 * says how big a pill of each size is.
 *
 * THE LINE BREAKS ARE A DRAWING, which is why a claim is two strings and not one
 * sentence left to the browser. Where display type this size turns is decided by
 * looking at it; a measure that decided it for us would re-break the block at
 * the first window that is not 1440 wide. Every headline on this site is stored
 * this way — see Reimagine's LINES.
 *
 * from / to ARE IN vw, positive right and negative left, measured on the row's
 * own left edge — which with REPEAT copies is the left edge of the FIRST copy,
 * so the numbers run to a few hundred negative and that is normal. The figures
 * are large because they are absolute positions in a belt three times the length
 * of the one on screen, not distances travelled; the travel is the difference,
 * and it is 76, 114 and 75vw.
 *
 * THE SIGN OF THE RUN IS THE ARRANGEMENT: row one runs LEFT, row two RIGHT and
 * row three LEFT, so no two neighbours are going the same way and the belts read
 * as working against each other rather than as three copies of one slide.
 *
 * WHERE ROW TWO STOPS IS THE POINT OF THE SECTION, and it is the one end that is
 * not a matter of taste: it is the position that leaves the mark standing in the
 * middle of the window with the claims run off both sides — see MARK in
 * ./belt.ts, which takes over from exactly there. The other two ends are chosen
 * to CLEAR, so that nothing is competing with the mark at the moment it is left
 * alone. */
type RowSpec = { from: number; to: number; items: Item[] };

/* HOW MANY TIMES EACH ROW IS PRINTED. Three is the smallest number that covers a
   100vw window at both ends of a ~115vw run through a ~190vw row, with a copy in
   hand on either side. */
const REPEAT = 3;

const ROWS: RowSpec[] = [
  {
    from: -87.1,
    to: -163.1,
    items: [
      { kind: "photo", size: "xl" },
      { kind: "photo", size: "med" },
      { kind: "photo", size: "sm" },
      {
        kind: "claim",
        size: "med",
        index: "01",
        lines: ["ROWS OF", "PRODUCTS."],
      },
      { kind: "photo", size: "xl" },
    ],
  },
  {
    from: -402.3,
    to: -284.8,
    items: [
      { kind: "photo", size: "sm" },
      {
        kind: "claim",
        size: "xxl",
        index: "02",
        lines: ["ENDLESS CHOICES THAT", "SOMEHOW ALL BLUR TOGETHER."],
      },
      { kind: "photo", size: "med" },
      { kind: "mark" },
      { kind: "photo", size: "xl" },
    ],
  },
  {
    from: -80.1,
    to: -155.1,
    items: [
      { kind: "photo", size: "xl" },
      {
        kind: "note",
        size: "med",
        lines: ["Very few stood out.", "Even fewer felt memorable."],
      },
      { kind: "photo", size: "med" },
      { kind: "photo", size: "sm" },
      {
        kind: "claim",
        size: "med",
        index: "03",
        lines: ["SAME PLAIN", "PACKAGING."],
      },
    ],
  },
];

/* THE MARK, AS A SILHOUETTE. The blob the wordmark is normally printed inside,
 * on its own and in the PILL's colour rather than in lime — so it reads as one
 * more shape that happens to be on the belt, and only gives itself away to
 * somebody already looking for it. That is why there is no title on it and why
 * it is hidden from the accessibility tree: announcing it would be announcing a
 * logo the design is deliberately not showing. */
function Mark() {
  return (
    <svg
      className="conveyor-mark"
      viewBox="0 0 346 226"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M322.945 92.7338C319.858 87.5561 318.685 81.4523 319.627 75.5039L320.87 67.6905L326.135 34.4657C326.946 29.3459 322.448 24.9631 317.382 25.9413L298.5 29.5875C294.587 30.3481 290.537 29.4378 287.276 27.1354C254.224 3.72249 204.237 -6.18497 151.695 3.9665C99.1544 14.118 56.4285 41.9426 34.417 76.0002C32.242 79.3618 28.8256 81.7036 24.9125 82.4642L6.03069 86.1104C0.965064 87.0887 -1.59253 92.8282 1.06313 97.2848L18.2684 126.16L22.3188 132.946C25.4055 138.124 26.5786 144.228 25.6369 150.176L24.3937 157.99L19.1282 191.214C18.3174 196.334 22.816 200.717 27.8816 199.739L46.7635 196.093C50.6765 195.332 54.7261 196.242 57.9872 198.545C91.0397 221.958 141.017 231.866 193.568 221.714C246.109 211.562 288.835 183.737 310.847 149.68C313.022 146.318 316.438 143.976 320.351 143.216L339.233 139.57C344.298 138.591 346.856 132.852 344.2 128.395L326.995 99.5198L322.945 92.7338Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* `echo` is a repeat of the row rather than the row itself — see REPEAT. It is
   the same pills, printed again to give the row length, so it is hidden from the
   accessibility tree: the sentence is read once. */
/* ONE LINE OF COPY, IN THE TWO BOXES A MASKED REVEAL NEEDS. .conveyor-clip holds
   the line's place in the block and crops it; .conveyor-rise is the only thing
   that moves. Two elements because one cannot both stay put and travel — the
   same split components/letters.tsx makes per LETTER for the headlines that get
   the full treatment. Per line here, not per letter: these are labels on a
   moving belt rather than a statement the page stops for, and twenty-three
   letters arriving one at a time on a pill that is itself sliding sideways is
   two movements competing for the same attention.

   A block rather than a <br>-separated run, so each line is its own box with its
   own mask. The line break is still a drawing and is still stated in the copy —
   see the note on lines above. */
function Line({ children }: { children: ReactNode }) {
  return (
    <span className="conveyor-clip">
      <span className="conveyor-rise">{children}</span>
    </span>
  );
}

function Train({ item, echo }: { item: Item; echo?: boolean }) {
  if (item.kind === "mark") return <Mark />;

  const className = `conveyor-train is-${item.size}`;
  const hidden = echo || undefined;

  if (item.kind === "photo") {
    return (
      <div className={className} aria-hidden={hidden}>
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo.src}
            alt={item.photo.alt}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
    );
  }

  if (item.kind === "note") {
    return (
      <div className={`${className} has-text`} aria-hidden={hidden}>
        <p className="conveyor-note">
          <Line>{item.lines[0]}</Line>
          <Line>{item.lines[1]}</Line>
        </p>
      </div>
    );
  }

  /* THE NUMBER IS NOT PART OF THE SENTENCE. It is a marker set beside the
     heading's first line — printed, so it is there for a sighted reader, and
     hidden from the accessibility tree so the heading is announced as the two
     words it is rather than as "01 rows of products". */
  return (
    <div className={`${className} has-text`} aria-hidden={hidden}>
      <div className="conveyor-claim">
        <span className="conveyor-index" aria-hidden="true">
          {item.index}
        </span>
        <h2 className="h2">
          <Line>{item.lines[0]}</Line>
          <Line>{item.lines[1]}</Line>
        </h2>
      </div>
    </div>
  );
}

export default function Conveyor() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE COPY IS STILL THERE. global.css parks every line
          under its mask so there is no frame of it standing in place before the
          reveal takes it away, which means a page with no script would park the
          sentence and never let it go. This releases it, and costs nothing when
          scripting is on — the contents of a noscript element are not even
          parsed. The reduced-motion rule in global.css says the same thing.
          components/Reimagine makes the same provision the same way. */}
      <noscript>
        <style>{`.conveyor-rise { transform: none }`}</style>
      </noscript>

      <div className="conveyor-belt">
        {ROWS.map((row, r) => (
          <div
            className="conveyor-track"
            key={r}
            /* The travel goes on the element as data rather than into a module
               the engine imports, so the row and everything about the row are in
               one place and belt.ts stays a mechanism. Document order is play
               order here exactly as it is for the pills. */
            data-x-from={row.from}
            data-x-to={row.to}
            /* How many times the row is printed, so the engine can work out one
               copy's length and wrap the idle drift on it — see IDLE in
               ./belt.ts. It reads the row's own width and divides. */
            data-repeat={REPEAT}
            style={{ "--x": `${row.from}vw` } as CSSProperties}
          >
            {/* The copies are emitted FLAT rather than each in a wrapper: the
                track's own gap is what joins one copy to the next, so a copy
                boundary is spaced exactly like every other join in the row and
                there is no seam to see. */}
            {Array.from({ length: REPEAT }, (_, copy) =>
              row.items.map((item, i) => (
                <Train item={item} echo={copy > 0} key={`${copy}-${i}`} />
              )),
            )}
          </div>
        ))}
      </div>
    </Stage>
  );
}
