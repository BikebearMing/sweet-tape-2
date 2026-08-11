/* Sweet Tape — the giant phrases writing themselves.
 *
 * The site's one text entrance, on the one headline that did not have it: every
 * letter waits below its own mask and slides up into place in a shuffled order.
 * Duration, ease and the hidden figure are imported from Hero/reveal rather than
 * copied, so the four places this happens cannot drift apart.
 *
 * WHAT IS DIFFERENT HERE IS THE CUE, and it is different from the other three.
 * The hero plays on load, the footer plays when its section comes up the
 * viewport. Neither works for a section that is pinned: everything in it is
 * technically on screen for the whole of the pin, so a section-level trigger
 * would write all three phrases at once and you would arrive at TO FIX to find
 * it had been standing there for four thousand pixels.
 *
 * THE CUE IS THE LETTER'S OWN VISIBILITY, one character at a time.
 *
 * It was the camera's: pin.ts knew when its playhead was nearing a phrase and
 * wrote the whole phrase a beat ahead of arrival. That is right for a phrase you
 * can see all of, and these are one and a half windows wide. The far half of TO
 * PROTECT was writing itself while it was still off the right of the screen, so
 * the camera then panned onto letters that had been standing for a second —
 * "the right word animates before I get there". Being early is invisible when it
 * happens out of frame; all it does is spend the animation where nobody is.
 *
 * So each character watches for itself, and a phrase this size writes itself
 * ACROSS its own sweep rather than all at once before it. What arrives as you
 * arrive is what you see move.
 *
 * WHAT THE CAMERA STILL DOES is guarantee. An observer only reports on frames
 * the browser renders, so a jump — an anchor, a scrollbar drag, a restored
 * scroll position — can carry the camera past a letter without it ever being
 * seen intersecting, and a letter that misses its cue stays under its mask for
 * good. pin.ts calls flush() at the stop where the camera leaves each row, by
 * which point every letter in it has certainly been on screen. On an ordinary
 * scroll it does nothing.
 *
 * The heading is the exception and keeps the footer's cue, because it is the one
 * thing here that behaves like ordinary copy in an ordinary section: it is on
 * screen before the pin engages, and it should be written by the time you get
 * there.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { REVEAL } from "../Hero/reveal";

export const GIANT_REVEAL = {
  /* Slower per letter than the hero's 0.025 because there are so few of them —
     TO FIX is six characters, and at the hero's pace a six-letter word is over
     before it reads as a stagger at all. The rise itself (duration, ease, hidden
     figure) is the hero's exactly. */
  STAGGER: 0.055,

  /* HOW EARLY A LETTER COUNTS AS IN VIEW — an IntersectionObserver rootMargin,
   * so it is the viewport grown by this much on every side before anything is
   * asked whether it overlaps.
   *
   * Zero would be honest and slightly late: the letter starts writing on the
   * frame its leading edge crosses the screen edge, so you watch the last of the
   * rise happen after it has slid in. This much is roughly a seventh of a window
   * of run-up, which at the camera's pace is most of a rise — the character is
   * standing about as it clears the edge, and it is still moving while it is in
   * shot, which is the point.
   *
   * IT IS THE SAME NUMBER THAT CAN RECREATE THE OLD BUG. Grow it far enough and
   * the margin reaches across the rest of the phrase, every letter fires at once
   * again, and the far end writes itself off-screen. A window is 100%; anything
   * approaching that is not a lead-in, it is a phrase-level trigger with extra
   * steps.
   *
   * All four sides, not just the right: the camera comes DOWN onto the first
   * phrase and travels the two diagonals, so letters enter vertically as often
   * as they enter sideways. Percentages resolve against the viewport's own
   * width and height, so the run-up is the same fraction of the screen on a
   * phone as on a desktop.
   */
  IN_VIEW_MARGIN: "20% 20% 20% 20%",

  /* HOW LONG A LETTER WAITS FOR COMPANY, in seconds.
   *
   * Visibility alone gives you one letter at a time. That is honest and it is
   * not the effect — the shuffle only exists as a shuffle if there is a group to
   * shuffle, and a group of one revealed left to right is a wipe, which is the
   * thing shuffle() at the bottom of this file was written to avoid. So a letter
   * coming into frame does not write immediately: it joins a pending group, and
   * the group goes up together in scattered order.
   *
   * A MAX-WAIT, NOT A DEBOUNCE, and the distinction is the whole safety of it.
   * The timer starts at the FIRST letter to join and is not restarted by the
   * ones after it, so no letter can ever wait longer than this however fast they
   * arrive. Restarting it — the reflex — would let a steady sweep defer the
   * group indefinitely and put the whole phrase back to writing in one lump.
   *
   * Paired with the margin above, which is what makes the wait free: a letter
   * joins a fifth of a window before it reaches the edge, so the group it is
   * waiting in is assembled and written by about the time it arrives. Shorten
   * the margin and this becomes lateness; lengthen it and the group starts
   * writing off-screen again.
   */
  BATCH_WINDOW: 0.28,

  /* And the ceiling, for the arrival of a whole phrase at once — the drop onto
     TO CREATE brings four or five in on one frame. Past this the group goes up
     without waiting out the window, so a fast scroll writes in bursts rather
     than assembling one enormous stagger that outlives the leg it belongs to. */
  BATCH_MAX: 5,

  /* The heading, on the footer's cue — its top three quarters of the way down
     the window. Late enough that the reader is looking at the section, early
     enough that it is standing before the pin takes the screen. */
  HEADING_START: "top 75%",

  /* Tighter than the phrases': this is three lines of small type, around forty
     letters, and at the phrases' pace the last of them would still be arriving
     long after the first line had landed. The footer's row does the same. */
  HEADING_STAGGER: 0.014,

  /* THE TAPE, pressed down rather than lifted — see the note in index.tsx.
     --peel 0 is the strip still up (Peel's `from`), 1 is flat, so the tween runs
     forwards and stays there. Written as a bare style property, which is what
     peel.ts does too: the value is a unitless number and there is nothing for
     GSAP's CSS plugin to infer. */
  TAPE_AT: 0.3,
  TAPE_DURATION: 0.75,
  TAPE_EASE: "power2.inOut",

  /* THE ARROWS, drawn rather than faded in — the mark is a pencil line on the
     page, and a line arrives by being drawn.

     Slower than a letter because it is one continuous gesture rather than one
     of a crowd, and because the eye follows a line's tip: at the letters' 0.6
     the stroke is over before you have tracked it. */
  ARROW_DURATION: 0.9,
  ARROW_EASE: "power2.inOut",

  /* The head, AFTER the line and not during it. As a fraction of the line's
     duration, so 1 is exactly its last frame.
   *
   * This overlapped at 0.62, on the reasoning that two marks running together
   * read as one stroke of a pen. They do — and that is the problem here, because
   * the head is not part of the same stroke. It is a separate flick back over
   * the end of the line, which is how the mark is actually made by hand, and
   * starting it while two thirds of the body is still being drawn reads as the
   * two racing each other rather than as one following the other.
   *
   * Also the geometric reason: at 0.62 the head was being drawn at a point the
   * line had not reached yet, so for a third of a second the barbs hung in the
   * air ahead of the stroke that was supposed to be arriving at them. */
  ARROW_HEAD_AT: 1,
  ARROW_HEAD_DURATION: 0.3,
};

/* Fisher–Yates, the hero's and the footer's. The shuffle IS the effect: reveal
   the same letters left to right and it reads as a wipe, which is a different
   thing — and a wipe left to right under a camera panning left to right would
   be a third thing again, the word appearing to be drawn by the scroll. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const charsIn = (el: Element) =>
  gsap.utils.toArray<HTMLElement>(".char", el as HTMLElement);

/* Hides a stroked path by pushing a dash as long as itself off the end.
   Animating the offset back to nothing draws it. The length is MEASURED off the
   path rather than typed, so the curve in the markup can be redrawn without a
   number here going stale.

   THE GAP IS len + 2 AND THE OFFSET len + 1, which is not padding for its own
   sake — it is what makes "undrawn" actually mean undrawn.

   A dash of exactly `len` pushed back by exactly `len` ought to hide the path
   perfectly, and it does not, because the two are not written at the same
   precision. GSAP sets the dasharray as the full float and the offset as whole
   px, so what actually lands in the DOM is

     stroke-dasharray: 42.4014      stroke-dashoffset: 42px

   and the offset is a third of a unit SHORT of the dash. That leftover fraction
   of dash sits at the head of the path, and these arrows are
   stroke-linecap: round — a fraction of a unit of dash still gets a full round
   cap at each end, so it renders as a dot a whole stroke-width across. Measured
   at 34 ink pixels standing on screen before either tween had run, worst on the
   head, which is the shorter path and the more recognisable shape.

   Widening the gap by 2 and offsetting by len + 1 puts the whole path strictly
   inside a gap with a unit of clearance at each end, so rounding the offset to
   the nearest px cannot drag a dash back onto it. Same fix and the same two
   numbers HandNote/hand.ts carries — that one inherited them from Vara, which
   hit this before we did. */
function park(path: SVGPathElement) {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: `${len} ${len + 2}`, strokeDashoffset: len + 1 });
  return len;
}

export type Reveals = {
  /**
   * Write anything still hidden in phrase `i` — the backstop for letters an
   * observer never got a frame to report. A no-op on an ordinary scroll.
   */
  flush: (i: number) => void;
  /** The same for arrow `i` — 0 is the one on the first leg. */
  flushArrow: (i: number) => void;
  /** Kill the triggers and leave every letter readable and every line drawn. */
  destroy: () => void;
};

/**
 * Builds the letter reveals for `root` and starts the heading's own trigger.
 *
 * @param root the <section class="giant-pinning">
 * @param rows the phrase blocks, in the order pin.ts walks them
 */
export function initGiantReveal(root: HTMLElement, rows: HTMLElement[]): Reveals {
  gsap.registerPlugin(ScrollTrigger);

  /* Takes the letters off the stylesheet's parked transform and hands them to
     GSAP. Until this lands the chars sit at translateY(130%) — which is also
     what makes the no-JS fallback in index.tsx necessary, and what makes it
     correct to set this BEFORE anything is tweened rather than after. */
  root.dataset.reveal = "live";

  const tweens: gsap.core.Tween[] = [];
  const timelines: gsap.core.Timeline[] = [];

  /* Parked here as well as in the stylesheet, because the attribute above has
     just released the CSS park and something has to hold them down in the frame
     between that and their own tween. */
  const parked = rows.map((row) => {
    const chars = charsIn(row);
    if (chars.length) gsap.set(chars, { yPercent: REVEAL.HIDDEN });
    return chars;
  });

  /* Every tape starts with its strip up. The stylesheet's rest pose is FLAT
     (--peel: 1) so that a page with no JS, or one running reduced motion, shows
     a photograph properly taped down rather than one held by a curled corner —
     this is the only place that lifts it, and it lifts it only to press it.

     ALL OF THEM, not one per row. A phrase used to have exactly one strip, on
     the card standing in its gap, and querySelector was honest about that. It
     now has one on every loose photograph too, and a singular query would have
     found the first, pressed it, and left the rest of the section's pictures
     hanging off strips this line had lifted and nothing was going to put down —
     which is a worse failure than not animating at all. */
  const tapes = rows.map((row) =>
    gsap.utils.toArray<HTMLElement>(".giant-tape", row),
  );
  tapes.flat().forEach((t) => t.style.setProperty("--peel", "0"));

  /* WRITTEN IS PER LETTER, not per phrase, which is the whole change. A phrase
     is now written by however many batches it took to cross the screen, and the
     only thing that must not happen twice is a single character rising twice —
     the timeline that backstops this is scrubbed, so every cue in it is crossed
     again on the way back up. */
  const written = new Set<Element>();

  /* One rise for one group, in scattered order. */
  const write = (chars: HTMLElement[]) => {
    const fresh = chars.filter((c) => !written.has(c));
    if (!fresh.length) return;
    fresh.forEach((c) => written.add(c));
    tweens.push(
      gsap.to(shuffle(fresh), {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: GIANT_REVEAL.STAGGER,
        ease: REVEAL.EASE,
      }),
    );
  };

  /* THE GATHERING. See BATCH_WINDOW — a letter coming into frame waits a moment
     for the ones around it so that what goes up is a group with an order to
     scatter, rather than a single character with nothing to be shuffled
     against. */
  let pending: HTMLElement[] = [];
  let gathering: gsap.core.Tween | null = null;

  const release = () => {
    gathering?.kill();
    gathering = null;
    const group = pending;
    pending = [];
    if (group.length) write(group);
  };

  const gather = (char: HTMLElement) => {
    pending.push(char);
    if (pending.length >= GIANT_REVEAL.BATCH_MAX) {
      release();
      return;
    }
    /* ??= and not =, which is the max-wait: the clock belongs to whoever
       started it. Reassigning here would restart the wait on every arrival and
       a steady sweep would never let the group go. */
    gathering ??= gsap.delayedCall(GIANT_REVEAL.BATCH_WINDOW, release);
  };

  /* The strip goes down over the words, a beat behind them — the picture is
   * taped to the board once the board has something written on it.
   *
   * CUED OFF THE PICTURE IT IS ON, one strip at a time, and that is the same
   * argument the letters make at the head of this file. A phrase is one and a
   * half windows wide and its photographs are scattered across the whole of it:
   * a per-ROW cue would tape the far ones down while they were still off the
   * right of the screen, which is not early, it is spent — you pan onto a
   * picture that was already stuck. The card in the phrase's gap is reached
   * partway through the sweep and the loose shots at their own moments, so the
   * arrangement is assembled as you travel it.
   *
   * The host is the tape's parent — the .giant-slot or the .giant-prop--shot
   * wrapper — which is the box the question is actually about: not "can you see
   * the strip" but "has the picture it holds arrived".
   */
  const tapeOfHost = new Map<Element, HTMLElement>();
  tapes.flat().forEach((t) => {
    if (t.parentElement) tapeOfHost.set(t.parentElement, t);
  });

  const pressed = new Set<HTMLElement>();

  const press = (tape: HTMLElement) => {
    if (pressed.has(tape)) return;
    pressed.add(tape);
    const at = { p: 0 };
    tweens.push(
      gsap.to(at, {
        p: 1,
        duration: GIANT_REVEAL.TAPE_DURATION,
        delay: GIANT_REVEAL.TAPE_AT,
        ease: GIANT_REVEAL.TAPE_EASE,
        onUpdate: () => tape.style.setProperty("--peel", String(at.p)),
      }),
    );
  };

  /* The arrows, parked as undrawn strokes. Once-only for the same reason. */
  const arrows = gsap.utils.toArray<HTMLElement>(
    ".diag-down-arrow, .diag-up-arrow",
    root,
  );
  const arrowPaths = arrows.map((a) => {
    const line = a.querySelector<SVGPathElement>(".arrow-line");
    const head = a.querySelector<SVGPathElement>(".arrow-head");
    if (line) park(line);
    if (head) park(head);
    return { line, head };
  });
  const drawn = new Set<number>();

  const draw = (i: number) => {
    if (drawn.has(i)) return;
    drawn.add(i);
    const paths = arrowPaths[i];
    if (!paths) return;
    const tl = gsap.timeline();
    if (paths.line) {
      tl.to(paths.line, {
        strokeDashoffset: 0,
        duration: GIANT_REVEAL.ARROW_DURATION,
        ease: GIANT_REVEAL.ARROW_EASE,
      });
    }
    if (paths.head) {
      tl.to(
        paths.head,
        {
          strokeDashoffset: 0,
          duration: GIANT_REVEAL.ARROW_HEAD_DURATION,
          ease: GIANT_REVEAL.ARROW_EASE,
        },
        GIANT_REVEAL.ARROW_DURATION * GIANT_REVEAL.ARROW_HEAD_AT,
      );
    }
    timelines.push(tl);
  };

  /* THE OBSERVER. One for the whole section, watching every character, every
   * slot and both arrows — a few dozen boxes, which is nothing, and cheaper than
   * the alternative of measuring rects on the scrub's every frame.
   *
   * It works here for a reason worth writing down: intersection is computed off
   * the same geometry as a bounding rect, so it SEES THE CAMERA. The canvas is
   * moved by one transform on one element and the letters' boxes ride it, which
   * means "is this letter on screen" is answered about where the letter actually
   * is at that moment, not where it was laid out. Nothing here has to know that
   * a camera exists, or where it is, or which direction it is going.
   *
   * Entries arrive in batches — everything that changed on that frame in one
   * callback — but the frame is NOT the grouping the reveal wants: crossing an
   * edge one letter at a time gives callbacks of one, which is why gather()
   * exists above and why nothing here writes anything directly.
   */
  /* WATCH THE MASK, NEVER THE LETTER. This is the one thing in here that has to
   * be got right, and getting it wrong fails silently.
   *
   * A parked .char sits at translateY(130%) — below its own .clip, which is
   * overflow: hidden, and that is what makes it invisible. An observer clips the
   * intersection against every clipping ancestor, so a hidden letter's visible
   * rect is EMPTY: it can never intersect anything, at any scroll position, and
   * its cue never comes. Measured before this line existed, all three phrases
   * fell through to the backstop and wrote themselves as the camera left the
   * row — later than the bug this was meant to fix.
   *
   * The .clip is the letter's real box in the row and it never moves, which is
   * the box the question was always about: "is there room on screen for this
   * letter", not "can you see the letter", which is the thing being decided.
   */
  const charOfBox = new Map<Element, HTMLElement>();
  const indexOfArrow = new Map<Element, number>();
  arrows.forEach((a, i) => indexOfArrow.set(a, i));

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        /* Done with it the moment it fires. Everything here happens once, so a
           box that has had its turn is only a box being measured for nothing. */
        io.unobserve(el);

        const char = charOfBox.get(el);
        if (char) {
          gather(char);
          continue;
        }
        const tape = tapeOfHost.get(el);
        if (tape) {
          press(tape);
          continue;
        }
        const arrow = indexOfArrow.get(el);
        if (arrow !== undefined) draw(arrow);
      }
    },
    { rootMargin: GIANT_REVEAL.IN_VIEW_MARGIN, threshold: 0 },
  );

  /* The mask when there is one — which there always is, from letters() — and
     the character itself as a fallback, so a run of copy split some other way
     still gets a cue rather than silently never arriving. */
  const boxOf = (char: HTMLElement) =>
    (char.closest(".clip") as HTMLElement | null) ?? char;

  const boxes = parked.map((chars) =>
    chars.map((c) => {
      const box = boxOf(c);
      charOfBox.set(box, c);
      return box;
    }),
  );

  boxes.flat().forEach((b) => io.observe(b));
  tapeOfHost.forEach((_, host) => io.observe(host));
  arrows.forEach((a) => io.observe(a));

  /* The backstops. See the head of the file — these repair a frame the browser
     never drew, and on any ordinary scroll they find nothing left to do. */
  const flush = (i: number) => {
    /* Anything still gathering goes up first, so the group keeps its scattered
       order instead of being swallowed into the repair below. */
    release();
    const chars = parked[i];
    if (chars?.length) {
      boxes[i].forEach((b) => io.unobserve(b));
      write(chars);
    }
    /* Every strip in the row, for the same reason the letters get flushed: the
       camera has left this phrase, so any picture in it that never got a frame
       to be seen on is a picture that will hang off a lifted strip for good. */
    tapes[i]?.forEach((t) => {
      if (t.parentElement) io.unobserve(t.parentElement);
      press(t);
    });
  };

  const flushArrow = (i: number) => {
    const arrow = arrows[i];
    if (arrow) io.unobserve(arrow);
    draw(i);
  };

  /* The heading, on its own trigger and its own beat. */
  const heading = root.querySelector<HTMLElement>(".top-title");
  const headChars = heading ? charsIn(heading) : [];
  let st: ScrollTrigger | undefined;

  if (headChars.length) {
    gsap.set(headChars, { yPercent: REVEAL.HIDDEN });
    st = ScrollTrigger.create({
      trigger: root,
      start: GIANT_REVEAL.HEADING_START,
      once: true,
      onEnter: () => {
        tweens.push(
          gsap.to(shuffle(headChars), {
            yPercent: 0,
            duration: REVEAL.DURATION,
            stagger: GIANT_REVEAL.HEADING_STAGGER,
            ease: REVEAL.EASE,
          }),
        );
      },
    });
  }

  return {
    flush,
    flushArrow,
    destroy: () => {
      io.disconnect();
      gathering?.kill();
      st?.kill();
      tweens.forEach((t) => t.kill());
      timelines.forEach((t) => t.kill());
      /* READABLE, not parked. A teardown mid-reveal — a StrictMode remount, a
         route change — must never leave a phrase hidden under its own mask with
         nothing left running to lift it. clearProps hands the letters back to
         the stylesheet, and data-reveal stays set, so the stylesheet's home for
         them is where they belong rather than where they started. */
      const all = [...parked.flat(), ...headChars];
      if (all.length) gsap.set(all, { clearProps: "transform" });
      /* And the lines DRAWN, for the same reason — a teardown must not leave a
         mark half-inked with nothing running to finish it. */
      const paths = arrowPaths.flatMap((a) => [a.line, a.head]).filter(Boolean);
      if (paths.length) {
        gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
      }
      /* And the tape STUCK, back to the stylesheet's rest pose. A teardown
         part-way through the press must not leave a photograph hanging off a
         half-laid strip. */
      tapes.flat().forEach((t) => t.style.removeProperty("--peel"));
    },
  };
}
