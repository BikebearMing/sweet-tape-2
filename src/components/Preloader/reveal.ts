/* Sweet Tape — the preloader, and the sweep that takes it away.
 *
 * A lime sheet over the whole viewport with the mark in the middle of it and
 * STICK BY YOU under that, held for a beat and then pulled up out of the way.
 * Every sheet's bottom edge is one wide arc rather than a straight line — the
 * same shape the slider's colour wipe leaves behind it (.bg-layer--next in
 * global.css) and the same family as the wave band. A flat edge travelling up a
 * page reads as a window blind; the arc reads as something being lifted off.
 *
 * Six more sheets are stacked behind the lime one, one per tape and in that
 * tape's stage colour (the order is set in index.tsx). They leave one after
 * another, a tenth of a second apart, so what crosses the screen is a run of
 * coloured bands with parallel arcs rather than a single wipe — the site's
 * whole palette going past on the way out, and the reason the lime sheet works
 * at all: the hero's own top field is the same lime, so a plain sweep would be
 * lime leaving over lime and show nothing but the mark moving.
 *
 * Three beats, in order:
 *
 *   the mark springs up    a sticker: it pops, its shape flexes as it settles,
 *                          and a sheen pans across it — Preloader/sticker.ts
 *   it is held            long enough to be read as a logo and not a flash
 *   the stack leaves       lime first, then the six tapes behind it, and the
 *                          mark goes up with the lime sheet it is printed on
 *
 * THE MARK USED TO COME UNSTUCK AND DROP on its own beat before the sweep, and
 * does not any more. It arrives, it flexes flat, and it stays flat until the
 * paper under it lifts — the pop is the gesture, and a second exit gesture on
 * top of it was one too many. STICKER.FALL and PRELOADER.FALL went with it.
 *
 * STICK BY YOU WAS THE MIDDLE OF THIS and has gone — it was set under the mark,
 * split to letters and revealed with the site's one text entrance. Two beats
 * went with it, which is why the numbers below no longer chain the way the long
 * note at PRELOADER says they once had to: there is nothing between the mark
 * landing and the mark leaving except the hold.
 *
 * In that order, and none of them overlap any more — the fall was the overlap.
 * The one thing to know before moving any of the numbers in PRELOADER is that
 * each beat is timed off the end of the one before it, so a change to an early
 * beat pushes everything after it.
 *
 * On a clock, not on the network. The cover runs its three beats and goes,
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
 * ALL THREE ARE THE HOME PAGE'S ONLY. The mark is the site introducing itself
 * and index.tsx prints it nowhere else, so on every other route this file finds
 * no mark and runs the sweep alone after a beat — see SWEEP_BARE. What it must
 * not do is wait PRELOADER.SWEEP for something that is not there.
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

import { isHeld, release, startSweep } from "./gate";
import { buildSticker, STICKER } from "./sticker";

export const PRELOADER = {
  /* The beats, in seconds from the cover appearing. Absolute rather than
     chained, because this is a fixed piece of choreography on a clock and the
     numbers are easier to read against each other than a chain of "and then".
   
     THERE IS ONLY ONE LEFT, and the constraints that used to bind the others
     are gone with them. STICK BY YOU sat between the mark landing and the mark
     leaving; SWEEP had to clear the letters going back, LINE_IN had to clear
     the mark arriving, and the whole thing chained. Then the fall went too.
     What is left is the mark arriving and the paper leaving, with nothing
     between them but the hold, so SWEEP is taste rather than arithmetic.

     The cover is about four and a half seconds. MARK.IN_AT decides the first
     one, and it is the only number here that is not taste — see its note. The
     hold after the mark lands is the one to pull if this is too long: the mark
     is down and still by about 2.6, so there is a second and three quarters of
     it simply being read before the paper moves. That is the point of an
     overture and it is also the first thing to spend. */
  SWEEP: 4.37,

  /* THERE IS NO FALL BEAT ANY MORE. There was: the mark came unstuck at 4.0
     and dropped, leading the sweep by about six tenths of its own length.

     The reason that number was so fiddly is the reason it is well rid of: THE
     MARK IS A CHILD OF THE SHEET. When the lime sheet sweeps it takes the mark
     with it, a whole viewport upwards, while a fall is trying to move it a
     mark's width down — the sheet wins by a factor of about five, so the drop
     had to be squeezed into the sliver of hold before the paper moved or it
     was simply cancelled on screen. Without it the mark holds flat from the
     settle to SWEEP and then goes up on the paper, which is what the sheet was
     always going to do to it anyway. */

  /* And where the sweep starts when there is nothing to wait for — a cover with
     no mark on it, which is what every route that is not the home page gets on
     a cold load (see the note on `overture` in index.tsx). Everything SWEEP is
     timed against is simply absent there, so the whole of the hold is a beat:
     long enough that the stack is seen to be a stack before it moves, short
     enough that it reads as the page arriving rather than as a wait. */
  SWEEP_BARE: 0.3,

  /* THE MARK'S OWN BEATS — the sticker's, since the peel went. The numbers it
     is BUILT from live in Preloader/sticker.ts (STICKER), because they describe
     a surface rather than a schedule and they were tuned as a set at
     /lab/sticker-pop. What is here is only when the thing starts and when it
     leaves, which is this file's business.

     The measured beats that used to be here went with the peel: the gif's
     unfold read frame by frame, its 7.26deg tick of the head, the fitted eases.
     They are in legacy/preloader-peel, kept whole rather than as a diff —
     the gif is gone and nobody can take those measurements again. */
  MARK: {
    /* LATER THAN THE GIF, and this is the one beat that survived the peel
       intact — because the reason for it was never about the peel.

       Measured on the built site, the cover's own frame cadence is:

         300-600ms     2 frames    one 334ms stall
         600-900ms     5 frames    median 49ms, so about 20fps
         900-1200ms   12 frames    median 16.7ms with a 117ms worst
         1200ms on    18 frames    a flat 16.7ms

       which is hydration and three's first compile landing on top of each
       other. The gif put its unfold at 0.52s and did not care — it was decoded
       off the main thread. A timeline is ON it, and a move starting at 0.52s
       is drawn in five frames. No easing survives that; it is a slideshow, and
       the sticker has MORE to lose there than the peel did, since its whole
       first half second is a spring settling.

       So it waits for the page to settle. Which makes this the number the whole
       cover is built around: everything else follows it, and the second before
       it is an empty sheet. Bringing it forward buys that second back and
       spends the pop on a five-frame slideshow to do it. */
    IN_AT: 1.0,
  },

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
  /* Front to back, which is the order they leave in. */
  const sheets = sheetsOf(root);

  /* NO MARK, NO HOLD. On every route but the home page the cover is bare —
     index.tsx prints the overture only where it belongs — and the beats before
     the sweep have nothing to run. Waiting PRELOADER.SWEEP for a mark that is
     not there would be four seconds of a blank lime screen, which is the worst
     version of this component there is. */
  const bare = !mark;
  const sweepAt = bare ? PRELOADER.SWEEP_BARE : PRELOADER.SWEEP;

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

  /* THE STICKER'S TWO TEARDOWNS, and they are separate on purpose.
   *
   * `stopSticker` takes the draw off the ticker, and the timeline calls it
   * itself the moment the pose stops moving — the cover's cost must not outlive
   * the gesture, and there are still nearly two seconds of hold and a whole
   * sweep to pay for after the mark has settled.
   *
   * `killSticker` takes the columns out of the DOM, and only the teardown calls
   * it. It has to exist and it has to be called: buildSticker APPENDS, so a
   * second mount over a first one that left its columns behind — which is
   * StrictMode on every dev reload — would put a hundred and twenty-eight
   * elements on the sheet with only the newest of them being drawn. */
  let stopSticker: (() => void) | null = null;
  let killSticker: (() => void) | null = null;

  /* THE MARK, AS A STICKER. It springs up off the sheet, its shape flexes as
     it settles, a sheen pans across it — and then it is done. It holds exactly
     as it landed until the sheet under it sweeps and takes it up.
   *
   * The surface is Preloader/sticker.ts and none of it is here: this writes a
   * pose and that draws it, the same division the whole component makes. What
   * is here is the choreography, and it is a straight read of the lab's
   * timeline (/lab/sticker-pop) as far as the settle — the lab's fall has no
   * counterpart here any more.
   *
   * A ticker rather than a tween on the element, because a pose is nine numbers
   * and the thing that turns them into a hundred and twenty-eight style writes
   * has to run once a frame, after all of them have moved. Taken off again the
   * moment the pose is still — the cover's cost must not outlive the gesture. */
  if (mark) {
    const src = mark.dataset.sticker;
    if (src) {
      const sticker = buildSticker(mark, src);
      const pose = sticker.pose;
      gsap.ticker.add(sticker.draw);
      stopSticker = () => gsap.ticker.remove(sticker.draw);
      killSticker = sticker.destroy;

      const at = PRELOADER.MARK.IN_AT;
      const pop = STICKER.POP;
      const flex = STICKER.FLEX;

      /* Held off the screen until its beat — the stylesheet hides the wrapper
         for the first paint (see .preloader-mark) and this is the release. The
         pose's own alpha is 0 at this instant, so nothing flashes; what this
         hands over is visibility, and the fade below is the entrance. */
      tl.set(mark, { autoAlpha: 0 }, 0);
      tl.set(mark, { autoAlpha: 1 }, at);

      tl.set(
        pose,
        {
          scale: pop.SCALE,
          rotX: pop.TILT,
          y: () => pop.RISE * mark.clientWidth,
          alpha: 0,
          bend: flex.BEND,
          fold: flex.FOLD,
          wave: flex.WAVE,
          phase: 0,
          sheen: 0,
        },
        at,
      );

      /* THE POP. One gesture out of four tweens on the same beat: it comes up,
         it comes forward, it grows, it appears. back.out on the two that carry
         the shape, so the mark passes its own size and comes back — which is
         most of what separates a thing that SPRINGS from a thing that is faded
         in. The rise is plain power3.out; a spring on the position as well
         reads as a bounce on top of a bounce. */
      tl.to(pose, { alpha: 1, duration: pop.DURATION * pop.FADE, ease: "none" }, at);
      tl.to(
        pose,
        { scale: 1, duration: pop.DURATION, ease: `back.out(${pop.BACK})` },
        at,
      );
      tl.to(
        pose,
        {
          rotX: 0,
          duration: pop.DURATION,
          ease: `back.out(${pop.BACK * pop.BACK_TILT})`,
        },
        at,
      );
      tl.to(pose, { y: 0, duration: pop.DURATION, ease: "power3.out" }, at);

      /* THE CORNER LAYING DOWN, and it starts LATE — see FLEX.START. The mark
         arrives upright and full size with the fold still in it, and only then
         presses down. The fold and the arc under it go together on one ease,
         because they are one gesture: the sticker being smoothed onto the
         sheet. sine.inOut, and FLEX.UNROLL says why it is not the elastic this
         used to be. */
      const unrollAt = at + pop.DURATION * flex.START;
      tl.to(
        pose,
        { fold: 0, duration: flex.UNROLL, ease: "sine.inOut" },
        unrollAt,
      );
      /* THE ARC OVERSHOOTS. It is tweened PAST flat in one move, so it crosses
         zero with speed rather than settling onto it and setting off again —
         then a second tween brings it home. See FLEX.REBOUND. */
      tl.to(
        pose,
        {
          bend: -flex.BEND * flex.REBOUND.DEPTH,
          duration: flex.UNROLL,
          ease: "sine.inOut",
        },
        unrollAt,
      );
      tl.to(
        pose,
        { bend: 0, duration: flex.REBOUND.DURATION, ease: "sine.inOut" },
        unrollAt + flex.UNROLL,
      );

      /* AND THE WOBBLE, which is where the elastic belongs: the residual flex
         in a thing that has landed rather than the landing itself. It outlasts
         the unroll on purpose — the shape is still moving after the mark has
         stopped, which is the difference between a sticker and a sign. */
      tl.to(
        pose,
        { wave: 0, duration: flex.SETTLE, ease: `elastic.out(1, ${flex.RUBBER})` },
        at + pop.DURATION * flex.START,
      );
      tl.to(
        pose,
        { phase: flex.SPIN * flex.SETTLE, duration: flex.SETTLE, ease: "none" },
        at,
      );

      /* THE SHEEN, on the pop's own beat rather than after it — see the note
         in STICKER.SHEEN. */
      tl.to(
        pose,
        {
          sheen: 1,
          duration: STICKER.SHEEN.DURATION,
          ease: "power1.inOut",
        },
        at + STICKER.SHEEN.AT,
      );

      /* AND THAT IS THE WHOLE GESTURE. Nothing moves the mark after the wobble
         has run out: it holds flat until the sheet it is printed on sweeps, and
         goes up with it.

         SO THE DRAW STOPS THE MOMENT THE POSE DOES, which is the end of the
         settle — the last tween on it, and later than both the unroll and the
         sheen. Every frame after that would write the same 128 transforms
         again, and it would write them across the sweep, which is the most
         expensive second of the page's life. The columns keep the styles they
         were last given and ride the paper off with the wrapper; they stay in
         the DOM, and the teardown is what removes them. */
      tl.call(
        () => stopSticker?.(),
        undefined,
        unrollAt + Math.max(flex.SETTLE, flex.UNROLL + flex.REBOUND.DURATION),
      );
    }
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

  /* THE MARK RIDES THE PAPER OFF, and it does so with no tween of its own: it
     is a child of the lime sheet, so the sweep above is the whole of its exit.

     It has had two other exits and neither is here. It used to LEAD the front
     sheet by PRELOADER.LEAD and travel MARK_TRAVEL further than it, so it
     lifted OFF the sheet rather than being carried away on it; then it fell
     instead, on its own beat and in the opposite direction. Both are gone —
     LEAD and MARK_TRAVEL went with the first, STICKER.FALL with the second.
     The curtain has its own lead (TRANSITION.LEAD) and never read these. */

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
     on (Preloader/transition.ts), and the mark is still sitting on it — the
     fall takes it out of sight but not out of the box. Come back down without
     this and the first route change opens with a logo on the curtain, lying
     wherever the fall left it.

     The one rule about this sheet is that nothing printed on it survives the
     first sweep, and this is now the whole of enforcing it. */
  if (mark) tl.set(mark, { autoAlpha: 0 });

  /* Parked off-screen is not the same as gone: the cover is still a fixed box
     over the page, and `visibility` is what stops it being one. Not display —
     that would drop the transforms GSAP is holding and, on a teardown
     mid-flight, leave the sheets back over the page. */
  tl.set(root, { visibility: "hidden" });

  /* And the sticker's columns go with it: 192 masked, will-change nodes and a
     live ResizeObserver have no business outliving the cover. destroy is
     idempotent, so the teardown below calling it again is fine. */
  tl.call(() => killSticker?.());

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
    stopSticker?.();
    killSticker?.();
    gsap.set(root, { clearProps: "visibility" });
    gsap.set([...sheets, ...(mark ? [mark] : [])], {
      /* opacity and visibility as well as the transform, because the sweep's
         last act is to put the mark and the line out for good — and a replay
         that inherited that would run the whole overture on an empty sheet. */
      clearProps: "transform,opacity,visibility",
    });
  };
}
