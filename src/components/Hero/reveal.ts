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

  /* Hand the letters over from the stylesheet.
   *
   * global.css holds them under their masks until this attribute lands, and
   * setting it first is what makes the tween's numbers mean what they say:
   * GSAP reads the computed transform as its starting point, and a percentage
   * translate coming from CSS is reported as resolved px — which GSAP would
   * then ADD to the yPercent set here, leaving every letter parked a full
   * height low. With the attribute on, the computed transform is `none` and
   * GSAP owns the whole value.
   *
   * Nothing is painted in between: the attribute and the fromTo happen in the
   * same task, so the browser has no chance to show the letters home. */
  root.dataset.reveal = "live";

  /* Letters flying in from nowhere is exactly what the setting is asking
     about. The attribute alone has already put them where they belong. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  /* One pool across the whole section rather than one per heading, so the
     kicker and the headline interleave and the hero arrives as a single move.

     No will-change: force3D promotes each letter for the duration of the tween
     and lets it go afterwards, which is the same win without leaving
     twenty-three permanent layers behind. */
  const tween = gsap.fromTo(
    shuffle(chars),
    { yPercent: REVEAL.HIDDEN },
    {
      yPercent: 0,
      duration: REVEAL.DURATION,
      stagger: REVEAL.STAGGER,
      ease: REVEAL.EASE,
      /* Built parked, played once the page is uncovered — the headline is the
         first thing on the site and it must not be spent behind the preloader's
         sheet. Paused costs the letters nothing: a fromTo renders its `from`
         immediately either way, which is what keeps them under their masks with
         nothing painted in between (see the attribute above). */
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
    // Back to the stylesheet — which, with the attribute still set, is home
    // rather than hidden. A teardown mid-flight leaves the copy readable.
    gsap.set(chars, { clearProps: "transform" });
  };
}

/* The corner mark's arrival — the perforation ruled down the edge, then the two
 * lines written against it.
 *
 * Built paused and played off the same gate as the title (see CORNER.DELAY), so
 * the whole top-left corner of the hero is one cascade rather than three things
 * that each start when their own code happens to run.
 *
 * The letters are parked by the fromTo's own immediate render, in the same task
 * initReveal set data-reveal — Stage.tsx calls the two together, and nothing is
 * painted in between. The dots are parked by the stylesheet instead, since they
 * carry a clip-path rather than a transform and an inline value simply wins.
 */
export function initCornerMark(root: HTMLElement): () => void {
  const el = root.querySelector<HTMLElement>(".corner-mark");
  if (!el) return () => {};

  const perf = el.querySelector<HTMLElement>(".corner-perf");
  const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
  if (!perf && !chars.length) return () => {};

  /* Nothing to undo: the stylesheet only parks the dots where motion is
     welcome, and the attribute initReveal has already set has the letters
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
      { yPercent: REVEAL.HIDDEN },
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

  // The attribute (set by initReveal) has already released the letters; with
  // reduced motion asked for, released — standing, readable — is the reveal.
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

     Same rise, ease and hidden figure as the title, so the two are one voice;
     immediateRender parks the letters at HIDDEN in the same task that the
     attribute freed them, so nothing paints in between. */
  const SPREAD = 1; // the walk down the copy, in timeline-time
  const JITTER = 0.35; // the local shuffle, as a fraction of that
  const tops = chars.map((c) => c.getBoundingClientRect().top);
  const minTop = Math.min(...tops);
  const rowSpan = Math.max(Math.max(...tops) - minTop, 1);
  const tl = gsap.timeline({ paused: true });
  chars.forEach((c, i) => {
    tl.fromTo(
      c,
      { yPercent: REVEAL.HIDDEN },
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
    startY = docTop(el!) - window.innerHeight * 0.9;
    // The copy's own height plus a fifth of a screen: tall copy, long scrub.
    travel = el!.offsetHeight + window.innerHeight * 0.2;
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
  window.addEventListener("resize", measure, { signal: ac.signal, passive: true });

  measure();
  gsap.ticker.add(frame);

  return () => {
    ac.abort();
    ro.disconnect();
    gsap.ticker.remove(frame);
    tl.kill();
    // Mid-scrub teardown must leave the copy readable, same as the title's.
    gsap.set(chars, { clearProps: "transform" });
  };
}
