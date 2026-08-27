/* Sweet Tape — the preloader, and the sweep that takes it away.
 *
 * A lime sheet over the whole viewport with the mark in the middle of it and
 * STICK BY YOU under that, held for a beat and then pulled up out of the way.
 * Every sheet's bottom edge is one wide arc rather than a straight line — the
 * same shape the slider's colour wipe leaves behind it (.bg-layer--next in
 * global.css) and the same family as the wave band. A flat edge travelling up a
 * page reads as a window blind; the arc reads as something being lifted off.
 *
 * Four more sheets are stacked behind the lime one, one per tape and in that
 * tape's stage colour (the order is set in index.tsx). They leave one after
 * another, a tenth of a second apart, so what crosses the screen is a run of
 * coloured bands with parallel arcs rather than a single wipe — the site's
 * whole palette going past on the way out, and the reason the lime sheet works
 * at all: the hero's own top field is the same lime, so a plain sweep would be
 * lime leaving over lime and show nothing but the mark moving.
 *
 * Four beats, in order:
 *
 *   the mark lays down     a peel, then a tick of the head — about 0.9s of it
 *   the line writes itself the hero's letter reveal, imported not copied
 *   the line drops back    the same letters, back under their masks
 *   the stack leaves       lime first, then the four tapes behind it
 *
 * In that order and not overlapping, which is the one thing to know before
 * moving any of the numbers in PRELOADER: each beat is timed off the end of the
 * one before it, so a change to an early beat pushes everything after it.
 *
 * On a clock, not on the network. The cover runs its four beats and goes,
 * whatever has or has not arrived — the load is not what this is about, and a
 * bar that jumps to 100 the moment the cache is warm is worse than no bar. What
 * it does buy the page is real all the same: the hero's 1.3 MB roll and the type
 * both have the whole hold to land in, and the title's entrance is held back
 * until there is somebody to watch it (see gate.ts, and initReveal in
 * Hero/reveal.ts).
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount replays rather than running two sweeps on the same sheet.
 *
 * TWO OF THOSE FOUR BEATS ARE THE HOME PAGE'S ONLY. The mark and the line are
 * the site introducing itself and index.tsx prints them nowhere else, so on
 * every other route this file finds neither and runs the sweep alone after a
 * beat — see SWEEP_BARE. What it must not do is wait PRELOADER.SWEEP for two
 * things that are not there.
 *
 * AND THE SWEEP OUTLIVES THE COVER. The same seven sheets come back down over
 * every route change from here on and lift off the page they land on, which is
 * the site's page transition (Preloader/transition.ts). That is why the two
 * pieces of the sweep that have nothing to do with the preloader's clock —
 * which elements it moves and in what order they go — are exported below as
 * sheetsOf and scheduleSheets rather than living inside initPreloader. The
 * transition builds the identical gesture out of them at its own speed, in
 * either direction, and there is one place to change what the rainbow does.
 */
import gsap from "gsap";

import { REVEAL } from "../Hero/reveal";
import { isHeld, release, startSweep } from "./gate";

/* Fisher–Yates, the hero's and the menu's. The shuffle is the effect: reveal a
   word's letters left to right and it reads as a wipe, which is a different
   thing. Shuffled again on the way out, so the line does not fall in the order
   it arrived — the two are separate gestures, not one played backwards. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const PRELOADER = {
  /* The beats, in seconds from the cover appearing. Absolute rather than
     chained, because this is a fixed piece of choreography on a clock and the
     numbers are easier to read against each other than a chain of "and then".
     Two of them are constrained, and only two:

       LINE_IN must clear the mark's own entrance: MARK.IN_AT plus
       MARK.IN_DURATION, which is where the peel has finished laying down.
       Earlier and the line is writing itself while the logo is still landing —
       two things moving at once in a composition that only has two things in
       it, and neither of them is watched.

       SWEEP must clear the line going back: LINE_OUT, plus OUT_DURATION, plus
       the stagger's spread across however many letters the line has (0.02 x 12
       at the copy it carries now — the spaces get a box each, so it is the
       string's whole length and not its letter count). The paper must not start
       moving while the letters are still falling.

     ONE AFTER THE OTHER, and it costs about six tenths of a second against the
     two overlapping — which is the whole of why they ever overlapped. The line
     used to open the cover at 0.15 and the mark landed on top of it at 1.0;
     that was not a decision so much as what was left when the mark's beat had
     to move back for the frame rate (see MARK.IN_AT). Sequential is the reading
     the piece was built for and it is worth the six tenths, but the price is
     real and it is paid twice: the cover is longer, and its first second is now
     an empty sheet, because the one thing that used to fill it now happens at
     the end. MARK.IN_AT is the number that decides that opening second, and it
     cannot come much further forward without being drawn in five frames.

     Everything else is taste. The whole cover is about four and a half seconds;
     LINE_OUT is the number to pull if that is too long, since the beat between
     the line landing and it leaving is still the one with nothing happening in
     it. That beat is down from well over a second to about a quarter of one,
     which is less generous than it sounds — the letters have been arriving
     since 1.7 and the line is readable from about 2.3, so what is actually on
     screen to be read is closer to half a second. */
  LINE_IN: 1.7,
  LINE_OUT: 2.85,
  SWEEP: 3.5,

  /* And where the sweep starts when there is nothing to wait for — a cover with
     no mark and no line on it, which is what every route that is not the home
     page gets on a cold load (see the note on `overture` in index.tsx).
     Everything the three numbers above are timed against is simply absent
     there, so the whole of the hold is a beat: long enough that the stack is
     seen to be a stack before it moves, short enough that it reads as the page
     arriving rather than as a wait. */
  SWEEP_BARE: 0.3,

  /* THE MARK'S OWN BEATS. Most of them are measured rather than chosen — they
     are the gif this replaces, read frame by frame. The two that are not say so
     where they stand: IN_AT, which had to move for the frame rate, and IN_FROM,
     which had to move because the gif's own value does not survive being slowed
     down enough to watch.

     That gif was 125 frames at 40ms. Its ink is blank for twelve of them, then
     unfolds over six, then holds dead still for twenty-three, then tilts out
     and back over eight, then holds unchanged for the remaining seventy-five —
     three quarters of the file spent on a still image, which is most of why it
     weighed 1.8 MB.

     The unfold is a PEEL, which is what makes this replaceable at all: through
     those six frames the ink still folded over sits at a steady bearing of 61
     degrees from the centre, and what shows of it is flat lime — a flap, lit
     from the front, exactly what components/Peel draws. The apparent rotation
     across the same frames is not the mark turning; it is the principal axis of
     a shape that is still half hidden, and it settles the moment the last of it
     lies down. */
  MARK: {
    /* LATER THAN THE GIF, and this is the one beat that had to leave it.
       Measured on the built site, the cover's own frame cadence is:

         300-600ms     2 frames    one 334ms stall
         600-900ms     5 frames    median 49ms, so about 20fps
         900-1200ms   12 frames    median 16.7ms with a 117ms worst
         1200ms on    18 frames    a flat 16.7ms

       which is hydration and three's first compile landing on top of each
       other. The gif put the unfold at 0.52s and did not care — it was decoded
       off the main thread. A timeline is on it, and a 240ms move starting at
       0.52s was being drawn in five frames. No easing survives that; it is a
       slideshow, and no amount of tuning the curve would have fixed it.

       So it waits for the page to settle. Which makes this the number the whole
       cover is now built around: everything else follows it (the tilt, then the
       line, then the sweep), and the second before it is an empty sheet with
       nothing in it. Bringing it forward buys that second back and spends the
       unfold on a five-frame slideshow to do it. */
    IN_AT: 1.0,

    /* Six frames, 13 to 19. Taking the fold still to run as (0.92, 0.42, 0.33,
       0.23, 0.11, 0.01, 0), the progress through the move at each of them is
       0, .54, .64, .75, .88, .99 — and from the third frame on that is
       power1.out to within a hundredth (.56, .75, .89, .97). It is NOT
       power2.out, which is at .875 by the halfway point where the gif is at
       .75; the mark lands early and then crawls, which reads as a stutter.

       The first frame is the odd one and is left un-fitted: half the move
       inside the first 40ms is more likely the artwork appearing part-way into
       an unfold that began on a frame with too little ink to measure than a
       genuine lurch.

       ALL OF WHICH IS NOW HISTORY, and kept only so the next person does not
       re-derive it. The measured curve is not what runs: it is 0.5s rather than
       the gif's 0.24, which is a straight call that the gif's unfold is too
       quick to watch. Twice the length, and at 60fps thirty frames to draw it
       in against the five it was getting.

       sine.inOut rather than the measured power1.out, for the same reason. A
       fitted power1.out starts at full speed from a dead stop, which at 0.24s
       is over before it registers and at 0.5s is a lurch. This eases out of
       rest and back into it — a sticker let go and settling, rather than one
       yanked flat. */
    IN_DURATION: 0.5,
    IN_EASE: "sine.inOut",

    /* Where the fold already is when it appears — and this is the one number
       here that deliberately contradicts the gif.

       The gif starts at 0.92: 92% of the artwork still folded over at the first
       frame with any ink in it. Reproduced faithfully, that does not read as a
       peel. At 0.92 there is no sticker on the screen at all, only a sliver at
       one edge, so what you watch is the mark UNROLLING INTO EXISTENCE — and a
       peel with nothing to peel off is just a strange way of fading in. The gif
       got away with it by being over in 240ms; at half a second and 60fps there
       is time to notice.

       0.4 is the first value going down from there where the badge is legibly
       itself — the blob, most of the word, a big corner turned back — so the
       move is a sticker being smoothed down onto the sheet rather than one
       being conjured. Push it back up toward 0.7 and the flap starts to cover
       the word again; take it to 0 and there is no fold left to lay down.

       Two things follow from lowering it, both handled below: the fold now
       travels less than half as far in the same IN_DURATION, which is what
       makes it read as settling rather than snapping, and the arrival can no
       longer be a hard cut — see IN_FADE. */
    IN_FROM: 0.4,

    /* The arrival, which at 0.92 did not need to exist: near enough nothing was
       on screen at the cut, so the fold itself was the entrance. With a legible
       badge at IN_FROM this is a third of the artwork appearing between one
       frame and the next, which reads as a glitch rather than as a beat.

       Short on purpose. Long enough that nothing snaps, short enough to be over
       while the fold has barely started, so what carries the entrance is still
       the peel and not a fade. */
    IN_FADE: 0.14,

    /* Then the tilt, frames 42 to 50: out over four, back over four, and the
       measured angles are symmetrical to two decimal places (2.20, 3.66, 5.83,
       7.26, 5.83, 3.66, 2.20). One move out and the same move back. */
    /* Straight off the back of the unfold, which lands at 1.5. The mark's whole
       arrival is one continuous action — it lies down, it ticks, it is done —
       and only then does the line write itself. Given a beat of its own instead
       (the 1.8 it sat at when the line had already been standing for most of a
       second) it becomes a third event in a queue of three, and the cover grows
       by however long that beat is. */
    TILT_AT: 1.55,
    TILT: -7.26, // degrees; the shape's own axis, counter-clockwise
    TILT_DURATION: 0.16, // each way

    /* Linear, which is what the gif measures: through the four frames out the
       move is 0, .30, .50, .80 of the way there — near enough a straight line,
       and nowhere near an ease-in-out, which would still be at .15 by the
       quarter mark. The peak is a corner, not a pause (7.26 with 5.83 either
       side of it), so the yoyo turning hard at the top is right too. It is a
       tick of the head, not a swing. */
    TILT_EASE: "none",
  },

  /* The line's exit. Quicker than its entrance and eased the other way — it
     arrived under its own steam and it leaves under gravity, which is also why
     it goes back to exactly where it came from (REVEAL.HIDDEN, below its own
     mask) rather than fading or rising. */
  OUT_DURATION: 0.4,
  OUT_STAGGER: 0.02,
  OUT_EASE: "power2.in",

  /* The sweep. Long for a move this size, deliberately: the sheet is the whole
     viewport, and a full screen of colour leaving in half a second is a flinch.
     inOut rather than the site's usual .out — this is the only animation on the
     page that has to both start and stop gracefully, since it begins from a
     dead stop and has to hand a still page over at the end rather than settling
     into one. */
  DURATION: 1.05,
  EASE: "power3.inOut",

  /* Where in the LAST sheet's sweep the roll behind it is told to start, as a
     fraction of DURATION.

     The last sheet, and that is the whole of getting this right. Every sheet in
     the stack is opaque, so nothing behind them is visible until the DEEPEST
     one has gone past — measure this against the lime sheet at the front and
     the answer is out by the stack's whole length (four steps, 0.36s), which is
     most of the roll's rise. It leads to a roll that is done growing before it
     has been seen at all.

     Against the last sheet the two numbers are directly comparable: on a 16:9
     screen that sheet's arc reaches the roll's lower edge at 0.365 of its own
     sweep and clears its top at 0.526 — a window of about a sixth of it, and
     narrow. This sits just inside the leading edge, so the roll is barely off
     its mark as the first sliver appears and a little over half way up by the
     time the paper has left it entirely.

     Too early and the rise is spent behind the paper: back.out reaches full
     size at 0.4 of its own duration (see ROLL.DURATION), so all that is left to
     watch is the overshoot settling, which reads as a roll that was already
     there. Too late and it is uncovered standing still and then starts, which
     reads as two events rather than one arrival.

     Those window figures assume 16:9 — the roll's place is in vw and the
     sheets' travel is a viewport tall, so a much taller window moves them. Tune
     by eye there rather than trusting the arithmetic. */
  SWEEP_MARK: 0.33,

  /* Between one sheet leaving and the next behind it. This is the width of the
     colour bands, in effect: the further apart, the deeper each stripe stands
     before the next one catches it up. Past about 0.2 they stop reading as one
     move and start being four wipes in a row. */
  STACK_STEP: 0.09,

  /* How far a gap may stray from that, as a fraction of it — so 0.4 is a gap
     anywhere between 0.054s and 0.126s. This is the "organic" half: an even
     0.09 all the way down reads as a machine dealing cards, and the eye finds
     the rhythm within about three bands. Uneven gaps mean uneven bands, which
     is what a stack of paper actually does when it is pulled.

     The unevenness is DETERMINISTIC, not random — see the golden-ratio step
     where it is used. A cover that dealt a different hand every reload would be
     a different gesture every time, and none of them chosen. */
  STACK_SPREAD: 0.4,

  /* And how much longer each sheet deeper in the stack takes, as a fraction of
     DURATION per sheet. The other half of it: with one duration for all of them
     the stack keeps whatever spacing it left with, and the bands travel as a
     rigid comb. Letting the deeper ones drag slightly means the stack fans out
     as it goes — the gaps open, the bands widen, and the last colour is still
     unrolling when the first is long gone.

     Small on purpose. At 0.018 the deepest of seven takes 11% longer than the
     first, which is a lean rather than a lag. */
  STACK_DRAG: 0.018,

  /* The mark's lead. It starts a moment before the sheet and travels a little
     further, so it lifts OFF the paper rather than being carried away on it —
     the same trick the pinboard's props use against the scroll, at the size of
     a gesture. In percent of the mark's own height. */
  LEAD: 0.12,
  MARK_TRAVEL: -22,

  /* Where in the LAST sheet's sweep the page below is let go, as a fraction of
     DURATION. The hero's title sits at the TOP of the viewport, which a cover
     travelling up uncovers LAST — so this is late on purpose. With REVEAL.DELAY
     (0.3s) added on top of it, the letters start rising just as the final arc
     clears them; earlier and the reveal is spent behind the paper, later and
     the hero sits visibly empty for a beat before it arrives. */
  HANDOFF: 0.55,
};

/* Every sheet in the cover, front to back — the lime one the mark is printed on
   and then the coloured stack behind it, in the order the markup declares and
   therefore in descending z-index (index.tsx counts it down the list).
 *
 * Front to back is also the order they LEAVE in, which is why the array wants
 * no sorting at the far end: the sweep walks it as it stands, and the cover
 * coming down walks it backwards. */
export function sheetsOf(root: HTMLElement): HTMLElement[] {
  return [
    root.querySelector<HTMLElement>(".preloader-sheet"),
    ...Array.from(root.querySelectorAll<HTMLElement>(".preloader-layer")),
  ].filter((el): el is HTMLElement => el !== null);
}

export type SheetStep = { el: HTMLElement; at: number; duration: number };

/* EACH SHEET MOVES IN ITS OWN TIME. Two things vary and one does not.
 *
 * The gap before each is knocked off `step` by a golden-ratio walk:
 * frac(i x 0.618) never repeats, never clumps, and is the same sequence on
 * every machine on every reload — which is the point. This is a designed
 * gesture that happens to be uneven, not a random one.
 *
 * The duration grows down the list by `drag`, so the stack fans out rather than
 * travelling as a rigid comb.
 *
 * THE EASE DOES NOT VARY, and that is not an oversight — it is the reason this
 * function returns a schedule instead of just tweening. The sheets are opaque
 * and stacked, so each one's colour is only the strip between its own edge and
 * the edge of the sheet in front of it. Let one overtake its neighbour — which
 * a springier ease on the wrong sheet would do mid-flight — and it does not
 * slide past: it goes BEHIND it, its strip closes to nothing, and that colour
 * vanishes from the sweep entirely.
 *
 * With one shared ease, no crossing is possible as long as the starts only
 * increase and the durations never decrease, both of which hold by construction
 * here. Position is duration x f((t - start) / duration) with the same f for
 * everyone: a later start and a longer duration can only ever put a sheet
 * further behind, never in front. That is the whole reason `drag` is allowed to
 * be positive and never negative.
 *
 * Which also says what `sheets` must be: the list in the order they should
 * LEAD, deepest colour first for a cover coming down, front sheet first for one
 * lifting off. Hand it the wrong way round and the leading sheet is the one at
 * the back of the z-stack, which paints over nothing and shows one colour. */
const PHI = 0.6180339887; // frac(i x PHI) — the least clumping walk there is

export function scheduleSheets(
  sheets: HTMLElement[],
  opts: {
    at: number;
    step: number;
    spread: number;
    duration: number;
    drag: number;
  },
): SheetStep[] {
  let at = opts.at;
  return sheets.map((el, i) => {
    if (i > 0) {
      const wobble = (((i * PHI) % 1) * 2 - 1) * opts.spread;
      at += opts.step * (1 + wobble);
    }
    return { el, at, duration: opts.duration * (1 + i * opts.drag) };
  });
}

/* Where the LAST sheet moves — the one that actually uncovers anything, since
   everything in front of it is opaque. Both of the sweep's signals are measured
   from here and so is anything else that wants to know when the page behind the
   cover becomes visible.

   Read off the schedule rather than recomputed from it: the gaps and the
   durations both vary, so there is no longer a formula for where the last sheet
   is, and a second copy of the arithmetic would be a second place to get it
   wrong. */
export function lastOf(
  schedule: SheetStep[],
  at: number,
  duration: number,
): { at: number; duration: number } {
  return schedule.at(-1) ?? { at, duration };
}

export function initPreloader(root: HTMLElement): () => void {
  /* Already gone. Not the first mount of this document's life — a layout
     remount, or StrictMode arriving after a sweep has finished — and the cover
     must not play a second time over a page the reader is already looking at. */
  if (!isHeld()) {
    gsap.set(root, { visibility: "hidden" });
    return () => {};
  }

  /* A full screen of colour sliding off the page is exactly what this setting
     is asking about, and the stylesheet has already taken the whole cover out
     of the page for it (see the Preloader section of global.css). All that is
     left is to let the hero go. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    release();
    return () => {};
  }

  /* Start at the top, whatever the browser had in mind.
   *
   * A reload restores the scroll position, which for a page that opens behind a
   * cover means the cover lifts on the middle of the site. `manual` turns that
   * off — it is recorded against this history entry, so it holds for every
   * later reload of the same tab — and the scrollTo handles the load it is set
   * on. Skipped when the URL carries a hash, which is a reader asking for a
   * specific place and outranks this.
   *
   * Before Lenis reads the position, which is why <Preloader /> is mounted
   * ahead of <SmoothScroll /> in the layout: effects run in tree order, and
   * Lenis constructed at a restored offset would carry that offset back the
   * first time the wheel moved. */
  if (!window.location.hash) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }

  const mark = root.querySelector<HTMLElement>(".preloader-mark");
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".preloader-line .char"),
  );

  /* Front to back, which is the order they leave in. */
  const sheets = sheetsOf(root);

  /* NO MARK, NO LINE, NO HOLD. On every route but the home page the cover is
     bare — index.tsx prints the overture only where it belongs — and the three
     beats before the sweep have nothing to run. Waiting PRELOADER.SWEEP for
     them anyway would be three and a half seconds of a blank lime screen, which
     is the worst version of this component there is. */
  const bare = !mark && chars.length === 0;
  const sweepAt = bare ? PRELOADER.SWEEP_BARE : PRELOADER.SWEEP;

  /* Hand the letters over from the stylesheet — the hero's manoeuvre exactly,
     and for the same reason: global.css parks them with a percentage translate,
     which computes to px, and GSAP would ADD its own yPercent to that and leave
     every letter a full height low. With the attribute on, the computed
     transform is `none` and GSAP owns the whole value.

     Nothing is painted in between: the attribute and the timeline are built in
     the same task, and a fromTo renders its `from` immediately even when it
     sits a second into the timeline. */
  root.dataset.reveal = "live";

  /* THE COVER IS CHOREOGRAPHY ON A CLOCK, and its clock runs through the worst
     frames of the page's life: hydration, three's first compile, the GLB
     landing. With lag smoothing off — which is what the page runs on once it is
     scrolling, see SmoothScroll — a single 200ms stall advances this timeline by
     200ms, and the beats it lands on simply do not happen. The mark's unfold is
     240ms, half a second in, and one stall can take four fifths of it.

     GSAP's own default would not help: its threshold is 500ms, and these stalls
     are half that. So the threshold comes down to just over two frames for the
     length of the hold, and any frame worse than that is counted as 33ms. The
     cover then runs a little longer in wall-clock on a slow machine and keeps
     its shape, which for a fixed piece of choreography is the right way round.

     SmoothScroll puts it back to 0 at the handoff, which is where it belongs:
     nothing scrolls before then. */
  gsap.ticker.lagSmoothing(120, 33);

  const tl = gsap.timeline();

  /* The mark, unfolding. Three beats off PRELOADER.MARK, all of them measured
     off the gif this replaces — see the note there.

     --peel is written as a bare number rather than tweened as a property,
     because that is what it is: no unit for GSAP's CSSPlugin to infer, and
     Peel/peel.ts writes it the same way. The rotation is a separate matter and
     goes through GSAP's transform, which composes with the `rotate` the
     stylesheet uses for --peel-dir rather than fighting it — and with the
     yPercent the sweep gives this same element later. */
  if (mark) {
    const fold = { v: PRELOADER.MARK.IN_FROM };
    const write = () => mark.style.setProperty("--peel", String(fold.v));
    write();

    /* Held off the screen until its beat, which is what the gif's first twelve
       blank frames are. The stylesheet is what hides it for the first paint —
       see the visibility on .preloader-mark — and this is the release; the set at
       0 is for the replay, so a StrictMode second run starts hidden again rather
       than inheriting the first run's visible mark.

       The release is a fade and not a cut, and IN_FADE says why. It runs on the
       same beat as the fold, so the badge is already on its way down as it
       resolves — one gesture, not a fade followed by a peel. */
    tl.set(mark, { autoAlpha: 0 }, 0);
    tl.to(
      mark,
      { autoAlpha: 1, duration: PRELOADER.MARK.IN_FADE, ease: "none" },
      PRELOADER.MARK.IN_AT,
    );

    tl.to(
      fold,
      {
        v: 0,
        duration: PRELOADER.MARK.IN_DURATION,
        ease: PRELOADER.MARK.IN_EASE,
        onUpdate: write,
      },
      PRELOADER.MARK.IN_AT,
    );

    /* The tilt, and back. yoyo rather than two tweens, so the return is
       guaranteed to be the same move reversed — which is what the measured
       angles say it is.

       Written as --mark-tilt and not as GSAP's `rotation`, for the reason
       global.css gives at the property: the wrapper's rotate already holds
       --peel-dir, and a rotation tween picks that up as its start and then
       leaves a copy of it in `transform` — 61deg of turn applied twice, and a
       mark sitting crooked for the rest of the hold. */
    const tilt = { deg: 0 };
    tl.to(
      tilt,
      {
        deg: PRELOADER.MARK.TILT,
        duration: PRELOADER.MARK.TILT_DURATION,
        ease: PRELOADER.MARK.TILT_EASE,
        yoyo: true,
        repeat: 1,
        onUpdate: () => mark.style.setProperty("--mark-tilt", `${tilt.deg}deg`),
      },
      PRELOADER.MARK.TILT_AT,
    );
  }

  /* The line, in — the site's one text entrance, imported from the hero rather
     than copied so the two cannot drift apart. */
  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      { yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: REVEAL.STAGGER,
        ease: REVEAL.EASE,
      },
      PRELOADER.LINE_IN,
    );

    /* And back down, under the same masks it came out of. */
    tl.to(
      shuffle(chars),
      {
        yPercent: REVEAL.HIDDEN,
        duration: PRELOADER.OUT_DURATION,
        stagger: PRELOADER.OUT_STAGGER,
        ease: PRELOADER.OUT_EASE,
      },
      PRELOADER.LINE_OUT,
    );
  }

  /* The stack, leaving. -100% of each SHEET, which is a viewport plus the arc's
     depth (the stylesheet gives them that extra height so the arc's lowest
     point starts below the fold and nothing shows around it at rest). So this
     clears the screen exactly, with no figure here that has to be kept in step
     with the CSS.

     Front sheet first, deepest last — see scheduleSheets for why the order of
     this array is the whole of whether the sweep shows six colours or one. */
  const schedule = scheduleSheets(sheets, {
    at: sweepAt,
    step: PRELOADER.STACK_STEP,
    spread: PRELOADER.STACK_SPREAD,
    duration: PRELOADER.DURATION,
    drag: PRELOADER.STACK_DRAG,
  });

  for (const s of schedule) {
    tl.to(
      s.el,
      { yPercent: -100, duration: s.duration, ease: PRELOADER.EASE },
      s.at,
    );
  }

  if (mark) {
    tl.to(
      mark,
      {
        yPercent: PRELOADER.MARK_TRAVEL,
        duration: PRELOADER.DURATION,
        ease: PRELOADER.EASE,
      },
      sweepAt - PRELOADER.LEAD,
    );
  }

  /* Both fractions below are of the last sheet's OWN duration, which is the
     longest of them. */
  const last = lastOf(schedule, sweepAt, PRELOADER.DURATION);

  /* The roll, told to start with the paper still over it — just. */
  tl.call(
    startSweep,
    undefined,
    last.at + last.duration * PRELOADER.SWEEP_MARK,
  );

  /* And the page itself, later in that same sheet's sweep. */
  tl.call(release, undefined, last.at + last.duration * PRELOADER.HANDOFF);

  /* THE OVERTURE IS OVER AND THE SHEET IT WAS PRINTED ON IS NOT. That lime
     sheet is the front of the curtain the page transition pulls down from here
     on (Preloader/transition.ts), and the mark is still sitting on it, still
     visible, parked wherever MARK_TRAVEL left it. Come back down without this
     and the first route change opens with a logo sliding in from off the top of
     the screen at an angle.

     The letters need no such thing — they went back under their masks at
     LINE_OUT and that is where they stay — but they are named here anyway, so
     that the one rule about this sheet ("nothing printed on it survives the
     first sweep") is written in one place rather than half implied by an
     earlier beat. */
  if (mark) tl.set(mark, { autoAlpha: 0 });
  if (chars.length) tl.set(chars, { autoAlpha: 0 });

  /* Parked off-screen is not the same as gone: the cover is still a fixed box
     over the page, and `visibility` is what stops it being one. Not display —
     that would drop the transforms GSAP is holding and, on a teardown
     mid-flight, leave the sheets back over the page. */
  tl.set(root, { visibility: "hidden" });

  /* Back to the start, not to the end — this teardown's real caller is
     StrictMode's double mount, and the second build has to find the cover
     sitting squarely over the page or its sweep starts from wherever the first
     one had got to. Clearing the props hands everything back to the stylesheet,
     which is where it was a moment ago; the attribute goes with them, so the
     letters are parked by CSS again rather than standing.
   *
   * The gate is deliberately NOT released here. Releasing it would open the
   * page during that same double mount and the cover would never play in dev.
   * It stays held until a sweep actually reaches HANDOFF — which is safe
   * because this component is mounted at the layout and lives as long as the
   * document does; a genuine unmount would leave the page held, and there is
   * no such unmount to have. */
  return () => {
    tl.kill();
    delete root.dataset.reveal;
    gsap.set(root, { clearProps: "visibility" });
    gsap.set([...sheets, ...(mark ? [mark] : []), ...chars], {
      /* opacity and visibility as well as the transform, because the sweep's
         last act is to put the mark and the line out for good — and a replay
         that inherited that would run the whole overture on an empty sheet. */
      clearProps: "transform,opacity,visibility",
    });
  };
}
