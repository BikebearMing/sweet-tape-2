/* Sweet Tape — the pinboard note, written on.
 *
 * Two things are drawn here and they are one gesture: the ruled margin
 * (components/HandNote/index.tsx, two cubics in the markup) and the copy beside
 * it, whose glyphs are built at runtime by Vara from a JSON font of drawn
 * strokes. Both are dashed paths with the dash pushed off the end, and both are
 * pulled back to zero by a single GSAP timeline — so the pen rules the margin,
 * lifts, and writes, rather than two effects happening near each other.
 *
 * VARA IS BUILT BUT NOT PLAYED. Its own animation is a setInterval per path at
 * a fixed 30fps, which cannot share a playhead with the ruled lines, cannot be
 * scrubbed, and does not stop when the section is torn down. So it is
 * constructed with autoAnimation off — which leaves every path already carrying
 * the stroke-dasharray it needs, at opacity 0 — and this file takes the paths
 * from there. Vara's job is the letterforms; the drawing is ours.
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
import Vara from "vara";

import { NOTE_LINES } from "./copy";

/* Copied out of node_modules/vara/fonts by hand — the package is not on the
   public path, and the CDN copy everyone links is a raw.githubusercontent URL,
   which is neither a CDN nor a promise. Absolute, because Vara fetches it by
   XHR and a relative path would resolve against whatever route the section is
   embedded in. */
const FONT_SRC = "/fonts/ShadowsIntoLight.json";

/* The hand's own proportions.
 *
 * EVERY ONE OF THESE IS IN THE FONT'S OWN UNITS, which is what makes them
 * size-independent — the glyphs are scaled to the box afterwards and these
 * scale with them — but it also means they do not survive a change of font.
 * Vara's fonts are drawn at wildly different scales, and the two this note has
 * worn are a fair sample of the spread:
 *
 *              lower-case a   line height   space   i
 *   Satisfy            13.0          29.1    10.4   7.6
 *   Shadows            15.7          62.9    17.3   2.1
 *
 * Swapping FONT_SRC without re-reading every figure below against the new
 * font's own is how a note ends up either monospaced or three lines deep in the
 * painting. The ratios are what carry over, not the numbers.
 */
const HAND = {
  /* Not a px size, whatever it is called. Vara measures a reference glyph
     rendered at this many px IN THE CONTAINER'S CSS FONT and divides by that
     glyph's own width to get the scale it draws at — so the number never
     reaches the screen, and after the viewBox in draw() it does not affect the
     rendered size at all.

     What it does still set is `minWidth`, the smallest advance a glyph may
     take: Vara measures a full stop at this size in px (about a quarter of it)
     and then compares that against glyph widths in FONT units, mixing the two.
     So this is really a threshold, and it wants to be a low one.

     It mattered more under Satisfy, which is a CONNECTED script — the letters
     are drawn to meet, so every glyph padded out over the bar came away from
     its neighbours and broke the join. Shadows is a PRINTED hand and has no
     joins to break, but the bar still costs spacing, and this note is being
     tightened rather than opened out. The one glyph it really catches here is
     the i at 2.1 units, which is narrow enough that some padding is right:
     without any, the dot of the i sits over its neighbour. */
  NOMINAL: 16,

  /* Against a lower-case a of 15.7 units, so a little over 11% of it — the same
     proportion Satisfy carried at 1.5/13.0. Vara's own default (0.5, out of the
     font JSON) is a fine ballpoint; this is the marker the rest of the board is
     written in. */
  STROKE: 1.8,

  /* Where the next line sits.
   *
   * Shadows' own figure is 62.9, and that number is not a line height in the
   * typographic sense: the generator takes it from the TALLEST GLYPH's bounding
   * box, so a hand with long ascenders and deep descenders reports a big one
   * whatever its x-height is doing. Shadows is exactly that — 62.9 against an a
   * of 15.7, a ratio of 4.0 where Satisfy's is 2.2 — so setting this to the
   * font's own figure leaves the note looking double-spaced.
   *
   * Set by eye against the copy instead, which is what it is for: close enough
   * that the four lines read as one note, open enough that the y of "everyday"
   * lands beside the t of "not" rather than in it.
   *
   * Set at the properties level ON PURPOSE — the per-paragraph lineHeight is in
   * px in the same function, which would untie it from the letters. */
  LINE: 44,

  /* How much is taken out of every LETTER gap — the tightening.
   *
   * Shadows is drawn loose: it is a printed hand with no joins to hold, so its
   * glyphs stand well apart, and the narrow ones collect padding from NOMINAL's
   * bar on top of that. Against a lower-case a of 15.7 units this is about an
   * eighth of one, which is a close hand rather than a cramped one.
   *
   * Gaps beside a SPACE are left alone — see the loop in draw(). At 2 with the
   * spaces included the letters looked right and the words had run together;
   * word spacing is its own judgement and is not what "reduce the letter
   * spacing" was asking for.
   *
   * Vara has a `letterSpacing` option and this is deliberately NOT it. That one
   * is added after the glyph advance has been scaled, so it lands in the SVG's
   * outer units — it would be the one number in this block that did not survive
   * a change of font, which is the exact thing the note at the top warns about.
   * It also cannot tell a letter gap from a word gap. Applied in draw() against
   * the scale instead, exactly as DRIFT is.
   *
   * Raise it until the letters touch. */
  TIGHTEN: 2,

  /* And how far each line starts to the right of the one above it. Nobody
     writing free-hand down a page holds the margin: the lines lean away from it
     a little further each time, which is the same drift the ruled down-stroke
     has. Without this the block is plumb on its left edge and the whole thing
     reads as type in a handwriting font, which is the one thing it must not.

     Vara has no per-line x — a paragraph is aligned as a unit — so this is
     applied to the built line groups in draw().

     Against a lower-case a of 15.7 units, so a shade under a fifth of one —
     the same proportion Satisfy carried at 2.5/13.0. */
  DRIFT: 3,

  /* The pen, when the stylesheet has not named one.
   *
   * It normally has: the ruled margin takes --hand-ink from CSS, and this file
   * now READS that same property off the note rather than carrying a second
   * copy of the value — which is what lets the same component be written in the
   * board's lime in the hero and in the giant ink under TO CREATE, and what
   * retires the "change both" this comment used to end with.
   *
   * So this is the fallback and nothing else: a note whose stylesheet never
   * loaded, or one dropped somewhere that forgot to set the property. The
   * hero's lime, because a note in no colour at all is a note nobody can see. */
  INK: "#b6fe00",
};

/* The drawing, in seconds. A constant pen speed within each part — every path
   gets a slice of the total in proportion to its own length — which is what
   makes it read as one hand rather than as a stagger. */
const DRAW = {
  RULE: 0.75, // both ruled strokes, end to end
  LIFT: 0.14, // the pen off the page between the margin and the first word
  INK: 3.4, // and the four lines
};

/* Where the note starts writing: its top at this fraction down the viewport.
   Above .peel's 0.92 — the tape starts lifting as it appears, and the note is
   given until it is properly on screen before anyone is asked to read it.

   Read as a viewport fraction and nothing else, which is why it survived the
   move to an observer intact: it never meant a scroll position, only "far
   enough up the screen". See the release in drawIt. */
const START_AT = 0.78;

/* Vara takes a SELECTOR rather than a node, so its container has to carry an
   id — and a distinct one per instance, so a torn-down build's late arrival can
   no longer resolve to a live mount. See the teardown at the bottom. */
let seq = 0;

/* Park a path with its whole length pushed past the end of the dash, ready to
   be pulled back to 0.

   The +2/+1 is Vara's own, kept here so the ruled strokes and the letters
   behave identically: a round cap on a zero-length dash paints a dot at the
   start of the path in some engines, and the extra unit of offset keeps the pen
   off the page until the tween moves it. */
function park(path: SVGPathElement): void {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len + 2}`;
  path.style.strokeDashoffset = `${len + 1}`;
  /* Vara builds its paths at opacity 0 and turns them up in draw(), which is
     not being called. Harmless on the ruled strokes, which are already opaque
     and stay that way. */
  path.style.opacity = "1";
}

/* Lay a set of paths end to end on the timeline at a constant pen speed, and
   return the time the last one finishes at. */
function write(
  tl: gsap.core.Timeline,
  paths: SVGPathElement[],
  at: number,
  duration: number
): number {
  const total = paths.reduce((sum, p) => sum + p.getTotalLength(), 0) || 1;
  let cursor = at;
  for (const path of paths) {
    const slice = (path.getTotalLength() / total) * duration;
    /* No ease per stroke: the pen does not accelerate inside a letter. The
       shape of the move is the ORDER of the strokes, not their curve. */
    tl.to(path, { strokeDashoffset: 0, duration: slice, ease: "none" }, cursor);
    cursor += slice;
  }
  return cursor;
}

/**
 * Writes every note under `root` — the pinning section has more than one, and a
 * section is the unit a caller has a handle on.
 *
 * EACH ONE IS BUILT ON ITS OWN, which is not just tidiness. Everything that
 * makes an instance what it is is read off the element: its ink, its pace, its
 * own Vara container with its own id, its own timeline and its own observer. So
 * two notes on one canvas write at their own speeds when their own picture
 * arrives, and neither can be released by the other coming into view.
 *
 * The teardown is the collected teardowns, in the order they were built.
 */
export function initHandNote(root: HTMLElement): () => void {
  const stops = Array.from(
    root.querySelectorAll<HTMLElement>(".hand-note")
  ).map(initOne);
  return () => stops.forEach((stop) => stop());
}

function initOne(note: HTMLElement): () => void {
  const mount = note.querySelector<HTMLElement>(".hand-ink");
  const rule = Array.from(
    note.querySelectorAll<SVGPathElement>(".hand-rule .hand-stroke")
  );
  if (!mount || !rule.length) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* The pen, off the note itself — see HAND.INK. Read here rather than passed
     in, so an instance is configured in one place: the same custom property the
     stylesheet already paints the ruled strokes with is the one the letters are
     drawn in, and the two cannot disagree. Trimmed because a custom property's
     value keeps the whitespace it was written with, which is not a colour. */
  const ink =
    getComputedStyle(note).getPropertyValue("--hand-ink").trim() || HAND.INK;

  /* How fast the pen moves, as a MULTIPLE of the durations in DRAW — read off
     the note for the same reason the pen's colour is, because the two instances
     are given wildly different amounts of time to write in.
   *
   * The hero's note has the whole page scroll to itself: it comes up the screen
   * at the reader's own pace and can take the four and a bit seconds the
   * gesture is tuned for. The one under TO CREATE does not. It rides a canvas
   * being walked past by a camera, and it crosses the screen in about 900px of
   * scroll — under a second at any ordinary pace. A gesture longer than the
   * window it plays in is a gesture nobody sees the end of. */
  const pace =
    parseFloat(getComputedStyle(note).getPropertyValue("--hand-draw")) || 1;

  /* Vara's container, created here rather than sitting in the markup: it is
     what a teardown detaches, and detaching it is what makes a build still in
     flight harmless. */
  const host = document.createElement("div");
  host.id = `hand-ink-${++seq}`;
  mount.appendChild(host);

  let stopped = false;
  let tl: gsap.core.Timeline | null = null;
  /* What releases the timeline — see the note by its construction in drawIt.
     Nothing here reacts to a resize any more: the observer works off the
     rendered box, so a new viewport is a new box and nothing to re-measure. */
  let io: IntersectionObserver | null = null;

  /* The ruled strokes are parked immediately, before the font has even been
     asked for: they are in the server's markup and are therefore already on
     screen. Everything else waits for Vara. */
  if (!reduced) rule.forEach(park);

  function drawIt() {
    const svg = host.querySelector<SVGSVGElement>("svg");
    if (!svg) return;

    /* Vara leaves two measuring spans in its container: an "a" it takes the
       font's scale from and a full stop it takes the minimum advance from, both
       at opacity 0, and neither ever removed. */
    host.querySelectorAll("span").forEach((s) => s.remove());

    const ink = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
    if (!ink.length) return;

    /* THE ONE THING THAT MAKES THIS RESPONSIVE. Vara sizes its SVG in px — a
       height attribute off the bounding box, and glyphs scaled to a px font
       size measured once, on build. Everything else on this page is in vw, so
       left alone the note would be the only thing that did not grow with the
       viewport, and it would re-measure to a different size on every reload.

       Replacing that with a viewBox taken off the finished artwork hands the
       sizing to the stylesheet: the strokes keep their proportions, the box in
       global.css decides how big they are, and a resize costs nothing. It is
       also what frees HAND.NOMINAL to sit wherever Vara's internals behave
       best, since it no longer reaches the screen.

       The bleed is one stroke width in the svg's own units — getBBox measures
       the PATH, not the ink laid over it, so half a stroke hangs off every edge
       and the round caps a little more. The scale it needs is read back off a
       letter's own transform (Vara writes `translate(...) scale(s)` on each
       glyph group), which is exact and cheaper than measuring for it. */
    const glyph = svg.querySelector<SVGGElement>("g > g > g");
    const scale = glyph?.transform.baseVal.consolidate()?.matrix.a ?? 1;

    /* The hand's drift down the page, added to the line groups Vara has already
       placed rather than folded into the layout — the widths, the wrapping and
       the baselines are all its business and none of them change. Before the
       bounding box below, so the box is measured around where the lines have
       ENDED UP.

       consolidate() has already flattened each group's transform list to the
       one matrix Vara built it from, so this reads e (the x translate), adds to
       it, and puts the item back. */
    svg.querySelectorAll<SVGGElement>("g.outer > g").forEach((line, i) => {
      /* The tightening, gap by gap — see HAND.TIGHTEN. Each glyph is pulled
         back by the total taken out of every gap before it in the line, which
         is what turns a constant per-gap reduction into a running offset.
         Before the line's own shift below, so the drift lands on a line whose
         width is already final.

         WORD GAPS ARE EXEMPT, and that is the whole design of it rather than a
         refinement. Taking the same slice out of every gap closes the spaces
         between words faster than the eye can spare them — Shadows' space is
         only 17.3 units, so by the time the letters look written the words have
         run together. Letter spacing is also the thing actually being asked
         for; word spacing is a separate judgement and this leaves it alone.

         Vara builds one group per character INCLUDING spaces, so the source
         line indexes the groups directly — the counts agree exactly, 12/17/19
         and 10 for the four lines. Which is what lets a gap be identified by
         the characters either side of it rather than by inspecting what Vara
         drew there (a space is a group with no paths and a transparent stroke,
         which is a far more fragile thing to test for).

         A character group is `translate(x, 0) scale(fontSize)` and the scale
         has to survive: setTranslate would replace the whole matrix with a
         pure translate and the glyph would come out at font size 1. So this
         writes the attribute back rather than using the transform list, and
         takes the scale from the group's own matrix rather than the outer
         `scale` — the same number, but only one of them is this element's. */
      const source = NOTE_LINES[i] ?? "";
      let taken = 0;
      Array.from(line.children).forEach((node, k) => {
        // The gap BEFORE this glyph, closed only if a letter stands on both
        // sides of it.
        if (k > 0 && source[k] !== " " && source[k - 1] !== " ") {
          taken += HAND.TIGHTEN;
        }
        const ch = node as SVGGElement;
        const cm = ch.transform.baseVal.consolidate()?.matrix;
        if (!cm) return;
        const x = cm.e - taken * scale;
        ch.setAttribute("transform", `translate(${x},${cm.f}) scale(${cm.a})`);
      });

      const m = line.transform.baseVal.consolidate()?.matrix;
      if (!m) return;
      const shifted = svg.createSVGTransform();
      shifted.setTranslate(m.e + HAND.DRIFT * scale * i, m.f);
      line.transform.baseVal.replaceItem(shifted, 0);
    });

    const bleed = HAND.STROKE * scale;
    const box = svg.getBBox();
    svg.setAttribute(
      "viewBox",
      `${box.x - bleed} ${box.y - bleed} ${box.width + bleed * 2} ${
        box.height + bleed * 2
      }`
    );
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    /* Both Vara's, both in px, and neither would win against the stylesheet —
       but leaving them behind invites the next person to wonder which one does. */
    svg.removeAttribute("width");
    svg.removeAttribute("height");

    if (reduced) {
      /* The note is copy. Standing, in ink, is what it is for — the drawing is
         the flourish, and this is the page with the flourishes turned off.

         The dash has to go as well as the opacity: Vara parks every path behind
         its own length whether or not it is going to animate it, so opacity
         alone leaves a fully written note that is fully invisible. */
      for (const path of ink) {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      }
      return;
    }

    ink.forEach(park);

    tl = gsap.timeline({ paused: true });
    /* All three scaled together — see `pace`. Scaling them rather than giving
       the fast instance its own numbers keeps the SHAPE of the gesture: the
       rule, the lift and the writing stay in the proportion they were tuned in,
       so a quicker note is the same hand moving faster and not a different one. */
    const ruled = write(tl, rule, 0, DRAW.RULE * pace);
    write(tl, ink, ruled + DRAW.LIFT * pace, DRAW.INK * pace);

    /* The release, and it has to be the note's position ON SCREEN rather than
     * in the document.
     *
     * This used to compare window.scrollY against the note's own offsetTop —
     * which is exactly right for the hero, where the note is in normal flow and
     * scrolling the page is what brings it up. It is wrong for the pinning
     * section, and quietly so. There the note rides a canvas inside a PINNED
     * box: its document position stops meaning anything the moment the pin
     * takes hold, and what actually carries it across the screen is the camera
     * transform, which no offsetTop can see. The note came and went with its
     * copy still unwritten, and the trigger fired long after the camera had
     * taken it away.
     *
     * An IntersectionObserver asks the question that was meant all along —
     * "is it in view yet" — and asks it of the rendered box, so a transform,
     * a pin and a plain scroll all answer it the same way. It also costs no
     * per-frame work, needs no re-measuring on resize, and is what every other
     * section here already uses to decide it is being looked at.
     *
     * START_AT becomes the root's bottom margin: shrinking the viewport box up
     * from the bottom means the note counts as seen once it has climbed past
     * that line, which is what the number always meant. */
    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        tl?.play();
        io?.disconnect(); // once written, it stays written
        io = null;
      },
      { rootMargin: `0px 0px ${-(1 - START_AT) * 100}% 0px` }
    );
    io.observe(note);
  }

  /* Wait for the page's own webfonts before building. Vara's scale comes from
     measuring a glyph in the container's CSS font; measure it while Inter Tight
     is still a fallback and the letters come out a few per cent off — which,
     since the box is fixed and the artwork is fitted to it, is a visible jump
     in weight between the first paint and the second. It costs a couple of
     frames on a thing a screen below the fold. */
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  fonts.then(() => {
    if (stopped) return;
    const vara = new Vara(
      `#${host.id}`,
      FONT_SRC,
      [
        {
          text: NOTE_LINES,
          fontSize: HAND.NOMINAL,
          strokeWidth: HAND.STROKE,
          color: ink,
          /* Wrapping off. The breaks are set in copy.ts, and Vara's own
             wrapping compares a px measurement against font units — hand it a
             width no line can reach and it never gets to decide. */
          width: 1e6,
          autoAnimation: false,
        },
      ],
      { lineHeight: HAND.LINE, autoAnimation: false }
    );
    vara.ready(() => {
      if (!stopped) drawIt();
    });
  });

  return () => {
    stopped = true;
    io?.disconnect();
    io = null;
    tl?.kill();
    /* Detaching the container IS the teardown. Vara has no destroy, and its
       build begins with an XHR deep enough to land after the section has gone:
       a request still in flight will finish, find the node it captured at
       construction, and write a second SVG into it. Off the document that is a
       few dozen paths nobody will ever see, dropped at the next collection —
       attached, it is a duplicate note. The id going with it is what stops the
       NEXT build's selector from resolving back to this one. */
    host.remove();
  };
}
