/* Sweet Tape — WE WANTED TO BE. crawling across /about's second screen.
 *
 * ONE TIMELINE, SCRUBBED, AND THAT IS THE WHOLE FILE. The section is pinned, a
 * couple of screens of scroll are spent on it, and everything that happens —
 * the sentence travelling right to left, the four boxes popping up under it —
 * is one GSAP timeline whose playhead IS the scroll position. There is no
 * velocity, no throttle chasing the wheel, no second clock anywhere: scroll it
 * half way and the section is exactly half way through, whatever route your
 * hand took to get there.
 *
 * WHICH IS DELIBERATELY NOT WHAT THE HOME PAGE'S BAND DOES. That band loops for
 * ever and leans on scroll VELOCITY, so it drifts when the page is still and
 * hurries when the page is thrown — right for a length of tape crossing the
 * page, wrong for a sentence with a full stop at the end of it. A line you are
 * meant to finish reading has to arrive when the reader brings it, and stay
 * where they left it. So: no acceleration, one smooth timeline, scrubbed.
 *
 * THE TEXT RIDES A PATH AND ONLY ONE NUMBER MOVES. <textPath> means the browser
 * does the bending; the tween animates startOffset, which is an arc length along
 * the wave, and every glyph follows. Same mechanism as WaveBand/marquee.ts, and
 * that file argues it at length.
 *
 * EVERY POSITION IN HERE IS MEASURED, IN VIEWBOX UNITS, AND SURVIVES A RESIZE.
 * The two ends of the crawl are struck off the sentence's own advance width in
 * the font that actually loaded (getSubStringLength) and off the arc lengths of
 * the frame's two edges (bisection on the path). All three are viewBox units,
 * and the viewBox is 1600 wide over a box that is 100vw wide — so the frame's
 * edges are path-x 0 and path-x 1600 whatever the window is doing, and NONE of
 * these numbers change when it resizes. The only thing a resize moves is how
 * long the pin is, which is a function of the window's height and is re-read on
 * every refresh.
 *
 * THE ONE THING IT WAITS FOR IS THE FONT. An advance width measured before the
 * typekit face has resolved is some other font's, and the sentence would park in
 * the wrong place and crawl the wrong distance. See whenFace below, which is the
 * wait and which explains why document.fonts.ready is not quite it.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { screenH } from "@/components/viewport";

/** The line. Shared with the markup so the measured character range and the
    rendered text can never disagree — the band's UNIT does the same job. */
export const SENTENCE = "WE WANTED TO BE.";

/* WHERE THE SENTENCE SITS BEFORE ANY OF THIS RUNS, as a plain attribute in the
   server HTML. It is an arc length along the wave and it is APPROXIMATE ON
   PURPOSE: an eyeballed number that lands the opening W a little inside the left
   edge, so a page that has not hydrated — or whose font has not resolved — still
   shows the sentence rather than an empty green screen or a line parked out in
   the path's off-screen runway. The real anchor is measured below and takes over
   the moment it exists. */
export const START_OFFSET = 8560;

/* --------------------------------------------------------------------------
   The frame, in path coordinates

   The viewBox is "0 0 1600 500" over a box exactly 100vw wide, so these two
   are the screen's left and right edges. Everything below is expressed against
   them, which is what makes the arrangement a statement about the DESIGN rather
   than about a window size.
   -------------------------------------------------------------------------- */
const FRAME_LEFT = 0;
const FRAME_RIGHT = 1600;

export const WANTED = {
  /* HOW MUCH SCROLL THE SECTION COSTS, in screens, and it is the only figure
   * here that is about the page rather than about the drawing.
   *
   * Just under two. The crawl is about half a screen of travel (see OVERHANG
   * and END_INSET) and four boxes pop over the top of it, so the sentence moves
   * at roughly a third of the reader's pace — slow enough that the line arrives
   * rather than flies past, short enough that the page is not held still for
   * longer than one sentence and four words can carry.
   *
   * Raise it and everything slows together, because everything in the section
   * is timed as a fraction of this. */
  LENGTH: 1.8,

  /* SMOOTHING, in seconds of catch-up. Not `true`, which would be exact
     tracking: exact tracking puts every wheel notch straight onto the sentence,
     so the line moves in the steps the input arrives in. A little pursuit turns
     those steps into a glide. The camera on the home page runs at the same
     figure and for the same reason. */
  SCRUB: 0.6,

  /* HOW MUCH OF THE SENTENCE IS PAST THE RIGHT EDGE WHEN YOU ARRIVE, as a
   * fraction of its own length — and it is THE knob for where the line stands at
   * rest, because the sentence enters from the right and this is how far in it
   * has come.
   *
   * TWO FIFTHS. The line opens well into the right half of the screen with WE
   * WANTE on it and the rest of itself out past the crop, so what you arrive on
   * is unmistakably an unfinished sentence — and an unfinished sentence is the
   * reason to keep scrolling. The bare green to its left is where it is going.
   *
   * IT HAS BEEN THREE VALUES AND THE TRAIL IS WORTH KEEPING. A half was the
   * brief's own word and cut the line to WE WA — a fragment rather than a
   * headline. A quarter drew the mock exactly, WE WANTED TO across the full
   * width with the TO cut by the edge, and it was right while the type was set
   * at 225px; at 200 the same fraction is a shorter line and it sits marooned in
   * the middle of the frame. Two fifths puts it back where it was ASKED to be —
   * over to the right, with somewhere to travel.
   *
   * It is also the larger half of what the crawl's distance is made of: the
   * sentence travels this much of itself, plus END_INSET below, and not a unit
   * further. Raising it lengthens the crawl; the pin does not get longer with
   * it, so the line simply moves faster under the same wheel. */
  OVERHANG: 0.77,
  /* ^ Hand-tuned past the 0.4 this file first carried. At 0.77 the line opens
       with only WE W on the screen and the rest of itself out past the crop,
       which is further right than the note above describes — the note is the
       reasoning, this is the setting. */

  /* WHERE THE FULL STOP PARKS AT THE END, as a fraction of the frame's width in
   * from the right edge.
   *
   * A QUARTER OF THE SCREEN, WHICH IS FAR MORE THAN A MARGIN, and it is set by
   * the boxes rather than by the type. BE. is the payoff — it is the one thing
   * the crawl exists to deliver — and box 04 stands in the right quarter of the
   * stage. Parked any closer to the edge the sentence finishes BEHIND it, which
   * is the one arrangement this section cannot end in.
   *
   * So the full stop comes to rest in the gap between box 02 and box 04, with
   * the whole of BE. clear of both. MEASURED, AND THE MARGIN IS 33px AT THE 1440
   * DESIGN WIDTH — this figure is already as small as the arrangement allows, so
   * the end of the crawl cannot be moved further right without moving box 04
   * with it. The start is free (see OVERHANG); the end is not. Move a box in
   * BOXES and this is the figure that has to be looked at again. */
  END_INSET: 0.25,

  /* THE POP, all four of them, in timeline time — 0 is the top of the pin and 1
   * is the end of it.
   *
   * FIRST is where box 01 starts. Not 0: the sentence should be seen to move
   * before anything else does, or the section opens with five things arriving at
   * once and none of them is the headline.
   *
   * LAST is where box 04 has finished. Not 1, for the opposite reason — the last
   * beat of the pin should be the sentence completing itself with the whole
   * arrangement already standing.
   *
   * EACH is how long one box takes, and it deliberately overlaps its neighbours:
   * at 0.22 against a step of about 0.19 a box is still settling as the next one
   * starts, which is what makes four pops read as one run rather than as four
   * separate events.
   *
   * RISE is how far a box climbs on its way in, as a percentage of its own
   * height. Small, and positive means it starts BELOW where it lands.
   *
   * EASE is the bounce. back.out overshoots once and settles, which is the whole
   * of what was asked for — and under a scrub it is the reader's own hand doing
   * the overshooting, since the ease is a curve through the tween's progress
   * rather than a curve through time. */
  POP: {
    FIRST: 0.08,
    LAST: 0.86,
    EACH: 0.22,
    RISE: 16,
    EASE: "back.out(2.2)",
  },
};

/* WAIT UNTIL THE SENTENCE IS SET IN THE FONT IT WILL BE READ IN.
 *
 * document.fonts.ready ANSWERS A SLIGHTLY DIFFERENT QUESTION, which is the
 * reason this is not that. It resolves once the font loads that had STARTED
 * have settled — so if the typekit stylesheet has not been parsed yet, nothing
 * has started, there is nothing to wait for, and it resolves immediately with
 * the fallback face in place. Whether that happens is a race between two network
 * requests, which means it is a race this section would lose only sometimes:
 * every figure in WANTED is struck off the sentence's advance width, so losing
 * it puts the line somewhere else entirely, on some loads and not others.
 *
 * document.fonts.check() asks the question this file actually has: is this exact
 * face available to draw with, right now. Asking it once a frame turns "the
 * loads that had started" into "the font I asked for".
 *
 * The cap is for the case where the kit never arrives at all — it is
 * domain-locked, and a host that is not listed at fonts.adobe.com silently gets
 * Arial Narrow for ever. After two seconds the section measures what it has and
 * stands somewhere sensible, which is a band in the wrong font rather than a
 * band that never appears.
 *
 * check() takes a whole font shorthand and it is the WEIGHT that decides the
 * metrics; 800 is what global.css sets on .wanted-text. The size in the query
 * only has to be a size. */
const FACE = '800 250px "futura-pt-condensed"';
const FACE_WAIT = 120; // frames — about two seconds

function whenFace(run: () => void): void {
  let frames = 0;
  const tick = () => {
    if (document.fonts.check(FACE) || frames++ > FACE_WAIT) {
      run();
      return;
    }
    requestAnimationFrame(tick);
  };
  /* Start from fonts.ready rather than from now: when the stylesheet IS already
     in, that resolves on the frame the face lands and there is nothing to poll.
     The polling is only for the case it resolves too early. */
  document.fonts.ready.then(tick);
}

/* --------------------------------------------------------------------------
   THREE NUMBERS THE STYLESHEET OWNS
   --------------------------------------------------------------------------
   All three are facts about the COMPOSITION rather than about the mechanism,
   and all three differ between the two sheets this section is drawn on. They
   are declared on the section and read back as bare numbers, the same bargain
   AboutOpen/spaceOut.ts strikes with --space-gap and Reimagine/unfold.ts with
   --rei-run; the constants in WANTED stay as the fallbacks, so the section
   still works if a rule is ever dropped.

   An unregistered custom property comes back as the token as authored, so a
   unit here would parse to the same number and mean something else entirely.
   Each is written bare and its unit is decided in exactly one place, which is
   the function that reads it. */

/* WHERE THE SENTENCE'S HEAD STANDS AT REST, as a fraction of the frame's width.
 *
 * IT IS THE FRAME-RELATIVE FORM OF OVERHANG AND IT EXISTS BECAUSE OVERHANG DOES
 * NOT SURVIVE A BIG TYPE SIZE. That figure is a share of the SENTENCE'S OWN
 * LENGTH — 0.77 of it past the right edge — which says the same thing about the
 * arrival pose only while the sentence is a couple of screens long. At the
 * desktop's 222 it puts the head at about four fifths across, which is the
 * design. At the phone's 1000 the sentence is four screens long, the remaining
 * 23 per cent of it is more than a screen, and the head starts off the LEFT edge
 * — the reader arrives in the middle of a word rather than at the beginning of a
 * sentence.
 *
 * So the phone says where the head STANDS instead, which is a statement about
 * the window and is therefore the same statement at any type size. NaN when the
 * property is absent, which is how the desktop keeps OVERHANG. */
const openAt = (root: HTMLElement): number =>
  Number.parseFloat(getComputedStyle(root).getPropertyValue("--wanted-open"));

/* HOW MUCH SCROLL THE PIN IS GIVEN, in screens. WANTED.LENGTH is the fallback
   and the argument for the figure; what the phone changes is only that its
   sentence travels four times as far, so the same pin would run it four times as
   fast under the same wheel. */
const runScreens = (root: HTMLElement): number => {
  const n = Number.parseFloat(
    getComputedStyle(root).getPropertyValue("--wanted-run"),
  );
  return Number.isFinite(n) ? n : WANTED.LENGTH;
};

/* WHETHER THE SECTION IS A CANVAS WALKED PAST A WINDOW, and it is the one thing
 * the stylesheet says here that changes what the section IS rather than what
 * size it is.
 *
 * ON THE DESKTOP IT IS NOT. The sentence is about a window and a half long, so
 * it is delivered by CRAWLING IT ALONG THE WAVE: startOffset is an arc length,
 * the glyphs slide along a curve that stands still in the frame, and the line
 * rises and falls through the hump as it goes. Four boxes at 18.889vw fit across
 * the window under it — a row, all of it in front of the reader at once, popping
 * in order because the order is the only thing left to say about a group that is
 * already whole.
 *
 * ON A PHONE THE CRAWL IS THE WRONG MECHANISM AND NOT MERELY THE WRONG SIZE, and
 * this is the whole argument for the branch. A glyph's speed ACROSS THE SCREEN
 * is its speed along the arc divided by the local slope of the wave. At 222
 * units the sentence stands on most of one broad hump, so that ratio barely
 * moves and the crawl reads as a line sliding sideways. At 1000 it is four
 * screens long, which is three and a half full cycles: the letters bunch up on
 * the steep parts and stretch out over the crests, the word spacing pulses as it
 * passes, and anything standing BESIDE the line at one fixed speed drifts out of
 * step with the words it belongs to. The mechanism is only quiet while the
 * sentence is short.
 *
 * SO THE PHONE BORROWS THE HOME PAGE'S PINNING SECTION OUTRIGHT. ONE CANVAS,
 * SEVERAL WINDOWS WIDE, WITH EVERYTHING STANDING ON IT — the sentence drawn once
 * along the wave and left there, the four boxes at fixed places along it — and
 * ONE translate walking it past a window that holds still. Nothing slides
 * against anything else because there is only one thing moving: the drawing
 * keeps the shape it was drawn in and the reader travels along it. That is
 * .giant-canvas exactly; see GiantPinning/pin.ts, which argues it at length.
 *
 * AND NOTHING ARRIVES, WHICH FOLLOWS FROM THE SAME FACT. A prop on a canvas does
 * not fade, pop or slide in — it is simply THERE, at full size, in its place,
 * and what changes is where the reader is looking. Every entrance this section
 * had was a way of saying "here is another one" to a reader who could already
 * see all four; on a canvas the scroll says it. See the build below, where the
 * two mechanisms are the two halves of one branch. */
const pans = (root: HTMLElement): boolean =>
  Number.parseFloat(getComputedStyle(root).getPropertyValue("--wanted-pan")) > 0;

/* The arc length at which the path crosses a given x.
 *
 * Bisection, because startOffset speaks arc length and the frame's edges are
 * x coordinates, and there is no way to convert between the two but to walk the
 * curve. Safe because the wave's x is strictly increasing — every segment
 * advances 1600 units to the right, none of them doubles back — so the crossing
 * is unique and the split cannot land on the wrong side of a second one.
 *
 * Forty rounds against a path some 17,600 units long resolves to well under a
 * thousandth of a unit, which is far past the point where anything about it is
 * visible; it costs forty getPointAtLength calls, once. The band's anchor is
 * found exactly this way. */
function lengthAtX(path: SVGPathElement, x: number): number {
  let lo = 0;
  let hi = path.getTotalLength();
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function initWeWanted(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>(".wanted-stage");
  const text = root.querySelector<SVGTextElement>(".wanted-text");
  const tp = root.querySelector<SVGTextPathElement>("textPath");
  const guide = root.querySelector<SVGPathElement>("#wanted-path");
  const boxes = Array.from(root.querySelectorAll<HTMLElement>(".wanted-box"));
  if (!stage || !text || !tp || !guide || !boxes.length) return () => {};

  /* HAND THE BOXES OVER FROM THE STYLESHEET, AND DO IT NOW rather than inside
     the font wait. global.css holds them at scale 0 until this attribute lands,
     and the attribute is also what a reader who has asked for less motion needs
     — see the media query, which shows them outright once it is set. Setting it
     first is what makes the tween's numbers mean what they say: GSAP reads the
     computed transform as its starting point, and a scale coming from CSS would
     be MULTIPLIED by the one below rather than replaced. With the attribute on,
     the computed transform is `none` and GSAP owns the whole value. */
  root.dataset.reveal = "live";

  /* Four boxes popping out of nothing and a sentence being dragged across the
     screen are exactly what this setting is asking about. The boxes are already
     standing — the attribute did that — and the sentence is parked at the END of
     its crawl, which is the one position where the line can be read whole. That
     is the section, held still: nothing arrives, and nothing is missing. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    whenFace(() => {
      const span = text.getSubStringLength(0, SENTENCE.length);
      const right = lengthAtX(guide, FRAME_RIGHT);
      const width = right - lengthAtX(guide, FRAME_LEFT);
      tp.setAttribute(
        "startOffset",
        String(right - span - WANTED.END_INSET * width),
      );
    });
    return () => {};
  }

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  let dead = false;
  let tl: gsap.core.Timeline | undefined;
  let st: ScrollTrigger | undefined;

  whenFace(() => {
    if (dead) return;

    /* THE SENTENCE'S OWN ADVANCE WIDTH, in the font that actually loaded.
       Path-independent: it sums character advances, and bending them round a
       curve never stretches them. */
    const span = text.getSubStringLength(0, SENTENCE.length);

    const left = lengthAtX(guide, FRAME_LEFT);
    const right = lengthAtX(guide, FRAME_RIGHT);
    const width = right - left;

    /* THE TWO ENDS OF THE CRAWL.
     *
     * At the start the sentence's TAIL is OVERHANG of its own length past the
     * right edge; at the end its tail has come back to END_INSET inside that
     * edge. Both are written as "where the end of the line is", because that is
     * what the section is about — the head of the sentence going off the left is
     * a consequence, not a placement.
     *
     * The travel between them is therefore span * OVERHANG + width * END_INSET,
     * which is always positive: the line can only ever crawl leftward, however
     * long the sentence gets or however wide the frame is. There is no
     * arrangement of these figures that reverses it. */
    const open = openAt(root);
    const from = Number.isFinite(open)
      ? /* WHERE THE HEAD STANDS, straight off the frame — see openAt. The head
           IS the offset: startOffset is the arc length the first glyph is set
           at, so asking for a position is asking for the arc length at that x
           and nothing more. */
        lengthAtX(guide, FRAME_LEFT + open * (FRAME_RIGHT - FRAME_LEFT))
      : right + span * WANTED.OVERHANG - span;
    const to = right - WANTED.END_INSET * width - span;

    /* WHICH OF THE TWO MECHANISMS THIS SHEET IS DRAWN WITH, and the stylesheet
     * told as well as asked — which is the half of the arrangement that keeps it
     * honest.
     *
     * --wanted-pan is the INTENT: this composition wants a canvas walked past a
     * window, and that is true of the phone's sheet whether or not anything is
     * driving it. data-pan is the FACT — set here, inside the build, on the one
     * path where a timeline exists — so the canvas layout and the translate that
     * carries it are only ever applied while something is writing --wanted-x.
     *
     * WHAT THAT BUYS IS THE TWO CASES WHERE NOTHING IS. A reader who has asked
     * for less motion is handed the section standing still, and a page whose
     * script never ran has the <noscript> escape in components/WeWanted showing
     * the boxes outright — and in both, a canvas four windows wide with nothing
     * to walk it is three claims parked off the right edge for good. Neither
     * gets data-pan, so both keep the stacked arrangement, which is four boxes a
     * reader can see.
     *
     * FIRST, BECAUSE EVERYTHING BELOW DEPENDS ON IT. */
    const panning = pans(root);
    if (panning) root.dataset.pan = "live";

    /* THE STEP BETWEEN POPS. Struck off the two ends and the count rather than
       typed, so a fifth box added to BOXES spreads the run instead of running
       off the end of the pin — the same call every stagger on this site makes.
       Guarded for the single-box case, where there is no step to take. */
    const { FIRST, LAST, EACH, RISE, EASE } = WANTED.POP;
    const step =
      boxes.length > 1 ? (LAST - EACH - FIRST) / (boxes.length - 1) : 0;

    /* ONE TIMELINE, ONE UNIT LONG. Everything in the section is positioned as a
       fraction of it, which is what lets the pin's length be the only figure
       that decides how much scroll any of this costs. */
    tl = gsap.timeline({ paused: true });

    if (panning) {
      /* THE SENTENCE IS SET ONCE AND NEVER MOVED AGAIN. startOffset is where the
       * first glyph stands on the wave, and on a canvas that is a fact about the
       * DRAWING rather than about the scroll — the whole point of the mechanism
       * is that the line keeps the shape it was drawn in. Nothing after this
       * touches the attribute; the section is one translate from here on. */
      tp.setAttribute("startOffset", String(from));

      /* HOW WIDE THE CANVAS IS, in vw, and it is MEASURED off the sentence
       * rather than declared. A figure typed here would be a second copy of
       * something the type size, the font and the wave already decide between
       * them, and two copies of a number are two numbers that drift.
       *
       * IN x AND NOT IN ARC LENGTH. The tail's arc length is `from + span` —
       * span is an advance width, and bending a run of glyphs round a curve
       * never stretches it — but what the camera travels is the DISTANCE ACROSS
       * THE SCREEN from the tail to where the full stop is meant to park, and an
       * inch of arc spent on a steep part of the wave buys less than an inch of
       * x. So both ends are read off the path as points.
       *
       * WHERE IT STOPS IS THE CRAWL'S OWN END_INSET, restated in x: a quarter of
       * the frame in from the right edge, which is where this section has parked
       * its full stop since it was drawn. The two mechanisms finish in the same
       * pose, which is what makes them the same section.
       *
       * PUBLISHED IN vw, and that is what makes it usable from the stylesheet:
       * the viewBox is 1600 units over a box exactly 100vw wide, so a unit is a
       * fixed fraction of the window and this figure is the same at any width.
       * The four claims are placed as fractions of it — see .wanted-boxes in
       * global.css, where the composition is done.
       *
       * FLOORED AT ZERO for a sheet whose sentence already fits: there is
       * nothing to walk past, and a negative canvas would pan it backwards. */
      const frame = FRAME_RIGHT - FRAME_LEFT;
      const tailX = guide.getPointAtLength(from + span).x;
      const travel = Math.max(
        0,
        ((tailX - (FRAME_RIGHT - WANTED.END_INSET * frame)) * 100) / frame,
      );
      root.style.setProperty("--wanted-travel", `${travel}vw`);

      /* THE CAMERA. Off a plain object rather than off the property itself:
       * GSAP would have to parse a custom property's current value out of the
       * computed style on every invalidation to tween it in place, and a number
       * in a closure is already the number. Peel's --peel and the belt's --x are
       * driven this way for the same reason.
       *
       * NEGATIVE, because walking rightwards along a canvas is sliding the
       * canvas left. One number, one property, one element — see .wanted-canvas,
       * which is the only thing in the section that moves. */
      const cam = { x: 0 };
      const write = () => {
        root.style.setProperty("--wanted-x", `${-cam.x}vw`);
      };

      write();
      tl.to(cam, { x: travel, duration: 1, ease: "none", onUpdate: write }, 0);
    } else {
      /* THE CRAWL, AND ONLY ONE NUMBER MOVES. <textPath> means the browser does
         the bending; the tween animates startOffset, an arc length along the
         wave, and every glyph follows it. Same mechanism as WaveBand/marquee.ts,
         and that file argues it at length. */
      tl.fromTo(
        tp,
        { attr: { startOffset: from } },
        { attr: { startOffset: to }, duration: 1, ease: "none" },
        0,
      );

      /* THE POPS, AND THEY BELONG TO THIS BRANCH ALONE. Scale from nothing while
         climbing into place, with one overshoot at the end of each — see POP.
         Not opacity: a box that fades is a box that was always there, and on a
         sheet where all four are in front of the reader from the first frame,
         ARRIVING is the only thing left for them to say.

         ON THE CANVAS THERE IS NOTHING TO SAY IT WITH, AND NOTHING TO SAY. The
         boxes stand in their places several windows apart and the scroll is what
         brings the reader to them, which is the whole of the entrance — a pop on
         top of that is a prop animating for its own sake, and a prop that pops
         while it is still off the right edge has animated where nobody was
         looking. The home page's scenery is placed the same way and is not
         animated either.

         WHICH IS ALSO WHY GSAP MUST NOT TOUCH THEM THERE. data-reveal is already
         set — it is the first thing initWeWanted does — so the stylesheet's park
         at scale 0 has been lifted and the computed transform is `none`. Not
         building the tween is the whole of it; there is no second state to
         write. */
      tl.fromTo(
        boxes,
        { scale: 0, yPercent: RISE },
        {
          scale: 1,
          yPercent: 0,
          duration: EACH,
          ease: EASE,
          stagger: step,
        },
        FIRST,
      );
    }

    st = ScrollTrigger.create({
      /* The pinned box is the honest trigger: `start` is about where THIS
         element takes the screen, and the pin is what holds it there. */
      trigger: stage,
      start: "top top",
      /* Re-read on every refresh, which includes every resize — the pin's
         length is the one thing here that is a function of the window. */
      end: () => "+=" + Math.round(screenH() * runScreens(root)),
      pin: stage,
      /* True pinning, not fake: the stage is 100vh in a normal document flow, so
         ScrollTrigger can hold it with position: fixed and push the rest of the
         page down with a spacer. */
      pinSpacing: true,
      scrub: WANTED.SCRUB,
      invalidateOnRefresh: true,
      /* REFRESHED BEFORE ANY TRIGGER THAT COULD SIT BELOW THIS ONE.
       *
       * A refresh reverts every pin, measures the page in its natural state,
       * and puts the pins back, adding each pin's spacing to the triggers that
       * sit after it. That only comes out right if the pin is measured FIRST,
       * and the default order is the order the triggers were created in — which
       * is the wrong way round for this one: it is built inside a promise (the
       * font wait above), so every trigger further down the page already exists
       * by the time it appears.
       *
       * IT IS WRITTEN HERE BECAUSE OF A DEFECT, and the defect is worth keeping
       * on the page even though the section it happened to is no longer
       * underneath. TO REIMAGINE used to follow this one; left at the default it
       * measured its own start against a page without this pin's 1620px of
       * spacer in it, and played its whole entrance that far early — off the
       * bottom of the screen, where nobody saw it. That section now sits ABOVE
       * this one, so nothing on /about is currently exposed to it.
       *
       * THE PRIORITY STAYS ANYWAY, because it is a statement about THIS pin and
       * not about who happened to be under it: a pin built late has to be
       * measured first, and the page is not finished — the footer and the
       * sign-off still to come go below this section. 1 says "this one first",
       * above the default and below the curtain's 2 and the belt's 3. */
      refreshPriority: 1,
      animation: tl,
    });

    /* AND EVERY OTHER TRIGGER ON THE PAGE HAS TO BE TOLD, because this one just
     * made the document nearly two screens longer.
     *
     * The pin's spacer is added at the moment this trigger is built, and this
     * trigger is built inside a promise — the font wait above. Anything below
     * this section that had already measured itself did so against a document
     * without the spacer in it, so its start position is out by exactly the
     * pin's length. It is not a subtle failure: back when TO REIMAGINE sat under
     * this section it played its whole entrance 1620px early, off the bottom of
     * the screen, every time, and what the reader met on the way down was a
     * section that had already happened. It sits above this one now and the call
     * below is currently insurance rather than a fix — but it is the cheap half
     * of a pair that costs a whole section when it is missing, and the page ends
     * here only until the sign-off lands.
     *
     * ScrollTrigger refreshes everything on load and on resize; a trigger that
     * changes the page's height LATER, on its own schedule, is the case it
     * cannot see coming and has to be told about. One call, once, at the moment
     * the spacer lands. */
    ScrollTrigger.refresh();

    if (process.env.NODE_ENV !== "production") {
      // Console handle for tuning, same convention as window.hero and
      // window.band. The knobs are read when the timeline is built, so a change
      // needs a reload — this is here to read values off, and to find the
      // timeline when something looks wrong.
      Object.assign(window, { wanted: { WANTED, tl, st } });
    }
  });

  return () => {
    dead = true;
    /* The trigger first: killing it takes the pin-spacer out of the document,
       and doing that after clearing the transforms would leave one frame with
       the boxes home and the page two screens too tall. */
    st?.kill();
    tl?.kill();
    /* Back to the stylesheet. With data-reveal still set that is the boxes
       standing at rest, which is the right place for a teardown mid-scrub to
       leave them — not scaled to whatever fraction the wheel had reached. */
    gsap.set(boxes, { clearProps: "transform" });
    /* And the camera with them. Left behind, --wanted-x would hold the canvas at
       whatever fraction of its travel the wheel had reached while nothing was
       driving it any more, and data-pan would keep the boxes out along a canvas
       that no longer moves. */
    root.style.removeProperty("--wanted-x");
    root.style.removeProperty("--wanted-travel");
    delete root.dataset.pan;
  };
}
