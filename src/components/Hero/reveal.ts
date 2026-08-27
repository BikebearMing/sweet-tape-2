/* Sweet Tape — the hero's split-text reveal.
 *
 * Every letter sits below its own mask and slides up into place, in a shuffled
 * order rather than left to right. Ported from an earlier project's
 * [data-split-text] helper; two things that were runtime work there are gone:
 *
 *   The DOM splitting. The copy is already one box per letter because the arc
 *   in global.css places each one individually, so React emits the structure on
 *   the server — no unsplit flash, no rewriting the heading on mount.
 *
 *   ScrollTrigger. The hero is the first thing on the page, so this plays on
 *   load; GSAP core is already in the bundle for the tape, and nothing here
 *   asks for more.
 *
 * Scoped to `root` and released by the returned cleanup, so StrictMode's double
 * mount replays rather than stacking two tweens on the same letters.
 */
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";

import { onViewportChange, screenH } from "@/components/viewport";

/* The entrance. Straight from the original — a letter is quick on its own, and
   the stagger is what turns twenty-three of them into one move. */
export const REVEAL = {
  /* Where a letter waits, as a percentage of its own height. global.css parks
     them at the same figure and the two have to agree — change both.

     Not 100. That would be exact only if the glyph filled its box, and
     capitals overshoot theirs (the same reason the slider's dip travels a
     shade past its box). The extra is invisible — it is all behind the mask —
     so it is set well clear rather than measured. */
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.025, // between letters, in shuffled order
  /* After the page is uncovered, not after mount — the preloader holds this
     back so the headline is not spent behind a sheet of paper (see gate.ts).
     With no preloader on the page it is after mount again, and means what it
     always did: enough of a beat that the reveal is not racing hydration. */
  DELAY: 0.3,
  EASE: "power3.out",
};

/* The corner mark, which arrives after the headline rather than with it. Its
   own beat, at its own pace: it is small print in a corner, and joining the
   title's one pool would either bury it in the middle of that move or stretch
   the move out to carry it. */
export const CORNER = {
  /* After the page is uncovered. Behind the headline (REVEAL.DELAY, 0.3) by
     enough to read as a second thing happening rather than as part of the
     first. */
  DELAY: 0.55,

  /* The perforation, punched down the edge before the copy beside it — the
     dots are the mark's left border and the words are set against them, so
     this is the line being ruled before the writing. */
  PERF_DURATION: 0.5,
  PERF_EASE: "power2.out",

  /* Where the copy starts, from the mark's own beginning. Overlapping the dots
     rather than following them: they are one gesture, not two. */
  TEXT_AT: 0.12,

  /* Tighter than REVEAL.STAGGER, because there are nearly forty letters here
     against the title's twenty-three and at the title's pace the last of them
     would still be arriving a second later. The rise itself — duration, ease,
     hidden figure — is the title's exactly. */
  STAGGER: 0.012,
};

/* Fisher–Yates. The shuffle is the effect: reveal the same letters left to
   right and it reads as a wipe, which is a different thing entirely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initReveal(root: HTMLElement): () => void {
  // Scoped to the title: the cardboard's h2 shares the .char mechanism but is
  // a viewport below the fold, and its reveal belongs to the scroll — see
  // initCopyReveal below.
  const chars = Array.from(root.querySelectorAll<HTMLElement>(".title .char"));
  if (!chars.length) return () => {};

  /* EVERY letter in the section, not only the title's. The three entrances
     here are built one after another by Stage.tsx, and the attribute below
     releases all of their letters at once — so all of them have to be parked
     before it lands, not just the ones this function tweens. The corner mark's
     and the cardboard's own inits then find their letters already down and
     build against that. */
  const all = Array.from(root.querySelectorAll<HTMLElement>(".char"));

  /* PARKED INLINE FIRST, AND THE ATTRIBUTE SECOND — the order matters and it
   * is the opposite of what it used to be.
   *
   * global.css holds these letters under their masks until data-reveal lands.
   * The attribute used to go first, on the reasoning that GSAP reads the
   * computed transform as its starting point: a percentage translate coming
   * from CSS is reported as resolved px, and GSAP would ADD its own yPercent
   * to that and leave every letter a full height low. Measured, it is worse
   * than that — 130% on top of a CSS 130% renders at 260%.
   *
   * `y: 0` is what settles it. It writes the px half of GSAP's translate
   * explicitly rather than inheriting whatever it read out of the stylesheet,
   * so `{ y: 0, yPercent: HIDDEN }` lands at exactly HIDDEN whether the CSS
   * park is still applied or already lifted. That makes this set safe to run
   * BEFORE the hand-off, which is the whole point:
   *
   *   the stylesheet parks the letter → this line parks it inline, and an
   *   inline transform outranks the rule → the attribute lifts a rule that is
   *   no longer holding anything.
   *
   * There is no longer an instant, paint or no paint, in which the letter is
   * home before its entrance has run. The old order had one — a zero-width
   * window between the two statements, which is zero-width only for as long as
   * nothing interrupts, and which was the one state in this file where being
   * hidden was nobody's job. It also survives a throw further down: whatever
   * fails after this line, the letters are still under their masks. */
  gsap.set(all, { y: 0, yPercent: REVEAL.HIDDEN });
  root.dataset.reveal = "live";

  /* Letters flying in from nowhere is exactly what the setting is asking
     about. What is wanted is the copy standing, so the park above is handed
     back — with the attribute on, the stylesheet's home for these letters is
     where they belong rather than where they started. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(all, { clearProps: "transform" });
    return () => {};
  }

  /* One pool across the whole section rather than one per heading, so the
     kicker and the headline interleave and the hero arrives as a single move.

     No will-change: force3D promotes each letter for the duration of the tween
     and lets it go afterwards, which is the same win without leaving
     twenty-three permanent layers behind. */
  const tween = gsap.fromTo(
    shuffle(chars),
    /* `y: 0` for the reason the set above carries it: the `from` pose has to
       mean the same thing whatever the computed transform happens to be when
       this is built. It is already exactly where the set left it, so this
       renders no change at all — which is the point. */
    { y: 0, yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: REVEAL.STAGGER,
      ease: REVEAL.EASE,
      /* Built parked, played once the page is uncovered — the headline is the
         first thing on the site and it must not be spent behind the preloader's
         sheet. Paused costs the letters nothing: they were put under their
         masks by the set above, and a fromTo renders its `from` immediately
         either way. */
      paused: true,
    }
  );

  /* The delay is here rather than on the tween, and it is the same beat it
     always was — only measured from the reveal rather than from mount. A
     delayedCall is unambiguous about that where a paused tween's own `delay`
     is not.

     whenRevealed fires on the spot when nothing is holding the page: no
     preloader in the layout, reduced motion, or a second hero further into the
     site. This section does not know which, and does not need to. */
  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(REVEAL.DELAY, () => tween.play());
  });

  return () => {
    unsubscribe();
    start?.kill();
    tween.kill();
    /* Back to the stylesheet — which, with the attribute still set, is home
       rather than hidden. A teardown mid-flight leaves the copy readable.

       ALL of them, not just this tween's: the park above reaches every letter
       in the section, so a teardown that cleared only the title's would leave
       the corner mark and the cardboard copy under masks this function put
       them behind. The other two inits clear their own as well, which is
       harmless — clearProps on a letter already handed back does nothing. */
    gsap.set(all, { clearProps: "transform" });
  };
}

/* The corner mark's arrival — the perforation ruled down the edge, then the two
 * lines written against it.
 *
 * Built paused and played off the same gate as the title (see CORNER.DELAY), so
 * the whole top-left corner of the hero is one cascade rather than three things
 * that each start when their own code happens to run.
 *
 * The letters are already under their masks before this runs: initReveal parks
 * every .char in the section inline, ahead of the attribute that releases the
 * stylesheet's hold on them, and Stage.tsx calls it first for exactly that
 * reason. All this adds is the tween. The dots are parked by the stylesheet
 * instead, on a rule of their own that no attribute lifts — they carry a
 * clip-path rather than a transform, and the fromTo's inline value simply wins
 * when it lands.
 */
export function initCornerMark(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>(".corner-mark");
  if (!el) return () => {};

  const perf = el.querySelector<HTMLElement>(".corner-perf");
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  if (!perf && !chars.length) return () => {};

  /* Nothing to undo: the stylesheet only parks the dots where motion is
     welcome, and initReveal takes the same branch a moment before this one —
     it hands its own park back and leaves every letter in the section
     standing. Asked for less motion, the mark is simply there. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const tl = gsap.timeline({ paused: true });

  if (perf) {
    tl.fromTo(
      perf,
      { clipPath: "inset(0% 0% 100% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: CORNER.PERF_DURATION,
        ease: CORNER.PERF_EASE,
      },
      0,
    );
  }

  /* Shuffled across both lines, not within each: it is two lines of one mark,
     and shuffling them separately would have the first finished before the
     second had started — a wipe down the block, which is the thing the shuffle
     exists to avoid. */
  if (chars.length) {
    tl.fromTo(
      shuffle(chars),
      /* `y: 0` alongside it, the same guard initReveal's park carries: the
         `from` pose then means HIDDEN and not "HIDDEN on top of whatever the
         stylesheet had", whichever of the two got here first. */
      { y: 0, yPercent: REVEAL.HIDDEN },
      {
        yPercent: 0,
        duration: REVEAL.DURATION,
        stagger: CORNER.STAGGER,
        ease: REVEAL.EASE,
      },
      CORNER.TEXT_AT,
    );
  }

  let start: gsap.core.Tween | null = null;
  const unsubscribe = whenRevealed(() => {
    start = gsap.delayedCall(CORNER.DELAY, () => tl.play());
  });

  return () => {
    unsubscribe();
    start?.kill();
    tl.kill();
    // A teardown mid-arrival leaves the mark readable and the dots drawn.
    gsap.set(chars, { clearProps: "transform" });
    if (perf) gsap.set(perf, { clipPath: "inset(0% 0% 0% 0%)" });
  };
}

/* The cardboard copy's reveal — the same move as the title's, handed to the
 * scroll instead of the clock.
 *
 * The h2 sits a viewport below the fold, so playing it on load would spend the
 * whole thing unseen. Instead the identical staggered tween is built PAUSED
 * and the scroll scrubs its playhead: the letters rise as the copy comes up
 * the viewport, at whatever pace the reader actually scrolls.
 *
 * Ratcheted, not scrubbed both ways: the playhead only ever advances, so
 * scrolling back up leaves the copy standing rather than dismantling it —
 * revealed once, revealed for good. That is also why there is no ScrollTrigger
 * here: a one-way playhead off one number is less machinery than the plugin,
 * and Lenis is already on the ticker this reads from.
 */
export function initCopyReveal(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>(".cardboard-wrapper .h2");
  if (!el) return () => {};
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  if (!chars.length) return () => {};

  // initReveal takes the same branch a moment before this one and hands its
  // park back, leaving every letter in the section standing; with reduced
  // motion asked for, standing — readable — is the reveal.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* Ordered down the copy, shuffled only locally. The title's reveal is one
     size and all at once, so a full shuffle is texture; on a copy this tall a
     full shuffle spends the bottom lines' letters at the top of the window —
     animated before the reader has scrolled to them, which reads as "it
     already happened". Each letter's place in the scrub is therefore its LINE
     first (0 at the first line, SPREAD at the last) with only the jitter
     shuffled — the reveal walks down the copy at the scroll's pace and
     sparkles as it goes.

     Same rise, ease and hidden figure as the title, so the two are one voice.
     The letters are already under their masks when this is built — initReveal
     parks every .char in the section before it releases the stylesheet's hold
     — so these fromTos change nothing on their immediate render, which is what
     makes it safe for them to be built at any point after it. */
  const SPREAD = 1; // the walk down the copy, in timeline-time
  const JITTER = 0.35; // the local shuffle, as a fraction of that

  /* WHICH LINE A LETTER IS ON, measured off the .clip and never the .char.
     The clip holds the letter's place in the line and does not move; the char
     is the thing being translated, and it is sitting a full height and a third
     below its line right now — asking it where it is would be asking about the
     park rather than about the copy. bodyLines() in bodyReveal.ts makes the
     same distinction and its note is the long version. */
  const boxOf = (c: HTMLElement) => c.parentElement ?? c;
  const tops = chars.map((c) => boxOf(c).getBoundingClientRect().top);
  const minTop = Math.min(...tops);
  const rowSpan = Math.max(Math.max(...tops) - minTop, 1);
  const tl = gsap.timeline({ paused: true });
  chars.forEach((c, i) => {
    tl.fromTo(
      c,
      { y: 0, yPercent: REVEAL.HIDDEN },
      { yPercent: 0, duration: REVEAL.DURATION, ease: REVEAL.EASE },
      ((tops[i] - minTop) / rowSpan) * SPREAD + Math.random() * SPREAD * JITTER
    );
  });

  /* The scrub window, in scroll travel: opens as the copy's top clears the
     bottom of the viewport and runs until its BOTTOM is well up the screen —
     so the window grows with the copy, and the last line is still rising as
     the reader actually reaches it, instead of the whole block being spent
     within the first half-screen. */
  let startY = 0;
  let travel = 1;

  function docTop(node: HTMLElement) {
    let y = 0;
    for (let n: HTMLElement | null = node; n; n = n.offsetParent as HTMLElement | null) {
      y += n.offsetTop;
    }
    return y;
  }

  function measure() {
    startY = docTop(el!) - screenH() * 0.9;
    // The copy's own height plus a fifth of a screen: tall copy, long scrub.
    travel = el!.offsetHeight + screenH() * 0.2;
  }

  /* NOTHING TO SCRUB IF IT IS ALREADY THERE.
   *
   * The window above opens as the copy's top clears the bottom of the screen,
   * which assumes the copy STARTS below the fold — true at 1440, where the
   * cardboard sits at 958px under a 900px window. On a phone the hero is a
   * column rather than a board and the same card lands at about 550px in an
   * 844px window: on screen, at rest, before a single pixel has been scrolled.
   *
   * startY then comes out NEGATIVE, and the scrub is already part-run at scroll
   * zero — the copy is painted at some fraction of its entrance, which is not a
   * half-finished animation, it is a paragraph with letters missing from it.
   * That is what the top of the page showed.
   *
   * So the entrance is only an entrance if there is one to make. If the copy is
   * in view with the page at rest, it is simply set down and the ticker is never
   * asked again. */
  function alreadyIn() {
    return docTop(el!) < screenH();
  }

  let best = 0; // the ratchet: the playhead never goes back

  function frame() {
    if (best >= 1) return;
    const p = (window.scrollY - startY) / travel;
    if (p <= best) return;
    best = Math.min(p, 1);
    tl.progress(best);
  }

  const ro = new ResizeObserver(measure);
  ro.observe(root);
  const ac = new AbortController();
  const stopVp = onViewportChange(measure);

  measure();
  if (alreadyIn()) {
    best = 1;
    tl.progress(1);
  } else {
    gsap.ticker.add(frame);
  }

  return () => {
    stopVp();
    ac.abort();
    ro.disconnect();
    gsap.ticker.remove(frame);
    tl.kill();
    // Mid-scrub teardown must leave the copy readable, same as the title's.
    gsap.set(chars, { clearProps: "transform" });
  };
}
