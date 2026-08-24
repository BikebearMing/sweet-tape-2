import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { onViewportChange } from "@/components/viewport";

/* THE BELT'S MOVEMENT — three rows dragged past the window as the section goes
 * by, scrubbed to the scroll and to nothing else.
 *
 * ROW ONE GOES THE OTHER WAY. That is the whole trick and it is worth saying
 * before anything else: the top row travels RIGHT while the two under it travel
 * LEFT, so the reader is looking at a machine with belts running against each
 * other rather than at three copies of one slide. It is also what stops the eye
 * settling — a shelf you cannot take in at a glance is the thing this section is
 * complaining about.
 *
 * SCRUBBED, NOT PLAYED. There is no clock: every frame is drawn from where the
 * page is, so the belt runs while the reader scrolls, stops when they stop, and
 * runs backwards when they go back up. A looping marquee on a timer would move
 * on its own while the page was still — which reads as a widget on the page
 * rather than as the page's own movement — and would need each row's contents
 * duplicated to hide its seam. Nothing here is duplicated: the rows are long
 * enough that their ends never come into the window inside the travel below.
 *
 * WHERE THE WEIGHT ACTUALLY COMES FROM, because the obvious answer is wrong and
 * cost us a round to find out.
 *
 * A NUMERIC SCRUB DOES NOT CHANGE THE MOVEMENT. It is a catch-up time: the rows
 * chase the scroll's position instead of being set to it. That sounds like mass
 * and is not, because of what it settles to — under steady scrolling the chase
 * reaches equilibrium within about a second and the belt then travels at exactly
 * the scroll's speed, merely OFFSET from it. Measured on this section at
 * scrub 1.5, the offset settled at a flat 13.5vw and stayed there: every frame
 * after that was the old movement, shifted. A constant offset is invisible —
 * there is nothing on screen to compare it against — so the only part a reader
 * can actually see is the fraction of a second of coasting at each end, and
 * Lenis has already eased those into near-nothing.
 *
 * WHAT IS VISIBLE IS A CHANGE OF SPEED, and that is EASE below. An ease across
 * the window makes the rows travel a different number of vw for the same wheel
 * notch depending on where in the section the reader is: barely moving as the
 * section climbs into view, quickest across the middle, gliding to a stop as it
 * settles. That is mass — a thing that resists starting and takes a while to
 * give up its motion — and unlike the scrub it is on screen the whole time.
 *
 * SO THE TWO ARE SET AGAINST EACH OTHER RATHER THAN STACKED. EASE carries the
 * feel; WEIGHT is kept small enough not to smear the shape of it. The failure
 * mode of a big WEIGHT is not vagueness, it is a broken handoff: at 1.5 a reader
 * arriving at speed crosses into the pin with the belt still 10.6vw short of its
 * end, so the mark begins its dip about a tenth of a screen right of centre and
 * slides into place while it compresses.
 *
 * ONE TWEEN FOR ALL THREE ROWS. They share the scroll's progress and each is a
 * straight line through it, so what is animated is a single number from 0 to 1
 * and the three positions are read off it on every frame. Three tweens would be
 * three ScrollTriggers measuring the same box against the same window.
 *
 * AND THEN THE BELT STOPS AND THE MARK TAKES THE SCREEN. That is the second half
 * of this file and it is what the first half is FOR: the rows are travelling
 * towards a pose in which the mark is standing alone in the middle of the window
 * with every claim run off the edges, and once they are there the section is
 * held and the mark is grown until there is nothing else on screen. Two
 * beats of one timeline, run inside one pin — see RUN, which is the schedule.
 *
 * AND NONE OF IT HAPPENS UNTIL THE SECTION IS ALL THE WAY ON SCREEN. The reader
 * scrolls the section up into place and it does nothing while they do: three
 * still rows with the sentence readable across them. Only when its bottom edge
 * reaches the bottom of the window — the section exactly filling the screen — is
 * it caught and held, and only then does the belt start. Every frame of the
 * movement is therefore spent on a full screen. The version before this one ran
 * the belt on the way in, which meant half the travel was spent while the
 * section was still climbing past the bottom edge, where it could not be
 * watched, and the other half was a handoff into the pin to get wrong. */

/* THE KNOBS.
 *
 * EASE is the feel, and it is a power1.inOut for the shape of its ENDS. The rows
 * leave from nothing and arrive at nothing: they take a moment to get going
 * after the section is caught, run quickest across the middle of the travel
 * where the reader is looking, and glide to a halt in the same instant the mark
 * begins to draw back. Nothing in the section starts or stops dead. Peak speed
 * is twice the flat rate.
 *
 * NOT power2.inOut, which is the same shape drawn harder: it leaves nine tenths
 * of the travel to the middle third and reads as a belt that was standing still
 * and then bolted. Not an .out, which would spend the movement in the first
 * moments after the pin catches, when the reader has barely registered that the
 * section has stopped. */
export const BELT = {
  /* THE SPEED PROFILE — the section's feel knob, and the one to reach for when
     the belt wants more or less mass. "none" is a flat rate, and every step
     towards power2.inOut trades an even crawl for a bigger difference between
     the ends and the middle. */
  EASE: "power1.inOut",

  /* THE CATCH-UP, IN SECONDS. Small on purpose — see the note at the top of the
     file: this buys the fraction of a second of coasting at each end and nothing
     else. 0.8 takes the edge off a wheel notch without smearing EASE. */
  WEIGHT: 0.8,
} as const;

/* THE MARK'S TAKEOVER.
 *
 * START IS WHERE THE BELT'S END IS — the section's bottom edge arriving at the
 * bottom of the window, which is the section exactly filling it. Pinning at that
 * position rather than at "top top" is the difference between a section that is
 * held once it is fully on screen and one that is caught halfway up.
 *
 * HOLD is how much scroll the growth is given, and it is the only figure here
 * that is a taste rather than a consequence. +=100% is one screen: long enough
 * that the mark opens rather than pops, short enough that a reader who is
 * scrolling to get somewhere does not feel stuck. It is also exactly the amount
 * of extra page the pin adds to the document.
 *
 * SCALE is measured rather than chosen, and the measurement is not the one you
 * would guess. The mark is 23.655vw across, so its BOUNDING BOX clears a 100vw
 * window at 4.23 — but this is a rounded blob, and what has to be off screen is
 * its CORNERS, which are the last part of it to get there. 6 leaves a wedge of
 * sheet in the top-left and bottom-right; 7 closes them at 16:9; 8 is that with
 * room for a squarer window, where the screen's diagonal is longer against the
 * same width. It costs nothing to overshoot — past coverage the mark is a flat
 * field of one colour and the extra scale is not visible.
 *
 * GROW is the share of the hold spent moving, and the rest is the screen held
 * full. It exists BECAUSE of the overshoot above: the last part of a run to 8 is
 * happening entirely off the edges of the screen, so spending scroll on it would
 * read as the section having stopped responding. Finishing at 0.8 turns that
 * dead stretch into a deliberate beat — a held green field — and the reader
 * leaves on it rather than on a shape still moving.
 *
 * AND IT DIPS BEFORE IT GOES. The mark draws BACK — down to DIP, over the first
 * DIP_FOR of the run — and only then launches. That is anticipation, the oldest
 * trick in the book and the reason the growth reads as a thing DECIDING to take
 * the screen rather than as a shape being resized: a movement that starts by
 * going the other way tells you it is coming before it arrives, and it gives the
 * eye a small target to watch expand from instead of a large one that was
 * already most of the way there.
 *
 * THE TWO EASES ARE THE BOUNCE. Down on a power2.out — quick off the mark and
 * settling into the bottom of the dip, which is a thing being compressed rather
 * than a thing shrinking. Up on a power2.out as well, so it LEAVES the dip fast,
 * the way something released does, and eases into filling the window rather than
 * accelerating into it. An ease under a scrub is normally wrong on this site
 * (see BELT above, where it would be a slipping belt) and is right here for the
 * reason the rule is: this one maps the scroll to a SIZE, not to a speed, so
 * shaping it is drawing rather than timing. */
export const MARK = {
  DIP: 0.72,
  SCALE: 8,
} as const;

/* THE PINNED RUN — where the section is caught, how much scroll it is given, and
 * how that scroll is divided between the four beats.
 *
 * START IS THE SECTION'S BOTTOM EDGE REACHING THE BOTTOM OF THE WINDOW, which
 * for a section one screen tall is the moment it exactly fills the screen.
 * NOTHING MOVES BEFORE THAT. The section scrolls up into place carrying the
 * still composition the markup rests on — all three claims readable — and the
 * belt does not start until the reader has the whole of it in front of them.
 * That is the point of doing it this way: every frame of the travel is spent on
 * a full screen, rather than half of it being spent while the section is still
 * climbing past the bottom edge where it cannot be watched.
 *
 * HOLD is the scroll the whole run is given, and it is ALSO the belt's speed
 * control — the one to turn when the trains are going too fast. The travel is a
 * fixed distance in vw, decided by the two poses, so the only way to slow it
 * down is to spend more scroll getting there. Every 100% added here is another
 * screen of wheel spread across the same movement.
 *
 * THE SHARES DIVIDE THAT SCROLL and are shares rather than lengths: under a
 * scrub a timeline is stretched over the range whatever its durations add up to,
 * so what matters is their proportion. TRAVEL is the belt, DRAW is the mark
 * pulling back, OPEN is it taking the screen, and whatever is left over is the
 * beat the full screen is held for.
 *
 * THE TAIL IS ONE SCREEN OF SCROLL, AND IT IS NOT A TASTE ANY MORE — IT IS AN
 * APPOINTMENT. components/Reason is lifted back over this section by exactly two
 * screens (see .reason's margin-top in global.css) so that its lime curtain
 * sweeps down while the mark is still held here, still pinned and still filling
 * the window. The curtain takes one screen; the tail has to be at least that or
 * the belt unpins mid-sweep and the green field slides out from behind a curtain
 * that has not finished covering it.
 *
 * 0.296 of +=350% is 1.04 screens, which is that with a frame in hand. The other
 * three shares were re-based on the longer hold rather than retuned: at these
 * figures the travel, the draw and the opening are each within a hundredth of a
 * screen of what they measured at +=280% / 0.55 / 0.08 / 0.25, so the belt runs
 * at the speed it was tuned to and only the held beat at the end got longer.
 * Change HOLD and all four have to be re-based together. */
export const RUN = {
  START: "bottom bottom",
  HOLD: "+=350%",
  TRAVEL: 0.44,
  DRAW: 0.064,
  OPEN: 0.2,
} as const;

/* THE IDLE — the belt already running before anybody scrolls it.
 *
 * A CONVEYOR THAT ONLY MOVES WHEN YOU PUSH IT IS NOT A CONVEYOR. So the rows
 * creep, on a clock of their own, from the moment the section comes into view:
 * a reader coming down the page meets a belt that is already going, and the
 * scroll is then them taking hold of a thing in motion rather than starting a
 * mechanism. Each row idles in the direction it is going to travel, so the crawl
 * and the run are the same movement at two speeds.
 *
 * SPEED IS IN vw PER SECOND and is meant to be barely a movement — at 1.2 a row
 * takes about two and a half minutes to cross its own repeat. Enough that the
 * section is never quite still; not enough to compete with the scroll.
 *
 * IT WRAPS ON ONE COPY OF THE ROW, which is the reason the rows are printed
 * three times at all: translating a row by exactly one copy's length puts
 * identical pills in identical places, so the drift can run for ever inside a
 * bounded offset and the jump back is invisible. Without the wrap a reader who
 * left the tab open would come back to a belt that had crawled off the screen.
 *
 * AND IT IS FOLDED AWAY BY THE TRAVEL. The idle is held at whatever it had
 * reached the moment the pin catches, and faded out across the travel — so the
 * belt arrives at exactly the pose the design asks for, with the mark dead
 * centre, however long the reader spent looking at it on the way in. That fade
 * is also why the idle must not tick during the travel: a wrap mid-fade would be
 * a jump of part of a copy, which is a jump you can see. */
export const IDLE = {
  SPEED: 1.2,
} as const;

/* THE COPY, RISING INTO PLACE. Per line and not per letter — see the note on
 * Line in components/Conveyor. HIDDEN has to agree with the parked pose in
 * global.css; DURATION and EASE are the site's own, from Hero's REVEAL. */
export const TEXT = {
  START: "top 75%",
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.09,
  EASE: "power3.out",
} as const;

/** One row's travel and its repeat length, both in vw — see components/Conveyor. */
type Row = { el: HTMLElement; from: number; to: number; stride: number };

/** One repeat of a row, in vw — the distance a row can be shifted by and look
    exactly the same, which is what the idle drift wraps on. */
function strideOf(el: HTMLElement): number {
  const repeat = Number(el.dataset.repeat) || 1;
  const vw = window.innerWidth / 100;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  return (el.getBoundingClientRect().width + gap) / repeat / vw;
}

export function initConveyor(root: HTMLElement): () => void {
  const tracks = Array.from(
    root.querySelectorAll<HTMLElement>(".conveyor-track"),
  );
  if (!tracks.length) return () => {};

  /* WHERE EACH ROW STARTS AND ENDS COMES OFF THE MARKUP, not out of a constant
     up here. It is composition — the same kind of decision as which pill goes
     where — and it is stated once, with the row it belongs to, in the component.
     This file knows that a row travels and not where to. */
  const rows: Row[] = tracks.map((el) => ({
    el,
    from: Number(el.dataset.xFrom),
    to: Number(el.dataset.xTo),
    /* ONE COPY'S LENGTH INCLUDING THE JOIN AFTER IT, measured rather than
       declared. A row is REPEAT copies with a gap between each, so its width is
       repeat*copy + (repeat-1)*gap and one stride is (width + gap) / repeat.
       Measuring it means the pills can be resized, or a gap retuned in the
       stylesheet, without a number in here going quietly out of date. */
    stride: strideOf(el),
  }));

  if (rows.some((r) => Number.isNaN(r.from) || Number.isNaN(r.to)))
    return () => {};

  /* A reader who has asked for less motion gets the belt parked exactly as the
     markup left it, which is `from` — three rows of shapes with all three claims
     readable across them. The section says everything it has to say standing
     still; the movement is emphasis, and emphasis is the part that comes off. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return () => {};

  /* Registered here rather than at module scope: this file is imported by a
     client component, but a client component still renders on the server, and
     registration is a browser-only concern. Idempotent, so a second mount costs
     nothing. */
  gsap.registerPlugin(ScrollTrigger);

  /* --x IS WRITTEN AS A STRING WITH ITS UNIT, off a plain object, rather than
     tweened as a property — the same way Peel's --peel and the preloader's mark
     are driven. GSAP would have to parse a custom property's current value out
     of the computed style on every invalidation to tween it in place; a number
     in a closure is already the number.
     
     AND THE UNIT IS vw, WHICH IS WHY THIS SURVIVES A RESIZE with nothing
     measured and no refresh handler. The travel is expressed in the same units
     the rows are drawn in, so -83vw is the same fraction of the same row at any
     window width. There is nothing cached here to invalidate. */
  const drive = { p: 0 };

  /* Seconds of crawl banked so far. It only advances while the belt is on screen
     and untouched — see the ticker below — so it is frozen the instant the pin
     takes over, and picks up again if the reader scrolls back out. */
  let idled = 0;

  const write = () => {
    for (const row of rows) {
      const base = row.from + (row.to - row.from) * drive.p;
      /* The crawl, wrapped on one copy and pointed the way the row travels, and
         faded out across the travel so the run always lands on `to` exactly. */
      const dir = Math.sign(row.to - row.from);
      const crawl = (idled * IDLE.SPEED) % row.stride;
      row.el.style.setProperty(
        "--x",
        `${base + dir * crawl * (1 - drive.p)}vw`,
      );
    }
  };

  /* Harmless now that the markup rests on `from` — this writes the pose that is
     already there — and kept because it is what makes the first frame after a
     resize or a re-bind agree with the tween rather than with the stylesheet. */
  write();

  /* THE STRIDE IS IN vw AND STILL HAS TO BE RE-TAKEN, which is the one claim
     the note above --x gets wrong. The TRAVEL survives a resize because -83vw
     is the same fraction of the sheet at any width; the stride does not,
     because it is a measurement of the PILLS, and the pills are re-sized on a
     phone (see the About phone block, where a row goes from 13.567vw tall to
     45). Cross that breakpoint by dragging a window and every row's wrap length
     is a figure from the other composition — the crawl jumps a pill's width
     every time it wraps.
     
     onViewportChange rather than `resize`, so a retracting address bar does not
     re-measure four rows mid-flick; a real width change is the only thing that
     can have moved this. */
  const stopVp = onViewportChange(() => {
    for (const row of rows) row.stride = strideOf(row.el);
    write();
  });

  const mark = root.querySelector<HTMLElement>(".conveyor-mark");
  const grow = { s: 1 };

  /* WRITTEN ON THE SECTION AND NOT ON A MARK, so it inherits to all REPEAT of
     them. Which copy of the mark is the one standing in the middle of the window
     at the end of the travel depends on where the row started, and that is a
     composition decision this file has no business knowing. Growing all of them
     is the same picture: at full scale a mark is 189vw across, so the two that
     are not centred are entirely off their own edges of the screen. */
  const writeMark = () =>
    root.style.setProperty("--mark-scale", String(grow.s));

  /* ONE TRIGGER, ONE TIMELINE, FOUR BEATS IN A ROW: the belt travels, the mark
     draws back, the mark takes the screen, and the screen is held. They are one
     because they happen in one place — the section is pinned for the whole of
     it, so there is no moment where something is moving and the section is not
     yet caught, and no handoff between two triggers to get wrong. An earlier
     version ran the belt on its own window on the way in and pinned afterwards,
     and every problem it had was at the seam between the two.

     --mark-scale AND NOT gsap's scale, which writes into `transform` and would
     wipe the tilt the stylesheet puts on the mark. scale: is a separate property
     that composes with transform:, exactly as translate: does on the rows, so
     the mark grows and stays leaning. */
  const run = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: RUN.START,
      end: RUN.HOLD,
      pin: true,
      /* The pin is entered at speed — the reader has been scrolling a section
         that does nothing to get here — so fix it a frame early rather than let
         a fast wheel cross the threshold between frames and snap it back. */
      anticipatePin: 1,
      scrub: BELT.WEIGHT,
      /* THE TOP OF A STACK OF THREE, and it has to be. A refresh reverts
       * every pin, measures the page, and puts them back in priority order,
       * adding each one's spacing to whatever is measured after it — so a pin
       * has to be measured BEFORE anything it sits above, or that thing measures
       * a document this spacer is not in yet.
       *
       * This is the same failure WeWanted/crawl.ts documents at refreshPriority,
       * from the other side. Left at the default, the conveyor was measured after
       * it and WE WANTED pinned itself a screen early: its stage went position:
       * fixed while the belt was still on screen, and the sentence was drawn
       * straight across the mark at full size. It claimed 1 because nothing else
       * on the site claimed anything.
       *
       * THREE AND NOT TWO because there are three of them on this page now, and
       * the numbers are the reading order: this section, then Reason at 2, then
       * WE WANTED at 1. Reason has no pin of its own but its curtain is measured
       * against a document that must already contain this spacer — it is lifted
       * back OVER this section by a negative margin, so its start is this
       * spacer's height minus two screens, and a stale spacer puts the whole
       * sweep a screen out. */
      refreshPriority: 3,
    },
  });

  run.to(drive, {
    p: 1,
    duration: RUN.TRAVEL,
    ease: BELT.EASE,
    onUpdate: write,
  });

  if (mark) {
    run
      .to(grow, {
        s: MARK.DIP,
        duration: RUN.DRAW,
        ease: "power2.out",
        onUpdate: writeMark,
      })
      .to(grow, {
        s: MARK.SCALE,
        duration: RUN.OPEN,
        ease: "power2.out",
        onUpdate: writeMark,
      })
      .to({}, { duration: 1 - RUN.TRAVEL - RUN.DRAW - RUN.OPEN });
  }

  /* THE CRAWL'S CLOCK, AND THE TWO THINGS THAT STOP IT.
   *
   * OFF SCREEN, because a belt idling in a section nobody is looking at is a
   * belt banking drift for a reader who has not arrived — they would come down
   * the page to a composition that had wandered away from the one that was
   * drawn. The gate is its own trigger rather than a per-frame measurement of
   * the section's box: a rect read every frame on a box this wide is a layout
   * the compositor did not need.
   *
   * AND WHILE THE PIN HAS IT, because during the travel the idle is a held
   * value being faded out, and a value that is still moving cannot be faded from
   * anywhere. drive.p leaves 0 on the first frame of the run and the clock stops
   * with it. */
  let onScreen = false;

  const gate = ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      onScreen = self.isActive;
    },
  });

  const tick = (_t: number, dt: number) => {
    if (!onScreen || drive.p > 0) return;
    idled += dt / 1000;
    write();
  };

  gsap.ticker.add(tick);

  /* THE COPY, ARRIVING BEFORE THE BELT DOES. It rises as the section comes up
     the screen — well before the pin catches — so the reader meets the sentence
     already written and the pin's job is only ever the movement. once, because a
     line of a claim is read and then it has been read; playing it again on the
     way back up would be the section introducing itself twice.

     THE STAGGER IS BY LINE WITHIN A COPY and not by document order, which is the
     one non-obvious thing here. The rows are printed REPEAT times and which copy
     is the one on screen differs per row, so staggering down the DOM would give
     the visible lines an arbitrary order — and a delay of up to REPEAT times the
     intended one. Taking the index modulo the lines in a copy gives every copy
     of a line the same beat, so whichever one the reader is looking at arrives
     when it should. */
  const rises = Array.from(
    root.querySelectorAll<HTMLElement>(".conveyor-rise"),
  );
  const repeat = Number(tracks[0]?.dataset.repeat) || 1;
  const perCopy = Math.max(1, Math.round(rises.length / repeat));

  /* The stylesheet's park is lifted before the tween is built — see
     .conveyor[data-reveal="live"] in global.css, which is where the argument
     for this one line lives. */
  if (rises.length) root.dataset.reveal = "live";

  const reveal = rises.length
    ? gsap.fromTo(
        rises,
        { yPercent: TEXT.HIDDEN },
        {
          yPercent: 0,
          duration: TEXT.DURATION,
          ease: TEXT.EASE,
          stagger: (i) => (i % perCopy) * TEXT.STAGGER,
          scrollTrigger: { trigger: root, start: TEXT.START, once: true },
        },
      )
    : null;

  if (process.env.NODE_ENV !== "production") {
    /* Console handle for tuning, the same convention as window.hero and
       window.reimagine. conveyor.run.progress(0.3) holds the belt part-way
       through its travel without scrolling to it; 0.9 opens the mark all the
       way. */
    Object.assign(window, {
      conveyor: { BELT, MARK, RUN, IDLE, TEXT, rows, run, reveal },
    });
  }

  return () => {
    stopVp();
    gsap.ticker.remove(tick);
    gate.kill();
    delete root.dataset.reveal;
    reveal?.scrollTrigger?.kill();
    reveal?.kill();
    run.scrollTrigger?.kill();
    run.kill();
    root.style.removeProperty("--mark-scale");
    /* Back to the pose the markup describes, so a teardown mid-travel leaves a
       section that reads rather than one stopped wherever the reader was. */
    for (const row of rows) row.el.style.setProperty("--x", `${row.from}vw`);
  };
}
