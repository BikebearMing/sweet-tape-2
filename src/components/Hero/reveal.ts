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
  DELAY: 0.3, // after mount, so the reveal is not racing hydration
  EASE: "power3.out",
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
      delay: REVEAL.DELAY,
      ease: REVEAL.EASE,
    }
  );

  return () => {
    tween.kill();
    // Back to the stylesheet — which, with the attribute still set, is home
    // rather than hidden. A teardown mid-flight leaves the copy readable.
    gsap.set(chars, { clearProps: "transform" });
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
