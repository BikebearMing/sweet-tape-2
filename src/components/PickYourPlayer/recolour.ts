/* Sweet Tape — the page taking the colour of whichever roll is being looked at.
 *
 * Hover a roll and the whole sheet becomes that tape: the ground floods with
 * its stage colour, the rise under the rolls follows in its own darker mix, the
 * headline and the small print both drop out of sight and come back up in the
 * tape's ink, and the dashed guide crosses over. Leave the row and all of it
 * goes home to the lime.
 *
 * THIS IS THE TAPE SLIDER'S MOVE, and deliberately so — the home page already
 * teaches it, so the product page repeating it is the same site speaking rather
 * than a second idea. The mechanism is ported from TapeSlider/engine.ts (addWipe
 * and addDip) and the two are worth reading together. What is NOT ported is the
 * scale of it: that section spends about two seconds on a click, with an orbit
 * to travel and a card to flip. This answers a HOVER, so every figure below is
 * roughly half of its counterpart there.
 *
 * THE SHEET, and why it is two layers and not a transition on one. A colour
 * change is either instant or a crossfade, and a crossfade between two
 * saturated colours goes through a muddy middle that belongs to neither. So the
 * incoming colour is a whole second sheet, parked above the section and slid
 * down over the old one, with its leading edge cut into one wide convex arc. At
 * no point are two colours mixed: there is a moving line, new above it and old
 * below.
 *
 * THE RISE GETS ITS OWN COPY OF THAT SHEET, inside itself, and the two are on
 * one clock. It has to: the rise sits ABOVE the ground's sheet in the paint
 * order (it is in the row's box, the sheet is behind everything), so a sheet
 * passing underneath would leave it standing in the old colour. Its copy is
 * offset by exactly how far down the section the rise starts, which is what
 * makes the two arcs one unbroken line across the page rather than two curves
 * sweeping past each other.
 *
 * THE HEADLINE DIPS rather than fading, which is the slider's word mark exactly:
 * each letter drops below its own mask, changes colour where it cannot be seen,
 * and rises back. A letter recolouring in place is a flicker; a letter that
 * leaves and returns is a deliberate act, and it also hides the one frame where
 * the ink would otherwise be the wrong colour against the new ground.
 *
 * THE SMALL PRINT DIPS TOO, but not the same way. The headline goes letter by
 * letter because that is how the headline arrives; the notes go a LINE at a
 * time, every word in a line moving together, because that is how body copy
 * arrives on this site — a paragraph is read rather than looked at, and forty
 * little boxes dropping out of a sentence one after another is a wipe across
 * it. Same gesture, told at the scale each kind of type is set at.
 *
 * A line is not in the markup and cannot be: where the copy breaks is settled
 * by the font, the measure and the window. So the grouping is measured, with
 * the entrance's own bodyLines() — one implementation of "which words are on a
 * line", asked again every time rather than kept.
 *
 * The guide is the one thing left that simply crosses over. It is a dashed line;
 * there is nothing to dip.
 */
import gsap from "gsap";

import { bodyLines } from "@/components/bodyReveal";

export const PICK_WASH = {
  /* The sheet's slide. Half the slider's 0.85 — that one answers a click and
     has an orbit turning under it; this answers a pointer crossing a boundary,
     and anything longer means the reader is already over the next roll before
     the last one has finished arriving. */
  SHEET: 0.55,
  SHEET_EASE: "power2.out",

  /* THE LEADING EDGE'S DEPTH, AS THE ARTWORK'S OWN PROPORTION OF THE WIDTH.
     150.5 / 1456, which is --curve-depth in global.css arrived at in px — the
     one figure every curve on the site is drawn to.

     It was 0.16 of the section's HEIGHT, capped at 220px, against the slider's
     0.22 and 240. Two sections, two depths, both of them a fraction of a box
     that has nothing to do with the shape; that is why this edge and the edge
     of the sheet it was passing over never looked like the same line. The shape
     itself is --section-curve and the mask geometry is .arc-cut. */
  ARC_RATIO: 150.5 / 1456,

  /* A beat after the letters start dropping, so the sheet is not already
     changing the ground while the ink is still standing on it. */
  SHEET_AT: 0.1,

  /* The dip. Down, a held beat at the bottom, then up — the hold is
     load-bearing for the same reason it is in the slider: with no pause the up
     tween renders in the same tick as the recolour and an ease-out brings a
     tenth of the letter back into view before the new colour has been written. */
  DOWN: 0.24,
  HOLD: 0.05,
  UP: 0.34,
  EASE_DOWN: "power2.in",
  EASE_UP: "power3.out", // no overshoot, or the tops clip at the peak

  /* Between letters. Sixteen of them, so the slider's 0.08 would be more than a
     second of stagger on its own. */
  STAGGER: 0.028,

  /* WHERE A WORD OF BODY COPY WAITS, as a percentage of its own height, and it
     is not the letters' 130. A .body-clip is the word's whole line box,
     half-leading included, so one box height is already past the mask's floor.
     BODY_REVEAL.HIDDEN is the same figure and the two have to agree — this is
     the same park that reveal drops the copy in from. */
  BODY_HIDDEN: 110,

  /* When the notes start dropping, from the headline's own start. Behind it by
     enough that the page reads top to bottom — the big type leaves, then the
     small — rather than everything on the sheet moving at once. */
  BODY_AT: 0.1,

  /* Between LINES of a note, not between its words. The words of a line share
     one tween and no stagger at all, which is what makes it read as a line
     moving rather than as a wipe across one — the entrance says the same thing
     with BODY_REVEAL.STAGGER, and this is a shade tighter because a hover is
     answered faster than a scroll. */
  BODY_STAGGER: 0.07,

  /* How long the pointer has to have settled on a roll before the page agrees
     to become it — see the note on paint(). Not part of the move: it is the
     wait BEFORE the move, and the whole of what stops a sweep across the row
     from firing six of them. */
  SETTLE: 0.15,

  /* Where a letter waits, as a percentage of its own height — the site's one
     figure for this, and the same one the headline's entrance and every other
     masked reveal on the site park at. Capitals overshoot their own box, so a
     letter moved exactly its own height leaves a hairline of tops showing. */
  HIDDEN: 130,
};

/** One tape's worth of the page, or the page's own. */
export type PickPalette = {
  /** The ground. */
  bg: string;
  /** The rise under the rolls — the ground with the hero's green mixed in. */
  rise: string;
  /** The headline. */
  word: string;
  /** The small print. */
  ink: string;
  /**
   * The dashed cut line.
   *
   * ITS OWN FIELD RATHER THAN `ink` REUSED, and it earns it on the way HOME.
   * On a tape the two are the same colour — the line joins the small print in
   * that tape's ink. At rest they are not: the page's own guide is the cloth
   * tape's blue, deliberately foreign to the lime it is ruled across, and the
   * small print is the hero's dark green. Fold them together and one hover
   * leaves the guide dark green for good.
   */
  guide: string;
};

/** What this module hands back to whoever is doing the picking. */
export type PickRecolour = {
  /**
   * Take the page to a roll's colours, or home.
   *
   * @param roll a `.pick-roll` carrying the tape's custom properties, or null
   *   for the section's own palette
   */
  paint: (roll: HTMLElement | null) => void;
  stop: () => void;
};

const varOf = (el: HTMLElement, name: string) =>
  getComputedStyle(el).getPropertyValue(name).trim();

/* The custom properties a roll carries are src/data/tapes.ts's, put there by
   cssVars() — the same ones the slider reads off its own buttons, so a palette
   edited in that file turns up on both pages with nothing to keep in step. The
   exception is the rise, which is not a colour anyone picked: it is the tape's
   ground mixed with the hero's dark green, and the stylesheet does the mixing
   (see --pick-roll-rise). What comes back here is a color-mix() expression
   rather than a resolved value, which is fine — it is being assigned straight
   back to a background. */
function paletteOf(roll: HTMLElement): PickPalette {
  return {
    bg: varOf(roll, "--bg"),
    rise: varOf(roll, "--pick-roll-rise"),
    word: varOf(roll, "--word"),
    ink: varOf(roll, "--ink"),
    /* On a tape the line is simply more of the small print's ink — it is being
       ruled across that tape's own sheet, and a foreign colour there would be
       the one thing on the page that had not changed. */
    guide: varOf(roll, "--ink"),
  };
}

/**
 * Wires the section's colour change up.
 *
 * @param root the <section class="pick-player">
 */
export function initPickRecolour(root: HTMLElement): PickRecolour {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);

  const base = q(".pick-wash-base");
  const next = q(".pick-wash-next");
  const wash = q(".pick-wash");
  const rise = q(".pick-rise");
  const riseNext = q(".pick-rise-next");

  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".pick-title .char"),
  );
  /* The small print, block by block — each note dips as one object, so what is
     wanted here is the paragraph and the words inside it separately: the words
     are what moves, and the paragraph is what carries the colour and the
     `data-arrived` that says whether the words are free to be moved at all. */
  const notes = Array.from(
    root.querySelectorAll<HTMLElement>(".pick-note"),
  ).map((block) => ({
    block,
    words: Array.from(block.querySelectorAll<HTMLElement>(".body-rise")),
  }));
  const noteWords = notes.flatMap((n) => n.words);

  /* The cut line is the one thing that simply crosses over — it is a dashed
     rule and there is nothing to dip. Tweened on `color` rather than on a
     border colour: the dash is drawn in currentColor precisely so that one
     property covers it. */
  const guides = Array.from(root.querySelectorAll<HTMLElement>(".pick-guide"));

  if (!base || !next || !wash || !rise || !riseNext) {
    return { paint: () => {}, stop: () => {} };
  }

  /* HOME, read off the stylesheet rather than typed here. The section's own
     palette is stated once, in global.css, and this is where the page goes back
     to when the pointer leaves — so reading it means the two can never disagree
     about what colour this page is. */
  const home: PickPalette = {
    bg: varOf(root, "--pick-bg"),
    rise: varOf(root, "--pick-rise-colour"),
    word: varOf(root, "--pick-ink"),
    ink: varOf(root, "--pick-ink"),
    guide: varOf(root, "--pick-guide-colour"),
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let sheet: gsap.core.Tween | null = null;
  let dip: gsap.core.Timeline | null = null;
  let fade: gsap.core.Tween | null = null;
  let settling: gsap.core.Tween | null = null;

  /* TWO PIECES OF STATE, AND THEY ARE NOT THE SAME THING.
   *
   * `showing` is the colour the page is on, or is on its way to — it is written
   * the moment a change actually starts. `wanted` is the last colour ASKED for,
   * written the moment the pointer crosses into a roll, whether or not anything
   * has begun to happen about it.
   *
   * They differ for exactly as long as the settle below, and that gap is what
   * lets a reader sweep across the row and be left with the colour they stopped
   * on rather than the six they passed through. */
  let showing = home.bg;
  let wanted = home.bg;

  /* The mark and the small print at the top of the window are FIXED FURNITURE
     and live in components/Menu, outside this section entirely — so they cannot
     be reached by anything above. They read this one property off the document
     instead, and the stylesheet gives them a transition on `color` so the change
     crosses over rather than snapping. It is the only thing this module writes
     outside its own section, and it is written here rather than there because
     this is the only place that knows what colour the page has become. */
  function paintTop(ink: string) {
    document.documentElement.style.setProperty("--top-ink", ink);
  }

  /* The whole colour change, with nothing moving — the reduced-motion path, and
     also the settle every animated run ends on. */
  function land(p: PickPalette) {
    base!.style.background = p.bg;
    next!.style.transform = "translateY(-100%)";
    rise!.style.background = p.rise;
    riseNext!.style.transform = "translateY(-100%)";
    for (const el of chars) el.style.color = p.word;
    for (const n of notes) n.block.style.color = p.ink;
    for (const el of guides) el.style.color = p.guide;
    paintTop(p.word);
  }

  /* THE SETTLE — what the pointer has to stop moving for before the page agrees
   * to change colour.
   *
   * The rolls lap each other, the row is most of a window wide, and a reader
   * moving from one end of it to the other crosses all six. Without this, that
   * is six washes queued nose to tail: every one of them cuts the last off part
   * way, so the page spends a second and a half strobing through colours nobody
   * asked to see and arrives at the right one last. With it, the five it passed
   * through are never started.
   *
   * IT DELAYS THE COLOUR AND NOTHING ELSE. The roll itself still lifts on the
   * frame the pointer arrives (fan.ts) — that is the answer to the gesture, and
   * a lag there would feel like the page had stopped responding. This is a
   * second, slower answer to a slower question ("which one are you looking
   * at?"), and it is allowed to wait to be sure.
   *
   * The figure is a judgement: long enough to sit out a sweep, short enough
   * that a reader who has settled on a roll does not notice waiting. Much past
   * 0.2 and a deliberate hover starts to feel unanswered; much under 0.1 and a
   * brisk pass still triggers two or three.
   */
  function paint(roll: HTMLElement | null) {
    const p = roll ? paletteOf(roll) : home;

    /* Already the answer to the last question asked — a pointer wobbling on a
       boundary sends plenty of these. */
    if (p.bg === wanted) return;
    wanted = p.bg;

    settling?.kill();
    settling = null;

    /* Passed over something and come back before the settle was up. The page is
       already showing this, or already on its way to it, so the right thing to
       do is nothing at all — starting a second wash to the colour that is
       arriving would cut the first one off for no reason. */
    if (p.bg === showing) return;

    /* A page repainting itself under the pointer is exactly what the setting is
       asking about — but the colour is the ANSWER to the hover, not decoration
       on it, so it still happens. It simply happens at once, once the settle
       has passed: a reduced-motion reader is more exposed to a strobing sweep
       than anyone, not less. */
    if (reduced) {
      settling = gsap.delayedCall(PICK_WASH.SETTLE, () => {
        settling = null;
        showing = p.bg;
        land(p);
      });
      return;
    }

    settling = gsap.delayedCall(PICK_WASH.SETTLE, () => {
      settling = null;
      run(p);
    });
  }

  /* The change itself, once the pointer has been still long enough to mean it. */
  function run(p: PickPalette) {
    showing = p.bg;

    /* Whatever was in flight is now describing a colour the page has moved on
       from. Finishing the sheet rather than killing it is what leaves the base
       layer holding the last colour asked for — killed mid-slide it would hold
       the one before, and the new sheet would come down over the wrong ground
       and reveal it again at the edges. The slider settles a fast second click
       the same way. */
    if (sheet?.isActive()) sheet.progress(1);
    dip?.kill();
    fade?.kill();

    /* Measured per run, not cached: every length on this page is in vw, so a
       resized window moves both the section and the rise inside it, and a sheet
       cut for the old size leaves a wedge of the old colour in the corners. It
       is two rects on a pointer crossing, which is nothing. */
    const box = wash!.getBoundingClientRect();
    const depth = box.width * PICK_WASH.ARC_RATIO;
    /* Taller than the section by the arc's depth, and the reason is the arc: the
       edge has to finish `depth` BELOW the bottom or its shallow ends leave
       wedges of the old colour in the two corners. The +2 is for the subpixel. */
    const travel = box.height + depth + 2;
    /* How deep the mask lays the curve's strip. .arc-cut owns the shape and
       falls back to --curve-depth; that default is right for a box the height of
       the section and wrong for these two, which are taller than it on purpose. */
    const curve = `${depth}px`;

    /* HOW FAR DOWN THE SECTION THE RISE STARTS. The rise's own sheet is offset
       by this, which is the whole trick that makes the two arcs one line: both
       sheets are cut to the same curve and both are driven by the same number,
       so subtracting the rise's own top puts its copy of the edge at the same
       place on the page as the ground's. */
    const riseTop = rise!.getBoundingClientRect().top - box.top;

    next!.style.height = `${travel}px`;
    next!.style.background = p.bg;
    next!.style.setProperty("--arc-h", curve);
    next!.style.transform = `translateY(${-travel}px)`;

    /* THE SAME BOX WIDTH AS THE GROUND'S SHEET, which is what makes the two
       curves the same curve: the mask's strip is stretched to the box it is on,
       and this one's parent is a page-width and a bit wider than the section.
       See .pick-rise-next in global.css. */
    riseNext!.style.width = `${box.width}px`;
    riseNext!.style.marginLeft = `${-box.width / 2}px`;
    riseNext!.style.height = `${travel}px`;
    riseNext!.style.background = p.rise;
    riseNext!.style.setProperty("--arc-h", curve);
    riseNext!.style.transform = `translateY(${-travel - riseTop}px)`;

    const state = { p: 0 };
    sheet = gsap.to(state, {
      p: 1,
      duration: PICK_WASH.SHEET,
      delay: PICK_WASH.SHEET_AT,
      ease: PICK_WASH.SHEET_EASE,
      onUpdate() {
        const ty = (state.p - 1) * travel;
        next!.style.transform = `translateY(${ty}px)`;
        riseNext!.style.transform = `translateY(${ty - riseTop}px)`;
      },
      /* The sheets have arrived, so the colour under them becomes the colour of
         the page and they go back to waiting above it. Nothing is seen to
         change: what is on screen at this instant is already this colour. */
      onComplete() {
        base!.style.background = p.bg;
        rise!.style.background = p.rise;
        next!.style.transform = "translateY(-100%)";
        riseNext!.style.transform = "translateY(-100%)";
      },
    });

    /* The cut line, straight across on the sheet's own clock. */
    fade = gsap.to(guides, {
      color: p.guide,
      duration: PICK_WASH.SHEET,
      delay: PICK_WASH.SHEET_AT,
      ease: PICK_WASH.SHEET_EASE,
    });
    paintTop(p.word);

    dip = gsap.timeline();

    /* THE DIP RUNS ONLY ON TYPE THAT HAS ARRIVED, and it is asked block by
       block rather than once for the section. Every entrance on this page
       drives the very elements this dip drives, on the very property it drives
       them with, and two tweens on one transform is a word jittering between
       two ideas of where it should be. The headline's entrance says so with
       data-arrived on the section (reveal.ts); each note's says so with
       data-arrived on itself (components/bodyReveal.ts). Whatever has not
       arrived simply changes colour, which cannot be seen anyway — until it
       arrives it is under its own mask. */

    /* THE HEADLINE, letter by letter: each one down, recoloured at the bottom of
       its own drop, and back up. Built as one timeline with both halves placed
       by hand rather than as two staggered tweens, so a letter's return is tied
       to ITS OWN departure — a second stagger would let the first letter come
       back before the last had left. */
    if (root.dataset.arrived === undefined) {
      for (const el of chars) el.style.color = p.word;
    } else {
      chars.forEach((el, i) => {
        const at = i * PICK_WASH.STAGGER;
        dip!.to(
          el,
          {
            yPercent: PICK_WASH.HIDDEN,
            duration: PICK_WASH.DOWN,
            ease: PICK_WASH.EASE_DOWN,
            onComplete: () => {
              el.style.color = p.word;
            },
          },
          at,
        );
        dip!.to(
          el,
          { yPercent: 0, duration: PICK_WASH.UP, ease: PICK_WASH.EASE_UP },
          at + PICK_WASH.DOWN + PICK_WASH.HOLD,
        );
      });
    }

    /* THE SMALL PRINT, A LINE AT A TIME — the entrance's own unit, and the
       reason it is not a word at a time is the reason that one gives: the words
       of a line share one tween and no stagger at all, or what reads is a wipe
       across the sentence rather than a line moving. Which words are on a line
       is a measurement, and bodyLines is the entrance's own — imported rather
       than reimplemented, and asked afresh here so a resized window or a late
       font is already accounted for.

       Its own hidden figure, and not the letters': a word's mask is its whole
       line box, so it is clear a good deal sooner. */
    notes.forEach(({ block, words }) => {
      if (!words.length) return;
      if (block.dataset.arrived === undefined) {
        block.style.color = p.ink;
        return;
      }

      const lines = bodyLines(words);

      /* ONE HOLD SHARED BY THE WHOLE BLOCK, and it is the slider's rule rather
         than a per-line one. Give each line its own DOWN + HOLD and the first
         is on its way back up before the last has left — so half the note is
         standing in the new ink over the old ground while the other half is
         still leaving, which is precisely the frame the dip exists to hide.
         Every line waits until the last one has landed, then they come back in
         the same order they went. */
      const backAt =
        PICK_WASH.BODY_AT +
        (lines.length - 1) * PICK_WASH.BODY_STAGGER +
        PICK_WASH.DOWN +
        PICK_WASH.HOLD;

      lines.forEach((line, i) => {
        dip!.to(
          line,
          {
            yPercent: PICK_WASH.BODY_HIDDEN,
            duration: PICK_WASH.DOWN,
            ease: PICK_WASH.EASE_DOWN,
            /* The colour goes on the BLOCK, not on the line — it owns the ink
               and the words merely inherit it — so it can only be written once
               the LAST line is down. Written on any earlier one and the lines
               still on screen change colour in place, which is the flicker this
               whole manoeuvre is here to avoid. */
            onComplete:
              i === lines.length - 1
                ? () => {
                    block.style.color = p.ink;
                  }
                : undefined,
          },
          PICK_WASH.BODY_AT + i * PICK_WASH.BODY_STAGGER,
        );
        dip!.to(
          line,
          { yPercent: 0, duration: PICK_WASH.UP, ease: PICK_WASH.EASE_UP },
          backAt + i * PICK_WASH.BODY_STAGGER,
        );
      });
    });
  }

  return {
    paint,
    stop() {
      settling?.kill();
      sheet?.kill();
      dip?.kill();
      fade?.kill();
      gsap.killTweensOf(chars);
      gsap.killTweensOf(noteWords);
      gsap.killTweensOf(guides);
      /* Everything back to the stylesheet's. A teardown mid-wipe must not leave
         the page half one colour and half another, or a row of letters — or a
         sentence — parked under a mask with nothing left running to lift it. */
      gsap.set(chars, { clearProps: "transform" });
      if (noteWords.length) {
        gsap.set(noteWords, { clearProps: "transform" });
      }
      for (const el of chars) el.style.removeProperty("color");
      for (const n of notes) n.block.style.removeProperty("color");
      for (const el of guides) el.style.removeProperty("color");
      base!.style.removeProperty("background");
      rise!.style.removeProperty("background");
      next!.style.transform = "translateY(-100%)";
      riseNext!.style.transform = "translateY(-100%)";
      document.documentElement.style.removeProperty("--top-ink");
    },
  };
}
