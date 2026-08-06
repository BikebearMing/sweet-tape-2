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
 *   the mark drops in      the gif's own animation, about 0.75s of it
 *   the line writes itself the hero's letter reveal, imported not copied
 *   the line drops back    the same letters, back under their masks
 *   the stack leaves       lime first, then the four tapes behind it
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

       LINE_IN must clear the mark's own entrance — the gif drops its lemon in
       at about frame 20 of 125, so a little under 0.8s. Earlier and the line is
       writing itself while the logo is still landing.

       SWEEP must clear the line going back: LINE_OUT, plus OUT_DURATION, plus
       the stagger's spread across however many letters the line has (0.02 x 12
       at the copy it carries now). The paper must not start moving while the
       letters are still falling.

     Everything else is taste. The whole cover is about four seconds; LINE_OUT
     is the number to pull if that is too long, since the beat between the line
     landing and it leaving is the one with nothing happening in it. */
  LINE_IN: 0.15,
  LINE_OUT: 2.15,
  SWEEP: 2.8,

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

  const sheet = root.querySelector<HTMLElement>(".preloader-sheet");
  const mark = root.querySelector<HTMLElement>(".preloader-mark");
  const chars = Array.from(
    root.querySelectorAll<HTMLElement>(".preloader-line .char"),
  );
  /* Document order, which is back to front — the stylesheet's z-index is what
     decides which is uncovered first, and index.tsx counts it down the list.
     So the stagger below can simply follow the array. */
  const layers = Array.from(
    root.querySelectorAll<HTMLElement>(".preloader-layer"),
  );

  /* Hand the letters over from the stylesheet — the hero's manoeuvre exactly,
     and for the same reason: global.css parks them with a percentage translate,
     which computes to px, and GSAP would ADD its own yPercent to that and leave
     every letter a full height low. With the attribute on, the computed
     transform is `none` and GSAP owns the whole value.

     Nothing is painted in between: the attribute and the timeline are built in
     the same task, and a fromTo renders its `from` immediately even when it
     sits a second into the timeline. */
  root.dataset.reveal = "live";

  const tl = gsap.timeline();

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
     with the CSS. */
  const sheets = [sheet, ...layers].filter(
    (el): el is HTMLElement => el !== null,
  );

  sheets.forEach((el, i) => {
    tl.to(
      el,
      { yPercent: -100, duration: PRELOADER.DURATION, ease: PRELOADER.EASE },
      PRELOADER.SWEEP + i * PRELOADER.STACK_STEP,
    );
  });

  if (mark) {
    tl.to(
      mark,
      {
        yPercent: PRELOADER.MARK_TRAVEL,
        duration: PRELOADER.DURATION,
        ease: PRELOADER.EASE,
      },
      PRELOADER.SWEEP - PRELOADER.LEAD,
    );
  }

  /* Where the last sheet — the deepest colour, and the one that actually
     uncovers anything — starts to move. Both of the signals below are measured
     from here, because both are about something behind the stack becoming
     visible, and nothing is visible until this one has gone. */
  const lastSweep =
    PRELOADER.SWEEP + Math.max(sheets.length - 1, 0) * PRELOADER.STACK_STEP;

  /* The roll, told to start with the paper still over it — just. */
  tl.call(
    startSweep,
    undefined,
    lastSweep + PRELOADER.DURATION * PRELOADER.SWEEP_MARK,
  );

  /* And the page itself, later in that same sheet's sweep. */
  tl.call(release, undefined, lastSweep + PRELOADER.DURATION * PRELOADER.HANDOFF);

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
      clearProps: "transform",
    });
  };
}
