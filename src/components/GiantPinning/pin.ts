/* Sweet Tape — the camera that walks the three giant statements.
 *
 * The section holds still while the page scrolls past it and ONE element moves:
 * .giant-canvas, several viewports wide, carrying the phrases, the arrows and
 * all the scenery. Scroll position is the camera's position along a path, and
 * the path is a staircase — right across TO CREATE, right and down to TO FIX,
 * right and up to TO PROTECT.
 *
 * WHERE THE NUMBERS COME FROM. Nowhere in here. Every stop is MEASURED off the
 * laid-out blocks. The arrangement lives in global.css as --gx / --gy per block,
 * and moving a block there moves the camera with it, because the camera never
 * had its own copy of the coordinates. That is the point of doing it this way
 * rather than typing offsets — two lists of the same numbers is two lists that
 * drift.
 *
 * A PHRASE WIDER THAN THE WINDOW IS READ, NOT FRAMED. That is the one rule with
 * any judgement in it. At the type size the design settles on, TO CREATE and TO
 * PROTECT are around one and a half windows wide, and centring something that
 * size shows you its middle and cuts both ends off — "O CREAT". So a block that
 * does not fit gets TWO stops instead of one, its opening and its ending, and
 * the camera travels between them: you read the phrase left to right the way you
 * would read it on paper. A block that does fit is simply centred, as before.
 * TO FIX is the short one and is usually the one that fits.
 *
 * The choice is stable under resize, which is why it can be made once at build
 * time. Every position in the stylesheet is in vw and so is every block's width,
 * so a block that is 1.47 windows wide is 1.47 windows wide at any window size —
 * a resize scales the whole path without changing its shape.
 *
 * SCROLLTRIGGER, and Lenis. Lenis scrolls the window for real rather than
 * transforming a container, so the plugin's own listeners see the scroll with no
 * proxy in between — the footer's reveal relies on the same thing. Pinning is
 * the one place that would have shown a difference, and it does not, because a
 * pin is just position: fixed against a scroll position both of them agree on.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { initGiantParallax } from "./parallax";
import { initGiantReveal } from "./reveal";

export const GIANT = {
  /** Where the section takes the screen. Full bleed, so its top at the top. */
  START: "top top",

  /* THE PACE, and the one number that decides how long the section is.
   *
   * Pixels of scrolling per pixel the camera travels. 1 is a window that moves
   * exactly as fast as your wheel — the canvas glued to the scroll. Below 1 the
   * camera outruns you, which is what makes a big-type section feel like it is
   * being yanked past; above 1 it lags behind you, which reads as weight.
   *
   * The section's whole length falls out of this: the camera's path is measured,
   * multiplied by this, and that is the pin's end. So the phrases can be moved,
   * resized or respaced in the stylesheet and the amount of scrolling adjusts
   * itself — there is no separate "make the section taller" number to remember
   * to change, which is exactly the pairing that goes stale.
   *
   * ONE, and it is worth understanding why rather than treating it as a length
   * dial. Below 1 the canvas travels further than your hand does — at 0.62 it
   * moved 1.6px for every 1px scrolled — and content that outruns the input is
   * read as something being PLAYED at you, however smooth it is. That is the
   * difference between "I am scrolling this" and "I am being taken somewhere",
   * and no amount of easing or smoothing fixes it, because it is not a
   * smoothness problem.
   *
   * At 1 the canvas moves exactly as far as you scrolled. The section costs
   * about seven and a half screens of page, which is the honest price of three
   * statements this size and two diagonals between them. Lowering it buys the
   * length back and spends the directness.
   */
  PACE: 1,

  /* SMOOTHING, and the first thing to reach for if the camera feels harsh.
     Seconds the playhead takes to catch up with the scroll position. `true`
     would be exact tracking, which sounds like what you want and is not: it
     puts every wheel notch straight onto the canvas, so the section moves in
     the steps the input arrives in. A little catch-up turns those steps into a
     glide, and it is doing a different job from Lenis — Lenis smooths the PAGE's
     scroll, this smooths the camera's pursuit of it.

     Kept short. Past about a second the camera keeps travelling for a beat after
     you stop, and a section that moves when your hand is still does not read as
     smooth — it reads as being taken somewhere. */
  SCRUB: 0.6,

  /* How far a phrase's edge stops from the window's edge when the camera is
     parked on it, as a fraction of the window width. Not zero: a letter flush to
     the edge reads as cut off rather than as the end of the word.

     Read from CSS (--giant-inset) when it is there, because the heading's box is
     built off the same figure and two copies would drift. This is the fallback.
     */
  EDGE_INSET: 0.045,

  /* A dead beat at the end of each phrase, in timeline time against a mean leg
     of 1. ZERO, deliberately.

     It reads well in the abstract — a moment to take the phrase in — and badly
     in the hand. A hold is scroll that moves nothing, so the section stops
     answering the wheel, and then all at once starts again: the exact "it snaps
     to the next one" feeling. The phrase is already on screen for the whole
     length of its own sweep, which is where the time to read it comes from.

     Raise it only together with an ease that decelerates into it — a hold at
     the end of a linear move is a full stop with no braking. */
  HOLD: 0,

  /* NO EASE. Not an oversight, and the single most important line in the file
   * for how the section feels.
   *
   * An ease is a change of speed, and a change of speed is what makes a scroll
   * feel like a RIDE rather than a scroll. power1.inOut — the obvious choice,
   * and what this was — brings the camera almost to a standstill at every stop
   * and winds it back up again: measured, it ran 296px of travel per step down
   * to 13 and back up to 295. That profile IS "it snaps from one to the next".
   * The stops were never dead time; they were dead SPEED.
   *
   * With "none", and each segment's duration set proportional to its own length
   * below, every segment runs at the identical speed. There is then no speed
   * change anywhere in the section — not at a corner, not at a phrase, not at
   * the ends. The camera travels at one rate from the first frame to the last,
   * and the only thing that ever changes is its direction.
   *
   * Which leaves the corners: at constant speed a turn is a change of direction
   * with no change of pace. The two here are about 23 and 55 degrees — drifts,
   * not reversals — and a drift at constant speed reads as the camera following
   * the staircase, which is what it is doing. Easing them "for smoothness" buys
   * a rounded corner at the price of the whole section stuttering.
   */
  EASE: "none",

  /* THE CORNERS, and the one the note above did not account for.
   *
   * "No ease" makes every leg run at one speed, which leaves direction as the
   * only thing that ever changes — and that is fine for the two diagonal joins,
   * which are drifts of about 23 and 55 degrees. It is not fine for the join
   * this section actually opens with. The drop off the heading is PURELY
   * VERTICAL (readPath forces its x to the first phrase's, deliberately), and
   * TO CREATE's sweep is purely horizontal, so the two meet at a RIGHT ANGLE.
   *
   * Measured on the canvas: a rock-steady 17-18px per frame throughout, with
   * the heading going -90 degrees, -104, then 180 — ninety degrees of turn
   * inside two frames. Speed never changed, so none of the reasoning above was
   * violated; the camera simply changed direction faster than an eye will
   * accept, and it reads as the section jumping as TO CREATE takes the screen.
   *
   * So sharp corners are ROUNDED IN THE PATH rather than smoothed in time. The
   * stop is replaced by a pair either side of it, which turns one hard corner
   * into two soft ones with a short diagonal between. And because each leg's
   * duration is already proportional to its own length, adding that geometry
   * costs nothing in pace: the camera runs the chamfer at the same speed it
   * runs everything else. The alternative — easing the corner — is the one this
   * file already rejects, and for good reason.
   *
   * CORNER is the radius, as a fraction of the SHORTER of the two legs meeting
   * there, so it can never eat more of a leg than that leg has. Every unit of
   * it is a unit of the drop that stops being vertical, so it is kept as small
   * as CORNER_STEPS allows — at 0.13 the arc spends about 70px of a 550px drop.
   *
   * CORNER_STEPS is how many segments the arc is drawn in, and it is what buys
   * the small radius: the turn is divided between them, so four segments make
   * a right angle into four turns of ~22 degrees — comfortably under the 55 the
   * section already makes further along and evidently accepts — where a plain
   * chamfer would need twice the radius to reach half that smoothness.
   *
   * CORNER_MIN is the turn worth rounding at all, in degrees. Above the two
   * existing joins, so they are left exactly as they were — this is a fix for a
   * right angle, not a new treatment applied to the whole staircase. */
  CORNER: 0.13,
  CORNER_STEPS: 4,
  CORNER_MIN: 70,
};

type Stop = { x: number; y: number };

/**
 * Pins `root` and scrubs the canvas along a stop-to-stop path over the phrases.
 *
 * @param root the <section class="giant-pinning">
 * @returns teardown — kills the trigger, the timeline and the pin-spacer with it
 */
export function initGiantPinning(root: HTMLElement): () => void {
  /* Hijacking the scroll so it drives a camera instead of the page is squarely
     what this setting is asking about. Leave: the stylesheet's reduced-motion
     block lays the three phrases out as an ordinary stack, so the section still
     says everything it has to say — it just says it by scrolling normally. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    /* The letters are parked under their masks by the stylesheet and released by
       this attribute, so it has to be set even on the path where nothing
       animates — otherwise "reduce motion" reads as "hide the headlines". The
       stacked fallback then shows the phrases standing, which is the whole
       point of it. */
    root.dataset.reveal = "live";
    return () => {};
  }

  const canvas = root.querySelector<HTMLElement>(".giant-canvas");
  const rows = gsap.utils.toArray<HTMLElement>(".giant-row", root);

  /* THE FRAME, and what actually gets pinned — the wrapper, not the section.
     The two are not the same box: the wrapper is exactly one viewport, which is
     what "pinned" means, while the section is the wrapper PLUS its tail (see
     --giant-tail in the stylesheet), the run of bare paper that carries the last
     phrase clear of the footer once the pin lets go. Pin the section and that
     tail is inside the held box and never scrolls; pin the wrapper and it is
     ordinary page below it, which is the point of it. */
  const frame = root.querySelector<HTMLElement>(".wrapper");

  /* The heading, and the reason the section OPENS on a vertical move. The camera
     starts framed on WHY WE EXIST and drops from it onto the first phrase, which
     is the "down" in down-to-horizontal: come down, then go horizontal. It is
     measured off the element rather than being a typed offset, so the length of
     that drop is simply the gap between the heading's --gy and the phrase's, set
     in the stylesheet like every other distance here.

     Optional. Without a .top-title the path just starts on the first phrase. */
  const intro = root.querySelector<HTMLElement>(".giant-canvas > .top-title");

  /* One row is a section with nothing to travel between, and no canvas is a
     markup change this file has not caught up with. Either way there is no
     camera to build, and the section is still readable without one. */
  if (!canvas || rows.length < 2) return () => {};

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* The edge inset, from the stylesheet when it declares one. It is unitless
     there — a fraction of the window — so this is a plain parse with no unit to
     resolve. The heading's box is built off the same custom property, which is
     the reason it lives in CSS: the two have to agree for the section to open
     with the heading centred, and agreement by coincidence does not survive
     somebody tuning one of them. */
  const insetFraction = () => {
    const declared = parseFloat(
      getComputedStyle(root).getPropertyValue("--giant-inset"),
    );
    return Number.isFinite(declared) ? declared : GIANT.EDGE_INSET;
  };

  /* The camera path, and which stops are the end of a phrase.
   *
   * offsetLeft/offsetTop rather than getBoundingClientRect: the rect is where
   * the element is RIGHT NOW, which during a scrub is mid-tween and includes the
   * very transform being solved for. offsetLeft is the untransformed layout
   * position, which is the only stable thing to measure against. It reads off
   * .giant-canvas because that is the offsetParent.
   */
  function readPath(): { stops: Stop[]; ends: boolean[]; opens: number[] } {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const inset = vw * insetFraction();
    const stops: Stop[] = [];
    const ends: boolean[] = [];
    /* Which stop is each row's FIRST — one entry per row, indexing into stops.
       A swept phrase owns two of them and a framed one owns a single stop, so
       row number and stop number are not the same thing, and the text cue needs
       the row's opening rather than whichever stop happens to share its
       index. */
    const opens: number[] = [];

    for (const row of rows) {
      opens.push(stops.length);
      const l = row.offsetLeft;
      const w = row.offsetWidth;
      /* Vertical is always centred, for both stops of a swept phrase — the
         staircase is the camera's vertical story and a phrase should not also
         drift up or down while you are reading it. */
      const y = vh / 2 - (row.offsetTop + row.offsetHeight / 2);

      if (w <= vw - inset * 2) {
        stops.push({ x: vw / 2 - (l + w / 2), y });
        ends.push(true);
      } else {
        stops.push({ x: inset - l, y }); // its opening, against the left edge
        ends.push(false);
        stops.push({ x: vw - inset - (l + w), y }); // its ending, against the right
        ends.push(true);
      }
    }

    /* The opening drop, prepended. Its x is the FIRST PHRASE'S x, not the
       heading's own — that is what makes the move purely vertical. Give it the
       heading's x instead and the section opens on a diagonal, which is the
       move the two legs further along are already making and would leave the
       whole section with no straight line in it. */
    if (intro) {
      stops.unshift({
        x: stops[0].x,
        y: vh / 2 - (intro.offsetTop + intro.offsetHeight / 2),
      });
      /* Marked as ending a phrase so the move OFF it is eased like a camera move
         rather than read like a line of text. */
      ends.unshift(true);
      /* Everything downstream shifted by the prepended stop. */
      for (let i = 0; i < opens.length; i++) opens[i] += 1;
    }

    return round({ stops, ends, opens });
  }

  /* Replace every corner sharper than GIANT.CORNER_MIN with a pair of stops
   * either side of it — see the note by GIANT.CORNER.
   *
   * The pair sits GIANT.CORNER of the shorter adjacent leg back along the way
   * in and the same distance on along the way out, so the camera turns twice by
   * half as much with a short diagonal between, instead of once by the whole
   * angle. The framing is not disturbed: the second of the pair already carries
   * the corner's own coordinates on the axis the outgoing leg does not move, so
   * the phrase is centred exactly as it was from that stop onward, and only the
   * transient between the two is new.
   *
   * `opens` is remapped rather than recomputed. It indexes stops, and inserting
   * any shifts everything after it — the same bookkeeping the intro's unshift
   * above already does, done properly because this can insert more than one.
   */
  function round({ stops, ends, opens }: { stops: Stop[]; ends: boolean[]; opens: number[] }) {
    const out: Stop[] = [];
    const outEnds: boolean[] = [];
    const moved: number[] = []; // old stop index -> its index in `out`

    for (let i = 0; i < stops.length; i++) {
      const cur = stops[i];
      const prev = stops[i - 1];
      const next = stops[i + 1];
      const keep = () => {
        moved[i] = out.length;
        out.push(cur);
        outEnds.push(ends[i]);
      };
      if (!prev || !next) {
        keep();
        continue;
      }

      const inX = cur.x - prev.x;
      const inY = cur.y - prev.y;
      const outX = next.x - cur.x;
      const outY = next.y - cur.y;
      const inL = Math.hypot(inX, inY);
      const outL = Math.hypot(outX, outY);
      if (inL < 1 || outL < 1) {
        keep();
        continue;
      }

      const cos = (inX * outX + inY * outY) / (inL * outL);
      const turn = (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
      if (turn < GIANT.CORNER_MIN) {
        keep();
        continue;
      }

      const r = Math.min(inL, outL) * GIANT.CORNER;
      /* An ARC, not a chamfer. Two points either side of the corner would turn
         90 degrees into two turns of 45, which is softer and still a corner;
         spreading the same radius over several segments turns it into as many
         turns of a fraction of that, and lets the radius be SMALLER for the
         same smoothness — which matters, because every unit of radius is a unit
         of the vertical drop that stops being vertical.

         A quadratic Bezier from the first tangent point to the second, with the
         corner itself as the control point. That is the standard fillet and it
         is exactly tangent to both legs at its ends, so the camera leaves the
         drop and joins the sweep with no kink at either join — the only thing
         left to see is the arc's own curvature, spread over CORNER_STEPS. */
      const ax = cur.x - (inX / inL) * r;
      const ay = cur.y - (inY / inL) * r;
      const bx = cur.x + (outX / outL) * r;
      const by = cur.y + (outY / outL) * r;

      /* The row opens at the FIRST point of the arc. It is the earliest of
         them, so anything keyed to it — the reveal's flush backstop — fires no
         later than it did before the corner was rounded. */
      moved[i] = out.length;
      const steps = Math.max(2, Math.round(GIANT.CORNER_STEPS));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const k = 1 - t;
        out.push({
          x: k * k * ax + 2 * k * t * cur.x + t * t * bx,
          y: k * k * ay + 2 * k * t * cur.y + t * t * by,
        });
        // Only the last point of the arc is the corner's own stop.
        outEnds.push(s === steps ? ends[i] : false);
      }
    }

    return { stops: out, ends: outEnds, opens: opens.map((i) => moved[i] ?? i) };
  }

  const legLengths = (stops: Stop[]) =>
    stops.slice(1).map((s, i) => Math.hypot(s.x - stops[i].x, s.y - stops[i].y));

  const pathLength = () =>
    legLengths(readPath().stops).reduce((a, b) => a + b, 0);

  const built = readPath();
  const count = built.stops.length;
  const legs = legLengths(built.stops);
  const total = legs.reduce((a, b) => a + b, 0) || 1;

  /* Function-based values, re-evaluated by GSAP on every invalidate. Paired with
     invalidateOnRefresh below, that is what makes a resize correct rather than
     approximately correct: every stop is in px, every px of it came from a vw or
     a viewport dimension, and all of them are wrong the moment the window
     changes. The DURATIONS below do not need the same treatment — they are
     ratios between legs, and a resize scales every leg by the same factor. */
  const at = (i: number, axis: "x" | "y") => () => readPath().stops[i][axis];

  /* Parked on the first stop before anything scrolls, so the section is already
     framed on TO CREATE when it comes into view rather than showing the canvas's
     own top-left corner. */
  gsap.set(canvas, { x: at(0, "x"), y: at(0, "y") });

  /* THE SCENERY, drifting against all of that. It needs one number per frame —
     where the camera is — and the timeline is the only thing that knows, so it
     is driven from here rather than from a scroll listener of its own. A second
     listener would be a second opinion about the camera's position, arriving on
     a different frame from the transform it is supposed to be relative to. */
  const parallax = initGiantParallax(root);
  const place = () => parallax.update(Number(gsap.getProperty(canvas, "x")));
  place();

  const tl = gsap.timeline({ onUpdate: place });

  /* A beat before the camera starts, so the section is ON something at the
     moment it takes the screen rather than already moving. Skipped entirely at
     HOLD: 0 — an empty tween of zero duration is still a timeline child, and
     the arithmetic below is clearer without one. */
  if (GIANT.HOLD > 0) tl.to({}, { duration: GIANT.HOLD });

  /* When the playhead reaches each stop, in timeline time. Collected as the
     timeline is built rather than worked out afterwards, because it is simply
     the running duration and any second derivation of it would be a chance to
     get it wrong. */
  const timeAt: number[] = [tl.duration()];

  for (let i = 1; i < count; i++) {
    tl.to(canvas, {
      x: at(i, "x"),
      y: at(i, "y"),
      /* Proportional to the distance covered, so the camera holds ONE speed for
         the whole section. Equal durations would make a short leg crawl and a
         long one race, which reads as the section stuttering. Scaled so the mean
         leg is 1 and GIANT.HOLD stays meaningful against it. */
      duration: (legs[i - 1] / total) * (count - 1),
      ease: GIANT.EASE,
    });

    if (GIANT.HOLD > 0 && built.ends[i]) {
      tl.to({}, { duration: GIANT.HOLD });
    }

    timeAt[i] = tl.duration();
  }

  /* Scroll spent MOVING, in timeline time — the durations above sum to this by
     construction. The rest of the timeline is holds, and the scrub maps scroll
     to time linearly, so scaling by the whole duration over this is what keeps a
     hold worth the same scrolling as the leg it is a fraction of. */
  const moveTime = count - 1;
  const holdScale = tl.duration() / moveTime;

  /* THE TEXT CUES ARE NOT HERE ANY MORE, and what is left is a guarantee.
   *
   * A phrase used to start writing itself a fixed beat before the camera reached
   * it. That is right for a phrase you can see all of, and these are one and a
   * half windows wide: the far half of TO PROTECT wrote itself while it was
   * still off the right of the screen, so the camera then panned onto letters
   * that had been standing for a second. reveal.ts now cues each character off
   * its own visibility instead, and knows nothing about this timeline.
   *
   * What it cannot do by itself is survive a JUMP. An IntersectionObserver only
   * reports on frames the browser renders, so an anchor, a scrollbar drag or a
   * restored scroll position can carry the camera past a letter without it ever
   * being seen intersecting — and a letter that misses its cue stays under its
   * mask for good. These calls sit at the stop where the camera LEAVES each row,
   * by which point every letter in it has certainly been on screen. On an
   * ordinary scroll they find nothing to do.
   *
   * A hair before the stop rather than on it, for the last row only in practice:
   * its leaving stop is the end of the timeline, and a call sitting exactly on
   * the duration is one the playhead can arrive at without crossing. The offset
   * is a thousandth of a leg — around a pixel of scrolling.
   */
  const reveals = initGiantReveal(root, rows);
  const EPS = 0.001;

  built.opens.forEach((stopIndex, rowIndex) => {
    /* The stop before the NEXT row opens is this row's last — a swept phrase
       owns two stops and a framed one owns a single stop, so this cannot be
       derived from the row index. */
    const leaves = (built.opens[rowIndex + 1] ?? count) - 1;
    const off = Math.max(0, (timeAt[leaves] ?? tl.duration()) - EPS);
    tl.call(() => reveals.flush(rowIndex), undefined, off);

    /* THE ARROW ON THE LEG INTO THIS PHRASE. Arrow 0 is on the leg into phrase
       1, so the arrow index is one behind the row's — and the camera is past it
       once the row it points at is open.

       Not for the first phrase: there is no leg before it, only the drop off the
       heading, and nothing is drawn on that. */
    if (rowIndex > 0) {
      const arrived = Math.max(0, (timeAt[stopIndex] ?? 0) - EPS);
      tl.call(() => reveals.flushArrow(rowIndex - 1), undefined, arrived);
    }
  });

  const st = ScrollTrigger.create({
    trigger: root,
    start: GIANT.START,
    /* MEASURED, not typed. The camera's path is however long the arrangement
       makes it, and this is that length at the chosen pace. Move a phrase in the
       stylesheet and the section gets longer or shorter to suit, with nothing
       here to keep in step. */
    end: () => "+=" + Math.round(pathLength() * GIANT.PACE * holdScale),
    pin: frame ?? true,
    /* True pinning, not fake: the section is 100vh in a normal document flow, so
       ScrollTrigger can hold it with position: fixed and push the rest of the
       page down with a spacer. */
    pinSpacing: true,
    scrub: GIANT.SCRUB,
    /* Re-measures the stops and re-reads `end` on every refresh, which includes
       every resize. Without it the camera keeps aiming at where the phrases were
       when the page loaded. */
    invalidateOnRefresh: true,
    /* The parallax measures layout too — where each prop's centre sits on the
       canvas — and every one of those numbers came from a vw. Re-measured on the
       same signal as the stops, and re-placed immediately: a refresh that leaves
       the scenery at offsets computed for the old window is a frame of props
       standing somewhere they were never put. */
    onRefresh: () => {
      parallax.measure();
      place();
    },
    animation: tl,
  });

  return () => {
    /* The trigger first: killing it takes the pin-spacer out of the document, and
       doing that after clearing the transform would leave one frame with the
       canvas home and the page still several screens too tall. */
    st.kill();
    tl.kill();
    reveals.destroy();
    parallax.destroy();
    /* Back to the stylesheet. A teardown mid-scrub must not leave the canvas
       parked at whatever camera position it happened to be at — with the pin
       gone that is simply a section showing an empty corner of itself. */
    gsap.set(canvas, { clearProps: "transform" });
  };
}
