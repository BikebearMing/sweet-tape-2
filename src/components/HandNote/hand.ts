/* Sweet Tape — the pinboard note, written on.
 *
 * Two things are drawn here and they are one gesture: the ruled margin
 * (components/HandNote/index.tsx, two cubics in the markup) and the copy beside
 * it, set from the drawn alphabet in components/HandNote/glyphs.ts. Both are
 * dashed paths with the dash pushed off the end, and both are pulled back to
 * zero by a single GSAP timeline — so the pen rules the margin, lifts, and
 * writes, rather than two effects happening near each other.
 *
 * VARA IS GONE. It built its letterforms at runtime from a JSON font of drawn
 * strokes and it did the job for a long time, but the hand it wrote in was a
 * stock one and this site now has its own — a folder of per-glyph exports drawn
 * for it. What replaced Vara is not a different animation library: it is
 * glyphs.ts, which reads those files and hands back ink and a pen path per
 * character. The drawing below is the same drawing it always was.
 *
 * NOTHING HERE PLAYS A LOTTIE, and the exports are Lottie files. The whole of
 * what a player would do for us is a mask sweeping a PNG, which is an <svg>
 * <mask> and a dashed path — so a note is ONE svg rather than sixty players,
 * and its letters can share the timeline the ruled margin is already on. That
 * argument is made properly at the top of glyphs.ts.
 *
 * Played once, on the way down, rather than scrubbed. The peel below it is
 * scrubbed because a hand pulling tape is a thing being DONE and follows the
 * wheel back up; handwriting is not — a sentence that unwrites itself when the
 * reader looks back up is a party trick. So it is the cardboard copy's move: a
 * paused timeline, released by the scroll and left standing.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount rebuilds rather than stacking a second note on the first.
 */
import gsap from "gsap";

import { LINE_SEP, NOTE_LINES } from "./copy";
import { COMP, loadGlyphs, type Glyph } from "./glyphs";

const SVG_NS = "http://www.w3.org/2000/svg";

/* CAN A MASK BE READ AS ALPHA RATHER THAN AS LUMINANCE? It decides how a glyph
 * is coloured, and the two answers are genuinely different drawings — see
 * setCopy, which builds both.
 *
 * IT IS ASKED RATHER THAN ASSUMED because the fallback is not a degraded note,
 * it is NO note. A mask read as luminance takes its coverage from how BRIGHT the
 * content is, and the glyph PNGs are near-black on transparent — so a browser
 * without mask-type would compute a mask of almost exactly zero and the writing
 * would simply not be there. That is not something to find out in the wild.
 *
 * Baseline since 2023 and true in every browser this site supports; the branch
 * exists so that the one that does not is merely a hairline worse off rather
 * than blank. */
const ALPHA_MASKS =
  typeof CSS !== "undefined" && CSS.supports?.("mask-type", "alpha");

/* THE SETTING, and every figure is in EM — one em being one comp box, which is
 * the square every glyph in the folder is drawn in (see COMP in glyphs.ts).
 *
 * IN EM AND NOT IN PIXELS, which is what makes them survive everything. The note
 * is written at five different sizes across this site and the finished artwork
 * is fitted to a box in the stylesheet afterwards, so an absolute size set here
 * would be overwritten by the fit and a px tracking would be the one figure that
 * did not come with it. These are ratios, and ratios are what carry.
 *
 * All three were arrived at in the lab (/lab/lottie-note) against the note's own
 * copy, and they are the values that came out of it. The lab's fourth dial —
 * size — is deliberately NOT here and never will be: on the page the size comes
 * from the box .hand-ink gives the writing, which is --hand-w times --hand-ink-w
 * and is therefore a per-instance decision made in the stylesheet. It falls out
 * rather than being declared, which is why the note can be a third the size in
 * the pinning section without any of this changing, and why re-tuning the
 * figures below never sets the size of anything.
 *
 * A RE-TUNE DOES MOVE THE SIZE, though, and it is worth knowing which way. The
 * artwork is fitted to the WIDTH of that box, so widening the setting — which
 * is what the word gap and the tracking below have just done — makes the same
 * copy longer and therefore SMALLER on the page, and opening the leading makes
 * the block taller under it. Every instance's --hand-ink-w is the dial for
 * that, and they are set section by section in global.css. */
const SET = {
  /* Taken out of every LETTER gap, or added to it — it is signed, and it is
     POSITIVE. It was -0.04 against the old alphabet, which stood well apart and
     wanted closing up; this hand wants the opposite. Word gaps are not touched
     by it — they have their own figure below, because moving the spaces at the
     same rate as the letters runs the words together long before the letters
     look written.

     FOUR TIMES WHAT IT WAS, and it moves against the word gap below rather than
     with it: the letters stand further apart and the spaces close up, which is
     the pair of changes that stops a line reading as one long word without
     making it read as a ransom note. Both figures came off the lab together and
     neither is meaningful on its own. */
  TRACK: 0.04,

  /* What a space costs the pen. Its own number rather than a multiple of the
     tracking, for the reason above.

     DOWN FROM 0.58, against a tracking that has gone up — see above. A hand
     writing with this much air between its letters does not need two thirds of
     a comp box to say where a word ends, and at 0.58 it was saying it twice.
     DRAW.SPACE below is this same figure again in time rather than in room, and
     the two move together. */
  WORD_GAP: 0.4,

  /* Between writing lines, baseline to baseline. UNDER one em, where it used to
     sit just over — an em here is the whole comp box, ascender room and
     descender room and all, so a note set at 1.02 was a note with a clear band
     of nothing between every pair of lines. A hand writing four lines on the
     back of something does not leave that much.

     IT IS THE FIGURE THE DESCENDERS ARE SPENT ON, and 0.82 is the lab's answer
     to how close they can come: the y of "everyday" passes the t of "not" below
     it rather than clearing it, which is what a written note does and what a
     typeset one never does. Tighter than this and they start to touch. */
  LEADING: 0.82,
};

/* The drawing, in seconds.
 *
 * THE RULED MARGIN IS DRAWN AT A CONSTANT PEN SPEED — both strokes share RULE
 * between them in proportion to their own lengths, so it reads as one movement.
 * THE WRITING IS NOT: every glyph takes the same PER whatever its length, and
 * the next one starts before the last has finished. That is the difference
 * between ruling a line and writing, and it is the model the lab settled on;
 * PER and OVERLAP are its figures. */
const DRAW = {
  RULE: 0.75, // both ruled strokes, end to end
  LIFT: 0.14, // the pen off the page between the margin and the first word

  /* One glyph, start to finish. A glyph made of two passes (a couple in the
     folder are) shares this between them by length, so it still takes one
     letter's worth of time.

     BACK UP TO ABOUT WHERE IT STARTED. It was 0.15, then 0.05 — three times
     quicker, on the argument that at 0.15 the hand was drawing each letter
     rather than writing it — and the lab's answer, with the setting above under
     it, is 0.16. What changed is the rest of the note: a hand with this much air
     between its letters and this little between its lines reads as writing at a
     speed that looked like drawing when the letters were tighter.

     IT IS THE ONE NUMBER HERE A READER ACTUALLY FEELS, and it is the one to
     reach for if a note ever runs long. The per-instance paces (--hand-draw,
     read below) are MULTIPLES of this, so every note on the site has just
     become about three times slower to write — which is the pace they were
     tuned at. See the note by `pace`. */
  PER: 0.16,

  /* How much of the next letter starts before the last one finishes. 0 is a
     typewriter and 1 is every letter at once; this is the dial that decides
     whether a row of separate files reads as writing.

     UP FROM 0.4, and it is what pays for the slower letter above: each glyph
     takes three times as long as it did, and without more of them running
     together the note would take three times as long to finish. At 0.6 the pen
     is well into the next letter before the last is done, which is both quicker
     and more like a hand than 0.4 was. */
  OVERLAP: 0.6,

  /* And what a space costs, as a fraction of a letter.
     
     TIED TO SET.WORD_GAP, which is the lab's own model: a space is a distance
     the pen crosses, so what it costs in time follows what it costs in room.
     The lab spends `per * wordGap * 2` on one, and this is that same figure —
     0.4 x 2 — written where the rest of the timing is. Change the word gap and
     change this with it. */
  SPACE: 0.8,
};

/* Where the note starts writing: its top at this fraction down the viewport.
   Above .peel's 0.92 — the tape starts lifting as it appears, and the note is
   given until it is properly on screen before anyone is asked to read it.

   Read as a viewport fraction and nothing else, which is why it survived the
   move to an observer intact: it never meant a scroll position, only "far
   enough up the screen". See the release in drawIt. */
const START_AT = 0.78;

/* The pen, when the stylesheet has not named one.
 *
 * It normally has: the ruled margin takes --hand-ink from CSS, and this file
 * READS that same property off the note rather than carrying a second copy of
 * the value — which is what lets the same component be written in the board's
 * lime in the hero and in the giant ink under TO CREATE.
 *
 * So this is the fallback and nothing else: a note whose stylesheet never
 * loaded, or one dropped somewhere that forgot to set the property. The hero's
 * lime, because a note in no colour at all is a note nobody can see. */
const INK = "#b6fe00";

/* Ids have to be unique per NOTE, not per document — two notes on one page each
   build their own masks and a shared id would have every letter of the second
   one wearing the first one's mask. */
let seq = 0;

/* Park a path with its whole length pushed past the end of the dash, ready to be
   pulled back to 0.

   The +2/+1 is inherited from the Vara build and kept for the reason it was
   there: a round cap on a zero-length dash paints a dot at the start of the path
   in some engines, and the extra unit of offset keeps the pen off the page until
   the tween moves it. On a mask path that dot is worse than a stray mark — it is
   a speck of the letter showing through before the pen has touched down. */
function park(path: SVGPathElement): void {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len + 2}`;
  path.style.strokeDashoffset = `${len + 1}`;
}

/* And the other end: fully drawn, no dash. Used for the reduced-motion note,
   which stands in ink rather than being written. The dash has to GO rather than
   be set to zero — a mask path parked behind its own length hides the letter
   completely, so a note left parked is a note that is simply not there. */
function unpark(path: SVGPathElement): void {
  path.style.strokeDasharray = "none";
  path.style.strokeDashoffset = "0";
}

/* Lay a set of paths end to end on the timeline at a constant pen speed, and
   return the time the last one finishes at. */
function write(
  tl: gsap.core.Timeline,
  paths: SVGPathElement[],
  at: number,
  duration: number,
): number {
  const total = paths.reduce((sum, p) => sum + p.getTotalLength(), 0) || 1;
  let cursor = at;
  for (const path of paths) {
    const slice = (path.getTotalLength() / total) * duration;
    /* No ease per stroke: the pen does not accelerate inside a letter. The shape
       of the move is the ORDER of the strokes, not their curve. */
    tl.to(path, { strokeDashoffset: 0, duration: slice, ease: "none" }, cursor);
    cursor += slice;
  }
  return cursor;
}

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/* SET THE COPY, and hand back the pen paths in the order they are written in.
 *
 * The layout is a cursor across a line and a baseline down the block, both in
 * comp units — see SET, which is in em, and COMP, which is what an em is. A
 * glyph is placed by its INK: the cursor is where the ink starts, and the
 * glyph's own baseline is put on the line's. That is the whole of the setting,
 * and both of the numbers it turns on come from glyphs.ts rather than from the
 * export, which carries neither.
 *
 * @returns one array of paths per glyph, in writing order — the outer array is
 *          what the timeline staggers, and the inner one is a glyph that takes
 *          more than one pass of the pen.
 */
function setCopy(
  mount: HTMLElement,
  lines: string[],
  glyphs: Map<string, Glyph>,
  ink: string,
): { svg: SVGSVGElement; pen: SVGPathElement[][] } {
  const id = `hand-${++seq}`;
  const svg = el("svg", { fill: "none", "aria-hidden": "true" });
  const defs = el("defs", {});
  svg.appendChild(defs);

  const pen: SVGPathElement[][] = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let bleed = 0;
  let mask = 0;

  lines.forEach((line, row) => {
    const baseline = row * SET.LEADING * COMP;
    let cursor = 0;

    for (const ch of line.toLowerCase()) {
      if (ch === " ") {
        cursor += SET.WORD_GAP * COMP;
        continue;
      }
      const glyph = glyphs.get(ch);
      if (!glyph) {
        /* A character with no file. It leaves the gap it would have taken rather
           than closing up, so a missing export reads as a hole somebody can see
           and not as a spelling mistake. glyphs.ts warns about it in dev. */
        cursor += SET.WORD_GAP * COMP;
        continue;
      }

      /* Placed by its ink and its own writing line. */
      const dx = cursor - glyph.x;
      const dy = baseline - glyph.baseline;
      const group = el("g", { transform: `translate(${dx},${dy})` });
      const paths: SVGPathElement[] = [];

      for (const stroke of glyph.strokes) {
        const path = el("path", {
          d: stroke.d,
          stroke: stroke.href ? "#fff" : ink,
          "stroke-width": stroke.pen,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
        });
        paths.push(path);

        if (!stroke.href) {
          /* A glyph with no ink of its own draws itself — see SYNTHETIC in
             glyphs.ts. It is the pen and the mark at once, exactly as the ruled
             margin is, so it goes straight into the picture with no mask. Half a
             pen hangs outside its box at every end, which is the only thing on
             the board that needs the viewBox opened up. */
          group.appendChild(path);
          bleed = Math.max(bleed, stroke.pen / 2);
          continue;
        }

        /* THE PEN, as a mask. Its region is set in USER SPACE and given a pen's
           clearance all round: left to default it is a fraction of the object's
           bounding box, which for a stroke wider than the letter it sweeps would
           clip the pen and leave the edges of the glyph permanently uncovered. */
        const box = {
          maskUnits: "userSpaceOnUse",
          x: stroke.x - stroke.pen,
          y: stroke.y - stroke.pen,
          width: stroke.w + stroke.pen * 2,
          height: stroke.h + stroke.pen * 2,
        };
        const penId = `${id}-p${++mask}`;
        const penMask = el("mask", { id: penId, ...box });
        penMask.appendChild(path);
        defs.appendChild(penMask);

        const image = el("image", {
          href: stroke.href,
          x: stroke.x,
          y: stroke.y,
          width: stroke.w,
          height: stroke.h,
          preserveAspectRatio: "none",
          mask: `url(#${penId})`,
        });

        if (!ALPHA_MASKS) {
          /* The old way, kept only for a browser that cannot read a mask as
             alpha: put the artwork on the page as it is and recolour the whole
             note with a filter afterwards. It works, and it costs a hairline —
             see the note by the filter below. */
          group.appendChild(image);
          continue;
        }

        /* AND THE INK, WHICH IS A COLOURED RECTANGLE WEARING THE LETTER.
         *
         * The glyph's PNG has its colour baked in and this note is written in
         * four different pens across the site, so something has to recolour it.
         * The obvious something is a filter — map every pixel to one colour,
         * pass the alpha through — and that is what this used to do.
         *
         * IT LEFT A HAIRLINE ACROSS THE NOTE. A filter is rasterised into a
         * buffer and that buffer is CLIPPED to the filter's region, which by
         * default runs 10% outside the artwork; the clip is antialiased, so the
         * region's own edge picks up a sliver of alpha, and a colour matrix that
         * paints every alpha the ink colour paints that sliver too. What came
         * out was a faint dashed rule below the last line, at exactly the
         * region's bottom edge — invisible at 8x, plain at 1x and 2x, which is
         * every screen anybody reads this on. Widening the region only moves the
         * edge somewhere else.
         *
         * So there is no filter. The image becomes the MASK — read as alpha
         * rather than as luminance, which is what ALPHA_MASKS is asking about —
         * and what is actually painted is a rectangle of the pen's colour
         * showing through the letter. Two masks, nested: the pen decides how much
         * of the letter has been written, the letter decides how much of the
         * rectangle is ink. Nothing is rasterised into a buffer and there is no
         * region to have an edge. */
        const inkId = `${id}-i${mask}`;
        const inkMask = el("mask", { id: inkId, ...box });
        inkMask.style.maskType = "alpha";
        inkMask.appendChild(image);
        defs.appendChild(inkMask);

        group.appendChild(
          el("rect", {
            x: stroke.x,
            y: stroke.y,
            width: stroke.w,
            height: stroke.h,
            fill: ink,
            mask: `url(#${inkId})`,
          }),
        );
      }

      svg.appendChild(group);
      pen.push(paths);

      /* The box, from the INK and not from the pen — the pen is wider than the
         letter and runs past both ends of it, which is what makes it uncover the
         whole thing, and measuring it would pad every edge of the note. */
      x0 = Math.min(x0, dx + glyph.x);
      y0 = Math.min(y0, dy + glyph.y);
      x1 = Math.max(x1, dx + glyph.x + glyph.w);
      y1 = Math.max(y1, dy + glyph.y + glyph.h);

      cursor += glyph.w + SET.TRACK * COMP;
    }
  });

  if (!pen.length) return { svg, pen };

  svg.setAttribute(
    "viewBox",
    `${x0 - bleed} ${y0 - bleed} ${x1 - x0 + bleed * 2} ${y1 - y0 + bleed * 2}`,
  );
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

  /* THE OLD RECOLOURING, AND ONLY WHERE IT IS STILL NEEDED — see the long note
     by the ink mask above. A browser that can read a mask as alpha never gets
     here: its letters are already the right colour, painted rather than
     repainted, and this note carries no filter at all. */
  if (!ALPHA_MASKS && /^#[0-9a-f]{6}$/i.test(ink)) {
    const filterId = `${id}-ink`;
    const n = parseInt(ink.slice(1), 16);
    const matrix = el("feColorMatrix", {
      type: "matrix",
      values: `0 0 0 0 ${((n >> 16) & 255) / 255} 0 0 0 0 ${
        ((n >> 8) & 255) / 255
      } 0 0 0 0 ${(n & 255) / 255} 0 0 0 1 0`,
    });
    const filter = el("filter", {
      id: filterId,
      "color-interpolation-filters": "sRGB",
      /* As far out as it can usefully go. The edge cannot be removed, only
         moved; this puts it clear of the writing. */
      x: "-25%",
      y: "-25%",
      width: "150%",
      height: "150%",
    });
    filter.appendChild(matrix);
    defs.appendChild(filter);
    svg.style.filter = `url(#${filterId})`;
  }

  mount.appendChild(svg);
  return { svg, pen };
}

/**
 * Writes every note under `root` — the pinning section has more than one, and a
 * section is the unit a caller has a handle on.
 *
 * EACH ONE IS BUILT ON ITS OWN, which is not just tidiness. Everything that
 * makes an instance what it is is read off the element: its ink, its pace, its
 * copy, its own timeline and its own observer. So two notes on one canvas write
 * at their own speeds when their own picture arrives, and neither can be
 * released by the other coming into view.
 *
 * The teardown is the collected teardowns, in the order they were built.
 */
export function initHandNote(root: HTMLElement): () => void {
  const stops = Array.from(
    root.querySelectorAll<HTMLElement>(".hand-note"),
  ).map(initOne);
  return () => stops.forEach((stop) => stop());
}

function initOne(note: HTMLElement): () => void {
  const ink_mount = note.querySelector<HTMLElement>(".hand-ink");
  const rule = Array.from(
    note.querySelectorAll<SVGPathElement>(".hand-rule .hand-stroke"),
  );
  if (!ink_mount || !rule.length) return () => {};
  const mount = ink_mount;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* WHAT THIS ONE SAYS, off the element — the board's sentence on the home page,
     the news page's own on that one. Read here for the same reason the pen and
     the pace are: this file finds its instances by querying the DOM, so anything
     that differs between them has to be ON the element or the drawing cannot see
     it. See LINE_SEP in copy.ts. The fallback is a note whose markup predates the
     attribute, not a default anybody should be relying on. */
  const lines = note.dataset.lines?.split(LINE_SEP) ?? NOTE_LINES;

  /* The pen, off the note itself — see INK. Read here rather than passed in, so
     an instance is configured in one place: the same custom property the
     stylesheet already paints the ruled strokes with is the one the letters are
     drawn in, and the two cannot disagree. Trimmed because a custom property's
     value keeps the whitespace it was written with, which is not a colour. */
  const ink =
    getComputedStyle(note).getPropertyValue("--hand-ink").trim() || INK;

  /* How fast the pen moves, as a MULTIPLE of the durations in DRAW — read off
   * the note for the same reason the pen's colour is, because the instances are
   * given wildly different amounts of time to write in.
   *
   * THESE ARE RELATIVE FIGURES AND DRAW.PER MOVED UNDER THEM. Every one of them
   * says "slower than the hero's", and the hero's is now a third of what it
   * was — so they all came down together and the ratios between the notes are
   * exactly as they were tuned. What changed is the absolute length: the note
   * under TO CREATE writes in about 0.8s where it used to take 1.8. If one of
   * them now reads as hurried, its own --hand-draw is the place to put that
   * right; the base pace belongs to the lab.
   *
   * The hero's note has the whole page scroll to itself: it comes up the screen
   * at the reader's own pace and can take the several seconds the gesture is
   * tuned for. The one under TO CREATE does not. It rides a canvas being walked
   * past by a camera, and it crosses the screen in about 900px of scroll — under
   * a second at any ordinary pace. A gesture longer than the window it plays in
   * is a gesture nobody sees the end of. */
  const pace =
    parseFloat(getComputedStyle(note).getPropertyValue("--hand-draw")) || 1;

  /* And how long it waits after being seen before the pen touches down, in
     seconds — 0 unless an instance asks for one, which is what every note on the
     board does. It exists for the news page's, which is on the opening screen
     and therefore in view from the first frame, so "when it is seen" is not a
     beat at all: without a hold it writes itself across the same moment the
     headline's letters are arriving, and the two gestures cancel.

     A NUMBER OF SECONDS AND NOT A CSS TIME. `0.15s` would parse to NaN here and
     fall back to zero silently, which is the kind of thing that is found six
     months later; a bare number cannot be mistaken for a value this file knows
     how to convert. */
  const delay =
    parseFloat(getComputedStyle(note).getPropertyValue("--hand-delay")) || 0;

  let stopped = false;
  let tl: gsap.core.Timeline | null = null;
  /* The hold between being seen and being written — see `delay`. Kept so the
     teardown can kill it: a note torn down inside its own hold would otherwise
     leave a call in flight that plays a timeline nothing is watching. */
  let held: gsap.core.Tween | null = null;
  /* What releases the timeline — see the note by its construction in draw().
     Nothing here reacts to a resize: the observer works off the rendered box, so
     a new viewport is a new box and nothing to re-measure. */
  let io: IntersectionObserver | null = null;
  /* The svg this build put in the mount, so the teardown takes down ITS OWN work
     and not whatever is in there — a rebuild that lands after a teardown must
     not be able to clear a live note. */
  let drawn: SVGSVGElement | null = null;

  /* The ruled strokes are parked immediately, before the alphabet has even been
     asked for: they are in the server's markup and are therefore already on
     screen. Everything else waits for the glyphs. */
  if (!reduced) rule.forEach(park);

  function draw(glyphs: Map<string, Glyph>) {
    const { svg, pen } = setCopy(mount, lines, glyphs, ink);
    drawn = svg;
    if (!pen.length) return;
    const ink_ = pen.flat();

    if (reduced) {
      /* The note is copy. Standing, in ink, is what it is for — the drawing is
         the flourish, and this is the page with the flourishes turned off. */
      rule.forEach(unpark);
      ink_.forEach(unpark);
      return;
    }

    ink_.forEach(park);

    tl = gsap.timeline({ paused: true });
    /* The margin first, at a constant pen speed, then the lift. Both scaled by
       `pace` along with the writing, so a quicker note is the same hand moving
       faster and not a different one. */
    const ruled = write(tl, rule, 0, DRAW.RULE * pace);
    let cursor = ruled + DRAW.LIFT * pace;

    /* And the copy, a letter at a time with each one starting before the last
       has finished — see DRAW.PER and DRAW.OVERLAP. The cursor walks the whole
       block, including its spaces, so the pen crossing a gap costs what a gap
       costs and the line breaks cost nothing: a hand does not pause at the end
       of a line, it is already moving when it gets there.

       Spaces are counted off the COPY rather than off the glyphs, so a space and
       a character with no export are the same beat — which they are, since
       neither leaves a mark. */
    let g = 0;
    for (const line of lines) {
      for (const ch of line.toLowerCase()) {
        if (ch === " " || !glyphs.get(ch)) {
          cursor += DRAW.PER * DRAW.SPACE * pace;
          continue;
        }
        write(tl, pen[g++], cursor, DRAW.PER * pace);
        cursor += DRAW.PER * (1 - DRAW.OVERLAP) * pace;
      }
    }

    /* The release, and it has to be the note's position ON SCREEN rather than in
     * the document.
     *
     * This used to compare window.scrollY against the note's own offsetTop —
     * which is exactly right for the hero, where the note is in normal flow and
     * scrolling the page is what brings it up. It is wrong for the pinning
     * section, and quietly so. There the note rides a canvas inside a PINNED
     * box: its document position stops meaning anything the moment the pin takes
     * hold, and what actually carries it across the screen is the camera
     * transform, which no offsetTop can see. The note came and went with its
     * copy still unwritten, and the trigger fired long after the camera had taken
     * it away.
     *
     * An IntersectionObserver asks the question that was meant all along — "is it
     * in view yet" — and asks it of the rendered box, so a transform, a pin and a
     * plain scroll all answer it the same way. It also costs no per-frame work,
     * needs no re-measuring on resize, and is what every other section here
     * already uses to decide it is being looked at.
     *
     * START_AT becomes the root's bottom margin: shrinking the viewport box up
     * from the bottom means the note counts as seen once it has climbed past that
     * line, which is what the number always meant. */
    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        /* The hold, if this instance asked for one — a delayedCall rather than
           the timeline's own `delay`, which on a paused timeline is ambiguous
           about what it is measured from. This one is measured from HERE, the
           moment the note counted as seen, which is the only thing it could
           mean. The site's other deferred entrances are built the same way (see
           the delayedCalls in WhatsRolling/reveal.ts). */
        if (delay > 0) held = gsap.delayedCall(delay, () => tl?.play());
        else tl?.play();
        io?.disconnect(); // once written, it stays written
        io = null;
      },
      { rootMargin: `0px 0px ${-(1 - START_AT) * 100}% 0px` },
    );
    io.observe(note);
  }

  /* THE ALPHABET, then the drawing. Only the characters this note actually uses
     are fetched, and glyphs.ts caches them for the document — so the second note
     on a page is a map lookup rather than a second round of requests.

     No wait on document.fonts any more, and that is one whole class of problem
     gone: Vara measured a glyph in the container's CSS font to work out its
     scale, so building before Inter Tight had swapped in gave letters a few per
     cent off and a visible jump in weight between the first paint and the
     second. These glyphs are artwork with their own units and no font is
     consulted at any point. */
  loadGlyphs(lines).then((glyphs) => {
    if (!stopped) draw(glyphs);
  });

  return () => {
    stopped = true;
    io?.disconnect();
    io = null;
    held?.kill();
    tl?.kill();
    /* Taking the svg out IS the teardown, and it is THIS build's svg rather than
       whatever the mount currently holds: the alphabet arrives asynchronously,
       so a build can still land after its section has gone. One that does writes
       into a detached mount and is dropped at the next collection; it can no
       longer reach into a live note and clear it. */
    drawn?.remove();
    drawn = null;
  };
}
